function displayFloat (v, nbDecimals) {
  var str = parseFloat(v).toFixed(nbDecimals)
  return str.indexOf('.') === -1 ? str + '.' : str.replace(/0+$/, '')
}

function initBrain (params) {
  // Parameter initialization - for internal use

  var defaultParams = {
    smooth: false,
    flagValue: false,
    colorBackground: '#000000',
    flagCoordinates: false,
    origin: { X: 0, Y: 0, Z: 0 },
    voxelSize: 1,
    affine: false,
    heightColorBar: 0.04,
    sizeFont: 0.075,
    colorFont: '#FFFFFF',
    nbDecimals: 3,
    crosshair: false,
    colorCrosshair: '#0000FF',
    sizeCrosshair: 0.9,
    title: false,
    numSlice: false,
    onclick: '',
    opacity: 1
  }
  var brain = Object.assign({}, defaultParams, params)

  // Build affine, if not specified
  if (typeof brain.affine === 'boolean' && brain.affine === false) {
    brain.affine = [[brain.voxelSize, 0, 0, -brain.origin.X],
      [0, brain.voxelSize, 0, -brain.origin.Y],
      [0, 0, brain.voxelSize, -brain.origin.Z],
      [0, 0, 0, 1]]
  }
  // Font parameters
  if (brain.flagCoordinates) {
    brain.spaceFont = 0.1
  } else {
    brain.spaceFont = 0
  };

  // Coordinates for current slices -
  // these will get updated when drawing the slices
  brain.coordinatesSlice = { 'X': 0, 'Y': 0, 'Z': 0 }

  // width and height for the canvas
  brain.widthCanvas = { 'X': 0, 'Y': 0, 'Z': 0 }
  brain.heightCanvas = { 'X': 0, 'Y': 0, 'Z': 0, 'max': 0 }

  return brain
}

function initCanvas (brain, canvas) {
  // Initialize a series of canvas to store individual slices and the viewer
  // - for internal use

  // The main canvas, where the three slices are drawn
  brain.canvas = document.getElementById(canvas)
  brain.context = brain.canvas.getContext('2d')
  brain.context.imageSmoothingEnabled = brain.smooth

  // An in-memory canvas to draw intermediate reconstruction
  // of the coronal slice, at native resolution
  brain.canvasY = document.createElement('canvas')
  brain.contextY = brain.canvasY.getContext('2d')

  // An in-memory canvas to draw intermediate reconstruction
  // of the axial slice, at native resolution
  brain.canvasZ = document.createElement('canvas')
  brain.contextZ = brain.canvasZ.getContext('2d')

  // An in-memory canvas to read the value of pixels
  brain.canvasRead = document.createElement('canvas')
  brain.contextRead = brain.canvasRead.getContext('2d')
  brain.canvasRead.width = 1
  brain.canvasRead.height = 1

  // A master sagital canvas for the merge of background and overlay
  brain.planes = {}
  brain.planes.canvasMaster = document.createElement('canvas')
  brain.planes.contextMaster = brain.planes.canvasMaster.getContext('2d')

  return brain
}

function initSprite (brain, sprite, nbSlice) {
  // Initialize the sprite and associated dimensions - for internal use

  brain.sprite = document.getElementById(sprite)
  brain.nbCol = brain.sprite.width / nbSlice.Y
  brain.nbRow = brain.sprite.height / nbSlice.Z
  brain.nbSlice = {
    X: typeof nbSlice.X !== 'undefined' ? nbSlice.X : brain.nbCol * brain.nbRow,
    Y: nbSlice.Y,
    Z: nbSlice.Z
  }
  if (brain.numSlice === false) {
    brain.numSlice = {
      X: Math.floor(brain.nbSlice.X / 2),
      Y: Math.floor(brain.nbSlice.Y / 2),
      Z: Math.floor(brain.nbSlice.Z / 2)
    }
  };
  return brain
}

