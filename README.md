# brainsprite.js

The brainsprite javascript library turns an image that includes a stack of brain slices in sagital plane, like this one:

>[<img src="https://github.com/SIMEXP/brainsprite.js/raw/master/examples/sprite_small.jpg" width="300px" />](https://github.com/SIMEXP/brainsprite.js/blob/master/examples/sprite.jpg)

into three brain slices in different planes (sagital, coronal, axial) that can be used to explore the brain interactively  - click here for a basic [live demo >](http://simexp.github.io/brainsprite.js/examples/example_basic.html):

>[<img src="https://github.com/SIMEXP/brainsprite.js/raw/master/examples/brainSlices.png" width="300px" />](http://simexp.github.io/brainsprite.js/examples/example_basic.html)

A key feature of the brainsprite viewer is that it is fast to load, because it relies on .jpg images. The slice rendering is also generated with html5 canvas, enabling smooth animations between slices. For brainsprite to work, you will need to generate a sprite image (also known as mosaic) such as the one above, and specify the size of each slice (in pixel). The sagital slices are assumed to be in the same orientation as the MNI space (X: left to right, Y: posterior to anterior, Z: ventral to dorsal), and stacked from left to right row by row. The number of slices per row can be anything, but generating a sprite image that is roughly square will work best. A full example of sprite image (MNI space at 1 mm isotropic) can be found [here](https://github.com/SIMEXP/brainsprite.js/blob/master/examples/sprite.jpg).

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

You can check the full code of the demo [here](https://raw.githubusercontent.com/SIMEXP/brainsprite.js/master/examples/example_basic.html) and check a [live demo >](http://simexp.github.io/brainsprite.js/examples/example_basic.html).

>[<img src="https://github.com/SIMEXP/brainsprite.js/raw/master/examples/brainSlices.png" width="300px" />](http://simexp.github.io/brainsprite.js/examples/example_basic.html)

## Slice coordinates
The option `flagCoordinates` will turn on a display of each slice number at the bottom of the canvas:
```html
 <script> 
  $( window ).load(function() {
    var brain = brainsprite({
      canvas: "3Dviewer", 
      sprite: "spriteImg", 
      flagCoordinates: true,
      nbSlice: { 'Y':233 , 'Z':189 }
    });
  });
  </script>
  ```
You can check the full code of the demo [here](https://raw.githubusercontent.com/SIMEXP/brainsprite.js/master/examples/example_slice_numbers.html) and check a [live demo >](http://simexp.github.io/brainsprite.js/examples/example_slice_numbers.html).

>[<img src="https://github.com/SIMEXP/brainsprite.js/raw/master/examples/example_slice_numbers.png" width="300px" />](http://simexp.github.io/brainsprite.js/examples/example_slice_numbers.html)

It is also possible to specify a voxel size (isotropic, i.e. the same dimension in the X, Y and Z axis), as well as an origin, i.e. which voxel has coordinates 0, 0, 0. Note that no rotations/shears are supported, as the volume is assumed to be resampled in MNI space. 
```html
  $( window ).load(function() {
    // Create brain slices
    var brain = brainsprite({
      canvas: "3Dviewer", 
      sprite: "spriteImg", 
      flagCoordinates: true, 
      origin: {X: 98, Y:134, Z:72}, 
      voxelSize: 1, 
      nbSlice: { 'Y':233 , 'Z':189 }
    });
  });
  ```
Here is a [full example](https://raw.githubusercontent.com/SIMEXP/brainsprite.js/master/examples/example_slice_numbers.html) that reports MNI coordinates for the voxel associated with the click, along with a [live demo >](http://simexp.github.io/brainsprite.js/examples/example_slice_coordinates.html).

## Click events
It is possible to attach a function that will be triggered when the user clicks on the brain viewer. The object passed to the function is called `brain` and contains all the info about the brain viewer, including the current slice coordinates. In this example, an alert is triggered that reports current coordinates:
```html
  $( window ).load(function() {
    var brain = brainsprite({
      canvas: "3Dviewer", 
      sprite: "spriteImg", 
      origin: {X: 98, Y:134, Z:72}, 
      voxelSize: 1, 
      onclick: function showCoordinates(brain) { 
        alert("Slice coordinates: x=" + brain.coordinatesSlice.X + " , y=" + brain.coordinatesSlice.Y + " ,z=" + brain.coordinatesSlice.Z);
      }, 
      nbSlice: { 'Y':233 , 'Z':189 }
    });
  });
  ```
Here is a [full example](https://raw.githubusercontent.com/SIMEXP/brainsprite.js/master/examples/example_click.html) that pops up an alert with MNI coordinates for the voxel associated with the click, along with a [live demo >](http://simexp.github.io/brainsprite.js/examples/example_click.html).

## Overlay
It is possible to add an overlay to a volume. The overlay is loaded as a sprite image and needs to be in the same space. The resolution of the background and overlay can differ by a constant factor. We first start by adding a second (hidden) sprite image in the page:
```html
<div id="div_viewer">
    <canvas id="3Dviewer"> 
    <img id="spriteImg" class="hidden" src="sprite.jpg"> 
    <img id="overlayImg" class="hidden" src="dmnSprite.png"> 
</div>
```
Then, we add the description of the overlay (including the number of voxels in the `Y` and `Z` dimensions) to the call to `brainsprite`. Note that the sprite can have a different organization than the background, in terms of the number of rows and columns.
```html
  $( window ).load(function() {
    // Create brain slices
    var brain = brainsprite({
      canvas: "3Dviewer", 
      sprite: "spriteImg", 
      overlay: {
        sprite: "overlayImg", 
        nbSlice: {'Y':79 , 'Z':63 }
      },
      nbSlice: { 'Y':233 , 'Z':189 }
    });
  });
  ```
Here is a [full example](https://raw.githubusercontent.com/SIMEXP/brainsprite.js/master/examples/example_overlay.html) adding a functional connectivity map to a structural MRI, along with a [live demo >](http://simexp.github.io/brainsprite.js/examples/example_overlay.html).

>[<img src="https://github.com/SIMEXP/brainsprite.js/raw/master/examples/example_overlay.jpg" width="300px" />](http://simexp.github.io/brainsprite.js/examples/example_overlay.html)

## Colors
It is possible to tweak the color of the background that is applied behind the slices, as well as the color of the text being applied, using properties passed to brainSprite.
```html
      colorBackground: "#FFFFFF",
      colorFont: "#000000"
```
Here is an [example](https://raw.githubusercontent.com/SIMEXP/brainsprite.js/master/examples/example_white.html) using a template with a white background, and black fonts, as well as the [live demo >](http://simexp.github.io/brainsprite.js/examples/example_white.html).

>[<img src="https://github.com/SIMEXP/brainsprite.js/raw/master/examples/example_white.png" width="300px" />](http://simexp.github.io/brainsprite.js/examples/example_white.html)
