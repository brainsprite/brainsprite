# brainsprite.js

The brainsprite javascript library turns an image that includes a stack of brain slices in sagital plane, like this one:
![brain sprite](https://github.com/SIMEXP/brainsprite.js/raw/master/examples/sprite_small.jpg "A sprite (or mosaic) of brain slices in sagital plane")

into three brain slices in different planes (sagital, coronal, axial) that can be used to explore the brain interactively  - click here for [a live demo](http://simexp.github.io/brainsprite.js/example_basic.html):
![brain slices](https://github.com/SIMEXP/brainsprite.js/raw/master/examples/brainSlices.png "Interactive brain slices in sagital/coronal/axial planes")

A key feature of the brainsprite viewer is that it is fast to load, because it relies on .jpg images. The slice rendering is also generated with html5 canvas, enabling smooth transitions between slices. For brainsprite to work, you will need to generate a sprite image (also known as mosaic) such as the one above, and specify the size of each slice (in pixel). The sagital slices are assumed to be in the same orientation as the MNI space (X: left to right, Y: posterior to anterior, Z: ventral to dorsal), and stacked from left to right row by row. The number of slices per row can be anything, but generating a sprite image that is roughly square will work best. A full example of sprite image (MNI space at 1 mm isotropic) can be found [here](https://github.com/SIMEXP/brainsprite.js/blob/master/examples/sprite.jpg).

## Basic example
The first thing to do is to add a div in your html with an empty canvas as well as the sprite image, which will be hidden:
```html
<div id="div_viewer">
    <canvas id="3Dviewer"> 
    <img id="spriteImg" class="hidden" src="sprite.jpg"> 
</div>
```
Then you include the brainsprite minified library (and jquery for the `$( window ).load(function()` instruction below, although brainsprite itself does not use jquery):
```html
<script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/1.6.1/jquery.min.js"></script> 
<script type="text/javascript" src="../brainsprite.min.js"></script>       
```
Finally, once the page is loaded, you call brainsprite to create a `brainSlice` object:
```html
 <script> 
  $( window ).load(function() {
    var brain = brainsprite({
      canvas: "3Dviewer", 
      sprite: "spriteImg", 
      nbSlice: { 'Y':233 , 'Z':189 }
    });
  });
  </script>
  ```
The three parameters are `canvas`: the ID of the canvas where the brain slices will be added; `sprite`: the ID of the sprite image; and, `nbslice` the size, along axis Y and Z, of each slice inside the sprite. The call to `brainsprite` will automatically generate the slices. 

You can check the full code of the demo [here](https://raw.githubusercontent.com/SIMEXP/brainsprite.js/master/examples/example_basic.html) and check a live version [here](http://simexp.github.io/brainsprite.js/example_basic.html).

