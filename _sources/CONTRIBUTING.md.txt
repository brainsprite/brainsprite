# Contributing

## Code style

The repository relies on pre-commit to enforce code style at commit time
and in continuous-integration.

To run it locally:

```bash
pip install pre-commit
pre-commit run -a
```

To run it on every commit, install the hools.

```bash
pre-commit install
```

## Run tests

### Python

```bash
pip install tox
tox run -e test -- tests/python
```

### Javascript

The javascript tests check how brainsprite behaves in the browser,
so the python `examples/*.py` are run via tox to generate the html pages to test.

All of this can be handled via make.

```bash
pip install tox
make coverage
```

## Build the documentation

Documentation includes some examples generated via sphinx-gallery.

Output will be in `docs/build/html`.

```bash
pip install tox
tox run -e doc
```

## Build the distributions

Output will be stored in `dist` folder.

```bash
make build
```

## Make a release

Assuming you are bumping to version `X.Y.Z`

### Bump version

- bump the version in `package.json`

```json
{
  "name": "brainsprite.js",
  "version": "X.Y.Z",
```

- update the minified code

```bash
make minify
```

### Open a release pull request

Open a PR `[REL] X.Y.Z`.

Once all the relevant CI passe, merge it.

### Create a tag

Checkout the master branch from upstream and tag it.

```bash
git checkout master
git fetch --all
git reset --hard upstream/master
git tag X.Y.Z
```

### Building the python package

```bash
git checkout X.Y.Z
make build
```

### Push to pypi

If you have the right access to pypi:

```bash
twine upload dist/python/*
```

### Push to npm

TODO


### Github release

At this point, we need to upload the binaries to GitHub and link them to the tag.
To do so, go to the tags under the "Releases" tab,
and edit the `X.Y.Z` tag by providing a description,
and upload the python and minified javascript distributions we just created
(you can just drag and drop the files from the `dist` folder.).
