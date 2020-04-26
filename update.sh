#!/usr/bin/bash

CURRPATH=`pwd`
SCRIPT=`realpath -s $0`
SCRIPTPATH=`dirname $SCRIPT`

cd $SCRIPTPATH

echo minifying brainsprite.js
minify brainsprite.js > brainsprite.min.js

echo updating js assets in brainsprite.py
cp brainsprite.min.js brainsprite/assets/js/
cp assets/jquery*/jquery.min.js brainsprite/assets/js

echo flushing previous docs build
rm -rf $SCRIPTPATH/docs/build
rm -rf $SCRIPTPATH/docs/source/auto_examples
rm -rf $SCRIPTPATH/tests/plot_*.html

echo Building docs
cd docs
make html

echo Running tests and updating tutorial thumbnails
cd ..
npm test

cd $CURRPATH
