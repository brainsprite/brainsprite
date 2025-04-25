minify:
	node  build.js
js_test:
	mkdir -p docs/build/html/_images
	npm test
