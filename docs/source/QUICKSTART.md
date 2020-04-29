# Getting started

## Why brainsprite?

There are many high quality brain viewers written in javascript, such as [papaya](https://github.com/rii-mango/Papaya) and [brainbrowser](https://github.com/aces/brainbrowser). These brain viewers have the ability of dealing with complex brain imaging formats, and users can interactively change the aspect of the viewer (e.g. the colormap). For this reason, these brain viewers are relatively large and slow to load. By comparison, the vision for brainsprite is to be as minimal, small and fast as possible. A brainsprite viewer takes roughly the same size as a traditional picture on a webpage, and looks like a publication figure rather than a software window. The brainpsrite interface is also highly customizable, and can be interfaced with other interactive elements on a webpage, such as sliders, plots or matrices. As such, brainsprite viewers are designed to be elements on a web dashboard, rather than a brain-viewer-inside-a-browser. To achieve fast loading, all the heavy lifting of data preparation is done through a python library which packages brain images into traditional png or jpg "sprite" files. The javascript brainsprite library then renders these sprites into interactive viewers, using only core html5 features.

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
