var joystick = new (require('joystick'))(0, 3500, 350);

joystick.on('button', console.log);
joystick.on('axis', console.log);