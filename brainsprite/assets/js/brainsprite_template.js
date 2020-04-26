// bransprise viewer
var brain = brainsprite(
  canvas: "{{canvas}}",
  sprite: "{{sprite}}",
  nbSlice: {
    X: {{X}},
    Y: {{Y}},
    Z: {{Y}}
  },
  overlay: {
    sprite: "{{sprite_overlay}}",
    nbSlice: {
      X: {{X_overlay}},
      Y: {{Y_overlay}},
      Z: {{Z_overlay}}
    },
    opacity: {{opacity}}
  },
  colorBackground: {{colorBackground}},
  colorFont: {{colorFont}},
  crosshair: {{draw_cross}},
  affine: {{affine}},
  flagCoordinates: {{annotate}},
  title: {{title}},
  flagValue: {{value}},
  numSlice: {
    X: {{X_num}},
    Y: {{Y_num}},
    Z':{{Z_num}}
  },
  colorMap: {
    img: {{label_cm}},
    min: {{min}},
    max: {{max}}
  }
);
