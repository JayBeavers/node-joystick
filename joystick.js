var fs = require('fs');
var events = require('events');
var util = require('util');

function Joystick(id) {

  var self = this;

  this.id = id;

  var buffer = new Buffer(8);
  var fd = undefined;

  events.EventEmitter.call(this);

  function parse(buffer) {

      var event =  {
        time : buffer.readUInt32LE(0),
        value: buffer.readInt16LE(4),
        number: buffer[7]
      }
      
      var type = buffer[6];
      if (type & 0x80) event.init = true;
      if (type & 0x01) event.type = 'button';
      if (type & 0x02) event.type = 'axis';

      event.id = self.id;
      
      return event;
  }

  function startRead() {
    fs.read(fd, buffer, 0, 8, null, onRead);
  };

  function onOpen(err, fdOpened) {
    if (err) return self.emit("error", err);

    fd = fdOpened;
    startRead();
  };

  function onRead(err, bytesRead) {
    if (err) return self.emit("error", err);

    var event = parse(buffer);
    self.emit(event.type, event);

    if (fd) startRead();
  };

  this.close = function (callback) {
    fs.close(fd, callback);
    fd = undefined;
  };

  fs.open("/dev/input/js" + id, "r", onOpen);
}

util.inherits(Joystick, events.EventEmitter);

module.exports = Joystick;