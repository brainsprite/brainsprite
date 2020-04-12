"""
Statistical map - Python
========================

Brainsprite viewer for an activation map with an anatomical scan in the background, using the python API, and how to embed the viewer in an html document.
"""

#%%
# We first download an anatomical scan through one of nilearn's fetcher
from nilearn import datasets

# one motor contrast map from NeuroVault
motor_images = datasets.fetch_neurovault_motor_task()
stat_img = motor_images.images[0]

#%%
# We use view_img to generate the viewer object in python.
# The defaults are set for a functional map, and we will need
# to specify a few arguments to get the right aspect:
#  * use a gray colormap (using :code:`cmap`),
#  * do not to a symmetric colormap, centered around zero (using :code:`symmetric_cmap`)
#  * pick colors matching a black background (using :code:`black_bg`)
#  * set the maximum value displayed in the image to increase contrast (using :code:`vmax`)
from nilearn import plotting

view = plotting.view_img(stat_img, threshold=3, title="plot_stat_map", cut_coords=[36, -27, 66])

# In a Jupyter notebook, if ``view`` is the output of a cell, it will
# be displayed below the cell
view

#%%
# We can export the viewer as an html page. The html page is fully self-contained: it includes the javascript brainsprite library as well as the sprite.
view.save_as_html('plot_stat_map.html')

#%%
# That html document can be opened and rendered indepently, and can be shared,
# e.g. as an email attachment. It is possible to include this html page as an
# iframe in another html document, using the following snippet:
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
