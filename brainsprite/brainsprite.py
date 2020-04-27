"""Python interface to the brainsprite library.
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


def _viewer_size(shape):
    """ Define the size of the viewer.
        Returns: width_view, height_view
    """
    # slices_width = sagittal_width (y) + coronal_width (x) + axial_width (x)
    slices_width = shape[1] + 2 * shape[0]

    # slices_height = max of sagittal_height (z), coronal_height (z), and
    # axial_height (y).
    # Also add 20% extra height for annotation and margin
    slices_height = np.max([shape[1], shape[2]])
    slices_height = 1.20 * slices_height

    # Get the final size of the viewer
    width_view = 600
    ratio = slices_height / slices_width
    height_view = np.ceil(ratio * width_view)

    return width_view, height_view


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


def _brainsprite_html(
    canvas,
    sprite,
    sprite_overlay,
    img_colorMap,
    bg_img,
    base64,
    stat_map_img,
    mask_img,
    bg_min,
    bg_max,
    colors,
    cmap,
    colorbar,
):
    """Create an html snippet for the brainsprite viewer (with sprite data).
    """
    # Initiate template
    resource_path = Path(__file__).resolve().parent.joinpath("assets", "html")
    if base64:
        file_template = resource_path.joinpath("brainsprite_template_base64.html")
        file_bg = None
        file_overlay = None
        file_colormap = None
    else:
        file_template = resource_path.joinpath("brainsprite_template.html")
        file_bg = sprite + ".png"
        file_bg = sprite_overlay + ".png"
        file_colormap = img_colorMap + ".png"
    tpl = tempita.Template.from_filename(str(file_template), encoding="utf-8")

    # Fill template
    snippet_html = tpl.substitute(
        canvas=canvas,
        sprite=sprite,
        img_colorMap=img_colorMap,
        sprite_overlay=sprite_overlay,
        bg_base64=_save_sprite(
            output_sprite=file_bg, img=bg_img, vmax=bg_max, vmin=bg_min, cmap="gray"
        ),
        overlay_base64=_save_sprite(
            output_sprite=file_overlay,
            img=stat_map_img,
            vmax=colors["vmax"],
            vmin=colors["vmin"],
            mask=mask_img,
            cmap=cmap,
        ),
        colormap_base64=_save_cm(
            output_cmap=file_colormap, cmap=colors["cmap"], format="png"
        ),
    )
    return snippet_html


def _brainsprite_js(
    canvas,
    sprite,
    sprite_overlay,
    img_colorMap,
    shape,
    affine,
    min,
    max,
    cut_slices,
    colorFont,
    colorBackground,
    opacity=1,
    crosshair=True,
    flagCoordinates=True,
    title=None,
    colorbar=True,
    flagValue=True,
):
    """ Create a js snippet for the brainsprite viewer
    """
    # Initiate template
    resource_path = Path(__file__).resolve().parent.joinpath("assets", "js")
    file_template = resource_path.joinpath("brainsprite_template.js")
    tpl = tempita.Template.from_filename(str(file_template), encoding="utf-8")

    return tpl.substitute(
        canvas=canvas,
        sprite=sprite,
        X=shape[0],
        Y=shape[1],
        Z=shape[2],
        sprite_overlay=sprite_overlay,
        X_overlay=shape[0],
        Y_overlay=shape[1],
        Z_overlay=shape[2],
        opacity=opacity,
        colorBackground=colorBackground,
        colorFont=colorFont,
        crosshair=float(crosshair),
        affine=affine.tolist(),
        flagCoordinates=float(flagCoordinates),
        title=title,
        flagValue=float(flagValue),
        X_num=cut_slices[0] - 1,
        Y_num=cut_slices[1] - 1,
        Z_num=cut_slices[2] - 1,
        img_colorMap=img_colorMap,
        min=min,
        max=max,
        colorbar=float(not colorbar),
    )


def brainsprite_data(
    stat_map_img,
    canvas="3Dviewer",
    sprite="spriteImg",
    sprite_overlay="overlayImg",
    img_colorMap="colorMap",
    bg_img="MNI152",
    cut_coords=None,
    colorbar=True,
    title=None,
    threshold=1e-6,
    annotate=True,
    draw_cross=True,
    black_bg="auto",
    cmap=cm.cold_hot,
    symmetric_cmap=True,
    dim="auto",
    vmax=None,
    vmin=None,
    resampling_interpolation="continuous",
    opacity=1,
    value=True,
    base64=True,
):
    """Generate data (sprites and code) for a brainsprite viewer

    Parameters
    ----------
    stat_map_img : Niimg-like object
        See http://nilearn.github.io/manipulating_images/input_output.html
        The statistical map image. Can be either a 3D volume or a 4D volume
        with exactly one time point.
    canvas : str
        The label for the brainsprite html canvas.
    sprite : str
        The label for the html sprite background image.
    sprite_overlay : str
        The label for the html sprite overlay image.
    img_colorMap : str
        The label for the html colormap image.
    bg_img : Niimg-like object (default='MNI152')
        See http://nilearn.github.io/manipulating_images/input_output.html
        The background image that the stat map will be plotted on top of.
        If nothing is specified, the MNI152 template will be used.
        To turn off background image, just pass "bg_img=False".
    cut_coords : None, or a tuple of floats (default None)
        The MNI coordinates of the point where the cut is performed
        as a 3-tuple: (x, y, z). If None is given, the cuts are calculated
        automaticaly.
    colorbar : boolean, optional (default True)
        If True, display a colorbar on top of the plots.
    title : string or None (default=None)
        The title displayed on the figure (or None: no title).
    threshold : string, number or None  (default=1e-6)
        If None is given, the image is not thresholded.
        If a string of the form "90%" is given, use the 90-th percentile of
        the absolute value in the image.
        If a number is given, it is used to threshold the image:
        values below the threshold (in absolute value) are plotted
        as transparent. If auto is given, the threshold is determined
        automatically.
    annotate : boolean (default=True)
        If annotate is True, current cuts are added to the viewer.
    draw_cross : boolean (default=True)
        If draw_cross is True, a cross is drawn on the plot to
        indicate the cuts.
    black_bg : boolean (default='auto')
        If True, the background of the image is set to be black.
        Otherwise, a white background is used.
        If set to auto, an educated guess is made to find if the background
        is white or black.
    cmap : matplotlib colormap, optional
        The colormap for specified image.
    symmetric_cmap : bool, optional (default=True)
        True: make colormap symmetric (ranging from -vmax to vmax).
        False: the colormap will go from the minimum of the volume to vmax.
        Set it to False if you are plotting a positive volume, e.g. an atlas
        or an anatomical image.
    dim : float, 'auto' (default='auto')
        Dimming factor applied to background image. By default, automatic
        heuristics are applied based upon the background image intensity.
        Accepted float values, where a typical scan is between -2 and 2
        (-2 = increase constrast; 2 = decrease contrast), but larger values
        can be used for a more pronounced effect. 0 means no dimming.
    vmax : float, or None (default=None)
        max value for mapping colors.
        If vmax is None and symmetric_cmap is True, vmax is the max
        absolute value of the volume.
        If vmax is None and symmetric_cmap is False, vmax is the max
        value of the volume.
    vmin : float, or None (default=None)
        min value for mapping colors.
        If `symmetric_cmap` is `True`, `vmin` is always equal to `-vmax` and
        cannot be chosen.
        If `symmetric_cmap` is `False`, `vmin` defaults to the min of the
        image, or 0 when a threshold is used.
    resampling_interpolation : string, optional (default continuous)
        The interpolation method for resampling.
        Can be 'continuous', 'linear', or 'nearest'.
        See nilearn.image.resample_img
    opacity : float in [0,1] (default 1)
        The level of opacity of the overlay (0: transparent, 1: opaque)
    value : boolean (default True)
        dislay the value of the overlay at the current voxel.
    base64 : boolean (default True)
        turn on/off embedding of sprites in the html using base64 encoding.
        If the flag is off, the sprites will be saved
    Returns
    -------
    bsprite : a brainsprite data structure.

    """

    # Prepare the color map and thresholding
    mask_img, stat_map_img, data, threshold = _mask_stat_map(stat_map_img, threshold)

    colors = colorscale(
        cmap,
        data.ravel(),
        threshold=threshold,
        symmetric_cmap=symmetric_cmap,
        vmax=vmax,
        vmin=vmin,
    )

    if black_bg:
        cfont = "#FFFFFF"
        cbg = "#000000"
    else:
        cfont = "#000000"
        cbg = "#FFFFFF"

    # Prepare the data for the cuts
    bg_img, bg_min, bg_max, black_bg = _load_bg_img(stat_map_img, bg_img, black_bg, dim)
    stat_map_img, mask_img = _resample_stat_map(
        stat_map_img, bg_img, mask_img, resampling_interpolation
    )
    cut_slices = _get_cut_slices(stat_map_img, cut_coords, threshold)

    # Now create the viewer, and populate the sprite data
    bsprite = {}
    bsprite["html"] = _brainsprite_html(
        canvas=canvas,
        sprite=sprite,
        sprite_overlay=sprite_overlay,
        img_colorMap=img_colorMap,
        bg_img=bg_img,
        base64=base64,
        stat_map_img=stat_map_img,
        mask_img=mask_img,
        bg_min=bg_min,
        bg_max=bg_max,
        colors=colors,
        cmap=cmap,
        colorbar=colorbar,
    )

    # Add the javascript snippet
    bsprite["js"] = _brainsprite_js(
        canvas=canvas,
        sprite=sprite,
        sprite_overlay=sprite_overlay,
        img_colorMap=img_colorMap,
        shape=stat_map_img.shape,
        affine=stat_map_img.affine,
        min=colors["vmin"],
        max=colors["vmax"],
        cut_slices=cut_slices,
        colorFont=cfont,
        colorBackground=cbg,
        opacity=opacity,
        crosshair=draw_cross,
        flagCoordinates=annotate,
        title=title,
        colorbar=colorbar,
        flagValue=value,
    )

    # Suggest a size for the viewer
    # width x height, in pixels
    bsprite["size"] = _viewer_size(stat_map_img.shape)

    return bsprite


def brainsprite_viewer(
    stat_map_img,
    bg_img="MNI152",
    cut_coords=None,
    colorbar=True,
    title=None,
    threshold=1e-6,
    annotate=True,
    draw_cross=True,
    black_bg="auto",
    cmap=cm.cold_hot,
    symmetric_cmap=True,
    dim="auto",
    vmax=None,
    vmin=None,
    resampling_interpolation="continuous",
    opacity=1,
    value=True,
):
    """Interactive html viewer of a statistical map, with optional background

    Parameters
    ----------
    stat_map_img : Niimg-like object
        See http://nilearn.github.io/manipulating_images/input_output.html
        The statistical map image. Can be either a 3D volume or a 4D volume
        with exactly one time point.
    bg_img : Niimg-like object (default='MNI152')
        See http://nilearn.github.io/manipulating_images/input_output.html
        The background image that the stat map will be plotted on top of.
        If nothing is specified, the MNI152 template will be used.
        To turn off background image, just pass "bg_img=False".
    cut_coords : None, or a tuple of floats (default None)
        The MNI coordinates of the point where the cut is performed
        as a 3-tuple: (x, y, z). If None is given, the cuts are calculated
        automaticaly.
    colorbar : boolean, optional (default True)
        If True, display a colorbar on top of the plots.
    title : string or None (default=None)
        The title displayed on the figure (or None: no title).
    threshold : string, number or None  (default=1e-6)
        If None is given, the image is not thresholded.
        If a string of the form "90%" is given, use the 90-th percentile of
        the absolute value in the image.
        If a number is given, it is used to threshold the image:
        values below the threshold (in absolute value) are plotted
        as transparent. If auto is given, the threshold is determined
        automatically.
    annotate : boolean (default=True)
        If annotate is True, current cuts are added to the viewer.
    draw_cross : boolean (default=True)
        If draw_cross is True, a cross is drawn on the plot to
        indicate the cuts.
    black_bg : boolean (default='auto')
        If True, the background of the image is set to be black.
        Otherwise, a white background is used.
        If set to auto, an educated guess is made to find if the background
        is white or black.
    cmap : matplotlib colormap, optional
        The colormap for specified image.
    symmetric_cmap : bool, optional (default=True)
        True: make colormap symmetric (ranging from -vmax to vmax).
        False: the colormap will go from the minimum of the volume to vmax.
        Set it to False if you are plotting a positive volume, e.g. an atlas
        or an anatomical image.
    dim : float, 'auto' (default='auto')
        Dimming factor applied to background image. By default, automatic
        heuristics are applied based upon the background image intensity.
        Accepted float values, where a typical scan is between -2 and 2
        (-2 = increase constrast; 2 = decrease contrast), but larger values
        can be used for a more pronounced effect. 0 means no dimming.
    vmax : float, or None (default=None)
        max value for mapping colors.
        If vmax is None and symmetric_cmap is True, vmax is the max
        absolute value of the volume.
        If vmax is None and symmetric_cmap is False, vmax is the max
        value of the volume.
    vmin : float, or None (default=None)
        min value for mapping colors.
        If `symmetric_cmap` is `True`, `vmin` is always equal to `-vmax` and
        cannot be chosen.
        If `symmetric_cmap` is `False`, `vmin` defaults to the min of the
        image, or 0 when a threshold is used.
    resampling_interpolation : string, optional (default continuous)
        The interpolation method for resampling.
        Can be 'continuous', 'linear', or 'nearest'.
        See nilearn.image.resample_img
    opacity : float in [0,1] (default 1)
        The level of opacity of the overlay (0: transparent, 1: opaque)
    value : boolean (default True)
        dislay the value of the overlay at the current voxel.

    Returns
    -------
    html_view : the html viewer object.
        It can be saved as an html page `html_view.save_as_html('test.html')`,
        or opened in a browser `html_view.open_in_browser()`.
        If the output is not requested and the current environment is a Jupyter
        notebook, the viewer will be inserted in the notebook.

    See Also
    --------
    nilearn.plotting.plot_stat_map:
        static plot of brain volume, on a single or multiple planes.
    nilearn.plotting.view_connectome:
        interactive 3d view of a connectome.
    nilearn.plotting.view_markers:
        interactive plot of colored markers.
    nilearn.plotting.view_surf, nilearn.plotting.view_img_on_surf:
        interactive view of statistical maps or surface atlases on the cortical
        surface.
    """
    # Generate sprites and meta-data
    bsprite = brainsprite_data(
        stat_map_img,
        bg_img=bg_img,
        cut_coords=cut_coords,
        colorbar=colorbar,
        title=title,
        threshold=threshold,
        annotate=annotate,
        draw_cross=draw_cross,
        black_bg=black_bg,
        cmap=cmap,
        symmetric_cmap=symmetric_cmap,
        dim=dim,
        vmax=vmax,
        vmin=vmin,
        resampling_interpolation=resampling_interpolation,
        opacity=opacity,
        value=value,
        base64=True,
    )

    # Add js assets
    js_dir = os.path.join(os.path.dirname(__file__), "assets", "js")
    with open(os.path.join(js_dir, "jquery.min.js")) as f:
        bsprite["jquery_js"] = f.read()
    with open(os.path.join(js_dir, "brainsprite.min.js")) as f:
        bsprite["brainsprite_js"] = f.read()

    # Initiate template
    resource_path = Path(__file__).resolve().parent.joinpath("assets", "html")
    file_template = resource_path.joinpath("viewer_template.html")
    tpl = tempita.Template.from_filename(str(file_template), encoding="utf-8")

    # Populate template
    viewer = tpl.substitute(
        title=title,
        jquery_js=bsprite["jquery_js"],
        brainsprite_js=bsprite["brainsprite_js"],
        bsprite_html=bsprite["html"],
        bsprite_js=bsprite["js"],
    )

    return HTMLDocument(viewer, width=bsprite["size"][0], height=bsprite["size"][1])