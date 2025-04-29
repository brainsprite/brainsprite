# Contributing

## Code style

The repository relies on pre-commit to enforce code-style at commit time
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

### Javascript

```bash
pip install tox
make coverage
```

### Python

```bash
pip install tox
tox run -e test -- tests/python
```

## Build the documentation

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
