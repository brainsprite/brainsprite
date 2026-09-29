{
  canvas: "{{canvas}}",
  sprite: "{{sprite}}",
  nbSlice: {
    X: {{X}},
    Y: {{Y}},
    Z: {{Z}}
  },
  overlays: [
    {{for i, ov in enumerate(overlays_js)}}
    {
      sprite: "{{sprite_overlay}}_{{i}}",
      nbSlice: {
        X: {{ov['X']}},
        Y: {{ov['Y']}},
        Z: {{ov['Z']}}
      },
      opacity: {{ov['opacity']}}
    },
    {{endfor}}
  ],
  colorBackground: "{{colorBackground}}",
  colorFont: "{{colorFont}}",
  crosshair: {{crosshair}},
  affine: {{affine}},
  flagCoordinates: {{flagCoordinates}},
  title: "{{title}}",
  flagValue: {{flagValue}},
  numSlice: {
    X: {{X_num}},
    Y: {{Y_num}},
    Z: {{Z_num}}
  },
  colorMap: {
    img: "{{img_colorMap}}",
    min: {{min}},
    max: {{max}},
    hide: {{colorbar}}
  },
  radiological: {{radiological}},
  showLR: {{showLR}},
}
