
var _ = require('lodash');
var BaseConsumer = require('@sazze/amqp').consumer;
var util = require('util');

function Consumer(options) {
  BaseConsumer.call(this, options, this.onMessage.bind(this));
}

util.inherits(Consumer, BaseConsumer);

module.exports = Consumer;

Consumer.prototype.onMessage = function (msg, channel, message) {
  // if (_.isString(msg)) {
  //   try {
  //     msg = JSON.parse(msg);
  //   } catch (e) {
  //     // invalid json string, nack and discard it
  //     channel.nack(message, false, false);
  //     return;
  //   }
  // }

  if (!_.isString(msg)) {
    msg = JSON.stringify(msg);
  }

  console.log(msg);

  // only need to ack if autoAck is disabled (noAck = false)
  if (!this.options.consumeOptions.noAck) {
    channel.ack(message);
  }

  // if (!_.isPlainObject(msg) || _.isUndefined(msg.event) || !_.isString(msg.event) || !msg.event) {
  //   // invalid message, nack and discard it
  //   channel.nack(message, false, false);
  //   return;
  // }

  // if (err) {
  //   if (dequeue) {
  //     aura.log.warn(err.stack || err.message || err);
  //     channel.nack(message, false, false);
  //   } else {
  //     aura.log.error(err.stack || err.message || err);
  //     channel.nack(message);
  //   }
  //
  //   return;
  // }
};