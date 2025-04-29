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
