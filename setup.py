from setuptools import setup, find_packages
from os import path

here = path.abspath(path.dirname(__file__))

# Get the long description from the README file
with open(path.join(here, "README.md"), encoding="utf-8") as f:
    long_description = f.read()

setup(
    name="brainsprite",
    version="0.14.1",
    description="Python API for the brainsprite MRI brain viewer",
    long_description=long_description,
    long_description_content_type="text/markdown",  # Optional (see note above)
    url="https://brainsprite.github.io",
    project_urls={  # Optional
        "Bug Reports": "https://github.com/brainsprite/brainsprite/issues",
        "Funding": "https://ccna-ccnv.ca/",
        "Source": "https://github.com/brainsprite/brainsprite/",
    },
    packages= find_packages(),
    package_data={"brainsprite.data.js": ["*.js"], "brainsprite.data.html": ["*.html"]},
    maintainer="Pierre Bellec",
    maintainer_email="pierre.bellec@gmail.com",
    install_requires=[
        "numpy",
        "matplotlib",
        "sklearn",
        "nilearn",
        "tempita",
    ],  # external packages as dependencies
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "Topic :: Software Development :: Build Tools",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3.5",
        "Programming Language :: Python :: 3.6",
        "Programming Language :: Python :: 3.7",
        "Programming Language :: Python :: 3.8",
    ],
    python_requires=">=3.5",
)
