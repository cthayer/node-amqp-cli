
var _ = require('lodash');
var cmdArgs = require('command-line-args');
var util = require('util');

function Options(options, usageOptions) {
  if (_.isPlainObject(options) && !_.isArray(options)) {
    usageOptions = options;
    options = [];
  }

  if (!_.isArray(options)) {
    options = [];
  }

  if (!_.isPlainObject(usageOptions)) {
    usageOptions = {};
  }

  var defaultOptions = [
    {name: 'help', alias: 'h', type: Boolean, description: 'show this usage message', defaultValue: false},
    {name: 'version', alias: 'v', type: Boolean, description: 'show version', defaultValue: false},
    // server connection group
    {name: 'host', alias: 'H', type: String, description: 'hostname or ip address', group: 'server', defaultValue: '127.0.0.1'},
    {name: 'port', alias: 'p', type: Number, description: 'port number', group: 'server', defaultValue: 5672},
    {name: 'user', alias: 'u', type: String, description: 'username', group: 'server', defaultValue: 'guest'},
    {name: 'password', alias: 'P', type: String, description: 'password (leave blank to be prompted for the password)', group: 'server', defaultValue: ''},
    {name: 'vhost', alias: 'V', type: String, description: 'vhost', group: "server", defaultValue: '/'},
    {name: 'ssl', type: Boolean, description: 'use SSL/TLS connection', group: "ssl", defaultValue: false},
    {name: 'ca-cert-file', type: String, description: 'ca certificate file', group: "ssl", defaultValue: ''},
    {name: 'cert-file', type: String, description: 'certificate file', group: "ssl", defaultValue: ''},
    {name: 'key-file', type: String, description: 'private key file', group: "ssl", defaultValue: ''},
    {name: 'no-verify-peer', type: Boolean, description: 'don\'t verify the peer certificate', group: "ssl", defaultValue: false},
    {name: 'no-fail-if-no-peer-cert', type: Boolean, description: 'don\'t fail if the peer does not provide a cert', group: "ssl", defaultValue: false}
  ];

  // configure the default options
  this.cli = cmdArgs(_.flattenDeep(defaultOptions.concat(options)));
  this.usageOptions = usageOptions;
  this.options = null;
  this.parseStack = [this.pwdPrompt.bind(this)];
}

module.exports = Options;

Options.prototype.parse = function (callback) {
  if (!_.isFunction(callback)) {
    callback = _.noop;
  }

  this.options = this.cli.parse();

  if (!_.isUndefined(this.options._all)) {
    delete this.options._all;
  }

  if (this.options._none.help) {
    this.showUsage();
  }

  if (this.options._none.version) {
    this.showVersion();
  }

  this.runParseStack(callback);
};

Options.prototype.showUsage = function() {
  var pack = require('../package.json');

  var usageOptions = {
    title: process.title,
    description: pack.description,
    groups: {
      _none: '',
      server: {
        title: 'server connection options'
      },
      ssl: {
        title: 'client SSL/TLS options'
      }
    }
  };

  console.log(this.cli.getUsage(_.merge(usageOptions, this.usageOptions)));

  process.exit(0);
};

Options.prototype.showVersion = function () {
  var pack = require('../package.json');
  var amqpPack = require('@sazze/amqp/package');

  console.log('  ' + process.title + ' version: ' + pack.version);
  console.log('  ' + amqpPack.name + ' version: ' + amqpPack.version);
  console.log('  node.js version: ' + process.version);

  process.exit(0);
};

Options.prototype.getAmqpOptions = function () {
  var options = {
    host: this.options.server.host,
    port: this.options.server.port,
    user: this.options.server.user,
    password: this.options.server.password,
    vhost: this.options.server.vhost
  };

  if (this.options.ssl.ssl) {
    options.ssl = {
      enable: true
    };
  }

  if (this.options.ssl['ca-cert-file']) {
    options.ssl.cacertfile = this.options.ssl['ca-cert-file'];
  }

  if (this.options.ssl['cert-file']) {
    options.ssl.certfile = this.options.ssl['cert-file'];
  }

  if (this.options.ssl['key-file']) {
    options.ssl.keyfile = this.options.ssl['key-file'];
  }

  if (this.options.ssl['no-verify-peer']) {
    options.ssl.verify = 'verify_none';
  }

  if (this.options.ssl['no-fail-if-no-peer-cert']) {
    options.ssl.fail_if_no_peer_cert = false;
  }

  return options;
};

Options.prototype.pwdPrompt = function (next) {
  if (this.options.server.password) {
    next();
    return;
  }

  var prompt = require('prompt');

  prompt.colors = false;
  prompt.message = '';
  prompt.delimiter = '';

  prompt.start();

  prompt.get({properties: {password: {hidden: true, description: 'password:'}}}, function (err, result) {
    if (err) {
      next(err);
      return;
    }

    this.options.server.password = result.password;

    next();
  }.bind(this));
};

Options.prototype.use = function (fn) {
  if (!_.isFunction(fn)) {
    console.warn(fn + ' is not a function');
    return;
  }

  this.parseStack.push(fn);
};

Options.prototype.runParseStack = function (callback) {
  if (this.parseStack.length < 1) {
    // no more parse stack to process
    process.nextTick(callback);
    return;
  }

  var fn = this.parseStack.shift();

  process.nextTick(function () {
    fn(function (err) {
      if (err) {
        console.error(err.message || err);
        process.exit(2);
      }

      this.runParseStack(callback);
    }.bind(this));
  }.bind(this));
};