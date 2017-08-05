"""
BrainSprite widget
"""
import ipywidgets as widgets
from traitlets import Unicode, Bytes, Dict, Int
# import numpy as np
# import nibabel as ni
import base64

@widgets.register
class BrainSprite(widgets.DOMWidget):
    """
    BrainSprite widget
    """

    _view_name = Unicode('BrainSpriteView').tag(sync=True)
    _model_name = Unicode('BrainSpriteModel').tag(sync=True)
    _view_module = Unicode('brainsprite').tag(sync=True)
    _model_module = Unicode('brainsprite').tag(sync=True)
    _view_module_version = Unicode('^0.1.0').tag(sync=True)
    _model_module_version = Unicode('^0.1.0').tag(sync=True)
    image = Dict(traits={
        "data": Unicode(),
        "nbSliceY": Int(),
        "nbSliceZ": Int(),
    }).tag(sync=True)

    def __init__(self, underlay, overlay=None, **kwargs):
        super(BrainSprite, self).__init__(**kwargs)
        with open("./sprite.jpg", "rb") as img:
            self.image = {
                "data": base64.b64encode(img.read()),
                "nbSliceY": 233,
                "nbSliceZ": 189,
            }

    # def _load_volume(self, source_file):
    #     img = ni.load(source_file)
    #     vol = img.get_data()

    #     if isinstance(img, ni.nifti1.Nifti1Image):
    #         # TODO check if it is right, and if it is possible
    #         #  to infer the swap based on headers
    #         vol = np.swapaxes(vol, 0, 2)

    #     return img, vol

    def set_overlay(self, overlay):
        pass

    def set_underlay(self, underlay):
        pass