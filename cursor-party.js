/**
 * Cursor Party Client Script
**/

const container = document.body;

// From socket.io.js
const socket = io();

// Client info
var id, 
    posX = 0, 
    posY = 0;
var hasCursor = false;
var myCursor = document.createElement('div');
    myCursor.className = "cursor" + " " + "cursor-" + getType();

var cursorOffset = {
    top: 10,
    left: 10,
};

// Other clients
var pals = {};

// Override browser's onmousemove event
document.addEventListener("mousemove", function(event) {
    posX = event.clientX + cursorOffset.left;
    posY = event.clientY + cursorOffset.top;

    if (!posX || !posY)
        return;

    // If first movement, create a cursor
    if (!hasCursor) {
        container.appendChild(myCursor);
        hasCursor = true;
    }

    // Move cursor
    moveCursor(myCursor,
        posX + window.pageXOffset,
        posY + window.pageYOffset
    );

    // Send update to server
    if (id) {
      socket.emit("motion", {
          x: posX + window.pageXOffset,
          y: posY + window.pageYOffset 
      });
    }

    event.preventDefault();
}, false);

// Handle mobile touch events
document.addEventListener("touchmove", function(event) {
    var touch = event.changedTouches[0];
    posX = touch.pageX;
    posY = touch.pageY;

    if (!posX || !posY)
        return;

    // If first movement, create a cursor
    if (!hasCursor) {
        container.appendChild(myCursor);
        hasCursor = true;
    }

    // Move cursor
    moveCursor(myCursor,
        posX + window.pageXOffset,
        posY + window.pageYOffset
    );

    // Send update to server
    if (id) {
      socket.emit("motion", {
          x: posX + window.pageXOffset,
          y: posY + window.pageYOffset 
      });
    }

    event.preventDefault(); // prevent scrolling
}, {passive: false});

/* Listen for socket events */

// Initial handshake (or possibly a re-handshake in case of server reboot)
socket.on("handshake", function(callback) {
    // Pull together whatever data we can send to the server
    var clientInfo = {
        userId: id || null,
        x: posX || null,
        y: posY || null
    }
    callback(clientInfo);
});

// Successful connection
socket.on("connection_established", function(info) {
    // Retrieve user ID from server
    id = info.id;
  
    if (id) {
      // Set online count
      if (!info.allPals.length || info.allPals.length < 1)
        setOnlineCount(1);

      // Retrieve existing pals
      for (var userId in info.allPals) {
          var pal = info.allPals[userId];
          if (pal.x && pal.y) { 
              createNewCursor(userId); // Adds new cursor to "pals"
              moveCursor(pals[userId], pal.x, pal.y);
          }
      }
    }
    else {
      console.log("FYI: cursor-party has a limit on connections per IP address!");
    }

});

// Client mouse movement
socket.on("motion", function(event) {
    if (!(event.x && event.y) || !event.userId) return;
  
    // Create a cursor for newcomer
    if (!pals[event.userId] && event.userId != id)
        createNewCursor(event.userId);

    // Move cursor
    moveCursor(pals[event.userId], event.x, event.y);
});

// A client disconnects
socket.on("departure", function(event) {
    var userId = event.id;
    var delCursor = pals[userId];

    // Remove cursor
    if (delCursor) {
        delCursor.parentElement.removeChild(delCursor);
        delete pals[userId];

        setOnlineCount(Object.keys(pals).length + 1);
    }
});


/* Assisting functions */

function createNewCursor(userId) {
    var newCursor = document.createElement('div');    
    pals[userId] = newCursor;
    container.appendChild(pals[userId]);
    setOnlineCount(Object.keys(pals).length + 1);  
}

function moveCursor(icon, x, y) {
    if (icon) {
        icon.style.left = x + 'px';
        icon.style.top = y + 'px';
    }
};

function setOnlineCount(num) {
    var counter = document.getElementById("online-count");
    counter.innerHTML = num;
}