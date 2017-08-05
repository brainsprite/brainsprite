var widgets = require('@jupyter-widgets/base');
var BrainSprite = require('./brainsprite');

export class BrainSpriteModel extends widgets.DOMWidgetModel {
  get defaults() {
    return {
      _model_name : 'BrainSpriteModel',
      _view_name : 'BrainSpriteView',
      _model_module : 'brainsprite',
      _view_module : 'brainsprite',
      _model_module_version : '0.1.0',
      _view_module_version : '0.1.0',
    };
  }
}

export class BrainSpriteView extends widgets.DOMWidgetView {

  initialize(parameters) {
    this.canvas = $('<canvas moz-opaque height="10" />');
    $(this.el).append(this.canvas);
  }

  render() {
    var image = this.model.get('image');
    this.sprite = document.createElement('img');
    this.sprite.src = 'data:image/png;base64,' + image.data;
    this.sprite.onload = function() {
      this.brain = BrainSprite.default({
        canvas: this.canvas[0],
        sprite: this.sprite,
        fastDraw: false,
        flagCoordinates: true,
        nbSlice: { 'Y': image.nbSliceY, 'Z': image.nbSliceZ },
      });
      $(window).resize(function(){
        this.canvas.width('100%');
        this.brain.resize();
        this.brain.drawAll();
      }.bind(this));
    }.bind(this);

    this.canvas.width('100%');
    // this.model.on('change:value', this.value_changed, this)
  }
  
  // value_changed() {
  // }
}