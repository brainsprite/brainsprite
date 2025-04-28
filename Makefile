clean:
	make -C docs clean
	rm -fr dist
# rm -rf $SCRIPTPATH/tests/plot_*.html

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