function initOverlay (brain, sprite, nbSlice) {
  // Initialize the overlay canvas - for internal use

  brain.overlay = {}
  brain.overlay.sprite = document.getElementById(sprite)
  brain.overlay.nbCol = brain.overlay.sprite.width / nbSlice.Y
  brain.overlay.nbRow = brain.overlay.sprite.height / nbSlice.Z
  brain.overlay.nbSlice = {
    X: typeof nbSlice.X !== 'undefined' ? nbSlice.X
      : brain.overlay.nbCol * brain.overlay.nbRow,
    Y: nbSlice.Y,
    Z: nbSlice.Z
  }

  return brain
}

function initColorMap (colorMap) {
  // Initialize the color map - for internal use.
  colorMap.img = document.getElementById(colorMap.img)
  colorMap.hide =
    typeof colorMap.hide !== 'undefined' ? colorMap.hide : false
  colorMap.canvas = document.createElement('canvas')
  colorMap.context = colorMap.canvas.getContext('2d')
  colorMap.canvas.width = colorMap.img.width
  colorMap.canvas.height = colorMap.img.height
  colorMap.context.drawImage(colorMap.img,
    0, 0, colorMap.img.width, colorMap.img.height,
    0, 0, colorMap.img.width, colorMap.img.height)
  return colorMap
}

