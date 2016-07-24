function brainsprite(params) {

  // Initialize the brain object
  var brain = {};
  
  // The main canvas, where the three slices are drawn
  brain.canvas = document.getElementById(params.canvas);
  brain.context = brain.canvas.getContext('2d');
  
  // An in-memory canvas to draw intermediate reconstruction
  // of the coronal slice, at native resolution
  brain.canvasY = document.createElement('canvas');
  brain.contextY = brain.canvasY.getContext('2d');
  
  // An in-memory canvas to draw intermediate reconstruction
  // of the axial slice, at native resolution
  brain.canvasZ = document.createElement('canvas');
  brain.contextZ = brain.canvasZ.getContext('2d');
  
  // Background color for the canvas
  brain.colorBackGround = typeof params.colorBackGround !== 'undefined' ? params.colorBackGround : "black";
  
  // The sprite image
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

  // Draw X,Y,Z slices for a particular time frame in the canvas. 
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
    
    // If necessary, apply new dimensions to the canvas
    if (brain.canvas.width!=(brain.widthCanvas.X+brain.widthCanvas.Y+brain.widthCanvas.Z)) {   
      brain.canvas.width = brain.widthCanvas.X+brain.widthCanvas.Y+brain.widthCanvas.Z;
      brain.canvas.height = brain.heightCanvas.max;
    };
    brain.context.fillStyle=brain.colorBackGround;
  
    // Now draw the slice
    switch(type) {
      case 'X':
        // Draw a sagital slice
        var posW = ((brain.numSlice.X)%brain.nbCol);
        var posH = (brain.numSlice.X-posW)/brain.nbCol;
        brain.context.fillRect(0, 0, brain.widthCanvas.X , brain.heightCanvas.max);
        brain.context.drawImage(brain.sprite,
                posW*brain.nbSlice.Y, posH*brain.nbSlice.Z, brain.nbSlice.Y, brain.nbSlice.Z,0, (brain.heightCanvas.max-brain.heightCanvas.X)/2, brain.widthCanvas.X, brain.heightCanvas.X );
        //ctx.fillStyle = "#ffffff";
        //ctx.fillText("Slice number "+numSlice.X,wImg.X/2,0.05*hImg.max);
        break
      case 'Y':
        // Draw a coronal slice
        brain.context.fillRect(brain.widthCanvas.X, 0, brain.widthCanvas.Y, brain.heightCanvas.max);
        brain.canvasY.width  = brain.nbSlice.X;
        brain.canvasY.height = brain.nbSlice.Z;
        for (xx=0; xx<brain.nbSlice.X; xx++) {
            var posW = (xx%brain.nbCol);
            var posH = (xx-posW)/brain.nbCol;
            brain.contextY.drawImage(brain.sprite, 
                posW*brain.nbSlice.Y + brain.numSlice.Y, posH*brain.nbSlice.Z, 1, brain.nbSlice.Z, xx, 0, 1, brain.nbSlice.Z );
                
        }
        brain.context.drawImage(brain.canvasY,
                0, 0, brain.nbSlice.X, brain.nbSlice.Z, brain.widthCanvas.X, (brain.heightCanvas.max-brain.heightCanvas.Y)/2, brain.widthCanvas.Y, brain.heightCanvas.Y );
        // brain.context.fillStyle = "#ffffff";
        // brain.context.fillText("Slice number "+numSlice.Y,wImg.X + (wImg.Y/2),0.05*hImg.max);
      case 'Z':
        // Draw an axial slice
        brain.context.fillRect(brain.widthCanvas.X+brain.widthCanvas.Y, 0, brain.widthCanvas.Z, brain.heightCanvas.max);
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
        brain.context.drawImage(brain.canvasZ,
                0, 0, brain.nbSlice.X, brain.nbSlice.Y, brain.widthCanvas.X+brain.widthCanvas.Y, (brain.heightCanvas.max-brain.heightCanvas.Z)/2, brain.widthCanvas.Z, brain.heightCanvas.Z );
        // brain.context.fillStyle = "#ffffff";
        // brain.context.fillText("Slice number "+brain.numSlice.Z,brain.widthCanvas.X + brain.widthCanvas.Y + (brain.widthCanvas.Z/2),0.05*brain.heightCanvas.max);
        
    }
  };

  // In case of click, update brain slices
  brain.clickBrain = function(e){
    var xx = e.pageX - brain.canvas.offsetLeft;
    var yy = e.pageY - brain.canvas.offsetTop;
    if (xx<brain.widthCanvas.X){
      brain.draw(Math.round(brain.nbSlice.Y*(xx/brain.widthCanvas.X)),'Y');
      brain.draw(Math.round(brain.nbSlice.Z*(yy-((brain.heightCanvas.max-brain.heightCanvas.X)/2))/brain.heightCanvas.X),'Z');
    } else if (xx<(brain.widthCanvas.X+brain.widthCanvas.Y)) {
      xx = xx-brain.widthCanvas.X;
      brain.draw(Math.round(brain.nbSlice.X*(xx/brain.widthCanvas.Y)),'X');
      brain.draw(Math.round(brain.nbSlice.Z*(yy-((brain.heightCanvas.max-brain.heightCanvas.Y)/2))/brain.heightCanvas.Y),'Z');
    } else {
      xx = xx-brain.widthCanvas.X-brain.widthCanvas.Y;
      brain.draw(Math.round(brain.nbSlice.X*(xx/brain.widthCanvas.Z)),'X');
      brain.draw(Math.round(brain.nbSlice.Y*(1-((yy-((brain.heightCanvas.max-brain.heightCanvas.Z)/2))/brain.heightCanvas.Z))),'Y');
    }
  };
  
  // Attach a listener for clicks
  brain.canvas.addEventListener('click', function(e) { brain.clickBrain(e)}, false);
  
  // Draw a X slice for good measure
  brain.draw(brain.numSlice.X,'X')
  brain.draw(brain.numSlice.Y,'Y')
  brain.draw(brain.numSlice.Z,'Z')
  return brain
};