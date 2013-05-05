var express = require("express");
var app = express();
var http = require("http");
var server = http.createServer(app);
var io = require("socket.io").listen(server);

server.listen(8080);

app.get("/", function(req, res) {
	res.sendfile(__dirname + "/index.html");
});

app.use("/css", express.static(__dirname+"/css"));
app.use("/img", express.static(__dirname+"/img"));

var users = {};
var EOAPointer = 0;

io.sockets.on("connection", function(socket) {
	io.sockets.emit("updateusers", users);

	socket.on("sendchat", function(message) {
		if(typeof socket.userPointer == "undefined") {
			socket.emit("updatechat", "SERVER", {"message": "you must login to send messages", "color": "#000000"});
			return false;
		}
		var data = {};
		data.color = users[socket.userPointer].color;
		data.message = message
		io.sockets.emit("updatechat", users[socket.userPointer].username, data);
	});
	
	socket.on("adduser", function(username) {
		var timestamp = Math.round(new Date().getTime() / 1000);

		socket.userPointer = EOAPointer;
		
		console.log(socket.userPointer);

		users[socket.userPointer] = new User(timestamp)
		users[socket.userPointer].ID = EOAPointer;
		users[socket.userPointer].username = username;
		users[socket.userPointer].timestamp = timestamp
		users[socket.userPointer].color = "#000000";

		EOAPointer++;

		io.sockets.emit("updatechat", "SERVER", {"message": users[socket.userPointer].username+" has connected", "color": "#000000"});
		io.sockets.emit("updateusers", users);
		console.log("added user: "+users[socket.userPointer].username);
	});
	
	socket.on("updateUser", function(data) {
		if(typeof socket.userPointer == "undefined") {
			return false;
		}
		users[socket.userPointer].color = data.color;
		if(users[socket.userPointer].username != data.username) {
			io.sockets.emit("updatechat", "SERVER", {"message": users[socket.userPointer].username+" has changed their username to "+data.username, "color": "#000000"});
		}
		users[socket.userPointer].username = data.username;
		io.sockets.emit("updateusers", users);
	});
	
	socket.on("logout", function() {
		socket.emit("updatechat", "SERVER", {"message": users[socket.userPointer].username+" has disconnected", "color": "#000000"});
		socket.disconnect();
	});
	
	socket.on("disconnect", function() {
		//if user disconnects without logging in server will crash because username is undefined. Check if username is set first
		//if username is not set nothing needs to be done so can close socket
		if(typeof socket.userPointer == "undefined") {
			console.log("connection error, exiting...");
			return false;
		}
		//console.log("disconnecting..."+socket.userPointer);
		socket.broadcast.emit("updatechat", "SERVER", {"message": users[socket.userPointer].username+" has disconnected", "color": "#000000"});
		delete users[socket.userPointer];
		io.sockets.emit("updateusers", users);
	});
});

function User(data) {
	var ID;
	var username;
	var timestamp;
	var color;
}