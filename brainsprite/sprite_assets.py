"""Convert a brain image into assets for the brainsprite web brain viewer.
"""
import os
import warnings
from io import BytesIO
from base64 import b64encode
from matplotlib.image import imsave
import numpy as np

from nilearn.plotting import cm
from nilearn.plotting.js_plotting_utils import colorscale
from nilearn._utils.niimg import _safe_get_data

from image_preprocess import (
    _threshold_data,
    _mask_stat_map,
    _load_bg_img,
    _resample_stat_map,
    _get_cut_slices,
)


class WebAssets:
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
    :type bg_img: Nimg-like object, optional
        See http://nilearn.github.io/manipulating_images/input_output.html
    :param cmap: The colormap for specified image.
    :type cmap:  matplotlib colormap, optional
    :param vmax: max value for mapping colors.
        If vmax is None and symmetric_cmap is True, vmax is the max
        absolute value of the volume.
        If vmax is None and symmetric_cmap is False, vmax is the max
        value of the volume.
    :type vmax: float, or None, optional
    :param vmin: min value for mapping colors.
        If `symmetric_cmap` is `True`, `vmin` is always equal to `-vmax` and
        cannot be chosen.
        If `symmetric_cmap` is `False`, `vmin` defaults to the min of the
        image, or 0 when a threshold is used.
    :type vmin: float, or None, optional
    :param dim: Dimming factor applied to background image. By default, automatic
        heuristics are applied based upon the background image intensity.
        Accepted float values, where a typical scan is between -2 and 2
        (-2 = increase constrast; 2 = decrease contrast), but larger values
        can be used for a more pronounced effect. 0 means no dimming.
    :type dim: float or 'auto', optional
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
        cmap=cm.cold_hot,
        vmax=None,
        vmin=None,
        dim="auto",
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
        self.cmap = cmap
        self.vmax = vmax
        self.vmin = vmin
        self.dim = dim
        self.threshold = threshold
        self.black_bg = black_bg
        self.cut_coords = cut_coords
        self.symmetric_cmap = symmetric_cmap
        self.resampling_interpolation = resampling_interpolation
        self.format = _check_format(format)
        self.base64 = base64
        self.verbose = verbose
        self.type_viewer = "brainsprite"

    def generate(self, path_output=os.getcwd(), bg_webimg=None):
        """Load an image, generate web assets.
        """

        # Output folder - will only be used if base64 encoding is disabled
        output_sprite = os.path.join(os.getcwd(), f"{self.name}.{self.format}")
        output_cmap = os.path.join(os.getcwd(), f"{self.name}_cm.{self.format}")

        # Prepare the color map and thresholding
        mask_img, stat_map_img, data, self.threshold = _mask_stat_map(
            self.img, self.threshold
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
            stat_map_img, self.bg_img, self.black_bg, self.dim
        )

        self.img, mask_img = _resample_stat_map(
            stat_map_img, bg_img, mask_img, self.resampling_interpolation
        )

        self.cut_slices_ = _get_cut_slices(
            stat_map_img, self.cut_coords, self.threshold
        )

        self.web_img_ = (
            _save_sprite(
                output_sprite=output_sprite,
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
                output_cmap=output_cmap,
                base64=self.base64,
                cmap=self.colors_["cmap"],
                format=self.format,
            ),
        )

        self.metadata_ = (
            _save_metadata(
                shape=stat_map_img.shape,
                affine=stat_map_img.affine,
                black_bg=self.black_bg,
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


def _bytesIO_to_base64(handle_io):
    """ Encode the content of a bytesIO virtual file as base64.
        Also closes the file.
        Returns: data
    """
    handle_io.seek(0)
    data = b64encode(handle_io.read()).decode("utf-8")
    handle_io.close()
    return data


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
        imsave(output_sprite, sprite, cmap=cmap, format=format)

    return output_sprite


def _set_colors(black_bg):
    if black_bg:
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
    metadata["X_num"] = cut_slices[0] - 1
    metadata["Y_num"] = cut_slices[1] - 1
    metadata["Z_num"] = cut_slices[2] - 1
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
