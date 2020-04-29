"""
Anatomical scan viewer
======================
Generate a brainsprite viewer for an anatomical MRI scan, by populating an html
template.
"""
#%%
# We first download an anatomical scan through one of nilearn's fetcher:
from nilearn import datasets

# one anatomical scan from the haxby dataset
haxby_dataset = datasets.fetch_haxby()
haxby_anat_filename = haxby_dataset.anat[0]

#%%
# Now let's have a look at a generic html template, and focus on the parts that need
# to be filled in:
#
# .. literalinclude:: ../_static/viewer_template.html
#    :language: html
#    :emphasize-lines: 5-8,12-15,22-25
#    :linenos:

#%%
# The parts with :code:`{{ }}` are part of the tempita language, and means that
# we need to populate these parts with three types of brainsprite code: an html
# snippet, a javascript snippet, and the brainsprite.js library itself. Let's use
# :code:`viewer_substitute` to generate the necessary code, and substitute this
# code in the template. In terms of the parameters, the defaults are set for a
# functional map, and we will need to specify a few arguments to get the right
# aspect:
#
#  * use a gray colormap (:code:`cmap`),
#  * do not to a symmetric colormap, centered around zero (:code:`symmetric_cmap`)
#  * pick colors matching a black background (:code:`black_bg`)
#  * set the maximum value displayed in the image to increase contrast (:code:`vmax`)
#  * add a title to the viewer (:code:`title`)
from brainsprite import viewer_substitute

bsprite = viewer_substitute(cmap='gray', symmetric_cmap=False, black_bg=True,
                         threshold=None, vmax=250, title="anatomical scan", value=False)
bsprite.fit(haxby_anat_filename)

#%%
# We can now open the template with tempita, and fill it with the required
# information. The parameters indicate which tempita names we used in the
# template for the javascript, html and library code, respectively.
import tempita
file_template = '../docs/source/_static/viewer_template.html'
template = tempita.Template.from_filename(file_template, encoding="utf-8")

viewer = bsprite.transform(template, javascript='js', html='html', library='bsprite')

#%%
# The object :code:`viewer` can be called directly to insert the viewer inside
# a jupyter notebook:
viewer

#%%
# The following instruction can be used to save the viewer in a stand-alone,
# html document:
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
# in-line html styling with centering and adapting the size of the iframe to
# the size of the image (the width and height of the viewer can be found in
# :code:`bsprite.width_` and :code:`bsprite.height_`, respectively):
#
# .. code-block:: html
#
#   <iframe src="plot_anat.html" width=500 height=200
#       style="padding:0; border:0; display: block;
#       margin-left: auto; margin-right: auto"></iframe>

#%%
# The templating approach presented here is generic, and allows to insert one
# or multiple viewers in any html document template.
