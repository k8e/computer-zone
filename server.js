/**
 * Server
**/

// Environment variables
require('dotenv').config();

var
    port = process.env.PORT || 3000,

    socketIO = require('socket.io'),
    express = require('express'),
    UUID = require('node-uuid'),

    http = require('http'),
    app = express(),
    server = http.createServer(app);

/* Express server set up. */

// Tell the server to listen for incoming connections
server.listen(port);
console.log('✧ Listening on port ' + port);

// Serve index.html to requests for /
app.get('/', function(req, res) {
    res.sendFile('/index.html', {
        root: __dirname
    });
});

///
/// This is ridiculous, and should be replaced with Express static files
///
app.get('/*', function(req, res, next) {

    //This is the current file they have requested
    var file = req.params[0];

    //Send the requesting client the file.
    res.sendFile(__dirname + '/' + file);

});

//  " Express and socket.io can work together to serve the socket.io client files "
//  " This way, when the client requests '/socket.io/' files, socket.io determines what the client needs. "

/* Socket.IO server set up. */

// Create a socket.io instance using our express server
var io = socketIO.listen(server);

// Socket.io will call this function when a client connects
io.sockets.on('connection', function(client) {
  
    //Generate a new UUID and attach it to their socket/connection
    client.userid = UUID();

    // Send connection feedback with id to the client
    client.emit('connection_established', {
        id: client.userid
    });

    // Announce arrival to all connected clients
    io.emit("arrival", {
        id: client.userid
    });
    console.log("✧ Pal " + client.userid + " connected.");

    /* Listen for more client events */

    // Client motion
    client.on("motion", function(info) {
        // Update all clients
        io.emit("motion", info);
    });

    // Client disconnect
    client.on('disconnect', function() {
        // Announce to all clients
        io.emit("departure", {
            id: client.userid
        });
        console.log("✧ Pal " + client.userid + " disconnected.");
    });

});