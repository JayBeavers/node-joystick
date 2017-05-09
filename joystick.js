const fs = require('fs');
const events = require('events');
/*
 *  id is the file system index of the joystick (e.g. /dev/input/js0 has id '0')
 *
 *  deadzone is the amount of sensitivity at the center of the axis to ignore.
 *    Axis reads from -32k to +32k and empirical testing on an XBox360 controller
 *    shows that a good 'dead stick' value is 3500
 *  Note that this deadzone algorithm assumes that 'center is zero' which is not generally
 *    the case so you may want to set deadzone === 0 and instead perform some form of
 *    calibration.
 *
 *  sensitivity is the amount of change in an axis reading before an event will be emitted.
 *    Empirical testing on an XBox360 controller shows that sensitivity is around 350 to remove
 *    noise in the data
 */

module.exports = class Joystick extends events {
  constructor (id, deadzone, sensitivity) {
    super();

    const buffer = new Buffer(8);
    let fd;

    // Last reading from this axis, used for debouncing events using sensitivty setting
    let lastAxisValue = [];
    let lastAxisEmittedValue = [];

    const parse = (buffer) => {
      const event =  {
        time : buffer.readUInt32LE(0),
        value: buffer.readInt16LE(4),
        number: buffer[7]
      };

      const type = buffer[6];

      if (type & 0x80) {
        event.init = true;
      }

      if (type & 0x01) {
        event.type = 'button';
      }

      if (type & 0x02) {
        event.type = 'axis';
      }

      event.id = id;

      return event;
    };

    const startRead = () => {
      fs.read(fd, buffer, 0, 8, null, onRead);
    };

    const onOpen = (err, fdOpened) => {
      if (err) return this.emit('error', err);
      else {
        this.emit('ready');

        fd = fdOpened;
        startRead();
      }
    };

    const onRead = (err, bytesRead) => {
      if (err) return this.emit('error', err);
      const event = parse(buffer);

      let squelch = false;

      if (event.type === 'axis') {
        if (sensitivity) {
          if (lastAxisValue[event.number] && Math.abs(lastAxisValue[event.number] - event.value) < sensitivity) {
            // data squelched due to sensitivity, no self.emit
            squelch = true;
          } else {
            lastAxisValue[event.number] = event.value;
          }
        }

        if (deadzone && Math.abs(event.value) < deadzone) event.value = 0;

        if (lastAxisEmittedValue[event.number] === event.value) {
          squelch = true;
        } else {
          lastAxisEmittedValue[event.number] = event.value;
        }
      }

      if (!squelch) this.emit(event.type, event);
      if (fd) startRead();
    };

    this.close = function (callback) {
      fs.close(fd, callback);
      fd = undefined;
    };

    fs.open('/dev/input/js' + id, 'r', onOpen);
  }
};
