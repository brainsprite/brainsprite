# Getting started

## Why brainsprite?

Brainsprite viewers are designed to be elements on a web dashboard: they load fast,
and can easily be interfaced with other interactive elements.
The brainsprite javascript library is thus as small and fast as possible, while
the heavy lifting of data preparation is done through a python library.

## HTML code
![](./_static/sprite_small.jpg)

Brainsprite works from a sprite image (also known as a mosaic) such as the one
above.The first thing to do is to add a div in an html document with an empty
canvas (which will be populated with the viewer) as well as the sprite image,
which is hidden:
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
<script type="text/javascript" src="brainsprite.min.js"></script>
```

Finally, once the page is loaded, brainsprite is called to create a
`brain` object. The parameters brainsprite are used to tweak the appearance of
the viewer, as well as specify important meta-data which cannot be infered from
the sprite, such as the size of each slice (in pixel):
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
Other important parameters are:
 * `canvas`: the ID of the canvas where the brain slices will be added;
 * `sprite`: the ID of the sprite image;

The call to `brainsprite` will automatically generate a brain viewer, just like
this one:
<iframe src="_static/example_basic.html" width=500 height=200 style="padding:0; border:0; display: block; margin-left: auto; margin-right: auto"></iframe>

## Python code

The brainsprite python library uses [nilearn](https://nilearn.github.io/) in
order to generate the sprites, as well as the html and javascript code required
above. This code can be inserted into an html page template based on the
[tempita](https://pypi.org/project/Tempita/) library. Altogether, adding a
brain viewer to a webpage only takes a few lines of python. Check the tutorials
to learn more about the syntax.
