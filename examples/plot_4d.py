"""4D brain viewer
================

Generate a brainsprite viewer for a 4D neuroimaging dataset (e.g. multiple
contrast maps), allowing the user to navigate through volumes with a slider
and arrow-key bindings.
"""

# %%
# First, fetch a sample activation map and build a synthetic 4D image by
# stacking three scaled versions of it (simulating multiple contrasts).
import nibabel as nib
import numpy as np
from nilearn import datasets

stat_img = nib.load(datasets.load_sample_motor_activation_image())
data = stat_img.get_fdata()

# Stack three contrasts: full, half, and inverted 75%
img_4d = nib.Nifti1Image(
    np.stack([data, data * 0.5, -data * 0.75], axis=-1),
    stat_img.affine,
)

# %%
# Create a viewer with a single ``view_fmri`` call.  The function detects the
# 4D shape automatically, splits it into volumes, and generates one sprite per
# volume using a shared colorscale.  Volume labels are shown in the slider.
from pathlib import Path

from brainsprite import view_fmri

viewer = view_fmri(
    img_4d,
    threshold=3,
    opacity=0.5,
    title="4D brain viewer",
    cut_coords=[36, -27, 66],
    radiological=True,
    labels=["Full amplitude", "Half amplitude", "Inverted 75%"],
)

# %%
# In a Jupyter notebook, the viewer is displayed directly in the cell output.
viewer

# %%
# Save the viewer as a self-contained HTML file.
examples_dir = Path.cwd()
if examples_dir.name != "examples":
    examples_dir = examples_dir / "examples"
viewer.save_as_html(examples_dir / "plot_4d.html")
