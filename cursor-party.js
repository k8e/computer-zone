/**
 * Cursor Party Client Script
**/

const container = document.body;

// From socket.io.js
const socket = io();

// Client info
var id;
var hasCursor = false;
var myCursor = document.createElement('div');
    myCursor.className = "cursor";

var cursorOffset = {
    top: 10,
    left: 10,
};

// Other clients
var pals = {};

// Override browser's onmousemove event
document.addEventListener("mousemove", function(event) {
    var pos = {
        x: event.clientX + cursorOffset.left,
        y: event.clientY + cursorOffset.top
    };

    if (!pos.x || !pos.y)
    return;

    // If first movement, create a cursor
    if (!hasCursor) {
        container.appendChild(myCursor);
        hasCursor = true;
    }

    // Move cursor
    moveCursor(myCursor,
        pos.x + window.pageXOffset,
        pos.y + window.pageYOffset
    );

    // Send update to server
    socket.emit("motion", {
        userId: id,
        x: pos.x + window.pageXOffset,
        y: pos.y + window.pageYOffset 
    });

    event.preventDefault();
}, false);

// Handle mobile touch events
document.addEventListener("touchmove", function(event) {
    var touch = event.changedTouches[0];
    var pos = {
        x: touch.pageX,
        y: touch.pageY
    };

    if (!pos.x || !pos.y)
        return;

    // If first movement, create a cursor
    if (!hasCursor) {
        container.appendChild(myCursor);
        hasCursor = true;
    }

    // Move cursor
    moveCursor(myCursor,
        pos.x + window.pageXOffset,
        pos.y + window.pageYOffset
    );

    // Send update to server
    socket.emit("motion", {
        userId: id,
        x: pos.x + window.pageXOffset,
        y: pos.y + window.pageYOffset 
    });

    event.preventDefault(); // prevent scrolling
}, {passive: false});

/* Listen for socket events */

// Successful connection
socket.on("connection_established", function(info) {
    // Retrieve user ID from server
    id = info.id;

    // Retrieve existing pals
    for (var userId in info.allPals) {
        var pal = info.allPals[userId];
        createNewCursor(userId);
        moveCursor(pals[userId], pal.x, pal.y);
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

// Another client arrives
socket.on("arrival", function(arriver) {
    console.log("✧ Welcome new friend: " + arriver.id)
})

// A client disconnects
socket.on("departure", function(event) {
    var userId = event.id;
    var delCursor = pals[userId];

    // Remove cursor
    delCursor.parentElement.removeChild(delCursor);
    delete pals[userId];
});


/* Assisting functions */

function createNewCursor(userId) {
    var newCursor = document.createElement('div');
    newCursor.className = "cursor";
    pals[userId] = newCursor;
    container.appendChild(pals[userId]);
}

function moveCursor(icon, x, y) {
    if (icon) {
        icon.style.left = x + 'px';
        icon.style.top = y + 'px';
    }
};