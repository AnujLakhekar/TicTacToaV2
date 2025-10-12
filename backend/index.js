// server/server.js
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);
const io = new Server(server);
import { join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, "..");

app.use(express.static(join(__dirname, "../public")));
let rooms = {}; // { roomId: { players: [], board: Array(9).fill(null), turn: 'X' } }

io.on("connection", (socket) => {
    console.log("New connection:", socket.id);

    socket.on("joinRoom", (roomId) => {
        if (!rooms[roomId]) {
            rooms[roomId] = { players: [], board: Array(9).fill(null), turn: "X" };
        }

        const room = rooms[roomId];

        if (room.players.length >= 2) {
            socket.emit("roomFull");
            return;
        }

        room.players.push(socket.id);
        socket.join(roomId);
        console.log(`${socket.id} joined ${roomId}`);

        socket.emit("joined", roomId);
        io.to(roomId).emit("playerCount", room.players.length);

        if (room.players.length === 2) {
            io.to(roomId).emit("startGame", { turn: room.turn });
        }
    });

    socket.on("move", ({ roomId, index }) => {
        const room = rooms[roomId];
        if (!room) return;

        const playerSymbol = room.players[0] === socket.id ? "X" : "O";

        if (room.turn !== playerSymbol || room.board[index]) return;

        room.board[index] = playerSymbol;
        room.turn = room.turn === "X" ? "O" : "X";

        io.to(roomId).emit("updateBoard", room.board);
        io.to(roomId).emit("nextTurn", room.turn);

        // check for winner
        const winner = checkWinner(room.board);
        if (winner) {
            io.to(roomId).emit("gameOver", { winner });
            room.board = Array(9).fill(null);
        }
    });

    socket.on("disconnect", () => {
        for (const [roomId, room] of Object.entries(rooms)) {
            room.players = room.players.filter((id) => id !== socket.id);
            io.to(roomId).emit("playerCount", room.players.length);
            if (room.players.length === 0) delete rooms[roomId];
        }
    });
});

function checkWinner(b) {
    const combos = [
        [0,1,2],[3,4,5],[6,7,8],
        [0,3,6],[1,4,7],[2,5,8],
        [0,4,8],[2,4,6]
    ];
    for (const [a,b_,c] of combos) {
        if (b[a] && b[a] === b[b_] && b[a] === b[c]) return b[a];
    }
    return null;
}


app.get("/", (req, res) => {
    res.sendFile(join(__dirname, "../index.html"));
})

app.get("/local", (req, res) => {
    res.sendFile(join(__dirname, "../Local.index.html"));
});

app.get("/multiplayer", (req, res) => {
    res.sendFile(join(__dirname, "src/MultiPlayer.html"));
});

app.get("/multiplayer/:id", (req, res) => {
    res.sendFile(join(__dirname, "src/MultiPlayer.html"));
});

server.listen(3000, () => console.log("Server running on http://localhost:3000"));
