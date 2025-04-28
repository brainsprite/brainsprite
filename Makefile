clean:
	make -C docs clean
	rm -fr dist
	rm -fr examples/plot*.html
	rm -fr tests/js/*.html
	rm -fr src/brainsprite/data/js/brainsprite.js
	rm -fr coverage .nyc_output

install:
	npm install

minify: install
	node build.js
	cp dist/brainsprite.min.js src/brainsprite/data/js/

build: clean minify
	pip install build twine
	python -m build --outdir dist/python
	twine check dist/python/*

.PHONY: src/brainsprite/data/js/brainsprite.js
src/brainsprite/data/js/brainsprite.js:
	cp brainsprite.js src/brainsprite/data/js

.PHONY: tests/js/*html
tests/js/*html: src/brainsprite/data/js/brainsprite.js
	tox run -e examples
	cp examples/plot_anat.html tests/js
	cp examples/plot_stat_map.html tests/js
	rm -fr src/brainsprite/data/js/brainsprite.js

.PHONY: coverage
coverage: install tests/js/*html
	mkdir -p docs/build/html/_images
	npm run test
	npm i nyc -g
	nyc report --reporter=html 
