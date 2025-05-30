const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    transports: ['websocket'], // Force WebSocket only (disable polling)
});

const fs = require('node:fs');
const path = require('path');
// ✅ Middleware to parse JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});
// Handle POST requests at "/"
app.post('/api', (req, res) => {
    const { action, user_id, dev_id } = req.body;
    if (!action) {
        return res.status(400).json({ status: "error", message: "Action Missing!" });
    }


    if (action == "logout_an_dev") {
        if (!user_id || !dev_id) {
            return res.status(400).json({ status: "error", message: "Missing user_id or dev_id" });
        }

        const exists = soket_ids_users[user_id]?.some(device => device.dev_id === dev_id);
        if (exists) {
            // const this_account_socketIds = soket_ids_users[user_id]?.map(device => device.socket_id) || [];

            for (const device of soket_ids_users[user_id]) {
                another_user_socket = io.sockets.sockets.get(device.socket_id);
                if (another_user_socket) {
                    another_user_socket.emit("an_device_loged_out", dev_id);
                }
            }

            res.json({ status: "success", message: "Message Sent Successfully" });

        } else {
            res.status(400).json({ status: "error", message: "Dev NOT Found" });
        }


    }


    // res.json({ status: "success", message: "Data received" });
});

var user_connected = 0;
// var users_data = {};
var soket_ids_users = {};
var active_rooms = {};
// Listen for client connections
// io.on('connection', (socket) => {
//     console.log('a user connected');

//     // Listen for a message from the client
//     socket.on('chat message', (msg) => {
//         console.log('message: ' + msg);
//         io.emit('chat message', msg); // Send the message to all connected clients
//     });

// socket.on('chat message', (msg) => {
//     console.log('message: ' + msg);
//     io.emit('chat message', msg); // Send the message to all connected clients
// });

//     // Detect when the client disconnects
//     socket.on('disconnect', () => {
//         console.log('user disconnected');
//     });
// });
function consolelog(msg) {
    io.emit("console", msg);
}
io.on('connection', (socket) => {
    // console.log("New User Connected Successfuly");
    user_connected = user_connected + 1;
    // io.emit("user_connection", user_connected);
    send_user_connection(user_connected)

    socket.emit("send_me_user_id");
    socket.on("my_user_id", (new_dev_id, new_user_id, new_dev_name = "unknown") => {
        // console.log(users_data);
        // console.log(new_user_id);

        soket_ids_users[new_user_id] = soket_ids_users[new_user_id] || [];

        const new_user_data = {
            dev_id: new_dev_id,
            dev_name: new_dev_name,
            socket_id: socket.id
        };

        // Push new user data
        soket_ids_users[new_user_id].push(new_user_data);

        // user_sokets.push(new_user_data);
        // soket_ids_users[new_user_id] = user_sokets;


        soket_ids_users[new_user_id].forEach(user_data => {
            another_user_socket = io.sockets.sockets.get(user_data.socket_id);
            if (another_user_socket) {
                another_user_socket.emit("my_online_devices", soket_ids_users[new_user_id]);
            } else {
                consolelog(`Socket ID ${user_data.socket_id} not found.`);
            }
        });



    });

    // Listen for heartbeat
    socket.on("play_on_another_dev", (this_socket_id, func) => {
        const another_user_socket = io.sockets.sockets.get(this_socket_id);
        if (another_user_socket) {
            another_user_socket.emit("run_func", func);
        } else {
            console.log(`Socket with ID ${this_socket_id} not found.`);
        }
    });

    socket.on("heartbeat", (data) => {
        // console.log(`Received heartbeat from ${socket.id}:`, data);
    });

    socket.on("serv_username", (player_data, room_id) => {
        socket.broadcast.to(room_id).emit("rec_username", player_data);
    });

    // Respond to ping-check
    socket.on("ping-check", (callback) => {
        if (callback) callback(); // Acknowledge the event
    });

    socket.on('disconnect', () => {

        const socket_id = socket.id;

        // player_id = soket_ids_users[socket_id];
        const disconected_user_id = findKeyBySocketId(soket_ids_users, socket_id);
        if (disconected_user_id !== null) {
            removeSocketId(soket_ids_users, socket_id);
            if (typeof soket_ids_users[disconected_user_id] !== "undefined") {
                soket_ids_users[disconected_user_id].forEach(user_data => {
                    try {
                        another_user_socket = io.sockets.sockets.get(user_data.socket_id);
                        if (another_user_socket) {
                            another_user_socket.emit("my_online_devices", soket_ids_users[disconected_user_id]);
                        } else {
                            consolelog(`Socket ID ${user_data.socket_id} not found.`);
                        }
                    } catch (err) {
                        logToMemory(`Error processing socket ID ${user_data.socket_id}:`, err);
                    }
                });
            }

        }

        // if (typeof users_data[player_id] !== 'undefined') {
        //     delete users_data[player_id];
        // }
        // if (typeof soket_ids_users[socket_id] !== 'undefined') {
        //     delete soket_ids_users[socket_id];
        // }

        // if (typeof active_rooms[socket_id] !== 'undefined') {
        //     room_id = active_rooms[socket_id];
        //     // console.log("active rooms before is : " + JSON.stringify(active_rooms));
        //     delete active_rooms[socket_id];
        //     clients = io.sockets.adapter.rooms.get(room_id);
        //     if (typeof clients !== "undefined") {
        //         for (clientId of clients) {
        //             delete active_rooms[clientId];
        //         }
        //     }

        //     socket.leave(room_id);
        //     io.to(room_id).emit("ob_disconected", "disconnected");
        //     io.in(room_id).socketsLeave(room_id);
        //     // console.log("active rooms after is : " + JSON.stringify(active_rooms));
        // }

        user_connected = user_connected - 1;
        // io.emit("user_connection", user_connected);
        send_user_connection(user_connected)
    });
});

function send_user_connection(user_connected) {
    if (typeof soket_ids_users["1"] !== "undefined") {
        for (const device of soket_ids_users["1"]) {
            another_user_socket = io.sockets.sockets.get(device.socket_id);
            if (another_user_socket) {
                another_user_socket.emit("user_connection", user_connected);
            }
        }
    }
}
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log('listening on *:3000');
});


function findKeyBySocketId(obj, socketId) {
    for (const key in obj) {
        if (obj[key].some(entry => entry.socket_id === socketId)) {
            return key;
        }
    }
    return null; // Return null if not found
}

function removeSocketId(obj, socketId) {
    for (const key in obj) {
        // Filter out the object with the matching socket_id
        obj[key] = obj[key].filter(entry => entry.socket_id !== socketId);

        // If the array becomes empty, delete the key
        if (obj[key].length === 0) {
            delete obj[key];
        }
    }
}
