"""Configuration file for the Sphinx documentation builder."""

# This file only contains a selection of the most common options. For a full
# list see the documentation:
# https://www.sphinx-doc.org/en/master/usage/configuration.html

# -- Path setup --------------------------------------------------------------

# If extensions (or modules to document with autodoc) are in another directory,
# add these directories to sys.path here. If the directory is relative to the
# documentation root, use os.path.abspath to make it absolute, like shown here.
#
import sys
from pathlib import Path

from brainsprite._version import __version__

sys.path.insert(0, Path("../src/brainsprite").resolve())

# -- Project information -----------------------------------------------------

project = "brainsprite"
copyright = "Brainsprite team"
author = "Brainsprite team"

# The full current version, including alpha/beta/rc tags.
current_version = __version__

# -- General configuration ---------------------------------------------------

# Add any Sphinx extension module names here, as strings. They can be
# extensions coming with Sphinx (named 'sphinx.ext.*') or your custom
# ones.
extensions = [
    "myst_parser",
    "sphinx_gallery.gen_gallery",
    "sphinx_js",
    "sphinx.ext.autodoc",
    "sphinx_copybutton",
]

# Add any paths that contain templates here, relative to this directory.
templates_path = ["_templates"]

# List of patterns, relative to source directory, that match files and
# directories to ignore when looking for source files.
# This pattern also affects html_static_path and html_extra_path.
exclude_patterns = []

# Sphinx gallery
sphinx_gallery_conf = {
    "examples_dirs": "../../examples",  # path to your example scripts
    "gallery_dirs": "auto_examples",  # path to where to save gallery generated output
    "thumbnail_size": (500, 300),
}

# The suffix of source filenames.
source_suffix = [".rst", ".md"]

# -- Options for HTML output -------------------------------------------------

# The theme to use for HTML and HTML Help pages.  See the documentation for
# a list of builtin themes.
#
html_theme = "sphinx_rtd_theme"

# tab name
html_short_title = "Brainsprite"

# The logo
html_logo = "img/logo_brainsprite.png"

# icon
html_favicon = "img/logo_brainsprite_small.png"

# Add any paths that contain custom static files (such as style sheets) here,
# relative to this directory. They are copied after the builtin static files,
# so a file named "default.css" will overwrite the builtin "default.css".
html_static_path = ["_static"]

html_theme_options = {
    'display_version': True,
    'github_url': 'https://github.com/brainsprite/brainsprite'

}

# Custom css
html_css_files = [
    "css/custom.css",
]

js_source_path = "../../"
