"""Preprocess images before generating web assets.
"""
import numpy as np

from nibabel.affines import apply_affine

from nilearn.image import resample_to_img, new_img_like, reorder_img
from nilearn.plotting.find_cuts import find_xyz_cut_coords
from nilearn.plotting.img_plotting import _load_anat
from nilearn._utils.niimg_conversions import check_niimg_3d
from nilearn._utils.param_validation import check_threshold
from nilearn._utils.extmath import fast_abs_percentile
from nilearn._utils.niimg import _safe_get_data
from nilearn.datasets import load_mni152_template


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
            f"Threshold given was {threshold}, but "
            f"the data has no values below {data.min()}. "
        )
    return data, mask, threshold


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
