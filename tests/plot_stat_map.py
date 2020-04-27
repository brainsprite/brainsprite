"""
Statistical map viewer - Python
===============================

Brainsprite viewer for an activation map with an anatomical background, using the python API, and how to embed the viewer in an html document.
"""

#%%
# First fetch the MNI high-resolution template and a functional statistical map.
from nilearn import datasets
anat = datasets.MNI152_FILE_PATH

# one motor contrast map from NeuroVault
motor_images = datasets.fetch_neurovault_motor_task()
stat_img = motor_images.images[0]

#%%
# We use :code:`brainsprite_viewer` to generate the viewer object in python.
# The defaults are set for a functional map, so there is not much to do. We still
# tweak a couple parameters to get a clean map:
#  * apply a threshold to get rid of small activation (:code:`threshold`),
#  * reduce the opacity of the overlay to see the underlying anatomy (:code:`opacity`)
#  * Put a title inside the figure (:code:`title`)
#  * manually specify the cut coordinates (:code:`cut_coords`)
from brainsprite import brainsprite_viewer

viewer = brainsprite_viewer(stat_img, bg_img=anat, threshold=3,
                         opacity=0.5, title="plot_stat_map",
                         cut_coords=[36, -27, 66])

# In a Jupyter notebook, if ``view`` is the output of a cell, it will
# be displayed below the cell
viewer

#%%
# We can export the viewer as an html page. The html page is fully self-contained: it includes the javascript brainsprite library as well as the sprite.
viewer.save_as_html('plot_stat_map.html')

#%%
# That html document can be opened and rendered indepently, and can be shared,
# e.g. as an email attachment. It is possible to include this html page as an
# iframe in another html document, using the following snippet:
#
# .. code-block:: html
#
#   <iframe src="plot_stat_map.html"></iframe>
#
# Note that the style of the iframe may need to be modified in
# order to, e.g. center the iframe in the page.
# This is better done through css, but here is an example of
# in-line html styling with centering and adapting the size of the iframe to the size of the image:
#
# .. code-block:: html
#
#   <iframe src="plot_stat_map.html" width=500 height=200
#       style="padding:0; border:0; display: block;
#       margin-left: auto; margin-right: auto"></iframe>
