clean:
	make -C docs clean
# rm -rf $SCRIPTPATH/tests/plot_*.html

minify:
	node  build.js

js_test:
	mkdir -p docs/build/html/_images
	npm test
