var express = require('express');
var socket = require('socket.io');
var app = express();


app.use(express.static('public'));

var server = app.listen(4000, () => {
	console.log('Websockets server listening on port 4000');
})


var io = socket(server);

var screensWaitingSetup = [];
var screensOnline = [];

io.on('connection', (socket) => {

	console.log('+ id: ' + socket.id);

	socket.on('screenConnected', (udid) => {
		screensOnline.push({
			udid: udid,
			socketId: socket.id
		})
	})

	socket.on('screenSetup', (udid, callback) => {
		var pin = generatePin();
		screensWaitingSetup.push({
			udid: udid,
			pin: pin,
			socketId: socket.id
		});
		callback(pin);
	})


	socket.on('screenUdid', (pin, callback) => {
		var screen = screensWaitingSetup.find((screen) => { return screen.pin === pin });
		var udid = (screen) ? screen.udid : null;
		callback(udid);
	})

	socket.on('screenAdded', (udid) => {
		var screen = screensWaitingSetup.find((screen) => { return screen.udid === udid });
		if (screen) {
			io.to(screen.socketId).emit('updateScreen');
			var index = screensWaitingSetup.findIndex((screen) => { return screen.udid === udid});
			screensWaitingSetup.splice(index, 1);
		}
	})

	socket.on('screenUpdated', (udid) => {
		var screen = screensOnline.find((screen) => { return screen.udid === udid });
		if (screen) {
			io.to(screen.socketId).emit('updateScreen');
		}
	})

	socket.on('screenDeleted', (udid) => {
		var screen = screensOnline.find((screen) => { return screen.udid === udid });
		if (screen) {
			io.to(screen.socketId).emit('updateScreen');
		}
	})

	socket.on('playlistUpdated', (playlistId) => {
		io.emit('playlistUpdated', playlistId);
	})

	socket.on('disconnect', () => {
		console.log('- id: ' + socket.id);
		var index = screensWaitingSetup.findIndex((screen) => { return screen.socketId === socket.id });
		if (index >= 0) {
			screensWaitingSetup.splice(index, 1); 
		}

		index = screensOnline.findIndex((screen) => { return screen.socketId === socket.id });
		if (index >= 0) {
			screensOnline.splice(index, 1); 
		}
	}) 
})


function generatePin() {
  var pin = "";
  var length = 4
  var possible = "0123456789";
  //var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  
  for (var i = 0; i < length; i++)
    pin += possible.charAt(Math.floor(Math.random() * possible.length));

  return pin;
}