clean:
	make -C docs clean
# rm -rf $SCRIPTPATH/tests/plot_*.html

minify:
	npm install -g minify
	minify brainsprite.js > brainsprite.min.js
