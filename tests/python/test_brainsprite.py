"""Test for brainsprite."""

import warnings
from pathlib import Path

import numpy as np
import pytest
from nibabel import Nifti1Image
from nilearn import datasets, image
from nilearn.externals import tempita
from nilearn.image import get_data, new_img_like

from brainsprite import brainsprite as bp


def _simulate_img(affine=None):
    """Simulate data with one "spot"
    Returns: img, data.
    """
    if affine is None:
        affine = np.eye(4)
    data = np.zeros([8, 8, 8])
    data[4, 4, 4] = 1
    img = Nifti1Image(data, affine)
    return img, data


def _check_affine(affine):
    """Check positive, isotropic, near-diagonal affine."""
    assert affine[0, 0] == affine[1, 1]
    assert affine[2, 2] == affine[1, 1]
    assert affine[0, 0] > 0

    a, _ = image.resampling.to_matrix_vector(affine)
    assert np.all(
        (np.abs(a) > 0.001).sum(axis=0) == 1
    ), "the affine transform was not near-diagonal"


def test_data_to_sprite():
    # Simulate data and turn into sprite
    data = np.zeros([8, 8, 8])
    data[2:6, 2:6, 2:6] = 1
    sprite = bp._data_to_sprite(data)

    # Generate ground truth for the sprite
    z = np.zeros([8, 8])
    zr = np.zeros([2, 8])
    cr = np.tile(np.array([[0, 0, 1, 1, 1, 1, 0, 0]]), [4, 1])
    c = np.concatenate((zr, cr, zr), axis=0)
    gtruth = np.concatenate(
        (
            np.concatenate((z, z, c), axis=1),
            np.concatenate((c, c, c), axis=1),
            np.concatenate((z, z, z), axis=1),
        ),
        axis=0,
    )

    assert sprite.shape == gtruth.shape, "shape of sprite not as expected"
    assert (sprite == gtruth).all(), "simulated sprite not as expected"


def test_threshold_data():
    data = np.arange(-3, 4)

    # Check that an 'auto' threshold leaves at least one element
    data_t, mask, _ = bp._threshold_data(data, threshold="auto")
    gtruth_m = np.array([False, True, True, True, True, True, False])
    gtruth_d = np.array([-3, 0, 0, 0, 0, 0, 3])
    assert (mask == gtruth_m).all()
    assert (data_t == gtruth_d).all()

    # Check that threshold=None keeps everything
    data_t, mask, _ = bp._threshold_data(data, threshold=None)
    assert np.all(np.logical_not(mask))
    assert np.all(data_t == data)

    # Check positive threshold works
    data_t, mask, _ = bp._threshold_data(data, threshold=1)
    gtruth = np.array([False, False, True, True, True, False, False])
    assert (mask == gtruth).all()

    # Check 0 threshold works
    data_t, mask, _ = bp._threshold_data(data, threshold=0)
    gtruth = np.array([False, False, False, True, False, False, False])
    assert (mask == gtruth).all()

    # Check that overly lenient threshold returns array
    data = np.arange(3, 10)
    data_t, mask, _ = bp._threshold_data(data, threshold=2)
    gtruth = np.full(7, False)
    assert (mask == gtruth).all()


def test_save_sprite():
    """This test covers _save_sprite."""
    # Generate simple simulated data with one "spot"
    img, _ = _simulate_img()
    mask, img, _, _ = bp._mask_stat_map(img, threshold=None)

    # Generate the sprite
    sprite_base64 = bp._save_sprite(img, vmin=0, vmax=1, mask=mask, format="png")

    # Check the sprite is correct
    assert sprite_base64.startswith("iVBORw0KG")
    assert sprite_base64.endswith("ABJRU5ErkJggg==")


def test_save_cmap():
    """This test covers _save_cmap."""
    # Save the cmap
    cmap_base64 = bp._save_cm("cold_hot", format="png", n_colors=2)

    # Check the colormap is correct
    assert cmap_base64.startswith("iVBORw0KG")
    assert cmap_base64.endswith("ElFTkSuQmCC")


def test_mask_stat_map():
    # Generate simple simulated data with one "spot"
    img, data = _simulate_img()

    # Try not to threshold anything
    mask_img, img, _, _ = bp._mask_stat_map(img, threshold=None)
    assert np.max(get_data(mask_img)) == 0

    # Now threshold at zero
    mask_img, img, _, _ = bp._mask_stat_map(img, threshold=0)
    assert np.min((data == 0) == get_data(mask_img))


