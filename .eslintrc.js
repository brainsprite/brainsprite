module.exports = {
  'env': {
    'browser': true,
    'es6': true
  },
  'extends': 'standard',
  'globals': {
    'Atomics': 'readonly',
    'SharedArrayBuffer': 'readonly',
    'brainsprite': 'readonly'
  },
  'parserOptions': {
    'ecmaVersion': 2018
  },
  'rules': {
    'no-unused-vars': ['warn', { 'vars': 'local', 'args': 'after-used',
      'ignoreRestSiblings': false }]
  }
}
