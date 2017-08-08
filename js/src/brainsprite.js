export default function BrainSprite(params) {
  // Initialize the brain object
  var defaultParams = {

    // Flag for "NaN" image values, i.e. unable to read values
    nanValue: false,

    // Smoothing of the main slices
    smooth: false,

    // drawing mode
    fastDraw: false,

    // interactive mode
    interactive: true,

    // Background color for the canvas
    colorBackground: '#000000',
    
    // Flag to turn on/off slice numbers
    flagCoordinates: false,
  
    // Origins and voxel size
    origin: { X: 0, Y: 0, Z: 0 },
    voxelSize: 1,
    
    // Colorbar size parameters
    heightColorBar: 0.04,
  
    // Font parameters
    sizeFont: 0.075,
    colorFont: '#FFFFFF',

  }

  var brain = Object.assign({}, defaultParams, params);

  //*******************************************//
  // Extract the value associated with a voxel //
  //*******************************************//
  brain.getValue = function(rgb, colorMap) {
    if (!colorMap) {
      return NaN;
    }
    var cv, dist, nbColor, ind, val, voxelValue;
    nbColor = colorMap.canvas.width;
    ind = NaN;
    val = Infinity;
    for (var xx = 0; xx < nbColor; xx++) {
      cv = colorMap.context.getImageData(xx, 0, 1, 1).data;
      dist = Math.pow(cv[0] - rgb[0], 2) + Math.pow(cv[1] - rgb[1], 2) + Math.pow(cv[2] - rgb[2], 2);
      if (dist < val) {
        ind = xx;
        val = dist;
      }
    }
    voxelValue = (ind * (colorMap.max - colorMap.min) / (nbColor - 1)) + colorMap.min;
    return voxelValue;
  };

  brain.resize = function() {
    var nbSlice = brain.nbSlice;

    // Update the width of the X, Y and Z slices in the canvas, based on the width of its parent
    var width = brain.widthCanvas = {
      X: Math.floor(brain.canvas.offsetWidth * (nbSlice.Y / (2 * nbSlice.X + nbSlice.Y))),
      Y: Math.floor(brain.canvas.offsetWidth * (nbSlice.X / (2 * nbSlice.X + nbSlice.Y))),
      Z: Math.floor(brain.canvas.offsetWidth * (nbSlice.X / (2 * nbSlice.X + nbSlice.Y))),
    }

    // Update the height of the slices in the canvas, based on width and image ratio
    brain.heightCanvas = {
      X: Math.floor(width.X * nbSlice.Z / nbSlice.Y),
      Y: Math.floor(width.Y * nbSlice.Z / nbSlice.X),
      Z: Math.floor(width.Z * nbSlice.Y / nbSlice.X),
    }
    brain.heightCanvas.max = Math.max(
      brain.heightCanvas.X,
      brain.heightCanvas.Y,
      brain.heightCanvas.Z
    );

    // Apply the width/height to the canvas, if necessary
    if (brain.canvas.height != brain.heightCanvas.max) {
      brain.canvas.style.height = Math.round(brain.heightCanvas.max) + "px";
      if (brain.smooth)
        brain.context.imageSmoothingEnabled = true;
    };

    brain.canvas.width = brain.canvas.offsetWidth;
    brain.canvas.height = brain.canvas.offsetHeight;

    // Size for fonts
    brain.sizeFontPixels = Math.round(brain.sizeFont * (brain.heightCanvas.max));
  }

  brain.init = function() {

    // Number of columns and rows in the sprite
    brain.nbCol = brain.sprite.width / params.nbSlice.Y;
    brain.nbRow = brain.sprite.height / params.nbSlice.Z;

    // Number of slices
    brain.nbSlice = {
      X: brain.nbCol * brain.nbRow,
      Y: params.nbSlice.Y,
      Z: params.nbSlice.Z
    };

    // width and height for the canvas
    brain.widthCanvas = { X: 0, Y: 0, Z: 0 };
    brain.heightCanvas = { X: 0, Y: 0, Z: 0, max: 0 };
    
    // Default for current slices
    brain.numSlice = {
      X: Math.floor(brain.nbSlice.X / 2),
      Y: Math.floor(brain.nbSlice.Y / 2),
      Z: Math.floor(brain.nbSlice.Z / 2)
    };
    
    // Coordinates for current slices - these will get updated when drawing the slices
    brain.coordinatesSlice = { X: 0, Y: 0, Z: 0 };
    brain.dirty = { X: true, Y: true, Z: true };
    brain.planes = {};

    brain.resize();

    if (brain.interactive) {
      brain.canvas.addEventListener('click', brain._canvasClick, false);
      brain.canvas.addEventListener('mousedown', function(e) {
        brain.canvas.addEventListener('mousemove', brain._canvasClick, false);
      }, false);
      brain.canvas.addEventListener('mouseup', function(e) {
        brain.canvas.removeEventListener('mousemove', brain._canvasClick, false);
      }, false);
    }

    // Draw the X canvas
    brain.planes.canvasX = document.createElement('canvas');
    brain.planes.contextX = brain.planes.canvasX.getContext('2d');
    brain.planes.canvasX.width = brain.sprite.width;
    brain.planes.canvasX.height = brain.sprite.height;
    brain.planes.contextX.globalAlpha = 1;
    brain.planes.contextX.drawImage(brain.sprite, 0, 0, brain.sprite.width, brain.sprite.height, 0, 0, brain.sprite.width, brain.sprite.height);

    if (brain.overlay) {
      // Draw the overlay on a canvas
      brain.planes.contextX.globalAlpha = brain.overlay.opacity;
      brain.planes.contextX.drawImage(brain.overlay.sprite, 0, 0, brain.overlay.sprite.width, brain.overlay.sprite.height, 0, 0, brain.sprite.width, brain.sprite.height);
    };

    // Draw the Y canvas
    brain.planes.canvasY = document.createElement('canvas');
    brain.planes.contextY = brain.planes.canvasY.getContext('2d');
    if (brain.fastDraw) {
      brain.planes.canvasY.width = brain.nbSlice.X * brain.nbCol;
      brain.planes.canvasY.height = brain.nbSlice.Z * Math.ceil(brain.nbSlice.Y / brain.nbCol);
      var pos = {};
      for (var yy = 0; yy < brain.nbSlice.Y; yy++) {
        for (var xx = 0; xx < brain.nbSlice.X; xx++) {
          pos.XW = (xx % brain.nbCol);
          pos.XH = (xx - pos.XW) / brain.nbCol;
          pos.YW = (yy % brain.nbCol);
          pos.YH = (yy - pos.YW) / brain.nbCol;
          brain.planes.contextY.globalAlpha = 1;
          brain.planes.contextY.drawImage(brain.sprite, pos.XW * brain.nbSlice.Y + yy, pos.XH * brain.nbSlice.Z, 1, brain.nbSlice.Z, pos.YW * brain.nbSlice.X + xx, pos.YH * brain.nbSlice.Z, 1, brain.nbSlice.Z);
          // Add the Y overlay
          if (brain.overlay) {
            brain.planes.contextY.globalAlpha = brain.overlay.opacity;
            brain.planes.contextY.drawImage(brain.overlay.sprite, pos.XW * brain.nbSlice.Y + yy, pos.XH * brain.nbSlice.Z, 1, brain.nbSlice.Z, pos.YW * brain.nbSlice.X + xx, pos.YH * brain.nbSlice.Z, 1, brain.nbSlice.Z);
          }
        }
      }
    } else {
      brain.planes.canvasY.width = brain.nbSlice.X;
      brain.planes.canvasY.height = brain.nbSlice.Z;
    }

    // Draw the Z canvas
    brain.planes.canvasZ = document.createElement('canvas');
    brain.planes.contextZ = brain.planes.canvasZ.getContext('2d');
    if (brain.fastDraw) {
      brain.planes.canvasZ.height = Math.max(brain.nbSlice.X * brain.nbCol, brain.nbSlice.Y * Math.ceil(brain.nbSlice.Z / brain.nbCol));
      brain.planes.canvasZ.width = brain.planes.canvasZ.height;
      brain.planes.contextZ.rotate(-Math.PI / 2);
      brain.planes.contextZ.translate(-brain.planes.canvasZ.width, 0);
      var pos = {};
      for (var zz = 0; zz < brain.nbSlice.Z; zz++) {
        for (var xx = 0; xx < brain.nbSlice.X; xx++) {
          pos.XW = (xx % brain.nbCol);
          pos.XH = (xx - pos.XW) / brain.nbCol;
          pos.ZH = zz % brain.nbCol;
          pos.ZW = Math.ceil(brain.nbSlice.Z / brain.nbCol) - 1 - ((zz - pos.ZH) / brain.nbCol);
          brain.planes.contextZ.globalAlpha = 1;
          brain.planes.contextZ.drawImage(brain.sprite, pos.XW * brain.nbSlice.Y, pos.XH * brain.nbSlice.Z + zz, brain.nbSlice.Y, 1, pos.ZW * brain.nbSlice.Y, pos.ZH * brain.nbSlice.X + xx, brain.nbSlice.Y, 1);
          // Add the Z overlay
          if (brain.overlay) {
            brain.planes.contextZ.globalAlpha = brain.overlay.opacity;
            brain.planes.contextZ.drawImage(brain.overlay.sprite, pos.XW * brain.nbSlice.Y, pos.XH * brain.nbSlice.Z + zz, brain.nbSlice.Y, 1, pos.ZW * brain.nbSlice.Y, pos.ZH * brain.nbSlice.X + xx, brain.nbSlice.Y, 1);
          }
        }
      }
    } else {
      brain.planes.canvasZ.width = brain.nbSlice.X;
      brain.planes.canvasZ.height = brain.nbSlice.Y;
      brain.planes.contextZ.rotate(-Math.PI / 2);
      brain.planes.contextZ.translate(-brain.nbSlice.Y, 0);
    }

    brain.drawAll();
    brain.triggerEvent('change', {
      oldCoords: Object.assign({}, brain.numSlice),
      newCoords: Object.assign({}, brain.numSlice),
    });
  }

  //***************************************//
  // Draw dirty slices in the canvas //
  //***************************************//
  brain.draw = function() {
    var pos = {}, coord, coordWidth;

    // Set font onto context
    brain.context.font = brain.sizeFontPixels + "px Arial";

    // Update voxel value
    if (brain.overlay && !brain.nanValue) {
      try {
        pos.XW = ((brain.numSlice.X) % brain.nbCol);
        pos.XH = (brain.numSlice.X - pos.XW) / brain.nbCol;
        brain.contextRead.drawImage(brain.overlay.sprite, pos.XW * brain.nbSlice.Y + brain.numSlice.Y, pos.XH * brain.nbSlice.Z + brain.numSlice.Z, 1, 1, 0, 0, 1, 1);
        rgb = brain.contextRead.getImageData(0, 0, 1, 1).data;
        brain.voxelValue = brain.getValue(rgb, brain.colorMap);
      } catch (err) {
        console.warn(err.message);
        rgb = 0;
        brain.nanValue = true;
        brain.voxelValue = NaN;
      }
    } else {
      brain.voxelValue = NaN;
    };

    if (brain.dirty.X){
      // Draw a sagital slice
      pos.XW = ((brain.numSlice.X) % brain.nbCol);
      pos.XH = (brain.numSlice.X - pos.XW) / brain.nbCol;

      // Set fill color for the slice
      brain.context.fillStyle = brain.colorBackground;
      brain.context.fillRect(0, 0, brain.widthCanvas.X, brain.canvas.height);
      brain.context.drawImage(
        brain.planes.canvasX,
        pos.XW * brain.nbSlice.Y,
        pos.XH * brain.nbSlice.Z,
        brain.nbSlice.Y,
        brain.nbSlice.Z,
        0,
        (brain.heightCanvas.max - brain.heightCanvas.X) / 2,
        brain.widthCanvas.X,
        brain.heightCanvas.X
      );

      // Add X coordinates on the slice
      if (brain.flagCoordinates) {
        coord = "x=" + brain.coordinatesSlice.X;
        coordWidth = brain.context.measureText(coord).width;
        brain.context.fillStyle = brain.colorFont;
        brain.context.fillText(coord, brain.widthCanvas.X / 2 - coordWidth / 2, Math.round(brain.canvas.height - (brain.sizeFontPixels / 2)));
      }

      brain.dirty.X = false;
    }

    if (brain.dirty.Y){
      // Draw a single coronal slice at native resolution
      brain.context.fillStyle = brain.colorBackground;
      brain.context.fillRect(brain.widthCanvas.X, 0, brain.widthCanvas.Y, brain.canvas.height);
      if (brain.fastDraw) {
        pos.YW = (brain.numSlice.Y % brain.nbCol);
        pos.YH = (brain.numSlice.Y - pos.YW) / brain.nbCol;
        brain.context.drawImage(brain.planes.canvasY,
          pos.YW * brain.nbSlice.X, pos.YH * brain.nbSlice.Z, brain.nbSlice.X, brain.nbSlice.Z, brain.widthCanvas.X, (brain.heightCanvas.max - brain.heightCanvas.Y) / 2, brain.widthCanvas.Y, brain.heightCanvas.Y);
      } else {
        for (var xx = 0; xx < brain.nbSlice.X; xx++) {
          var posW = (xx % brain.nbCol);
          var posH = (xx - posW) / brain.nbCol;
          brain.planes.contextY.drawImage(brain.planes.canvasX,
            posW * brain.nbSlice.Y + brain.numSlice.Y, posH * brain.nbSlice.Z, 1, brain.nbSlice.Z, xx, 0, 1, brain.nbSlice.Z);
        }
        // Redraw the coronal slice in the canvas at screen resolution
        brain.context.drawImage(brain.planes.canvasY,
          0, 0, brain.nbSlice.X, brain.nbSlice.Z, brain.widthCanvas.X, (brain.heightCanvas.max - brain.heightCanvas.Y) / 2, brain.widthCanvas.Y, brain.heightCanvas.Y);
      }

      // Add colorbar
      if ((brain.colorMap) && (!brain.colorMap.hide)) {
        // draw the colorMap on the coronal slice at screen resolution
        brain.context.drawImage(brain.colorMap.img,
          0, 0, brain.colorMap.img.width, 1, Math.round(brain.widthCanvas.X + brain.widthCanvas.Y * 0.2), Math.round(brain.heightCanvas.max * brain.heightColorBar / 2), Math.round(brain.widthCanvas.Y * 0.6), Math.round(brain.heightCanvas.max * brain.heightColorBar));
        brain.context.fillStyle = brain.colorFont;
        brain.context.fillText(brain.colorMap.min, brain.widthCanvas.X + (brain.widthCanvas.Y * 0.2), Math.round((brain.heightCanvas.max * brain.heightColorBar * 2) + (3 / 4) * (brain.sizeFontPixels)));
        brain.context.fillText(brain.colorMap.max, brain.widthCanvas.X + (brain.widthCanvas.Y * 0.8) - brain.context.measureText(brain.colorMap.max).width, Math.round((brain.heightCanvas.max * brain.heightColorBar * 2) + (3 / 4) * (brain.sizeFontPixels)));
      }

      // Add Y coordinates on the slice
      if (brain.flagCoordinates) {
        coord = "y=" + brain.coordinatesSlice.Y;
        coordWidth = brain.context.measureText(coord).width;
        brain.context.fillStyle = brain.colorFont;
        brain.context.fillText(coord, brain.widthCanvas.X + (brain.widthCanvas.Y / 2) - coordWidth / 2, Math.round(brain.canvas.height - (brain.sizeFontPixels / 2)));
      }
      
      brain.dirty.Y = false;
    }

    if (brain.dirty.Z){
      // Draw a single axial slice at native resolution
      brain.context.fillStyle = brain.colorBackground;
      brain.context.fillRect(brain.widthCanvas.X + brain.widthCanvas.Y, 0, brain.widthCanvas.Z, brain.canvas.height);
      if (brain.fastDraw) {
        pos.ZW = (brain.numSlice.Z % brain.nbCol);
        pos.ZH = (brain.numSlice.Z - pos.ZW) / brain.nbCol;
        brain.context.drawImage(brain.planes.canvasZ,
          pos.ZW * brain.nbSlice.X, pos.ZH * brain.nbSlice.Y, brain.nbSlice.X, brain.nbSlice.Y, brain.widthCanvas.X + brain.widthCanvas.Y, (brain.heightCanvas.max - brain.heightCanvas.Z) / 2, brain.widthCanvas.Z, brain.heightCanvas.Z);
      } else {
        for (var xx = 0; xx < brain.nbSlice.X; xx++) {
          var posW = (xx % brain.nbCol);
          var posH = (xx - posW) / brain.nbCol;
          brain.planes.contextZ.drawImage(brain.planes.canvasX,
            posW * brain.nbSlice.Y, posH * brain.nbSlice.Z + brain.numSlice.Z, brain.nbSlice.Y, 1, 0, xx, brain.nbSlice.Y, 1);

        }
        // Redraw the axial slice in the canvas at screen resolution
        brain.context.drawImage(brain.planes.canvasZ,
          0, 0, brain.nbSlice.X, brain.nbSlice.Y, brain.widthCanvas.X + brain.widthCanvas.Y, (brain.heightCanvas.max - brain.heightCanvas.Z) / 2, brain.widthCanvas.Z, brain.heightCanvas.Z);
      }
      // Add Z coordinates on the slice
      if (brain.flagCoordinates) {
        coord = "z=" + brain.coordinatesSlice.Z;
        coordWidth = brain.context.measureText(coord).width;
        brain.context.fillStyle = brain.colorFont;
        brain.context.fillText(coord, brain.widthCanvas.X + brain.widthCanvas.Y + (brain.widthCanvas.Z / 2) - coordWidth / 2, Math.round(brain.canvas.height - (brain.sizeFontPixels / 2)));
      }
      
      brain.dirty.Z = false;
    }
  };

  brain.moveTo = function(coords) {
    coords.X = Math.max(Math.min(coords.X || brain.numSlice.X, brain.nbSlice.X - 1), 0);
    coords.Y = Math.max(Math.min(coords.Y || brain.numSlice.Y, brain.nbSlice.Y - 1), 0);
    coords.Z = Math.max(Math.min(coords.Z || brain.numSlice.Z, brain.nbSlice.Z - 1), 0);

    brain.coordinatesSlice.X = (brain.numSlice.X * brain.voxelSize) - brain.origin.X;
    brain.coordinatesSlice.Y = (brain.numSlice.Y * brain.voxelSize) - brain.origin.Y;
    brain.coordinatesSlice.Z = ((brain.nbSlice.Z - brain.numSlice.Z - 1) * brain.voxelSize) - brain.origin.Z;

    var oldCoords = Object.assign({}, brain.numSlice);
    var newCoords = Object.assign({}, coords);
    
    brain.dirty = {
      X: brain.dirty.X || coords.X != brain.numSlice.X,
      Y: brain.dirty.Y || coords.Y != brain.numSlice.Y,
      Z: brain.dirty.Z || coords.Z != brain.numSlice.Z,
    };
    
    brain.numSlice = coords;

    brain.triggerEvent('change', { oldCoords: oldCoords, newCoords: newCoords });
    brain.draw();
  }

  brain.eventListeners = { change: [] };  
  brain.addEventListener = function(type, listener) {
    if (type != 'change') return;
    brain.eventListeners.change.push({type: type, listener: listener});
  };

  brain.removeEventListener = function(type, listener) {
    var i = 0;
    while (i < brain.eventListeners.length) {
      var eventListener = brain.eventListeners[i];
      if (eventListener.type == type && eventListener.listener == listener) {
        brain.eventListeners.splice(i, 1);
        break;
      }
      ++i;
    }
  };

  brain.triggerEvent = function(type, payload) {
    var i = 0;
    while (i < brain.eventListeners[type].length) {
      var eventListener = brain.eventListeners[type][i];
      eventListener.listener.call(brain, payload);
      ++i;
    }
  }

  brain._canvasClick = function(e) {
    var rect = brain.canvas.getBoundingClientRect();
    var xx = e.clientX - rect.left;
    var yy = e.clientY - rect.top;
    var sx, sy, sz;

    if (xx < brain.widthCanvas.X) {
      sy = Math.round(brain.nbSlice.Y * (xx / brain.widthCanvas.X));
      sz = Math.round(brain.nbSlice.Z * (yy - ((brain.heightCanvas.max - brain.heightCanvas.X) / 2)) / brain.heightCanvas.X);
      brain.moveTo({ Y: sy, Z: sz });

    } else if (xx < (brain.widthCanvas.X + brain.widthCanvas.Y)) {
      xx = xx - brain.widthCanvas.X;
      sx = Math.round(brain.nbSlice.X * (xx / brain.widthCanvas.Y));
      sz = Math.round(brain.nbSlice.Z * (yy - ((brain.heightCanvas.max - brain.heightCanvas.Y) / 2)) / brain.heightCanvas.Y);
      brain.moveTo({ X: sx, Z: sz });

    } else {
      xx = xx - brain.widthCanvas.X - brain.widthCanvas.Y;
      sx = Math.round(brain.nbSlice.X * (xx / brain.widthCanvas.Z));
      sy = Math.round(brain.nbSlice.Y * (1 - ((yy - ((brain.heightCanvas.max - brain.heightCanvas.Z) / 2)) / brain.heightCanvas.Z)));
      brain.moveTo({ X: sx, Y: sy });

    };
  };

  brain.drawAll = function() {
    brain.dirty = { X: true, Y: true, Z: true };
    brain.draw();
  };

  // The main canvas, where the three slices are drawn
  brain.canvas = brain.canvas || document.createElement('canvas');
  brain.context = brain.canvas.getContext('2d');
  if (brain.smooth)
    brain.context.imageSmoothingEnabled = true;

  // An in-memory canvas to read the value of pixels
  brain.canvasRead = document.createElement('canvas');
  brain.contextRead = brain.canvasRead.getContext('2d');
  brain.canvasRead.width = 1;
  brain.canvasRead.height = 1;

  //******************//
  // The sprite image //
  //******************//
  if (typeof params.sprite == "string") {
    var node = document.getElementById(params.sprite);
    if (!node) {
      var img = new Image();
      img.addEventListener('load', function() {
        brain.sprite = img;
        brain.init();
      }, false);
      img.src = params.sprite; 
    }
  } else if (params.sprite.tagName.toUpperCase() == "IMG") {
    if (!params.sprite.complete) {
      params.sprite.addEventListener('load', function() {
        brain.init();
      }, false);
    } else {
      brain.sprite = params.sprite;
      brain.init();
    }
  }

  //*************//
  // The overlay //
  //*************//
  params.overlay = typeof params.overlay !== 'undefined' ? params.overlay : false;
  if (params.overlay) {
    // Initialize the overlay
    brain.overlay = {};
    // Get the sprite
    brain.overlay.sprite = document.getElementById(params.overlay.sprite);
    // Ratio between the resolution of the foreground and background
    // Number of columns and rows in the overlay
    brain.overlay.nbCol = brain.overlay.sprite.width / params.overlay.nbSlice.Y;
    brain.overlay.nbRow = brain.overlay.sprite.height / params.overlay.nbSlice.Z;
    // Number of slices in the overlay
    brain.overlay.nbSlice = {
      X: brain.overlay.nbCol * brain.overlay.nbRow,
      Y: params.overlay.nbSlice.Y,
      Z: params.overlay.nbSlice.Z
    };
    // opacity
    brain.overlay.opacity = typeof params.overlay.opacity !== 'undefined' ? params.overlay.opacity : 1;
  };

  //**************//
  // The colormap //
  //**************//
  params.colorMap = typeof params.colorMap !== 'undefined' ? params.colorMap : false;
  if (params.colorMap) {
    // Initialize the color map
    brain.colorMap = {};
    // Get the sprite
    brain.colorMap.img = document.getElementById(params.colorMap.img);
    // Set min / max
    brain.colorMap.min = params.colorMap.min;
    brain.colorMap.max = params.colorMap.max;
    // Set visibility
    params.colorMap.hide = typeof params.colorMap.hide !== 'undefined' ? params.colorMap.hide : false;
    // An in-memory canvas to store the colormap
    brain.colorMap.canvas = document.createElement('canvas');
    brain.colorMap.context = brain.colorMap.canvas.getContext('2d');
    brain.colorMap.canvas.width = brain.colorMap.img.width;
    brain.colorMap.canvas.height = brain.colorMap.img.height;

    // Copy the color map in an in-memory canvas
    brain.colorMap.context.drawImage(brain.colorMap.img,
      0, 0, brain.colorMap.img.width, brain.colorMap.img.height,
      0, 0, brain.colorMap.img.width, brain.colorMap.img.height);
  };

  return brain;
};