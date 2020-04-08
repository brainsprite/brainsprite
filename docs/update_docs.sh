#!/usr/bin/bash
echo Updating brainsprite.js as a docs static file
cp ../brainsprite.js source/_static
make html
