
var _ = require('lodash');
var path = require('path');

module.exports = {
  setup: function (options) {
    if (options.filename) {
      process.title = path.basename(options.filename);
    }
  }
};