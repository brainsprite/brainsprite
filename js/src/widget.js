__webpack_public_path__ = document.querySelector('body').getAttribute('data-base-url') + 'nbextensions/brainsprite/';

module.exports = require('./brainsprite-widget.js');
module.exports['version'] = require('../package.json').version;
