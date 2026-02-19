"""High-level viewer functions for brainsprite."""
import json
from pathlib import Path

import tempita

from brainsprite.brainsprite import viewer_substitute


def view_registration(
    stat_map_img,
    bg_img="MNI152",
    cut_coords=None,
    colorbar=True,
    title=None,
    threshold=None,
    annotate=True,
    draw_cross=True,
    black_bg="auto",
    cmap="gray",
    symmetric_cmap=False,
    dim="auto",
    vmax=None,
    vmin=None,
    resampling_interpolation="continuous",
    opacity=0.5,
    value=True,
    radiological=False,
    showLR=True,
):
    """Interactive viewer for assessing image registration quality.

    Displays a single overlay image on top of a background (default: MNI152
    template) with an interactive opacity slider. Slide to blend between the
    two images and judge how well they are aligned.

    No thresholding is applied by default so that the full extent of the
    overlay (including low-signal regions) is visible.

    Parameters
    ----------
    stat_map_img : Niimg-like object
        The image to overlay — typically a functional volume (EPI) or any
        image whose registration you want to verify.
    bg_img : Niimg-like object, optional
        The reference/background image. Defaults to the MNI152 template.
        Pass ``None`` or ``False`` to disable the background.
    cut_coords : None or tuple of floats, optional
        MNI coordinates (x, y, z) of the cut point. If ``None``, cuts are
        chosen automatically.
    colorbar : bool, optional
        If ``True`` (default), display a colorbar.
    title : str or None, optional
        Title displayed in the viewer. ``None`` means no title.
    threshold : str, number or None, optional
        Threshold applied to the overlay. Defaults to ``None`` (no masking)
        so the full image extent is shown.
    annotate : bool, optional
        If ``True`` (default), display current cut coordinates.
    draw_cross : bool, optional
        If ``True`` (default), draw a crosshair on the viewer.
    black_bg : bool or "auto", optional
        Background colour. ``"auto"`` guesses from the background image.
    cmap : matplotlib colormap, optional
        Colormap for the overlay. Defaults to ``"gray"``.
    symmetric_cmap : bool, optional
        If ``True``, the colormap is symmetric around zero. Defaults to
        ``False``.
    dim : float or "auto", optional
        Dimming factor for the background image.
    vmax : float or None, optional
        Maximum value for the overlay colormap. Inferred automatically when
        ``None``.
    vmin : float or None, optional
        Minimum value for the overlay colormap. Inferred automatically when
        ``None``.
    resampling_interpolation : str, optional
        Interpolation used when resampling the overlay to the background.
    opacity : float, optional
        Initial opacity of the overlay (0 = transparent, 1 = opaque).
        Defaults to ``0.5`` so both images are immediately visible.
        The slider lets the user adjust this interactively.
    value : bool, optional
        If ``True`` (default), show the overlay value at the cursor position.
    radiological : bool, optional
        If ``True``, display in radiological convention (left on right).
    showLR : bool, optional
        If ``True`` (default), show L/R labels.

    Returns
    -------
    StatMapView
        An HTML document object that can be displayed in a Jupyter notebook or
        saved with :meth:`~brainsprite.brainsprite.StatMapView.save_as_html`.
    """
    bsprite = viewer_substitute(
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
        radiological=radiological,
        showLR=showLR,
    )
    bsprite.fit(stat_map_img, bg_img=bg_img)

    resource_path = Path(__file__).resolve().parent / "data" / "html"
    tpl = tempita.Template.from_filename(
        str(resource_path / "viewer_registration.html"), encoding="utf-8"
    )
    return bsprite.transform(
        tpl,
        javascript="js",
        html="html",
        library="bsprite",
        namespace={
            "opacity": opacity,
            "opacity_pct": int(round(opacity * 100)),
        },
    )


