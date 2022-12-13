"""Convert a brain image into assets for the brainsprite web brain viewer.
"""
import os
import warnings
from io import BytesIO
from base64 import b64encode

import numpy as np
from matplotlib.image import imsave

from nibabel.affines import apply_affine

from nilearn.image import resample_to_img, new_img_like, reorder_img
from nilearn.plotting.js_plotting_utils import colorscale
from nilearn.plotting import cm
from nilearn.plotting.find_cuts import find_xyz_cut_coords
from nilearn.plotting.img_plotting import _load_anat
from nilearn._utils.niimg_conversions import check_niimg_3d
from nilearn._utils.param_validation import check_threshold
from nilearn._utils.extmath import fast_abs_percentile
from nilearn._utils.niimg import _safe_get_data
from nilearn.datasets import load_mni152_template


class WebImg:
    """
    Convert a brain image into assets for a web document.

    Parameters
    ----------
    :param name: The name for these web assets.
        This is used to compose images in brain viewers.
    :type name: string
    :param img: A brain image.
    :type img: Nimg-like object
        See http://nilearn.github.io/manipulating_images/input_output.html
    :param bg_img: A brain image to use as background.
    :type img: Nimg-like object, optional
        See http://nilearn.github.io/manipulating_images/input_output.html
    :param resampling_interpolation: The interpolation method for resampling.
        Can be 'continuous', 'linear', or 'nearest'.
        See nilearn.image.resample_img
    :type resampling_interpolation: string, optional
    :param base64: Encode data as base64 string, as opposed to a file.
    :type base64: boolean, optional
    :param verbose: Print information during processing.
    :type verbose: boolean, optional
    """

    def __init__(
        self,
        name,
        img,
        bg_img=None,
        threshold=None,
        black_bg="auto",
        cut_coords=None,
        symmetric_cmap=True,
        resampling_interpolation="continuous",
        format="png",
        base64=True,
        verbose=False,
    ):
        """Set up default attributes for the class."""
        self.name = name
        self.img = img
        self.bg_img = bg_img
        self.threshold = threshold
        self.black_bg = black_bg
        self.cut_coords = cut_coords
        self.symmetric_cmap = symmetric_cmap
        self.resampling_interpolation = resampling_interpolation
        self.format = _check_format(format)
        self.base64 = base64
        self.verbose = verbose
        self.type_viewer = "brainsprite"

    def load():
        """Load an image, generate web assets.
        """

        # Prepare the color map and thresholding
        mask_img, stat_map_img, data, self.threshold = _mask_stat_map(
            stat_map_img, self.threshold
        )

        self.colors_ = colorscale(
            self.cmap,
            data.ravel(),
            threshold=self.threshold,
            symmetric_cmap=self.symmetric_cmap,
            vmax=self.vmax,
            vmin=self.vmin,
        )

        # Prepare the data for the cuts
        bg_img, self.bg_min_, self.bg_max_, self.black_bg_ = _load_bg_img(
            stat_map_img, bg_img, self.black_bg, self.dim
        )

        stat_map_img, mask_img = _resample_stat_map(
            stat_map_img, bg_img, mask_img, self.resampling_interpolation
        )

        self.cut_slices_ = _get_cut_slices(
            stat_map_img, self.cut_coords, self.threshold
        )

        self.web_img_ = (
            _save_sprite(
                output_sprite=self.web_img,
                img=stat_map_img,
                base64=self.base64,
                vmax=self.colors_["vmax"],
                vmin=self.colors_["vmin"],
                mask=mask_img,
                cmap=self.cmap,
            ),
        )

        self.web_colormap_ = (
            _save_cm(
                output_cmap=self.web_colormap,
                base64=self.base64,
                cmap=self.colors_["cmap"],
                format=self.format,
            ),
        )

        self.metadata_ = (
            _save_metadata(
                shape=stat_map_img.shape,
                affine=stat_map_img.affine,
                black_bg=black_bg,
                cut_slices=self.cut_slices_,
                colors=self.colors_,
            ),
        )
        return


def _check_format(format):
    """Check output format of image assets.
    """
    if format not in ["png", "jpg"]:
        raise ValueError(
            f'Only "png" and "jpg" are supported as image asset (argument `format`). {format} was provided.'
        )
    return format


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
    # In the absence of background, default to `black_bg=False`,
    # i.e. deal with text colors as if the background was white
    if (bg_img is None or bg_img is False) and black_bg == "auto":
        black_bg = False

    if bg_img is not None and bg_img is not False:
        # An image has been specified as background.
        # we load it as an anatomical image.
        if isinstance(bg_img, str) and bg_img == "MNI152":
            bg_img = load_mni152_template()
        bg_img, black_bg, bg_min, bg_max = _load_anat(
            bg_img, dim=dim, black_bg=black_bg
        )
    else:
        # No background is specified.
        # Use the image itself as background
        bg_img = new_img_like(
            stat_map_img, np.zeros(stat_map_img.shape), stat_map_img.affine
        )
        bg_min = 0
        bg_max = 0
    # This step is very important
    # re-arrange the image so that the voxel-to-world coordinates system
    # is a simple diagonal matrix
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
    img, base64, vmax, vmin, output_sprite=None, mask=None, cmap="Greys", format="png"
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
    if base64:
        output_sprite = BytesIO()
        imsave(output_sprite, sprite, vmin=vmin, vmax=vmax, cmap=cmap, format=format)
        output_sprite = _bytesIO_to_base64(output_sprite)
    else:
        output_sprite = output_cmap
        imsave(output_cmap, data, cmap=cmap, format=format)

    return output_sprite


def _set_colors(black_bg):
    if self.black_bg:
        cfont = "#FFFFFF"
        cbg = "#000000"
    else:
        cfont = "#000000"
        cbg = "#FFFFFF"
    return cfont, cbg


def _save_metadata(shape, affine, black_bg, cut_slices, colors):
    cfont, cbg = _set_colors(black_bg)
    metadata = {}
    metadata["X"] = shape[0]
    metadata["Y"] = shape[1]
    metadata["Z"] = shape[2]
    metadata["X_overlay"] = shape[0]
    metadata["Y_overlay"] = shape[1]
    metadata["Z_overlay"] = shape[2]
    metadata["colorBackground"] = cbg
    metadata["colorFont"] = cfont
    metadata["affine"] = affine.tolist()
    metadata["X_num"] = cut_slices_[0] - 1
    metadata["Y_num"] = cut_slices_[1] - 1
    metadata["Z_num"] = cut_slices_[2] - 1
    metadata["min"] = colors["vmin"]
    metadata["max"] = colors["vmax"]
    return metadata


def _save_cm(cmap, base64, output_cmap=None, format="png", n_colors=256):
    """ Save the colormap of an image as an image file.
    """

    # the colormap
    data = np.arange(0.0, n_colors) / (n_colors - 1.0)
    data = data.reshape([1, n_colors])

    if base64:
        output_cmap = BytesIO()
        imsave(output_cmap, data, cmap=cmap, format=format)
        output_cmap = _bytesIO_to_base64(output_cmap)
    else:
        imsave(output_cmap, data, cmap=cmap, format=format)
    return output_cmap
