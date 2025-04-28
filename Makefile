clean:
	make -C docs clean
	rm -fr dist
	rm -fr examples/*.html
	rm -fr tests/js/*.html
	rm -fr src/brainsprite/data/js/brainsprite.js

install:
	npm install

minify: install
	node build.js
	cp brainsprite.min.js src/brainsprite/data/js/

js_test: install
	mkdir -p docs/build/html/_images
	npm test

build: clean minify
	pip install build twine
	python -m build
	twine check dist/*