def test_load_bg_img():
    # Generate simple simulated data with non-diagonal affine
    affine = np.eye(4)
    affine[0, 0] = -1
    affine[0, 1] = 0.1
    img, _ = _simulate_img(affine)

    # use empty bg_img
    bg_img, _, _, _ = bp._load_bg_img(img, bg_img=None)

    # Check positive isotropic, near-diagonal affine
    _check_affine(bg_img.affine)

    # Try to load the default background
    bg_img, _, _, _ = bp._load_bg_img(img)

    # Check positive isotropic, near-diagonal affine
    _check_affine(bg_img.affine)


def test_resample_stat_map():
    # Start with simple simulated data
    bg_img, data = _simulate_img()

    # Now double the voxel size and mess with the affine
    affine = 2 * np.eye(4)
    affine[3, 3] = 1
    affine[0, 1] = 0.1
    stat_map_img = Nifti1Image(data, affine)

    # Make a mask for the stat image
    mask_img = new_img_like(stat_map_img, data > 0, stat_map_img.affine)

    # Now run the resampling
    stat_map_img, mask_img = bp._resample_stat_map(
        stat_map_img, bg_img, mask_img, resampling_interpolation="nearest"
    )

    # Check positive isotropic, near-diagonal affine
    _check_affine(stat_map_img.affine)
    _check_affine(mask_img.affine)

    # Check voxel size matches bg_img
    assert (
        stat_map_img.affine[0, 0] == bg_img.affine[0, 0]
    ), "stat_map_img was not resampled at the resolution of background"
    assert (
        mask_img.affine[0, 0] == bg_img.affine[0, 0]
    ), "mask_img was not resampled at the resolution of background"


def test_get_cut_slices():
    # Generate simple simulated data with one "spot"
    img, data = _simulate_img()

    # Use automatic selection of coordinates
    cut_slices = bp._get_cut_slices(img, cut_coords=None, threshold=None)
    assert (cut_slices == [4, 4, 4]).all()

    # Check that using a single number for cut_coords raises an error
    with pytest.raises(ValueError):
        bp._get_cut_slices(img, cut_coords=4, threshold=None)

    # Check that it is possible to manually specify coordinates
    cut_slices = bp._get_cut_slices(img, cut_coords=[2, 2, 2], threshold=None)
    assert (cut_slices == [2, 2, 2]).all()

    # Check that the affine does not change where the cut is done
    affine = 2 * np.eye(4)
    img = Nifti1Image(data, affine)
    cut_slices = bp._get_cut_slices(img, cut_coords=None, threshold=None)
    assert (cut_slices == [4, 4, 4]).all()


def test_viewer_substitute():
    mni = datasets.load_mni152_template()
    with warnings.catch_warnings(record=True) as w:
        # Create a fake functional image by resample the template
        img = image.resample_img(mni, target_affine=3 * np.eye(3))
        file_template = Path(__file__).resolve().parent / "data" / "html" / "viewer_template.html"
        template = tempita.Template.from_filename(file_template, encoding="utf-8")
        bsprite = bp.viewer_substitute(
            cmap="gray",
            symmetric_cmap=False,
            black_bg=True,
            threshold=None,
            vmax=250,
            title="Slice viewer",
            value=False,
        )
        bsprite.fit(img)
        viewer = bsprite.transform(template, javascript="js", html="html", library="bsprite")
        _check_html(viewer)

        bsprite.fit(img, bg_img=mni)
        viewer = bsprite.transform(template, javascript="js", html="html", library="bsprite")
        _check_html(viewer)

        bsprite.fit(img, bg_img=None)
        viewer = bsprite.transform(template, javascript="js", html="html", library="bsprite")
        _check_html(viewer)

        img_4d = image.new_img_like(img, get_data(img)[:, :, :, np.newaxis])
        ndim = 4
        assert len(img_4d.shape) == ndim
        bsprite.fit(img_4d)

    # Check that all warnings were expected
    warnings_set = {warning_.category for warning_ in w}
    expected_set = {FutureWarning, UserWarning, DeprecationWarning}
    assert warnings_set.issubset(
        expected_set
    ), f"the following warnings were not expected: {warnings_set.difference(expected_set)}"


def _check_html(html_view):
    """Check the presence of some expected code in the html viewer."""
    assert isinstance(html_view, bp.StatMapView)
    assert "var brain =" in str(html_view)
    assert "overlayImg" in str(html_view)
