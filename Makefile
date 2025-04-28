clean:
	make -C docs clean
	rm -fr dist
# rm -rf $SCRIPTPATH/tests/plot_*.html

minify:
	node build.js
	cp brainsprite.min.js src/brainsprite/data/js/

js_test:
	mkdir -p docs/build/html/_images
	npm test

build: clean minify
	pip install build twine
	python -m build
	twine check dist/*
