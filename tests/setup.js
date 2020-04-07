const express = require('express');

module.exports = async function() {
  const app = express();
  app.use(express.static('public/'));
  global.__SERVER__ = app.listen(8080);
};
