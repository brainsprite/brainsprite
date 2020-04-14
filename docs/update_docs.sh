#!/usr/bin/bash
echo flushing previous build
rm -rf build
rm -rf source/auto_examples
rm -rf ../tests/plot_*.html

echo Updating brainsprite.js as a docs static file
cp ../brainsprite.js source/_static

echo Building docs
make html

echo Running tests and updating tutorial thumbnails
npm test
