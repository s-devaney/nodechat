var express = require("express");
var app = express();
var http = require("http");
var server = http.createServer(app);
var io = require("socket.io").listen(server);

server.listen(8080);

//serve index file when / is requested
app.get("/", function(req, res) {
	res.sendfile(__dirname + "/index.html");
});

//serve css+img files when requested
app.use("/css", express.static(__dirname+"/css"));
app.use("/img", express.static(__dirname+"/img"));

var users = {};
//this variable points to the end user object
//could user users.push() but users is an object not an array, see line 109/110 for reasoning
var EOAPointer = 0;

io.sockets.on("connection", function(socket) {
	//when user connects send them (and only them, we don't want to waste bandwidth) initial userdata
	socket.emit("updateusers", users);

	socket.on("sendchat", function(message) {
		//check user is logged in first
		if(typeof socket.userPointer == "undefined") {
			socket.emit("updatechat", "SERVER", {"message": "you must login to send messages", "color": "#000000"});
			return false;
		}

		var data = {};
		data.color = users[socket.userPointer].color;
		data.message = message
		//broadcast message to all clients
		io.sockets.emit("updatechat", users[socket.userPointer].username, data);
	});
	
	socket.on("adduser", function(username) {
		var timestamp = Math.round(new Date().getTime() / 1000);

		//each user needs to be able to identify their index in the user array!
		socket.userPointer = EOAPointer;

		//set user variables
		users[socket.userPointer] = new User(timestamp)
		users[socket.userPointer].ID = EOAPointer;
		users[socket.userPointer].username = username;
		users[socket.userPointer].timestamp = timestamp
		users[socket.userPointer].color = "#000000";

		EOAPointer++;

		io.sockets.emit("updatechat", "SERVER", {"message": users[socket.userPointer].username+" has connected", "color": "#000000"});
		io.sockets.emit("updateusers", users);
	});
	
	socket.on("updateUser", function(data) {
		//if nothing's changed there is no need to waste bandwidth by broadcasting updateusers
		var change = false;
		
		//check user has set a username first
		if(typeof socket.userPointer == "undefined") {
			return false;
		}
		
		//check if user has changed their colour
		if(users[socket.userPointer.color != data.color) {
			users[socket.userPointer].color = data.color;
			change = true;
		}

		//check if user has changed their username
		if(users[socket.userPointer].username != data.username) {
			users[socket.userPointer].username = data.username;
			io.sockets.emit("updatechat", "SERVER", {"message": users[socket.userPointer].username+" has changed their username to "+data.username, "color": "#000000"});
			change = true;
		}
		
		//something's changed, send clients new userdata
		if(change === true) {
			io.sockets.emit("updateusers", users);
		}
	});
	
	//user has clicked the logout button
	socket.on("logout", function() {
		//if user tries to logout without logging in server will crash because username is undefined
		//check user is logged in first
		if(typeof socket.userPointer == "undefined") {
			return false;
		}

		socket.emit("updatechat", "SERVER", {"message": users[socket.userPointer].username+" has disconnected", "color": "#000000"});
		socket.disconnect();
	});
	
	//user has closed the browser window or lost connection
	socket.on("disconnect", function() {
		//if user disconnects without logging in server will crash because username is undefined. Check if username is set first
		//if username is not set nothing needs to be done so can close socket
		if(typeof socket.userPointer == "undefined") {
			return false;
		}

		socket.broadcast.emit("updatechat", "SERVER", {"message": users[socket.userPointer].username+" has disconnected", "color": "#000000"});
		//the reason users is an object not an array is because we need to use the delete function to remove users from memory
		//arrays don't have this functionality in JS they only null the element (so if a user disconnects their array index is null rather than empty)
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