const template = require('./template.js')

const file = 'plot_anat.html'
template.fullTest(file,
  // clip to the iframe (offset by the default 8px body margin)
  { x: 8, y: 8, width: 800, height: 360 }
)
