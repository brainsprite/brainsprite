"""Convert a nii img into assets for an html document (png/jpg sprite + json metadata)
"""
import os
import json
import warnings
from pathlib import Path
from io import BytesIO
from base64 import b64encode

import numpy as np
from matplotlib.image import imsave

from nibabel.affines import apply_affine

from nilearn.image import resample_to_img, new_img_like, reorder_img
from nilearn.plotting.js_plotting_utils import get_html_template, colorscale
from nilearn.plotting import cm
from nilearn.plotting.find_cuts import find_xyz_cut_coords
from nilearn.plotting.img_plotting import _load_anat
from nilearn.reporting import HTMLDocument
from nilearn._utils.niimg_conversions import check_niimg_3d
from nilearn._utils.param_validation import check_threshold
from nilearn._utils.extmath import fast_abs_percentile
from nilearn._utils.niimg import _safe_get_data
from nilearn.datasets import load_mni152_template
from nilearn.externals import tempita

def _data_to_sprite(data):
    """ Convert a 3D array into a sprite of sagittal slices.
        Returns: sprite (2D numpy array)
        If each sagittal slice is nz (height) x ny (width) pixels, the sprite
        size is (M x nz) x (N x ny), where M and N are computed to be roughly
        equal. All slices are pasted together row by row, from top left to
        bottom right. The last row is completed with empty slices.
    """

    nx, ny, nz = data.shape
    nrows = int(np.ceil(np.sqrt(nx)))
    ncolumns = int(np.ceil(nx / float(nrows)))

    sprite = np.zeros((nrows * nz, ncolumns * ny))
    indrow, indcol = np.where(np.ones((nrows, ncolumns)))

    for xx in range(nx):
        # we need to flip the image in the x axis
        sprite[
            (indrow[xx] * nz) : ((indrow[xx] + 1) * nz),
            (indcol[xx] * ny) : ((indcol[xx] + 1) * ny),
        ] = data[xx, :, ::-1].transpose()

    return sprite


def _threshold_data(data, threshold=None):
    """ Threshold a data array.
        Returns: data (array), mask (boolean array) threshold (updated)
    """
    # If threshold is None, do nothing
    if threshold is None:
        mask = np.full(data.shape, False)
        return data, mask, threshold

    # Deal with automatic settings of plot parameters
    if threshold == "auto":
        # Threshold epsilon below a percentile value, to be sure that some
        # voxels pass the threshold
        threshold = fast_abs_percentile(data) - 1e-5

    # Threshold
    threshold = check_threshold(
        threshold, data, percentile_func=fast_abs_percentile, name="threshold"
    )

    # Mask data
    if threshold == 0:
        mask = data == 0
        data = data * np.logical_not(mask)
    else:
        mask = (data >= -threshold) & (data <= threshold)
        data = data * np.logical_not(mask)

    if not np.any(mask):
        warnings.warn(
            "Threshold given was {0}, but "
            "the data has no values below {1}. ".format(threshold, data.min())
        )
    return data, mask, threshold


def _bytesIO_to_base64(handle_io):
    """ Encode the content of a bytesIO virtual file as base64.
        Also closes the file.
        Returns: data
    """
    handle_io.seek(0)
    data = b64encode(handle_io.read()).decode("utf-8")
    handle_io.close()
    return data


def _mask_stat_map(stat_map_img, threshold=None):
    """ Load a stat map and apply a threshold.
        Returns: mask_img, stat_map_img, data, threshold
    """
    # Load stat map
    stat_map_img = check_niimg_3d(stat_map_img, dtype="auto")
    data = _safe_get_data(stat_map_img, ensure_finite=True)

    # threshold the stat_map
    if threshold is not None:
        data, mask, threshold = _threshold_data(data, threshold)
        mask_img = new_img_like(stat_map_img, mask, stat_map_img.affine)
    else:
        mask_img = new_img_like(stat_map_img, np.zeros(data.shape), stat_map_img.affine)
    return mask_img, stat_map_img, data, threshold


