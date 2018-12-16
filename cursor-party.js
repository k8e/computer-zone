/**
 * Cursor Party Client Script
**/

// From socket.io.js
const socket = io();

// Client info
var id;
var hasCursor = false;
var myCursor = document.createElement('div');
    myCursor.className = "cursor";

// Other clients
var friends = {};

// Override browser's onmousemove event
var mouseMove = function(event) {
    event = event || window.event;

    // If first movement create a cursor
    if (id && !hasCursor && event.clientX && event.clientY) {
        document.body.appendChild(myCursor);
        document.body.style.cursor = "none";
        hasCursor = true;
    }

    // Move cursor
    moveCursor(myCursor,
        event.clientX + window.pageXOffset,
        event.clientY + window.pageYOffset
    );

    // Send update to server
    socket.emit("motion", {
        userId: id,
        x: event.clientX  + window.pageXOffset ,
        y: event.clientY + window.pageYOffset 
    });
};
document.onmousemove = mouseMove;


/* Listen for socket events */

// Successful connection
socket.on("connection_established", function(info) {
    // Retrieve user ID from server
    id = info.id;
});

// Client mouse movement
socket.on("motion", function(event) {
    if (!(event.x && event.y) || !event.userId) return;

    // Create a cursor for newcomer
    if (!friends[event.userId] && event.userId != id)
        createNewCursor(event.userId);

    // Move cursor
    moveCursor(friends[event.userId], event.x, event.y);
});

// Another client arrives
socket.on("arrival", function(arriver) {
    console.log("✧ Welcome new friend: " + arriver.id)
})

// A client disconnects
socket.on("departure", function(event) {
    var userId = event.id;
    var delCursor = friends[userId];

    // Remove cursor
    delCursor.parentElement.removeChild(delCursor);
    delete friends[userId];
});


/* Assisting functions */

function createNewCursor(userId) {
    var newCursor = document.createElement('div');
    newCursor.className = "cursor";
    friends[userId] = newCursor;
    document.body.appendChild(friends[userId]);
}

function moveCursor(icon, x, y) {
    if (icon) {
        icon.style.left = "" + x + "px";
        icon.style.top = "" + y + "px";
    }
};