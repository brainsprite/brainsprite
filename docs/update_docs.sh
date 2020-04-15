#!/usr/bin/bash
echo flushing previous build
rm -rf build
rm -rf source/auto_examples
rm -rf ../tests/plot_*.html

echo Building docs
make html

echo Running tests and updating tutorial thumbnails
npm test
