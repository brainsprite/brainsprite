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

# Stack three contrasts: full, half, and quarter amplitude
img_4d = nib.Nifti1Image(
    np.stack([data, data * 0.5, -data * 0.75], axis=-1),
    stat_img.affine,
)

# %%
# Create a viewer with the 4D image.  The ``fit()`` method detects the 4D
# shape automatically, splits it into volumes, and generates one sprite per
# volume using a shared colorscale.
from brainsprite import viewer_substitute

bsprite = viewer_substitute(
    threshold=3,
    opacity=0.5,
    title="4D brain viewer",
    cut_coords=[36, -27, 66],
    radiological=True,
)
bsprite.fit(img_4d)
num_frames = len(bsprite.sprites_overlay_)

# %%
# Load a custom HTML template that adds a slider and label.
from pathlib import Path

import tempita

examples_dir = Path.cwd()
if examples_dir.name != "examples":
    examples_dir = examples_dir / "examples"
file_template = examples_dir / "viewer_4d_template.html"
template = tempita.Template.from_filename(file_template, encoding="utf-8")

viewer = bsprite.transform(
    template,
    javascript="js",
    html="html",
    library="bsprite",
    namespace={"num_frames": num_frames},
)

# %%
# In a Jupyter notebook, the viewer is displayed directly in the cell output.
viewer

# %%
# Save the viewer as a self-contained HTML file.
viewer.save_as_html(examples_dir / "plot_4d.html")
