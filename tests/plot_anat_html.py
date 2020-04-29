"""
Anatomical scan viewer - html
=============================

This example generates a brainsprite viewer for an anatomical scan by filling an html template using python and tempita.
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
# .. literalinclude:: ../_static/plot_anat_html_template.html
#    :language: html
#    :emphasize-lines: 5-8,12-15,22-25
#    :linenos:

#%%
# The parts with :code:`{{ }}` are part of the tempita language, and means that
# we need to populate these parts with brainsprite code. Let's use
# :code:`brainsprite_data` to generate the necessary html and js snippets.
# Note that the options we use here for the viewer are the same as for
# :code:`brainsprite_viewer` in the `plot_anat <plot_anat.html>`_ tutorial, and are
# explained in more details there.
from brainsprite import viewer_substitute

bsprite = viewer_substitute(cmap='gray', symmetric_cmap=False, black_bg=True,
                         threshold=None, vmax=250, title="anatomical scan", value=False)
bsprite.fit(haxby_anat_filename)

#%%
# We can now open the template with tempita, and fill it with the required
# information:
import tempita
file_template = '../docs/source/_static/plot_anat_html_template.html'
template = tempita.Template.from_filename(file_template, encoding="utf-8")

viewer = bsprite.transform(template, javascript='js', html='html', library='bsprite')

#%%
# If :code:`viewer` is called in a notebook, it inserts itself:
viewer

#%%
# The following instruction can be used to save the viewer in a stand-alone,
# html document:
viewer.save_as_html('plot_anat_html.html')
#%%
# That is the end of this tutorial. The templating approach
# presented here is generic, and allows to insert one or multiple viewers and
# build complex html documents, as demonstrated in other tutorials.
