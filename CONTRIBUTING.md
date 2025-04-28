# CONTRIBUTING

## Run tests

### Javascript

```bash
npm install
make test
```

### Python

```bash
pip install tox
tox run -e test -- brainsprite
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
