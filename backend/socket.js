const io = require("socket.io")(server, {
    cors: {
        origin: "http://127.0.0.1:5500",
        methods: ["GET", "POST"]
    }
});
io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
});
