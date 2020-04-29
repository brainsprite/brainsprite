# Getting started

## Why brainsprite?

Brainsprite viewers are designed to be elements on a web dashboard: they load fast,
and can easily be interfaced with other interactive elements on a webpage.
The brainsprite javascript library is thus as small and fast as possible, while
the heavy lifting of data preparation is done through a python library.

## Sprites
For brainsprite to work, you will need to generate a sprite image (also known
as a mosaic) such as the one above, and specify the size of each slice (in
pixel). The sagital slices are assumed to be in the same orientation as the
MNI space (X: left to right, Y: posterior to anterior, Z: ventral to dorsal),
and stacked from left to right row by row. The number of slices per row can be
anything, but generating a sprite image that is roughly square will work best.

## HTML code
The first thing to do is to add a div in your html with an empty canvas as well
as the sprite image, which will be hidden:
```html
<div>
    <canvas id="3Dviewer">
    <img id="spriteImg" class="hidden" src="sprite.jpg">
</div>
```

## Javascript code
Then you include the brainsprite minified library (and jquery for the
`$( window ).load(function()` instruction below, although brainsprite itself
does not use jquery):
```html
<script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/1.6.1/jquery.min.js"></script>
<script type="text/javascript" src="../brainsprite.min.js"></script>
```

Finally, once the page is loaded, brainsprite is called to create a
`brain` object:
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

## Templating
The brainsprite python library uses another library called
[nilearn](https://nilearn.github.io/) in order to generate the sprites, as well
as the html and javascript code required above. This code can be inserted into
an html page template based on the [tempita](https://pypi.org/project/Tempita/)
library. Altogether, adding a brainviewer to a webpage only takes a few lines of
python. Check the tutorials to learn more about the syntax.