var brainsprite = function (params) {
  // Create and activate a brainsprite viewer object
  //
  // Parameters
  // ----------
  //  nanValue : (boolean) unable to read values.
  //  smooth : (boolean) turn on/off smoothing of the main slices.
  //  flagValue : (boolean) turn on/off display of the current value.
  //  colorBackground : (str) the color for background.
  //  colorFont : (str) the color for the fonts.
  //  colorCrosshair : (str) the color of the crosshair.
  //  flagCoordinates : (bool) turn on/off slice coordinates.
  //  origin : ({"X","Y","Z"}) coordinates of the origin.
  //  voxelSize : (float) the size of one voxel (assumed to be isotropic)
  //  affine : (3x4 array, or false) the voxel-to-world transform.
  //    false will trigger isotropic diagonal using origin and voxelSize.
  //  heightColorBar : (float) height of the text for the colorbar.
  //  sizeFont : (float) the size of other texts.
  //  nbDecimals : (int) the number of decimals when showing the value.
  //  crosshair : (bool) turns on/off the crosshair.
  //  sizeCrosshair: (float) the size of the crosshair, expressed as a
  //    fraction of the slice (comprised between 0 and 1).
  //  title : (str or false) the title for the viewer.
  //    false will use no title.
  //  numSlice : ({"X", "Y", "Z"}, or false): the coordinates of the initial
  //    cut. false will use the middle of the volume.
  //  overlay: (object or false) if false, no overlay.
  //  opacity: (float) the opacity of the overlay.
  //  onclick: (string) command to call on click.
  //  colormap: (object or false) if false, no colormap.
  //
  // Returns
  // -------
  // brain : a brainsprite viewer object.

  let brain = initBrain(params)
  brain = initCanvas(brain, params.canvas)
  brain = initSprite(brain, params.sprite, params.nbSlice)
  if (params.overlay) {
    brain = initOverlay(brain, params.overlay.sprite, params.overlay.nbSlice)
  };
  if (params.colorMap) {
    brain.colorMap = initColorMap(params.colorMap)
  };

  let getValue = function (rgb, colorMap) {
  // Extract the value associated with a voxel by looking up in a colormap.
    if (!colorMap) {
      return NaN
    }
    var cv, dist, nbColor, ind, val, voxelValue
    nbColor = colorMap.canvas.width
    ind = NaN
    val = Infinity
    let xx = 0
    for (xx = 0; xx < nbColor; xx++) {
      cv = colorMap.context.getImageData(xx, 0, 1, 1).data
      dist = Math.pow(cv[0] - rgb[0], 2) +
              Math.pow(cv[1] - rgb[1], 2) +
              Math.pow(cv[2] - rgb[2], 2)
      if (dist < val) {
        ind = xx
        val = dist
      }
    }
    voxelValue =
        (ind * (colorMap.max - colorMap.min) / (nbColor - 1)) + colorMap.min
    return voxelValue
  }

  let updateValue = function () {
    // Update voxel value
    let pos = {}; let test1 = []; let test2 = []
    if (brain.overlay && !brain.nanValue) {
      try {
        pos.XW = Math.round((brain.numSlice.X) % brain.nbCol)
        pos.XH = Math.round((brain.numSlice.X - pos.XW) / brain.nbCol)
        brain.contextRead.fillStyle = '#FFFFFF'
        brain.contextRead.fillRect(0, 0, 1, 1)
        brain.contextRead.drawImage(
          brain.overlay.sprite,
          pos.XW * brain.nbSlice.Y + brain.numSlice.Y,
          pos.XH * brain.nbSlice.Z + brain.nbSlice.Z - brain.numSlice.Z - 1,
          1, 1, 0, 0, 1, 1)
        let rgb = {}
        rgb = brain.contextRead.getImageData(0, 0, 1, 1).data
        test1 = ((rgb[0] === 255) && (rgb[1] === 255) && (rgb[2] === 255))
        brain.contextRead.fillStyle = '#000000'
        brain.contextRead.fillRect(0, 0, 1, 1)
        brain.contextRead.drawImage(
          brain.overlay.sprite,
          pos.XW * brain.nbSlice.Y + brain.numSlice.Y,
          pos.XH * brain.nbSlice.Z + brain.nbSlice.Z - brain.numSlice.Z - 1,
          1, 1, 0, 0, 1, 1)
        rgb = brain.contextRead.getImageData(0, 0, 1, 1).data
        test2 = ((rgb[0] === 0) && (rgb[1] === 0) && (rgb[2] === 0))
        if (test1 && test2) {
          brain.voxelValue = NaN
        } else {
          brain.voxelValue = getValue(rgb, brain.colorMap)
        }
      } catch (err) {
        console.warn(err.message)
        brain.nanValue = true
        brain.voxelValue = NaN
      }
    } else {
      brain.voxelValue = NaN
    };
  }

  let multiply = function (a, b) {
    // Multiply two matrices A and B
    let aNumRows = a.length; let aNumCols = a[0].length
    let bNumCols = b[0].length
    let m = new Array(aNumRows) // initialize array of rows
    for (var r = 0; r < aNumRows; ++r) {
      m[r] = new Array(bNumCols) // initialize the current row
      for (var c = 0; c < bNumCols; ++c) {
        m[r][c] = 0 // initialize the current cell
        for (var i = 0; i < aNumCols; ++i) {
          m[r][c] += a[r][i] * b[i][c]
        }
      }
    }
    return m
  }

  let updateCoordinates = function () {
    let coordVoxel = multiply(brain.affine,
      [ [brain.numSlice.X + 1],
        [brain.numSlice.Y + 1],
        [brain.numSlice.Z + 1],
        [1] ])
    brain.coordinatesSlice.X = coordVoxel[0]
    brain.coordinatesSlice.Y = coordVoxel[1]
    brain.coordinatesSlice.Z = coordVoxel[2]
  }

  //* **********************//
  // Initialize the viewer //
  //* **********************//
  brain.init = function () {
    let clientWidth = brain.canvas.parentElement.clientWidth
    let nX = brain.nbSlice.X; let nY = brain.nbSlice.Y; let nZ = brain.nbSlice.Z

    // Update the width of the X, Y and Z slices in the canvas,
    // based on the width of its parent
    brain.widthCanvas.X =
        Math.floor(clientWidth * (nY / (2 * nX + nY)))
    brain.widthCanvas.Y =
        Math.floor(clientWidth * (nX / (2 * nX + nY)))
    brain.widthCanvas.Z =
        Math.floor(clientWidth * (nX / (2 * nX + nY)))
    brain.widthCanvas.max =
        Math.max(brain.widthCanvas.X,
          brain.widthCanvas.Y,
          brain.widthCanvas.Z)

    // Update the height of the slices in the canvas,
    // based on width and image ratio
    brain.heightCanvas.X = Math.floor(brain.widthCanvas.X * nZ / nY)
    brain.heightCanvas.Y = Math.floor(brain.widthCanvas.Y * nZ / nX)
    brain.heightCanvas.Z = Math.floor(brain.widthCanvas.Z * nY / nX)
    brain.heightCanvas.max =
        Math.max(brain.heightCanvas.X,
          brain.heightCanvas.Y,
          brain.heightCanvas.Z)

    // Apply the width/height to the canvas, if necessary
    let widthAll =
        brain.widthCanvas.X + brain.widthCanvas.Y + brain.widthCanvas.Z
    if (brain.canvas.width !== widthAll) {
      brain.canvas.width = widthAll
      brain.canvas.height =
          Math.round((1 + brain.spaceFont) * brain.heightCanvas.max)
      brain.context.imageSmoothingEnabled = brain.smooth
    };

    // Size for fonts
    brain.sizeFontPixels =
        Math.round(brain.sizeFont * (brain.heightCanvas.max))

    // fonts
    brain.context.font = brain.sizeFontPixels + 'px Arial'

    // Draw the Master canvas
    brain.planes.canvasMaster.width = brain.sprite.width
    brain.planes.canvasMaster.height = brain.sprite.height
    brain.planes.contextMaster.globalAlpha = 1
    brain.planes.contextMaster.drawImage(brain.sprite,
      0, 0, brain.sprite.width, brain.sprite.height,
      0, 0, brain.sprite.width, brain.sprite.height)
    if (brain.overlay) {
      // Draw the overlay on a canvas
      brain.planes.contextMaster.globalAlpha = brain.opacity
      brain.planes.contextMaster.drawImage(brain.overlay.sprite,
        0, 0, brain.overlay.sprite.width, brain.overlay.sprite.height,
        0, 0, brain.sprite.width, brain.sprite.height)
    };

    // Draw the X canvas (sagital)
    brain.planes.canvasX = document.createElement('canvas')
    brain.planes.contextX = brain.planes.canvasX.getContext('2d')
    brain.planes.canvasX.width = nY
    brain.planes.canvasX.height = nZ

    // Draw the Y canvas (coronal)
    brain.planes.canvasY = document.createElement('canvas')
    brain.planes.contextY = brain.planes.canvasY.getContext('2d')
    brain.planes.canvasY.width = nX
    brain.planes.canvasY.height = nZ

    // Draw the Z canvas (axial)
    brain.planes.canvasZ = document.createElement('canvas')
    brain.planes.contextZ = brain.planes.canvasZ.getContext('2d')
    brain.planes.canvasZ.width = nX
    brain.planes.canvasZ.height = nY
    brain.planes.contextZ.rotate(-Math.PI / 2)
    brain.planes.contextZ.translate(-nY, 0)

    // Update value
    updateValue()

    // Update coordinates
    updateCoordinates()

    // Round up slice coordinates
    brain.numSlice.X = Math.round(brain.numSlice.X)
    brain.numSlice.Y = Math.round(brain.numSlice.Y)
    brain.numSlice.Z = Math.round(brain.numSlice.Z)
  }

  //* **************************************//
  // Draw a particular slice in the canvas //
  //* **************************************//
  brain.draw = function (slice, type) {
    // Init variables
    let pos = {}; let coord; let coordWidth
    let offX = Math.ceil((1 - brain.sizeCrosshair) * brain.nbSlice.X / 2)
    let offY = Math.ceil((1 - brain.sizeCrosshair) * brain.nbSlice.Y / 2)
    let offZ = Math.ceil((1 - brain.sizeCrosshair) * brain.nbSlice.Z / 2)
    let nY = brain.nbSlice.Y; let nZ = brain.nbSlice.Z; let xx

    // Now draw the slice
    switch (type) {
      case 'X':
        // Draw a sagital slice in memory
        pos.XW = ((brain.numSlice.X) % brain.nbCol)
        pos.XH = (brain.numSlice.X - pos.XW) / brain.nbCol
        brain.planes.contextX.drawImage(brain.planes.canvasMaster,
          pos.XW * nY, pos.XH * nZ, nY, nZ,
          0, 0, nY, nZ)

        // Add a crosshair
        if (brain.crosshair) {
          brain.planes.contextX.fillStyle = brain.colorCrosshair
          brain.planes.contextX.fillRect(
            brain.numSlice.Y, offZ, 1, nZ - 2 * offZ)
          brain.planes.contextX.fillRect(
            offY, nZ - brain.numSlice.Z - 1, nY - 2 * offY, 1)
        }

        // fill the slice with background color
        brain.context.fillStyle = brain.colorBackground
        brain.context.fillRect(0, 0, brain.widthCanvas.X, brain.canvas.height)

        // Draw on the main canvas
        brain.context.drawImage(brain.planes.canvasX, 0, 0, nY, nZ, 0,
          (brain.heightCanvas.max - brain.heightCanvas.X) / 2,
          brain.widthCanvas.X, brain.heightCanvas.X)

        // Draw the title
        if (brain.title) {
          brain.context.fillStyle = brain.colorFont
          brain.context.fillText(brain.title,
            Math.round(brain.widthCanvas.X / 10),
            Math.round((brain.heightCanvas.max * brain.heightColorBar) +
                          brain.sizeFontPixels / 4))
        }

        // Draw the value at current voxel
        if (brain.flagValue) {
          const value = isNaN(brain.voxelValue) ? 'no value' : 'value = ' + displayFloat(brain.voxelValue, brain.nbDecimals)
          brain.context.fillStyle = brain.colorFont
          brain.context.fillText(value, Math.round(brain.widthCanvas.X / 10),
            Math.round((brain.heightCanvas.max * brain.heightColorBar * 2) +
            (3 / 4) * (brain.sizeFontPixels)))
        }

        // Add X coordinates on the slice
        if (brain.flagCoordinates) {
          coord = 'x = ' + Math.round(brain.coordinatesSlice.X)
          coordWidth = brain.context.measureText(coord).width
          brain.context.fillStyle = brain.colorFont
          brain.context.fillText(coord, brain.widthCanvas.X / 2 - coordWidth /
            2, Math.round(brain.canvas.height - (brain.sizeFontPixels / 2)))
        }
        break

      case 'Y':
        // Draw a single coronal slice at native resolution
        brain.context.fillStyle = brain.colorBackground
        brain.context.fillRect(brain.widthCanvas.X, 0, brain.widthCanvas.Y,
          brain.canvas.height)
        for (xx = 0; xx < brain.nbSlice.X; xx++) {
          let posW = (xx % brain.nbCol)
          let posH = (xx - posW) / brain.nbCol
          brain.planes.contextY.drawImage(brain.planes.canvasMaster,
            posW * brain.nbSlice.Y + brain.numSlice.Y, posH * brain.nbSlice.Z,
            1, brain.nbSlice.Z, xx, 0, 1, brain.nbSlice.Z)
        }

        // Add a crosshair
        if (brain.crosshair) {
          brain.planes.contextY.fillStyle = brain.colorCrosshair
          brain.planes.contextY.fillRect(brain.numSlice.X, offZ, 1,
            brain.nbSlice.Z - 2 * offZ)
          brain.planes.contextY.fillRect(offX, brain.nbSlice.Z -
            brain.numSlice.Z - 1, brain.nbSlice.X - 2 * offX, 1)
        }

        // Redraw the coronal slice in the canvas at screen resolution
        brain.context.drawImage(brain.planes.canvasY,
          0, 0, brain.nbSlice.X, brain.nbSlice.Z, brain.widthCanvas.X,
          (brain.heightCanvas.max - brain.heightCanvas.Y) / 2,
          brain.widthCanvas.Y, brain.heightCanvas.Y)

        // Add colorbar
        if ((brain.colorMap) && (!brain.colorMap.hide)) {
          // draw the colorMap on the coronal slice at screen resolution
          brain.context.drawImage(brain.colorMap.img,
            0, 0, brain.colorMap.img.width, 1, Math.round(brain.widthCanvas.X +
            brain.widthCanvas.Y * 0.2), Math.round(brain.heightCanvas.max *
            brain.heightColorBar / 2), Math.round(brain.widthCanvas.Y * 0.6),
            Math.round(brain.heightCanvas.max * brain.heightColorBar))
          brain.context.fillStyle = brain.colorFont
          const labelMin = displayFloat(brain.colorMap.min, brain.nbDecimals)
          const labelMax = displayFloat(brain.colorMap.max, brain.nbDecimals)
          brain.context.fillText(labelMin, brain.widthCanvas.X +
            (brain.widthCanvas.Y * 0.2) -
            brain.context.measureText(labelMin).width / 2,
          Math.round((brain.heightCanvas.max * brain.heightColorBar * 2) +
            (3 / 4) * (brain.sizeFontPixels)))
          brain.context.fillText(labelMax, brain.widthCanvas.X +
            (brain.widthCanvas.Y * 0.8) -
            brain.context.measureText(labelMax).width / 2,
          Math.round((brain.heightCanvas.max * brain.heightColorBar * 2) +
            (3 / 4) * (brain.sizeFontPixels)))
        }

        // Add Y coordinates on the slice
        if (brain.flagCoordinates) {
          brain.context.font = brain.sizeFontPixels + 'px Arial'
          brain.context.fillStyle = brain.colorFont
          coord = 'y = ' + Math.round(brain.coordinatesSlice.Y)
          coordWidth = brain.context.measureText(coord).width
          brain.context.fillText(coord, brain.widthCanvas.X +
          (brain.widthCanvas.Y / 2) - coordWidth / 2,
          Math.round(brain.canvas.height - (brain.sizeFontPixels / 2)))
        }
        break

      case 'Z':
        // Draw a single axial slice at native resolution
        brain.context.fillStyle = brain.colorBackground
        brain.context.fillRect(brain.widthCanvas.X + brain.widthCanvas.Y, 0,
          brain.widthCanvas.Z, brain.canvas.height)
        for (xx = 0; xx < brain.nbSlice.X; xx++) {
          let posW = (xx % brain.nbCol)
          let posH = (xx - posW) / brain.nbCol
          brain.planes.contextZ.drawImage(brain.planes.canvasMaster,
            posW * brain.nbSlice.Y, posH * brain.nbSlice.Z + brain.nbSlice.Z -
            brain.numSlice.Z - 1, brain.nbSlice.Y, 1, 0, xx, brain.nbSlice.Y, 1)
        }

        // Add a crosshair
        if (brain.crosshair) {
          brain.planes.contextZ.fillStyle = brain.colorCrosshair
          brain.planes.contextZ.fillRect(offY, brain.numSlice.X,
            brain.nbSlice.Y - 2 * offY, 1)
          brain.planes.contextZ.fillRect(brain.numSlice.Y, offX, 1,
            brain.nbSlice.X - 2 * offX)
        }

        // Redraw the axial slice in the canvas at screen resolution
        brain.context.drawImage(brain.planes.canvasZ,
          0, 0, brain.nbSlice.X, brain.nbSlice.Y, brain.widthCanvas.X +
          brain.widthCanvas.Y, (brain.heightCanvas.max -
          brain.heightCanvas.Z) / 2, brain.widthCanvas.Z, brain.heightCanvas.Z)

        // Add Z coordinates on the slice
        if (brain.flagCoordinates) {
          coord = 'z = ' + Math.round(brain.coordinatesSlice.Z)
          coordWidth = brain.context.measureText(coord).width
          brain.context.fillStyle = brain.colorFont
          brain.context.fillText(coord, brain.widthCanvas.X +
          brain.widthCanvas.Y + (brain.widthCanvas.Z / 2) - coordWidth / 2,
          Math.round(brain.canvas.height - (brain.sizeFontPixels / 2)))
        }
    }
  }

  // In case of click, update brain slices
  brain.clickBrain = function (e) {
    let rect = brain.canvas.getBoundingClientRect()
    let xx = e.clientX - rect.left
    let yy = e.clientY - rect.top
    let sy, sz

    if (xx < brain.widthCanvas.X) {
      sy = Math.round((brain.nbSlice.Y - 1) * (xx / brain.widthCanvas.X))
      sz = Math.round((brain.nbSlice.Z - 1) * (((brain.heightCanvas.max +
        brain.heightCanvas.X) / 2) - yy) / brain.heightCanvas.X)
      brain.numSlice.Y = Math.max(Math.min(sy, brain.nbSlice.Y - 1), 0)
      brain.numSlice.Z = Math.max(Math.min(sz, brain.nbSlice.Z - 1), 0)
    } else if (xx < (brain.widthCanvas.X + brain.widthCanvas.Y)) {
      xx = xx - brain.widthCanvas.X
      let sx = Math.round((brain.nbSlice.X - 1) * (xx / brain.widthCanvas.Y))
      let sz = Math.round((brain.nbSlice.Z - 1) * (((brain.heightCanvas.max +
        brain.heightCanvas.X) / 2) - yy) / brain.heightCanvas.X)
      brain.numSlice.X = Math.max(Math.min(sx, brain.nbSlice.X - 1), 0)
      brain.numSlice.Z = Math.max(Math.min(sz, brain.nbSlice.Z - 1), 0)
    } else {
      xx = xx - brain.widthCanvas.X - brain.widthCanvas.Y
      let sx = Math.round((brain.nbSlice.X - 1) * (xx / brain.widthCanvas.Z))
      let sy = Math.round((brain.nbSlice.Y - 1) * (((brain.heightCanvas.max +
        brain.heightCanvas.Z) / 2) - yy) / brain.heightCanvas.Z)
      brain.numSlice.X = Math.max(Math.min(sx, brain.nbSlice.X - 1), 0)
      brain.numSlice.Y = Math.max(Math.min(sy, brain.nbSlice.Y - 1), 0)
    };
    // Update value
    updateValue()

    // Update coordinates
    updateCoordinates()

    // Redraw slices
    brain.drawAll()
    if (brain.onclick) {
      brain.onclick(e)
    };
  }

  brain.drawAll = function () {
    brain.draw(brain.numSlice.X, 'X')
    brain.draw(brain.numSlice.Y, 'Y')
    brain.draw(brain.numSlice.Z, 'Z')
  }

  // Attach a listener for clicks
  brain.canvas.addEventListener('click', brain.clickBrain, false)

  // Attach a listener on mouse down
  brain.canvas.addEventListener('mousedown', function () {
    brain.canvas.addEventListener('mousemove', brain.clickBrain, false)
  }, false)

  // Detach the listener on mouse up
  brain.canvas.addEventListener('mouseup', function () {
    brain.canvas.removeEventListener('mousemove', brain.clickBrain, false)
  }, false)

  // Draw all slices when background/overlay are loaded
  brain.sprite.addEventListener('load', function () {
    brain.init()
    brain.drawAll()
  })
  if (brain.overlay) {
    brain.overlay.sprite.addEventListener('load', function () {
      brain.init()
      brain.drawAll()
    })
  }

  // Init the viewer
  brain.init()

  // Draw all slices
  brain.drawAll()

  return brain
}
