"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const io = require('socket.io')(5000, {
    cors: {
        allowedHeaders: ["*"],
        origin: "*"
    }
});
io.on("connect", (socket) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`New Connected`);
    socket.on('load-groups', (userid) => {
        console.log("load-groups", socket.id);
        fetch(`https://chatdb.pockethost.io/api/collections/groups/records?filter=(members?~'${userid}')`, {
            method: "GET"
        })
            .then((res) => res.json())
            .then((data) => {
            console.log("groups", data);
            socket.emit('load-groups', data, "userid");
        });
    });
    socket.on('load-group-chats', (group_id) => {
        console.log("load-group-chats", group_id);
        fetch(`https://chatdb.pockethost.io/api/collections/messages/records?filter=(group='${group_id}')`, {
            method: "GET"
        })
            .then((res) => res.json())
            .then((data) => {
            socket.emit('load-group-chats', data.items);
        });
        console.log("load-group-chats sent", socket.id);
    });
    socket.on("send-message-group", (group_id, message, userId) => {
        console.log("send-message-group", message, userId, socket.id);
        socket.leaveAll();
        socket.join(group_id);
        io.to(group_id).emit("send-message-group", group_id, message, userId);
        let newMessage = "";
        fetch(`https://chatdb.pockethost.io/api/collections/messages/records`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                group: group_id,
                message: message,
                sender: userId,
            }),
        }).then((res) => {
            // Check if the response is successful
            if (!res.ok) {
                throw new Error("Network response was not ok");
            }
            // Parse the JSON response
            return res.json();
        })
            .then((data) => {
            // Handle the parsed data
            console.log(data);
        })
            .catch((err) => {
            // Handle errors
            console.error("Error:", err);
        });
        // add message to group
        fetch(`https://chatdb.pockethost.io/api/collections/groups/records/${group_id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                messages: {
                    _push: newMessage
                },
            }),
        });
    });
    socket.on("switch-group", (group_id) => {
        socket.leaveAll();
        socket.join(group_id);
        console.log("switch-group", group_id);
        console.log(socket.rooms);
        fetch(`https://chatdb.pockethost.io/api/collections/messages/records?filter=(group='${group_id}')`, {
            method: "GET"
        })
            .then((res) => res.json())
            .then((data) => {
            socket.emit('load-group-chats', data.items);
        });
        console.log("load-group-chats sent", socket.id);
    });
    socket.on("disconnect", () => {
        console.log("Socket Disconnected");
    });
}));