def view_fmri(
    stat_map_img,
    bg_img="MNI152",
    cut_coords=None,
    colorbar=True,
    title=None,
    threshold=1e-6,
    annotate=True,
    draw_cross=True,
    black_bg="auto",
    cmap="gray",
    symmetric_cmap=False,
    dim="auto",
    vmax=None,
    vmin=None,
    resampling_interpolation="continuous",
    opacity=1,
    value=True,
    radiological=False,
    showLR=True,
    tr=None,
    labels=None,
):
    """Interactive viewer for fMRI / 4D neuroimaging data with slider navigation.

    Generates a self-contained HTML viewer that displays a 4D NIfTI image (or
    a list of 3D images) with a slider and arrow-key bindings to step through
    volumes. A shared colorscale is enforced across all volumes. Volume labels
    default to ``"Volume N (t=N*TR sec)"`` when ``tr`` is supplied, otherwise
    ``"Volume N"``. Custom labels can also be provided.

    Parameters
    ----------
    stat_map_img : Niimg-like object or list of Niimg-like objects
        The statistical map image. Can be a 3D volume, a 4D volume (each time
        point becomes a separate overlay), or a list of 3D Niimg-like objects.
    bg_img : Niimg-like object, optional
        The background image. Defaults to the MNI152 template. Pass ``None``
        or ``False`` to disable the background.
    cut_coords : None or tuple of floats, optional
        MNI coordinates (x, y, z) of the cut point. If ``None``, cuts are
        chosen automatically.
    colorbar : bool, optional
        If ``True`` (default), display a colorbar.
    title : str or None, optional
        Title displayed in the viewer. ``None`` means no title.
    threshold : str, number or None, optional
        Threshold applied to the stat map. ``None`` means no thresholding.
    annotate : bool, optional
        If ``True`` (default), display current cut coordinates.
    draw_cross : bool, optional
        If ``True`` (default), draw a crosshair on the viewer.
    black_bg : bool or "auto", optional
        Background colour. ``"auto"`` guesses from the image.
    cmap : matplotlib colormap, optional
        Colormap for the overlay. Defaults to ``"gray"``.
    symmetric_cmap : bool, optional
        If ``True``, the colormap is symmetric around zero. Defaults to
        ``False``, which is appropriate for grayscale fMRI overlays.
    dim : float or "auto", optional
        Dimming factor for the background image.
    vmax : float or None, optional
        Maximum value for the colormap. Inferred automatically when ``None``.
        The same vmax is used for all volumes (shared colorscale).
    vmin : float or None, optional
        Minimum value for the colormap. Inferred automatically when ``None``.
        The same vmin is used for all volumes (shared colorscale).
    resampling_interpolation : str, optional
        Interpolation used when resampling to the background image.
    opacity : float, optional
        Opacity of the overlay (0 = transparent, 1 = opaque).
    value : bool, optional
        If ``True`` (default), show the overlay value at the cursor position.
    radiological : bool, optional
        If ``True``, display in radiological convention (left on right).
    showLR : bool, optional
        If ``True`` (default), show L/R labels.
    tr : float or None, optional
        Repetition time in seconds. When provided, auto-generated labels
        include the acquisition time: ``"Volume N (t=N*TR sec)"``.
        Ignored when ``labels`` is provided explicitly.
    labels : list of str or None, optional
        Labels for each volume. When ``None``, labels are generated
        automatically (see ``tr``). Must have the same length as the number of
        volumes when provided.

    Returns
    -------
    StatMapView
        An HTML document object that can be displayed in a Jupyter notebook or
        saved with :meth:`~brainsprite.brainsprite.StatMapView.save_as_html`.

    Raises
    ------
    ValueError
        If ``labels`` is provided but its length does not match the number of
        volumes in ``stat_map_img``.
    """
    bsprite = viewer_substitute(
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
        radiological=radiological,
        showLR=showLR,
    )
    bsprite.fit(stat_map_img, bg_img=bg_img)

    num_frames = len(bsprite.sprites_overlay_)
    if labels is not None:
        if len(labels) != num_frames:
            raise ValueError(
                f"len(labels) must equal the number of volumes ({num_frames}), "
                f"got {len(labels)}."
            )
    elif tr is not None:
        labels = [f"Volume {i} (t={i * tr:g} sec)" for i in range(num_frames)]
    else:
        labels = [f"Volume {i}" for i in range(num_frames)]

    resource_path = Path(__file__).resolve().parent / "data" / "html"
    tpl = tempita.Template.from_filename(
        str(resource_path / "viewer_4d.html"), encoding="utf-8"
    )
    return bsprite.transform(
        tpl,
        javascript="js",
        html="html",
        library="bsprite",
        namespace={
            "num_frames": num_frames,
            "labels": labels,
            "labels_json": json.dumps(labels),
        },
    )