def _load_bg_img(stat_map_img, bg_img="MNI152", black_bg="auto", dim="auto"):
    """ Load and resample bg_img in an isotropic resolution,
        with a positive diagonal affine matrix.
        Returns: bg_img, bg_min, bg_max, black_bg
    """
    if (bg_img is None or bg_img is False) and black_bg == "auto":
        black_bg = False

    if bg_img is not None and bg_img is not False:
        if isinstance(bg_img, str) and bg_img == "MNI152":
            bg_img = load_mni152_template()
        bg_img, black_bg, bg_min, bg_max = _load_anat(
            bg_img, dim=dim, black_bg=black_bg
        )
    else:
        bg_img = new_img_like(
            stat_map_img, np.zeros(stat_map_img.shape), stat_map_img.affine
        )
        bg_min = 0
        bg_max = 0
    bg_img = reorder_img(bg_img, resample="nearest")
    return bg_img, bg_min, bg_max, black_bg


def _resample_stat_map(
    stat_map_img, bg_img, mask_img, resampling_interpolation="continuous"
):
    """ Resample the stat map and mask to the background.
        Returns: stat_map_img, mask_img
    """
    stat_map_img = resample_to_img(
        stat_map_img, bg_img, interpolation=resampling_interpolation
    )
    mask_img = resample_to_img(mask_img, bg_img, fill_value=1, interpolation="nearest")

    return stat_map_img, mask_img

def _get_cut_slices(stat_map_img, cut_coords=None, threshold=None):
    """For internal use. Find slice numbers for the cut.
    """
    # Select coordinates for the cut
    if cut_coords is None:
        cut_coords = find_xyz_cut_coords(stat_map_img, activation_threshold=threshold)

    # Convert cut coordinates into cut slices
    try:
        cut_slices = apply_affine(np.linalg.inv(stat_map_img.affine), cut_coords)
    except ValueError:
        raise ValueError(
            "The input given for display_mode='ortho' needs to be "
            "a list of 3d world coordinates in (x, y, z). "
            "You provided cut_coords={0}".format(cut_coords)
        )
    except IndexError:
        raise ValueError(
            "The input given for display_mode='ortho' needs to be "
            "a list of 3d world coordinates in (x, y, z). "
            "You provided single cut, cut_coords={0}".format(cut_coords)
        )

    return cut_slices


def _save_sprite(
    img, vmax, vmin, output_sprite=None, mask=None, cmap="Greys", format="png"
):
    """ Generate a sprite from a 3D Niimg-like object.
        Returns: sprite
    """

    # Create sprite
    sprite = _data_to_sprite(_safe_get_data(img, ensure_finite=True))

    # Mask the sprite
    if mask is not None:
        mask = _data_to_sprite(_safe_get_data(mask, ensure_finite=True))
        sprite = np.ma.array(sprite, mask=mask)

    # Save the sprite
    if output_sprite is None:
        output_sprite = BytesIO()
        imsave(output_sprite, sprite, vmin=vmin, vmax=vmax, cmap=cmap, format=format)
        output_sprite = _bytesIO_to_base64(output_sprite)
    else:
        imsave(output_cmap, data, cmap=cmap, format=format)

    return output_sprite


def _save_cm(cmap, output_cmap=None, format="png", n_colors=256):
    """ Save the colormap of an image as an image file.
    """

    # the colormap
    data = np.arange(0.0, n_colors) / (n_colors - 1.0)
    data = data.reshape([1, n_colors])

    if output_cmap is None:
        output_cmap = BytesIO()
        imsave(output_cmap, data, cmap=cmap, format=format)
        output_cmap = _bytesIO_to_base64(output_cmap)
    else:
        imsave(output_cmap, data, cmap=cmap, format=format)
    return output_cmap


