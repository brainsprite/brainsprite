all: js_test

js_install:
	npm install

js_test: js_install
	npm test
