all: js_test

js_intall:
	npm install

js_test: js_intall
	npm test
