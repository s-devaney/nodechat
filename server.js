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

var users = {};
var userIDPool = [];
var EOAPointer = 0;

io.sockets.on("connection", function(socket) {
	//console.log("connected");

	socket.on("sendchat", function(data) {
		io.sockets.emit("updatechat", users[socket.userPointer].username, data);
	});
	
	socket.on("adduser", function(username) {
		var timestamp = Math.round(new Date().getTime() / 1000);

		if(userIDPool.length > 0) {
			socket.userPointer = userIDPool.pop();
		} else {
			socket.userPointer = EOAPointer;
		}
		
		//console.log(socket.userPointer);

		users[socket.userPointer] = new User(timestamp)
		users[socket.userPointer].ID = EOAPointer;
		users[socket.userPointer].username = username;
		users[socket.userPointer].timestamp = timestamp
		users[socket.userPointer].color = "#000000";

		if(socket.userPointer = EOAPointer) {
			EOAPointer++;
		}

		socket.emit("updatechat", "SERVER", users[socket.userPointer].username+" has connected");
		io.sockets.emit("updateusers", users);
		//console.log("added user: "+users[socket.userPointer].username);
	});
	
	socket.on("disconnect", function() {
		if(typeof socket.userPointer == "undefined") {
			console.log("connection error, exiting...");
			return false;
		}
		//console.log("disconnecting..."+socket.userPointer);
		var pointer = socket.userPointer;
		//console.log("pointer: "+pointer);
		socket.broadcast.emit("updatechat", "SERVER", users[pointer].username+" has disconnected");
		delete users[pointer];
		userIDPool.push(pointer);
		//console.log("users =");
		//console.log(users);
		//console.log("JSON: "+JSON.stringify(users));
		io.sockets.emit("updateusers", users);
	});
});

function User(data) {
	var ID;
	var username;
	var timestamp;
	var color;
}