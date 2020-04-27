"""
Anatomical scan viewer - Python
===============================

This example generates a brainsprite viewer for an anatomical scan using python, and then explains how to embed the viewer in an html document.
"""

#%%
# We first download an anatomical scan through one of nilearn's fetcher
from nilearn import datasets

# one anatomical scan from the haxby dataset
haxby_dataset = datasets.fetch_haxby()
haxby_anat_filename = haxby_dataset.anat[0]

#%%
# We use :code:`brainsprite_viewer` to generate the viewer object in python.
# The defaults are set for a functional map, and we will need
# to specify a few arguments to get the right aspect:
#  * use a gray colormap (:code:`cmap`),
#  * do not to a symmetric colormap, centered around zero (:code:`symmetric_cmap`)
#  * pick colors matching a black background (:code:`black_bg`)
#  * set the maximum value displayed in the image to increase contrast (:code:`vmax`)
#  * add a title to the viewer (:code:`title`)
from brainsprite import brainsprite_viewer

viewer = brainsprite_viewer(haxby_anat_filename, cmap='gray',
                         symmetric_cmap=False, black_bg=True,
                         threshold=None, vmax=250, title="anatomical scan", value=False)
# In a Jupyter notebook, if ``view`` is the output of a cell, it will
# be displayed below the cell
viewer

#%%
# We can export the viewer as an html page. The html page is fully self-contained: it includes the javascript brainsprite library as well as the sprite.
viewer.save_as_html('plot_anat.html')

#%%
# It is possible to include this html page as an iframe in
# another html document, using the following snippet.
#
# .. code-block:: html
#
#   <iframe src="plot_anat.html"></iframe>
#
# Note that the style of the iframe may need to be modified in
# order to, e.g. center the iframe in the page.
# This is better done through css, but here is an example of
# in-line html styling with centering and adapting the size of the iframe to the size of the image:
#
# .. code-block:: html
#
#   <iframe src="plot_anat.html" width=500 height=200
#       style="padding:0; border:0; display: block;
#       margin-left: auto; margin-right: auto"></iframe>
