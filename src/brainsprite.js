function brainsprite (d) {
  function a (f, e) {
    f.imageSmoothingEnabled = e
    return f
  }
  var brain = {}
  const c = {
    nanValue: false,
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
    radiological: false,
    showLR: false
  }
  var brain = Object.assign({}, c, d)
  if (typeof brain.affine === 'boolean' && brain.affine === false) {
    brain.affine = [
      [brain.voxelSize, 0, 0, -brain.origin.X],
      [0, brain.voxelSize, 0, -brain.origin.Y],
      [0, 0, brain.voxelSize, -brain.origin.Z],
      [0, 0, 0, 1]
    ]
  }
  brain.canvas = document.getElementById(d.canvas)
  brain.context = brain.canvas.getContext('2d')
  brain.context = a(brain.context, brain.smooth)
  brain.canvasY = document.createElement('canvas')
  brain.contextY = brain.canvasY.getContext('2d')
  brain.canvasZ = document.createElement('canvas')
  brain.contextZ = brain.canvasZ.getContext('2d')
  brain.canvasRead = document.createElement('canvas')
  brain.contextRead = brain.canvasRead.getContext('2d')
  brain.canvasRead.width = 1
  brain.canvasRead.height = 1
  brain.onclick = typeof d.onclick !== 'undefined' ? d.onclick : ''
  if (brain.flagCoordinates) {
    brain.spaceFont = 0.1
  } else {
    brain.spaceFont = 0
  }
  brain.sprite = document.getElementById(d.sprite)
  brain.nbCol = brain.sprite.width / d.nbSlice.Y
  brain.nbRow = brain.sprite.height / d.nbSlice.Z
  brain.nbSlice = { X: typeof d.nbSlice.X !== 'undefined' ? d.nbSlice.X : brain.nbCol * brain.nbRow, Y: d.nbSlice.Y, Z: d.nbSlice.Z }
  brain.widthCanvas = { X: 0, Y: 0, Z: 0 }
  brain.heightCanvas = { X: 0, Y: 0, Z: 0, max: 0 }
  if (brain.numSlice == false) {
    brain.numSlice = { X: Math.floor(brain.nbSlice.X / 2), Y: Math.floor(brain.nbSlice.Y / 2), Z: Math.floor(brain.nbSlice.Z / 2) }
  }
  brain.coordinatesSlice = { X: 0, Y: 0, Z: 0 }
  brain.planes = {}
  brain.planes.canvasMaster = document.createElement('canvas')
  brain.planes.contextMaster = brain.planes.canvasMaster.getContext('2d')
  d.overlay = typeof d.overlay !== 'undefined' ? d.overlay : false
  if (d.overlay) {
    brain.overlay = {}
    brain.overlay.sprite = document.getElementById(d.overlay.sprite)
    brain.overlay.nbCol = brain.overlay.sprite.width / d.overlay.nbSlice.Y
    brain.overlay.nbRow = brain.overlay.sprite.height / d.overlay.nbSlice.Z
    brain.overlay.nbSlice = { X: typeof d.overlay.nbSlice.X !== 'undefined' ? d.overlay.nbSlice.X : brain.overlay.nbCol * brain.overlay.nbRow, Y: d.overlay.nbSlice.Y, Z: d.overlay.nbSlice.Z }
    brain.overlay.opacity = typeof d.overlay.opacity !== 'undefined' ? d.overlay.opacity : 1
  }
  d.colorMap = typeof d.colorMap !== 'undefined' ? d.colorMap : false
  if (d.colorMap) {
    brain.colorMap = {}
    brain.colorMap.img = document.getElementById(d.colorMap.img)
    brain.colorMap.min = d.colorMap.min
    brain.colorMap.max = d.colorMap.max
    d.colorMap.hide = typeof d.colorMap.hide !== 'undefined' ? d.colorMap.hide : false
    brain.colorMap.canvas = document.createElement('canvas')
    brain.colorMap.context = brain.colorMap.canvas.getContext('2d')
    brain.colorMap.canvas.width = brain.colorMap.img.width
    brain.colorMap.canvas.height = brain.colorMap.img.height
    brain.colorMap.context.drawImage(brain.colorMap.img, 0, 0, brain.colorMap.img.width, brain.colorMap.img.height, 0, 0, brain.colorMap.img.width, brain.colorMap.img.height)
  }
  brain.getValue = function (i, h) {
    if (!h) {
      return NaN
    }
    let f, l, e, j, k, g
    e = h.canvas.width
    j = NaN
    k = Infinity
    for (xx = 0; xx < e; xx++) {
      f = h.context.getImageData(xx, 0, 1, 1).data
      l = Math.pow(f[0] - i[0], 2) + Math.pow(f[1] - i[1], 2) + Math.pow(f[2] - i[2], 2)
      if (l < k) {
        j = xx
        k = l
      }
    }
    g = (j * (h.max - h.min)) / (e - 1) + h.min
    return g
  }
  brain.updateValue = function () {
    const h = {}
    let f = []
    let e = []
    if (brain.overlay && !brain.nanValue) {
      try {
        h.XW = Math.round(brain.numSlice.X % brain.nbCol)
        h.XH = Math.round((brain.numSlice.X - h.XW) / brain.nbCol)
        brain.contextRead.fillStyle = '#FFFFFF'
        brain.contextRead.fillRect(0, 0, 1, 1)
        brain.contextRead.drawImage(brain.overlay.sprite, h.XW * brain.nbSlice.Y + brain.numSlice.Y, h.XH * brain.nbSlice.Z + brain.nbSlice.Z - brain.numSlice.Z - 1, 1, 1, 0, 0, 1, 1)
        rgb = brain.contextRead.getImageData(0, 0, 1, 1).data
        f = rgb[0] == 255 && rgb[1] == 255 && rgb[2] == 255
        brain.contextRead.fillStyle = '#000000'
        brain.contextRead.fillRect(0, 0, 1, 1)
        brain.contextRead.drawImage(brain.overlay.sprite, h.XW * brain.nbSlice.Y + brain.numSlice.Y, h.XH * brain.nbSlice.Z + brain.nbSlice.Z - brain.numSlice.Z - 1, 1, 1, 0, 0, 1, 1)
        rgb = brain.contextRead.getImageData(0, 0, 1, 1).data
        e = rgb[0] == 0 && rgb[1] == 0 && rgb[2] == 0
        if (f && e) {
          brain.voxelValue = NaN
        } else {
          brain.voxelValue = brain.getValue(rgb, brain.colorMap)
        }
      } catch (g) {
        console.warn(g.message)
        rgb = 0
        brain.nanValue = true
        brain.voxelValue = NaN
      }
    } else {
      brain.voxelValue = NaN
    }
  }
  brain.multiply = function (p, o) {
    const l = p.length
    const h = p[0].length
    const k = o.length
    const f = o[0].length
    const g = new Array(l)
    for (let e = 0; e < l; ++e) {
      g[e] = new Array(f)
      for (let n = 0; n < f; ++n) {
        g[e][n] = 0
        for (let j = 0; j < h; ++j) {
          g[e][n] += p[e][j] * o[j][n]
        }
      }
    }
    return g
  }
  brain.updateCoordinates = function () {
    coordVoxel = brain.multiply(brain.affine, [[brain.numSlice.X + 1], [brain.numSlice.Y + 1], [brain.numSlice.Z + 1], [1]])
    brain.coordinatesSlice.X = coordVoxel[0]
    brain.coordinatesSlice.Y = coordVoxel[1]
    brain.coordinatesSlice.Z = coordVoxel[2]
  }
  brain.init = function () {
    brain.widthCanvas.X = Math.floor(brain.canvas.parentElement.clientWidth * (brain.nbSlice.Y / (2 * brain.nbSlice.X + brain.nbSlice.Y)))
    brain.widthCanvas.Y = Math.floor(brain.canvas.parentElement.clientWidth * (brain.nbSlice.X / (2 * brain.nbSlice.X + brain.nbSlice.Y)))
    brain.widthCanvas.Z = Math.floor(brain.canvas.parentElement.clientWidth * (brain.nbSlice.X / (2 * brain.nbSlice.X + brain.nbSlice.Y)))
    brain.widthCanvas.max = Math.max(brain.widthCanvas.X, brain.widthCanvas.Y, brain.widthCanvas.Z)
    brain.heightCanvas.X = Math.floor((brain.widthCanvas.X * brain.nbSlice.Z) / brain.nbSlice.Y)
    brain.heightCanvas.Y = Math.floor((brain.widthCanvas.Y * brain.nbSlice.Z) / brain.nbSlice.X)
    brain.heightCanvas.Z = Math.floor((brain.widthCanvas.Z * brain.nbSlice.Y) / brain.nbSlice.X)
    brain.heightCanvas.max = Math.max(brain.heightCanvas.X, brain.heightCanvas.Y, brain.heightCanvas.Z)
    if (brain.canvas.width != brain.widthCanvas.X + brain.widthCanvas.Y + brain.widthCanvas.Z) {
      brain.canvas.width = brain.widthCanvas.X + brain.widthCanvas.Y + brain.widthCanvas.Z
      brain.canvas.height = Math.round((1 + brain.spaceFont) * brain.heightCanvas.max)
      brain.context = a(brain.context, brain.smooth)
    }
    brain.sizeFontPixels = Math.round(brain.sizeFont * brain.heightCanvas.max)
    brain.context.font = brain.sizeFontPixels + 'px Arial'
    brain.planes.canvasMaster.width = brain.sprite.width
    brain.planes.canvasMaster.height = brain.sprite.height
    brain.planes.contextMaster.globalAlpha = 1
    brain.planes.contextMaster.drawImage(brain.sprite, 0, 0, brain.sprite.width, brain.sprite.height, 0, 0, brain.sprite.width, brain.sprite.height)
    if (brain.overlay) {
      brain.planes.contextMaster.globalAlpha = brain.overlay.opacity
      brain.planes.contextMaster.drawImage(brain.overlay.sprite, 0, 0, brain.overlay.sprite.width, brain.overlay.sprite.height, 0, 0, brain.sprite.width, brain.sprite.height)
    }
    brain.planes.canvasX = document.createElement('canvas')
    brain.planes.contextX = brain.planes.canvasX.getContext('2d')
    brain.planes.canvasX.width = brain.nbSlice.Y
    brain.planes.canvasX.height = brain.nbSlice.Z
    brain.planes.canvasY = document.createElement('canvas')
    brain.planes.contextY = brain.planes.canvasY.getContext('2d')
    brain.planes.canvasY.width = brain.nbSlice.X
    brain.planes.canvasY.height = brain.nbSlice.Z
    brain.planes.canvasZ = document.createElement('canvas')
    brain.planes.contextZ = brain.planes.canvasZ.getContext('2d')
    brain.planes.canvasZ.width = brain.nbSlice.X
    brain.planes.canvasZ.height = brain.nbSlice.Y
    brain.planes.contextZ.rotate(-Math.PI / 2)
    brain.planes.contextZ.translate(-brain.nbSlice.Y, 0)
    brain.updateValue()
    brain.updateCoordinates()
    brain.numSlice.X = Math.round(brain.numSlice.X)
    brain.numSlice.Y = Math.round(brain.numSlice.Y)
    brain.numSlice.Z = Math.round(brain.numSlice.Z)
  }
  brain.draw = function (h, f) {
    const j = {}
    let i
    let e
    const g = { X: '', Y: '', Z: '' }
    g.X = Math.ceil(((1 - brain.sizeCrosshair) * brain.nbSlice.X) / 2)
    g.Y = Math.ceil(((1 - brain.sizeCrosshair) * brain.nbSlice.Y) / 2)
    g.Z = Math.ceil(((1 - brain.sizeCrosshair) * brain.nbSlice.Z) / 2)
    switch (f) {
      case 'X':
        j.XW = brain.numSlice.X % brain.nbCol
        j.XH = (brain.numSlice.X - j.XW) / brain.nbCol
        brain.planes.contextX.drawImage(brain.planes.canvasMaster, j.XW * brain.nbSlice.Y, j.XH * brain.nbSlice.Z, brain.nbSlice.Y, brain.nbSlice.Z, 0, 0, brain.nbSlice.Y, brain.nbSlice.Z)
        if (brain.crosshair) {
          brain.planes.contextX.fillStyle = brain.colorCrosshair
          brain.planes.contextX.fillRect(brain.numSlice.Y, g.Z, 1, brain.nbSlice.Z - 2 * g.Z)
          brain.planes.contextX.fillRect(g.Y, brain.nbSlice.Z - brain.numSlice.Z - 1, brain.nbSlice.Y - 2 * g.Y, 1)
        }
        brain.context.fillStyle = brain.colorBackground
        brain.context.fillRect(0, 0, brain.widthCanvas.X, brain.canvas.height)
        brain.context.drawImage(brain.planes.canvasX, 0, 0, brain.nbSlice.Y, brain.nbSlice.Z, 0, (brain.heightCanvas.max - brain.heightCanvas.X) / 2, brain.widthCanvas.X, brain.heightCanvas.X)
        if (brain.title) {
          brain.context.fillStyle = brain.colorFont
          brain.context.fillText(brain.title, Math.round(brain.widthCanvas.X / 10), Math.round(brain.heightCanvas.max * brain.heightColorBar + (1 / 4) * brain.sizeFontPixels))
        }
        if (brain.flagValue) {
          value = 'value = ' + Number.parseFloat(brain.voxelValue).toPrecision(brain.nbDecimals).replace(/0+$/, '')
          valueWidth = brain.context.measureText(value).width
          brain.context.fillStyle = brain.colorFont
          brain.context.fillText(value, Math.round(brain.widthCanvas.X / 10), Math.round(brain.heightCanvas.max * brain.heightColorBar * 2 + (3 / 4) * brain.sizeFontPixels))
        }
        if (brain.flagCoordinates) {
          i = 'x = ' + Math.round(brain.coordinatesSlice.X)
          e = brain.context.measureText(i).width
          brain.context.fillStyle = brain.colorFont
          brain.context.fillText(i, brain.widthCanvas.X / 2 - e / 2, Math.round(brain.canvas.height - brain.sizeFontPixels / 2))
        }
        break
      case 'Y':
        brain.context.fillStyle = brain.colorBackground
        brain.context.fillRect(brain.widthCanvas.X, 0, brain.widthCanvas.Y, brain.canvas.height)
        for (xx = 0; xx < brain.nbSlice.X; xx++) {
          posW = xx % brain.nbCol
          posH = (xx - posW) / brain.nbCol
          brain.planes.contextY.drawImage(brain.planes.canvasMaster, posW * brain.nbSlice.Y + brain.numSlice.Y, posH * brain.nbSlice.Z, 1, brain.nbSlice.Z, xx, 0, 1, brain.nbSlice.Z)
        }
        if (brain.crosshair) {
          brain.planes.contextY.fillStyle = brain.colorCrosshair
          brain.planes.contextY.fillRect(brain.numSlice.X, g.Z, 1, brain.nbSlice.Z - 2 * g.Z)
          brain.planes.contextY.fillRect(g.X, brain.nbSlice.Z - brain.numSlice.Z - 1, brain.nbSlice.X - 2 * g.X, 1)
        }
        brain.context.drawImage(brain.planes.canvasY, 0, 0, brain.nbSlice.X, brain.nbSlice.Z, brain.widthCanvas.X, (brain.heightCanvas.max - brain.heightCanvas.Y) / 2, brain.widthCanvas.Y, brain.heightCanvas.Y)
        if (brain.colorMap && !brain.colorMap.hide) {
          brain.context.drawImage(
            brain.colorMap.img,
            0,
            0,
            brain.colorMap.img.width,
            1,
            Math.round(brain.widthCanvas.X + brain.widthCanvas.Y * 0.2),
            Math.round((brain.heightCanvas.max * brain.heightColorBar) / 2),
            Math.round(brain.widthCanvas.Y * 0.6),
            Math.round(brain.heightCanvas.max * brain.heightColorBar)
          )
          brain.context.fillStyle = brain.colorFont
          label_min = Number.parseFloat(brain.colorMap.min).toPrecision(brain.nbDecimals).replace(/0+$/, '')
          label_max = Number.parseFloat(brain.colorMap.max).toPrecision(brain.nbDecimals).replace(/0+$/, '')
          brain.context.fillText(label_min, brain.widthCanvas.X + brain.widthCanvas.Y * 0.2 - brain.context.measureText(label_min).width / 2, Math.round(brain.heightCanvas.max * brain.heightColorBar * 2 + (3 / 4) * brain.sizeFontPixels))
          brain.context.fillText(label_max, brain.widthCanvas.X + brain.widthCanvas.Y * 0.8 - brain.context.measureText(label_max).width / 2, Math.round(brain.heightCanvas.max * brain.heightColorBar * 2 + (3 / 4) * brain.sizeFontPixels))
        }
        if (brain.flagCoordinates) {
          brain.context.font = brain.sizeFontPixels + 'px Arial'
          brain.context.fillStyle = brain.colorFont
          i = 'y = ' + Math.round(brain.coordinatesSlice.Y)
          e = brain.context.measureText(i).width
          brain.context.fillText(i, brain.widthCanvas.X + brain.widthCanvas.Y / 2 - e / 2, Math.round(brain.canvas.height - brain.sizeFontPixels / 2))
        }
        if (typeof brain.showLR !== 'undefined' && brain.showLR) {
          var isRadiological = brain.radiological || false
          var fontSize = Math.round(1 * brain.sizeFontPixels)
          var paddingTop = Math.round(0.22 * brain.canvas.height)
          var prevFont = brain.context.font
          var prevAlign = brain.context.textAlign
          var prevBaseline = brain.context.textBaseline

          brain.context.font = fontSize + 'px Arial'
          brain.context.textAlign = 'center'
          brain.context.textBaseline = 'middle'
          brain.context.fillStyle = brain.colorFont

          var labelLeft = isRadiological ? 'R' : 'L'
          var labelRight = isRadiological ? 'L' : 'R'

          const paddingRatio = 0.05 // 5% from each side
          const offsetX = brain.widthCanvas.Y * paddingRatio

          brain.context.fillText(labelLeft, brain.widthCanvas.X + offsetX, paddingTop)
          brain.context.fillText(labelRight, brain.widthCanvas.X + brain.widthCanvas.Y - offsetX, paddingTop)

          brain.context.font = prevFont
          brain.context.textAlign = prevAlign
          brain.context.textBaseline = prevBaseline
        }
        break

      case 'Z':
        brain.context.fillStyle = brain.colorBackground
        brain.context.fillRect(brain.widthCanvas.X + brain.widthCanvas.Y, 0, brain.widthCanvas.Z, brain.canvas.height)
        for (xx = 0; xx < brain.nbSlice.X; xx++) {
          posW = xx % brain.nbCol
          posH = (xx - posW) / brain.nbCol
          brain.planes.contextZ.drawImage(brain.planes.canvasMaster, posW * brain.nbSlice.Y, posH * brain.nbSlice.Z + brain.nbSlice.Z - brain.numSlice.Z - 1, brain.nbSlice.Y, 1, 0, xx, brain.nbSlice.Y, 1)
        }
        if (brain.crosshair) {
          brain.planes.contextZ.fillStyle = brain.colorCrosshair
          brain.planes.contextZ.fillRect(g.Y, brain.numSlice.X, brain.nbSlice.Y - 2 * g.Y, 1)
          brain.planes.contextZ.fillRect(brain.numSlice.Y, g.X, 1, brain.nbSlice.X - 2 * g.X)
        }
        brain.context.drawImage(brain.planes.canvasZ, 0, 0, brain.nbSlice.X, brain.nbSlice.Y, brain.widthCanvas.X + brain.widthCanvas.Y, (brain.heightCanvas.max - brain.heightCanvas.Z) / 2, brain.widthCanvas.Z, brain.heightCanvas.Z)
        if (brain.flagCoordinates) {
          i = 'z = ' + Math.round(brain.coordinatesSlice.Z)
          e = brain.context.measureText(i).width
          brain.context.fillStyle = brain.colorFont
          brain.context.fillText(i, brain.widthCanvas.X + brain.widthCanvas.Y + brain.widthCanvas.Z / 2 - e / 2, Math.round(brain.canvas.height - brain.sizeFontPixels / 2))
        }
        if (typeof brain.showLR !== 'undefined' && brain.showLR) {
          var isRadiological = brain.radiological || false
          var fontSize = Math.round(1 * brain.sizeFontPixels)
          var paddingTop = Math.round(0.22 * brain.canvas.height)
          var prevFont = brain.context.font
          var prevAlign = brain.context.textAlign
          var prevBaseline = brain.context.textBaseline

          brain.context.font = fontSize + 'px Arial'
          brain.context.textAlign = 'center'
          brain.context.textBaseline = 'middle'
          brain.context.fillStyle = brain.colorFont

          var labelLeft = isRadiological ? 'R' : 'L'
          var labelRight = isRadiological ? 'L' : 'R'

          const paddingRatio = 0.05 // 5% from each side
          const offsetX = brain.widthCanvas.Z * paddingRatio

          brain.context.fillText(labelLeft, brain.widthCanvas.X + brain.widthCanvas.Y + offsetX, paddingTop)
          brain.context.fillText(labelRight, brain.widthCanvas.X + brain.widthCanvas.Y + brain.widthCanvas.Z - offsetX, paddingTop)

          brain.context.font = prevFont
          brain.context.textAlign = prevAlign
          brain.context.textBaseline = prevBaseline
        }
        break
    }
  }
  brain.clickBrain = function (h) {
    const f = brain.canvas.getBoundingClientRect()
    let j = h.clientX - f.left
    const k = h.clientY - f.top
    let i, g
    if (j < brain.widthCanvas.X) {
      i = Math.round((brain.nbSlice.Y - 1) * (j / brain.widthCanvas.X))
      g = Math.round(((brain.nbSlice.Z - 1) * ((brain.heightCanvas.max + brain.heightCanvas.X) / 2 - k)) / brain.heightCanvas.X)
      brain.numSlice.Y = Math.max(Math.min(i, brain.nbSlice.Y - 1), 0)
      brain.numSlice.Z = Math.max(Math.min(g, brain.nbSlice.Z - 1), 0)
    } else {
      if (j < brain.widthCanvas.X + brain.widthCanvas.Y) {
        j = j - brain.widthCanvas.X
        sx = Math.round((brain.nbSlice.X - 1) * (j / brain.widthCanvas.Y))
        g = Math.round(((brain.nbSlice.Z - 1) * ((brain.heightCanvas.max + brain.heightCanvas.X) / 2 - k)) / brain.heightCanvas.X)
        brain.numSlice.X = Math.max(Math.min(sx, brain.nbSlice.X - 1), 0)
        brain.numSlice.Z = Math.max(Math.min(g, brain.nbSlice.Z - 1), 0)
      } else {
        j = j - brain.widthCanvas.X - brain.widthCanvas.Y
        sx = Math.round((brain.nbSlice.X - 1) * (j / brain.widthCanvas.Z))
        i = Math.round(((brain.nbSlice.Y - 1) * ((brain.heightCanvas.max + brain.heightCanvas.Z) / 2 - k)) / brain.heightCanvas.Z)
        brain.numSlice.X = Math.max(Math.min(sx, brain.nbSlice.X - 1), 0)
        brain.numSlice.Y = Math.max(Math.min(i, brain.nbSlice.Y - 1), 0)
      }
    }
    brain.updateValue()
    brain.updateCoordinates()
    brain.drawAll()
    if (brain.onclick) {
      brain.onclick(h)
    }
  }
  brain.drawAll = function () {
    brain.draw(brain.numSlice.X, 'X')
    brain.draw(brain.numSlice.Y, 'Y')
    brain.draw(brain.numSlice.Z, 'Z')
  }
  brain.canvas.addEventListener('click', brain.clickBrain, false)
  brain.canvas.addEventListener(
    'mousedown',
    function (f) {
      brain.canvas.addEventListener('mousemove', brain.clickBrain, false)
    },
    false
  )
  brain.canvas.addEventListener(
    'mouseup',
    function (f) {
      brain.canvas.removeEventListener('mousemove', brain.clickBrain, false)
    },
    false
  )
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
  brain.init()
  brain.drawAll()
  return brain
}
