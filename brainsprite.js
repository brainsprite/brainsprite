function brainsprite(params) {

  // Function to add nearest neighbour interpolation to a canvas
  function setNearestNeighbour(context,flag){
    context.imageSmoothingEnabled = flag;
    return context
  }

  // Initialize the brain object
  var brain = {};

  // Smoothing of the main slices
  brain.smooth = typeof params.smooth !== 'undefined' ? params.smooth: false;

  // The main canvas, where the three slices are drawn
  brain.canvas = document.getElementById(params.canvas);
  brain.context = brain.canvas.getContext('2d');
  brain.context = setNearestNeighbour(brain.context,brain.smooth);

  // An in-memory canvas to draw intermediate reconstruction
  // of the coronal slice, at native resolution
  brain.canvasY = document.createElement('canvas');
  brain.contextY = brain.canvasY.getContext('2d');

  // An in-memory canvas to draw intermediate reconstruction
  // of the axial slice, at native resolution
  brain.canvasZ = document.createElement('canvas');
  brain.contextZ = brain.canvasZ.getContext('2d');

  // Onclick events
  brain.onclick = typeof params.onclick !== 'undefined' ? params.onclick : "";

  // Background color for the canvas
  brain.colorBackground = typeof params.colorBackground !== 'undefined' ? params.colorBackground : "#000000";

  // Flag to turn on/off slice numbers
  brain.flagCoordinates = typeof params.flagCoordinates !== 'undefined' ? params.flagCoordinates : false;

  // Origins and voxel size
  brain.origin = typeof params.origin !== 'undefined' ? params.origin : {X: 0, Y: 0, Z: 0};
  brain.voxelSize = typeof params.voxelSize !== 'undefined' ? params.voxelSize : 1;

  // Colorbar size parameters
  brain.heightColorBar = 0.04;

  // Font parameters
  brain.sizeFont = 0.075;
  brain.colorFont = typeof params.colorFont !== 'undefined' ? params.colorFont : "#FFFFFF";
  if (brain.flagCoordinates) {
    brain.spaceFont = 0.1;
  } else {
    brain.spaceFont = 0;
  };

  //******************//
  // The sprite image //
  //******************//
  brain.sprite = document.getElementById(params.sprite);

  // Number of columns and rows in the sprite
  brain.nbCol = brain.sprite.width/params.nbSlice.Y;
  brain.nbRow = brain.sprite.height/params.nbSlice.Z;
  // Number of slices
  brain.nbSlice = {
    X: brain.nbCol*brain.nbRow,
    Y: params.nbSlice.Y,
    Z: params.nbSlice.Z
  };
  // width and height for the canvas
  brain.widthCanvas  = {'X':0 , 'Y':0 , 'Z':0 };
  brain.heightCanvas = {'X':0 , 'Y':0 , 'Z':0 , 'max':0};
  // Default for current slices
  brain.numSlice = {
    'X': Math.floor(brain.nbSlice.X/2),
    'Y': Math.floor(brain.nbSlice.Y/2),
    'Z': Math.floor(brain.nbSlice.Z/2)
  };
  // Coordinates for current slices - these will get updated when drawing the slices
  brain.coordinatesSlice = {'X': 0, 'Y': 0, 'Z': 0 };

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
      brain.overlay.nbCol = brain.overlay.sprite.width/params.overlay.nbSlice.Y;
      brain.overlay.nbRow = brain.overlay.sprite.height/params.overlay.nbSlice.Z;
      // Number of slices in the overlay
      brain.overlay.nbSlice = {
        X: brain.overlay.nbCol*brain.overlay.nbRow,
        Y: params.overlay.nbSlice.Y,
        Z: params.overlay.nbSlice.Z
      };
      // Ratio between the size of the foreground and background
      brain.overlay.ratio = brain.overlay.nbSlice.Y / brain.nbSlice.Y;
      // An in-memory canvas to draw intermediate reconstruction
      // of the axial slice, at native resolution
      brain.overlay.canvasX = document.createElement('canvas');
      brain.overlay.contextX = brain.overlay.canvasX.getContext('2d');
      // An in-memory canvas to draw intermediate reconstruction
      // of the coronal slice, at native resolution
      brain.overlay.canvasY = document.createElement('canvas');
      brain.overlay.contextY = brain.overlay.canvasY.getContext('2d');
      // An in-memory canvas to draw intermediate reconstruction
      // of the axial slice, at native resolution
      brain.overlay.canvasZ = document.createElement('canvas');
      brain.overlay.contextZ = brain.overlay.canvasZ.getContext('2d');
      // opacity
      brain.overlay.opacity = typeof params.overlay.opacity !== 'undefined' ? params.overlay.opacity : 1;
  };

  //**************//
  // The colormap //
  //**************//
  params.colorMap = typeof params.colorMap !== 'undefined' ? params.colorMap: false;
  if (params.colorMap) {
      // Initialize the color map
      brain.colorMap = {};
      // Get the sprite
      brain.colorMap.img = document.getElementById(params.colorMap.img);
      // Set min / max
      brain.colorMap.min = params.colorMap.min;
      brain.colorMap.max = params.colorMap.max;
      // Set visibility
      params.colorMap.hide = typeof params.colorMap.hide !== 'undefined' ? params.colorMap.hide: false;
      // An in-memory canvas to store the colormap
      brain.colorMap.canvas = document.createElement('canvas');
      brain.colorMap.context = brain.colorMap.canvas.getContext('2d');
      brain.colorMap.canvas.width  = brain.colorMap.img.width;
      brain.colorMap.canvas.height = brain.colorMap.img.height;

      // Copy the color map in an in-memory canvas
      brain.colorMap.context.drawImage(brain.colorMap.img,
                0,0,brain.colorMap.img.width, brain.colorMap.img.height,
                0,0,brain.colorMap.img.width, brain.colorMap.img.height);
  };

  //********************************************//
  // Extract the value associated with on voxel //
  //********************************************//
  brain.getValue = function(rgb,colorMap) {
    if (!colorMap) {
      return NaN;
    }
    var cv, dist, nbColor, ind, val, voxelValue;
    nbColor = colorMap.canvas.width;
    ind = NaN;
    val = Infinity;
    try {
      for (xx=0; xx<nbColor; xx++) {
        cv = colorMap.context.getImageData(xx,0,1,1).data;
        dist = Math.pow(cv[0]-rgb[0],2)+Math.pow(cv[1]-rgb[1],2)+Math.pow(cv[2]-rgb[2],2);
        if (dist<val) {
          ind = xx;
          val = dist;
        }
      }
      voxelValue = (ind*(colorMap.max - colorMap.min)/(nbColor-1)) + colorMap.min;
      return voxelValue;
    }
    catch (err) {
      console.warn(err.message);
      return NaN;
    };
  };

  //***************************************//
  // Draw a particular slice in the canvas //
  //***************************************//
  brain.draw = function(slice,type) {

    // Update the slice number
    brain.numSlice[type] = slice;

    // Update the width of the X, Y and Z slices in the canvas, based on the width of its parent
    brain.widthCanvas.X = Math.floor(brain.canvas.parentElement.clientWidth*(brain.nbSlice.Y/(2*brain.nbSlice.X+brain.nbSlice.Y)));
    brain.widthCanvas.Y = Math.floor(brain.canvas.parentElement.clientWidth*(brain.nbSlice.X/(2*brain.nbSlice.X+brain.nbSlice.Y)));
    brain.widthCanvas.Z = Math.floor(brain.canvas.parentElement.clientWidth*(brain.nbSlice.X/(2*brain.nbSlice.X+brain.nbSlice.Y)));

    // Update the height of the slices in the canvas, based on width and image ratio
    brain.heightCanvas.X = Math.floor(brain.widthCanvas.X * brain.nbSlice.Z / brain.nbSlice.Y );
    brain.heightCanvas.Y = Math.floor(brain.widthCanvas.Y * brain.nbSlice.Z / brain.nbSlice.X );
    brain.heightCanvas.Z = Math.floor(brain.widthCanvas.Z * brain.nbSlice.Y / brain.nbSlice.X );
    brain.heightCanvas.max = Math.max(brain.heightCanvas.X,brain.heightCanvas.Y,brain.heightCanvas.Z);

    // Apply the width/height to the canvas, if necessary
    if (brain.canvas.width!=(brain.widthCanvas.X+brain.widthCanvas.Y+brain.widthCanvas.Z)) {
      brain.canvas.width = brain.widthCanvas.X+brain.widthCanvas.Y+brain.widthCanvas.Z;
      brain.canvas.height = Math.round((1+brain.spaceFont)*(brain.heightCanvas.max));
      brain.context = setNearestNeighbour(brain.context,brain.smooth);
    };

    // Set fill color for the slice
    brain.context.fillStyle=brain.colorBackground;

    // Size for fonts
    var sizeFontPixels = Math.round(brain.sizeFont*(brain.heightCanvas.max));

    // Update slice coordinates
    brain.coordinatesSlice.X = (brain.numSlice.X * brain.voxelSize) - brain.origin.X;
    brain.coordinatesSlice.Y = (brain.numSlice.Y * brain.voxelSize) - brain.origin.Y;
    brain.coordinatesSlice.Z = ((brain.nbSlice.Z-brain.numSlice.Z-1) * brain.voxelSize) - brain.origin.Z;

    // Update voxel value
    if (brain.overlay) {
      try {
        var rgb = brain.overlay.contextX.getImageData(brain.numSlice.Y,brain.numSlice.Z,1,1).data;
      }
      catch(e) {
        var rgb = 0;
      }
      brain.voxelValue = brain.getValue(rgb,brain.colorMap);
    } else {
      brain.voxelValue = NaN;
    };
    // Now draw the slice
    switch(type) {
      case 'X':
        // Draw a sagital slice
        var posW = ((brain.numSlice.X)%brain.nbCol);
        var posH = (brain.numSlice.X-posW)/brain.nbCol;
        brain.context.fillRect(0, 0, brain.widthCanvas.X , brain.canvas.height);
        brain.context.drawImage(brain.sprite,
                posW*brain.nbSlice.Y, posH*brain.nbSlice.Z, brain.nbSlice.Y, brain.nbSlice.Z,0, (brain.heightCanvas.max-brain.heightCanvas.X)/2, brain.widthCanvas.X, brain.heightCanvas.X );

        // Add overlay
        if (brain.overlay) {
            // Draw a single axial slice at native resolution (for the overlay)
            brain.overlay.canvasX.width = brain.overlay.nbSlice.Y;
            brain.overlay.canvasX.height = brain.overlay.nbSlice.Z;
            brain.overlay.contextX.globalAlpha = brain.overlay.opacity;
            var posW = ((Math.round(brain.overlay.ratio*brain.numSlice.X))%brain.overlay.nbCol);
            var posH = (Math.round(brain.overlay.ratio*brain.numSlice.X)-posW)/brain.overlay.nbCol;
            brain.overlay.contextX.drawImage(brain.overlay.sprite,
                posW*brain.overlay.nbSlice.Y, posH*brain.overlay.nbSlice.Z, brain.overlay.nbSlice.Y, brain.overlay.nbSlice.Z,0,0,brain.overlay.nbSlice.Y,brain.overlay.nbSlice.Z);
            // Draw the X slice on the main canvas
            brain.context.drawImage(brain.overlay.canvasX,
                0, 0, brain.overlay.nbSlice.Y, brain.overlay.nbSlice.Z,0, (brain.heightCanvas.max-brain.heightCanvas.X)/2, brain.widthCanvas.X, brain.heightCanvas.X );
        };

        // Add X coordinates on the slice
        if (brain.flagCoordinates) {
          brain.context.font = sizeFontPixels + "px Arial";
          brain.context.fillStyle = brain.colorFont;
          var coord = "x="+brain.coordinatesSlice.X;
          var coordWidth = brain.context.measureText(coord).width;
          brain.context.fillText(coord,brain.widthCanvas.X/2-coordWidth/2,Math.round(brain.canvas.height-(sizeFontPixels/2)));
        }
        break
      case 'Y':
        // Draw a single coronal slice at native resolution
        brain.context.fillRect(brain.widthCanvas.X, 0, brain.widthCanvas.Y, brain.canvas.height);
        brain.canvasY.width  = brain.nbSlice.X;
        brain.canvasY.height = brain.nbSlice.Z;
        for (xx=0; xx<brain.nbSlice.X; xx++) {
            var posW = (xx%brain.nbCol);
            var posH = (xx-posW)/brain.nbCol;
            brain.contextY.drawImage(brain.sprite,
                posW*brain.nbSlice.Y + brain.numSlice.Y, posH*brain.nbSlice.Z, 1, brain.nbSlice.Z, xx, 0, 1, brain.nbSlice.Z );
        }
        // Redraw the coronal slice in the canvas at screen resolution
        brain.context.drawImage(brain.canvasY,
                0, 0, brain.nbSlice.X, brain.nbSlice.Z, brain.widthCanvas.X, (brain.heightCanvas.max-brain.heightCanvas.Y)/2, brain.widthCanvas.Y, brain.heightCanvas.Y );

        // Add overlay
        if (brain.overlay) {
          // Draw a single coronal slice at native resolution (for the overlay)
          brain.overlay.canvasY.width = brain.overlay.nbSlice.X;
          brain.overlay.canvasY.height = brain.overlay.nbSlice.Z;
          brain.overlay.contextY.globalAlpha = brain.overlay.opacity;
          for (xx=0; xx<brain.overlay.nbSlice.X; xx++) {
            var posW = xx%brain.overlay.nbCol;
            var posH = (xx-posW)/brain.overlay.nbCol;
            brain.overlay.contextY.drawImage(brain.overlay.sprite,
                posW*brain.overlay.nbSlice.Y + Math.round(brain.overlay.ratio*brain.numSlice.Y), posH*brain.overlay.nbSlice.Z, 1, brain.overlay.nbSlice.Z, xx, 0, 1, brain.overlay.nbSlice.Z );
          }
          // Redraw the coronal slice in the canvas at screen resolution
          brain.context.drawImage(brain.overlay.canvasY,
                0, 0, brain.overlay.nbSlice.X, brain.overlay.nbSlice.Z, brain.widthCanvas.X, (brain.heightCanvas.max-brain.heightCanvas.Y)/2, brain.widthCanvas.Y, brain.heightCanvas.Y );
        }

        // Add colorbar
        if ((brain.colorMap)&&(!brain.colorMap.hide)) {
          // draw the colorMap on the coronal slice at screen resolution
          brain.context.drawImage(brain.colorMap.img,
                0, 0, brain.colorMap.img.width, 1, Math.round(brain.widthCanvas.X + brain.widthCanvas.Y*0.2) , Math.round(brain.heightCanvas.max * brain.heightColorBar / 2), Math.round(brain.widthCanvas.Y*0.6) , Math.round(brain.heightCanvas.max * brain.heightColorBar));
          brain.context.font = sizeFontPixels + "px Arial";
          brain.context.fillStyle = brain.colorFont;
          brain.context.fillText(brain.colorMap.min,brain.widthCanvas.X+(brain.widthCanvas.Y*0.2),Math.round( (brain.heightCanvas.max*brain.heightColorBar*2) + (3/4)*(sizeFontPixels) ));
          brain.context.fillText(brain.colorMap.max,brain.widthCanvas.X+(brain.widthCanvas.Y*0.8)-brain.context.measureText(brain.colorMap.max).width,Math.round( (brain.heightCanvas.max*brain.heightColorBar*2) + (3/4)*(sizeFontPixels) ));
        }

        // Add Y coordinates on the slice
        if (brain.flagCoordinates) {
          brain.context.font = sizeFontPixels + "px Arial";
          brain.context.fillStyle = brain.colorFont;
          var coord = "y="+brain.coordinatesSlice.Y;
          var coordWidth = brain.context.measureText(coord).width;
          brain.context.fillText(coord,brain.widthCanvas.X+(brain.widthCanvas.Y/2)-coordWidth/2,Math.round(brain.canvas.height-(sizeFontPixels/2)));
        }

      case 'Z':
        // Draw a single axial slice at native resolution
        brain.context.fillRect(brain.widthCanvas.X+brain.widthCanvas.Y, 0, brain.widthCanvas.Z, brain.canvas.height);
        brain.canvasZ.width = brain.nbSlice.X;
        brain.canvasZ.height = brain.nbSlice.Y;
        brain.contextZ.rotate(-Math.PI/2);
        brain.contextZ.translate(-brain.nbSlice.Y,0);
        for (xx=0; xx<brain.nbSlice.X; xx++) {
            var posW = (xx%brain.nbCol);
            var posH = (xx-posW)/brain.nbCol;
            brain.contextZ.drawImage(brain.sprite,
                posW*brain.nbSlice.Y , posH*brain.nbSlice.Z + brain.numSlice.Z, brain.nbSlice.Y, 1, 0, xx, brain.nbSlice.Y, 1 );

        }
        // Redraw the axial slice in the canvas at screen resolution
        brain.context.drawImage(brain.canvasZ,
                0, 0, brain.nbSlice.X, brain.nbSlice.Y, brain.widthCanvas.X+brain.widthCanvas.Y, (brain.heightCanvas.max-brain.heightCanvas.Z)/2, brain.widthCanvas.Z, brain.heightCanvas.Z );

        // Add overlay
        if (brain.overlay) {
          // Draw a single axial slice at native resolution (for the overlay)
          brain.overlay.canvasZ.width = brain.overlay.nbSlice.X;
          brain.overlay.canvasZ.height = brain.overlay.nbSlice.Y;
          brain.overlay.contextZ.rotate(-Math.PI/2);
          brain.overlay.contextZ.translate(-brain.overlay.nbSlice.Y,0);
          brain.overlay.contextZ.globalAlpha = brain.overlay.opacity;
          for (xx=0; xx<brain.overlay.nbSlice.X; xx++) {
            var posW = xx%brain.overlay.nbCol;
            var posH = (xx-posW)/brain.overlay.nbCol;
            brain.overlay.contextZ.drawImage(brain.overlay.sprite,
                posW*brain.overlay.nbSlice.Y , posH*brain.overlay.nbSlice.Z + Math.round(brain.overlay.ratio*brain.numSlice.Z), brain.overlay.nbSlice.Y, 1,  0, xx, brain.overlay.nbSlice.Y , 1 );
          }
          // Redraw the axial slice in the canvas at screen resolution
          brain.context.drawImage(brain.overlay.canvasZ,
                0, 0, brain.overlay.nbSlice.X, brain.overlay.nbSlice.Y, brain.widthCanvas.X+brain.widthCanvas.Y, (brain.heightCanvas.max-brain.heightCanvas.Z)/2, brain.widthCanvas.Z, brain.heightCanvas.Z );
        }

        // Add Z coordinates on the slice
        if (brain.flagCoordinates) {
          brain.context.font = sizeFontPixels + "px Arial";
          brain.context.fillStyle = brain.colorFont;
          var coord = "z="+brain.coordinatesSlice.Z;
          var coordWidth = brain.context.measureText(coord).width;
          brain.context.fillText(coord,brain.widthCanvas.X+brain.widthCanvas.Y+(brain.widthCanvas.Z/2)-coordWidth/2,Math.round(brain.canvas.height-(sizeFontPixels/2)));
        }
    }
  };

  // In case of click, update brain slices
  brain.clickBrain = function(e){
    var rect = brain.canvas.getBoundingClientRect();
    var xx = e.clientX - rect.left;
    var yy = e.clientY - rect.top;

    if (xx<brain.widthCanvas.X){
      var sy = Math.round(brain.nbSlice.Y*(xx/brain.widthCanvas.X));
      var sz = Math.round(brain.nbSlice.Z*(yy-((brain.heightCanvas.max-brain.heightCanvas.X)/2))/brain.heightCanvas.X);
      brain.draw(Math.max(Math.min(sy,brain.nbSlice.Y-1),0),'Y');
      brain.draw(Math.max(Math.min(sz,brain.nbSlice.Z-1),0),'Z');
    } else if (xx<(brain.widthCanvas.X+brain.widthCanvas.Y)) {
      xx = xx-brain.widthCanvas.X;
      sx = Math.round(brain.nbSlice.X*(xx/brain.widthCanvas.Y));
      sz = Math.round(brain.nbSlice.Z*(yy-((brain.heightCanvas.max-brain.heightCanvas.Y)/2))/brain.heightCanvas.Y);
      brain.draw(Math.max(Math.min(sx,brain.nbSlice.X-1),0),'X');
      brain.draw(Math.max(Math.min(sz,brain.nbSlice.Z-1),0),'Z');
    } else {
      xx = xx-brain.widthCanvas.X-brain.widthCanvas.Y;
      sx = Math.round(brain.nbSlice.X*(xx/brain.widthCanvas.Z));
      sy = Math.round(brain.nbSlice.Y*(1-((yy-((brain.heightCanvas.max-brain.heightCanvas.Z)/2))/brain.heightCanvas.Z)));
      brain.draw(Math.max(Math.min(sx,brain.nbSlice.X-1),0),'X');
      brain.draw(Math.max(Math.min(sy,brain.nbSlice.Y-1),0),'Y');
      brain.draw(brain.numSlice.Z,'Z');
    };
    if (brain.onclick) {
      brain.onclick(e);
    };
  };

  brain.drawAll = function(){
    brain.draw(brain.numSlice.X,'X')
    brain.draw(brain.numSlice.Y,'Y')
    brain.draw(brain.numSlice.Z,'Z')
  };

  // Attach a listener for clicks
  brain.canvas.addEventListener('click', brain.clickBrain, false);

  // Attach a listener on mouse down
  brain.canvas.addEventListener('mousedown', function(e) {
    brain.canvas.addEventListener('mousemove', brain.clickBrain, false);
  }, false);

  // Detach the listener on mouse up
  brain.canvas.addEventListener('mouseup', function(e) {
      brain.canvas.removeEventListener('mousemove', brain.clickBrain, false);
    }, false);

  // Draw all slices when background/overlay are loaded
  brain.sprite.addEventListener('load', function(){
    brain.drawAll();
  });
  brain.overlay.sprite.addEventListener('load', function(){
    brain.drawAll();
  });

  // Draw all slices
  brain.drawAll();

  return brain
};
