# brainsprite.js

The brainsprite javascript library turns an image that includes a stack of brain slices in sagital plane, like this one:
![brain sprite](https://github.com/SIMEXP/brainsprite.js/raw/master/examples/sprite_small.jpg "A sprite (or mosaic) of brain slices in sagital plane")
into three brain slices in different planes (sagital, coronal, axial) that can be used to explore the brain interactively:
![brain slices](https://github.com/SIMEXP/brainsprite.js/raw/master/examples/brainSlices.png "Interactive brain slices in sagital/coronal/axial planes")

Although many javascript volumetric brain viewers exist, brainsprite viewer is very fast to load, because it relies on .jpg images. The slice rendering is also generated with html5 canvas, enabling smooth interactions. For brainsprite to work, you will need to generate a sprite image (also known as mosaic) such as the one above, and specify the size of each slice (in pixel). The sagital slices are assumed to be in the same orientation as the MNI space (X: left to right, Y: posterior to anterior, Z: ventral to dorsal), and stacked from left to right row by row. The number of slices per row can be anything, but generating a sprite image that is roughly square will work best. 



