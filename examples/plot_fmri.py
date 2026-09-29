"""Resting-state fMRI viewer
===========================

Generate an interactive brainsprite viewer for a resting-state fMRI run
from the ADHD dataset.  A slider and arrow-key bindings let you step through
all 176 volumes; each label shows the acquisition time derived from the TR
stored in the image header.

.. note::
   Generating sprites for 176 volumes takes around a minute and produces a
   self-contained HTML file (~25 MB).
"""

# %%
# Fetch one resting-state fMRI run from the ADHD dataset.
import nibabel as nib
from nilearn.datasets import fetch_adhd

adhd_dataset = fetch_adhd(n_subjects=1)
func_img = nib.load(adhd_dataset.func[0])

print(f"fMRI shape : {func_img.shape}")   # (61, 73, 61, 176)

# %%
# Read the TR from the NIfTI header (4th zoom = time step in seconds).
tr = float(func_img.header.get_zooms()[3])
print(f"TR         : {tr} sec")

# %%
# Create the interactive viewer with a single ``view_fmri`` call.
# * ``bg_img=None``   — the fMRI volumes are displayed directly (no anatomical
#                       underlay) using the default gray colormap.
# * ``threshold=None`` — no thresholding; the raw BOLD signal is shown.
# * ``tr=tr``          — auto-generates labels ``"Volume N (t=X sec)"``.
from pathlib import Path

from brainsprite import view_fmri

viewer = view_fmri(
    func_img,
    bg_img=None,
    threshold=None,
    tr=tr,
    title="Resting-state fMRI (ADHD dataset)",
)

# %%
# In a Jupyter notebook the viewer appears directly in the cell output.
viewer

# %%
# Save as a standalone, self-contained HTML file.
examples_dir = Path.cwd()
if examples_dir.name != "examples":
    examples_dir = examples_dir / "examples"
viewer.save_as_html(examples_dir / "plot_fmri.html")
