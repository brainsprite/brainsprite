"""Registration quality viewer
==============================

Visually assess the registration of a functional (EPI) volume to the MNI152
template using an interactive opacity slider.  Slide to blend between the EPI
and the anatomical reference — misaligned structures become obvious when the
two images do not match at any opacity level.
"""

# %%
# Fetch one resting-state fMRI run from the ADHD dataset and extract the
# first volume.  The dataset is already registered to MNI space, so the
# overlay should align well with the default MNI152 background.
from nilearn.datasets import fetch_adhd
from nilearn.image import index_img

adhd_dataset = fetch_adhd(n_subjects=1)
first_vol = index_img(adhd_dataset.func[0], 0)

print(f"Volume shape : {first_vol.shape}")

# %%
# Create the registration viewer.  ``view_registration`` overlays the EPI
# volume on the MNI152 template with no thresholding (the full image extent
# is shown) and starts the opacity slider at 50 % so both images are
# immediately visible.
from pathlib import Path

from brainsprite import view_registration

viewer = view_registration(
    first_vol,
    title="Registration check: ADHD fMRI → MNI152",
)

# %%
# In a Jupyter notebook the viewer appears directly in the cell output.
viewer

# %%
# Save as a standalone, self-contained HTML file.
examples_dir = Path.cwd()
if examples_dir.name != "examples":
    examples_dir = examples_dir / "examples"
viewer.save_as_html(examples_dir / "plot_registration.html")
