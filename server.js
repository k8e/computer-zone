/**
 * Server
**/

var
    socketIO = require('socket.io'),
    express = require('express'),
    UUID = require('node-uuid'),
    http = require('http');

// All our pals
var pals = {};

// IP counter
var ipCount = {};
var ipMax = 5;
var banList = [];

/* Express server set up. */

var port = process.env.PORT || 3000;
var app = express();
var server = http.createServer(app);

// Tell the server to listen for incoming connections
server.listen(port);
console.log('✧ Listening on port ' + port);

// Serve index.html to requests for /
app.get('/', function(req, res) {
    res.sendFile('/index.html', {
        root: __dirname
    });
});

// This is ridiculous, and should be replaced with Express static files
app.get('/*', function(req, res, next) {
    // This is the current file they have requested
    var file = req.params[0];
    // Send the requesting client the file.
    res.sendFile(__dirname + '/' + file);
});

/* Socket.IO server set up. */

// Create a socket.io instance using our express server
var io = socketIO.listen(server);

// Socket.io will call this function when a client connects
io.sockets.on('connection', function(client) {

    // Update IP Count
    var ip = client.handshake.headers["x-forwarded-for"].split(",")[0];
    if (ipCount[ip])
      ipCount[ip]++;
    else
      ipCount[ip] = 1;

    // Request client info (if IP count not exceeded)
    if (ipCount[ip] && (ipCount[ip] < ipMax) && (banList.indexOf(ip) < 0)) {
      client.emit('handshake', function(response) {
          if (!response) return;

          let clientX = 0, 
              clientY = 0;

          // Receive info from client (in case of reconnection)
          if (response.userId && ) {
              client.userId = response.userId;
              clientX = response.x;
              clientY = response.y
          }
          // Set up brand new client
          else {
              // Generate a new UUID and attach it to their socket/connection
              client.userId = UUID();

              // Send connection feedback with id and existing pals
              client.emit('connection_established', {
                  id: client.userId,
                  allPals: pals
              });

              // Announce arrival to all connected clients
              io.emit("arrival", {
                  id: client.userId
              });
          }

          // Add client to the pal list
          pals[client.userId] = {
              x: clientX,
              y: clientY
          };

          console.log("✧ Pal " + client.userId + "connected from " + ip);
      });
    }
    else {
      // Send connection feedback with id and existing pals
      client.emit('connection_established', {
          id: null,
          allPals: pals
      });
    }

    /* Listen for more client events */

    // Client motion
    client.on('motion', function(info) {      
        if (pals[client.userId] 
            && (banList.indexOf(ip) < 0)
            && (typeof info.x == 'number' && typeof info.y == 'number'))  
        {          
            // Update all clients
            io.emit("motion", {
                userId: client.userId,
                x: info.x,
                y: info.y
            });

            // Update this client in the pal list
            pals[client.userId].x = info.x;
            pals[client.userId].y = info.y;
        }
    });

    // Client disconnect
    client.on('disconnect', function() {
        // Update IP Count
        if (ipCount[ip])
          ipCount[ip]--;
        if (ipCount[ip] == 0)
          delete ipCount[ip];

        // Delete this client from list
        delete pals[client.userId];
        // Announce to all clients
        io.emit("departure", {
            id: client.userId
        });
        console.log("✧ Pal " + client.userId + " disconnected.");
    });

});