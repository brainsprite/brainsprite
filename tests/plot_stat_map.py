"""
Statistical map viewer
======================
Generate a brainsprite viewer for an activation map with an anatomical
background, by populating an html template.
"""

#%%
# First fetch the MNI high-resolution template and a functional statistical map.
from nilearn import datasets
anat = datasets.MNI152_FILE_PATH

# one motor contrast map from NeuroVault
motor_images = datasets.fetch_neurovault_motor_task()
stat_img = motor_images.images[0]

#%%
# We are going to use the same template and instruction as in the
# `plot_anat <plot_anat.html>`_ tutorial. The defaults are set for a functional
# map, so there is not much to do. We still tweak a couple parameters to get a
# clean map:
#
#  * apply a threshold to get rid of small activation (:code:`threshold`),
#  * reduce the opacity of the overlay to see the underlying anatomy (:code:`opacity`)
#  * Put a title inside the figure (:code:`title`)
#  * manually specify the cut coordinates (:code:`cut_coords`)
from brainsprite import viewer_substitute

bsprite = viewer_substitute(threshold=3, opacity=0.5, title="plot_stat_map",
                         cut_coords=[36, -27, 66])
bsprite.fit(stat_img, bg_img=anat)

#%%
# We can now open the template with tempita, and fill it with the required
# information. The parameters indicate which tempita names we used in the
# template for the javascript, html and library code, respectively.
import tempita
file_template = '../docs/source/_static/viewer_template.html'
template = tempita.Template.from_filename(file_template, encoding="utf-8")

viewer = bsprite.transform(template, javascript='js', html='html', library='bsprite')

# In a Jupyter notebook, if ``view`` is the output of a cell, it will
# be displayed below the cell
viewer

#%%
# The following instruction can be used to save the viewer in a stand-alone,
# html document:
viewer.save_as_html('plot_stat_map.html')

#%%
# There are a lot more control one can use to modify the appearance of the
# brain viewer. Check the Python API for more information.
