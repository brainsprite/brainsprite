from ._version import version_info, __version__
from .brainsprite_widget import BrainSprite

def _jupyter_nbextension_paths():
    return [{
        'section': 'notebook',
        'src': 'static',
        'dest': 'brainsprite',
        'require': 'brainsprite/extension'
    }]
