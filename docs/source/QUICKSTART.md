# Getting started

## Sprites
For brainsprite to work, you will need to generate a sprite image (also known as mosaic) such as the one above, and specify the size of each slice (in pixel). The sagital slices are assumed to be in the same orientation as the MNI space (X: left to right, Y: posterior to anterior, Z: ventral to dorsal), and stacked from left to right row by row. The number of slices per row can be anything, but generating a sprite image that is roughly square will work best. A full example of sprite image (MNI space at 1 mm isotropic) can be found [here](https://github.com/brainsprite/brainsprite/blob/master/tests/sprite.jpg).

## Basic example
The first thing to do is to add a div in your html with an empty canvas as well as the sprite image, which will be hidden:
```html
<div>
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
The three parameters are `canvas`: the ID of the canvas where the brain slices will be added; `sprite`: the ID of the sprite image; and, `nbslice` the size, along axis Y and Z, of each slice inside the sprite. The call to `brainsprite` will automatically generate the slices. Try clicking on the slices to navigate the volume.

You can check the full code of the demo [here](https://raw.githubusercontent.com/brainsprite/brainsprite/master/tests/example_basic.html) and check a [live demo >](http://brainsprite.github.io/brainsprite/tests/example_basic.html).

>[<img src="https://github.com/brainsprite/brainsprite/raw/master/tests/brainSlices.png" width="300px" />](http://brainsprite.github.io/brainsprite/tests/example_basic.html)
