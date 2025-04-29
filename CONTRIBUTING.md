# Contributing

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

```bash
pip install tox
tox run -e doc
```

## Build the distributions

```bash
make build
```
