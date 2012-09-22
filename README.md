# node-joystick

A node module for reading joystick data based on the work of [Nodebits](http://nodebits.org/linux-joystick).

## Example

```javascript
var joystick = new (require('joystick'))(0);
joystick.on('button', console.log);
joystick.on('axis', console.log);
```