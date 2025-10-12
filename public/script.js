const socket = io();
const joinBtn = document.getElementById("joinBtn");
const roomInput = document.getElementById("roomId");
const gameDiv = document.getElementById("game");
const boardDiv = document.getElementById("board");
const statusP = document.getElementById("status");

let roomId = null;
let board = Array(9).fill(null);
let bg = Math.random() * 360;

document.body.style.background = `hsl(${bg}, 70%, 20%)`;

joinBtn.onclick = () => {
    roomId = roomInput.value.trim();
    if (roomId) socket.emit("joinRoom", roomId);
};

socket.on("joined", () => {
    document.getElementById("room").style.display = "none";
    gameDiv.style.display = "block";
});

socket.on("playerCount", (count) => {
    statusP.textContent = count < 2 ? "Waiting for opponent..." : "Game started!";
});

socket.on("startGame", ({ turn }) => {
    statusP.textContent = `${turn}'s turn`;
    renderBoard();
});

socket.on("updateBoard", (newBoard) => {
    board = newBoard;
    renderBoard();
});

socket.on("nextTurn", (turn) => {
    statusP.textContent = `${turn}'s turn`;
});

socket.on("gameOver", ({ winner }) => {
    setTimeout(() => {
        alert(`${winner} wins!`);
        board = Array(9).fill(null);
        renderBoard();
        statusP.textContent = "Game restarted! X's turn";
    }, 2000)
});

function renderBoard() {
    boardDiv.innerHTML = "";
    board.forEach((cell, i) => {
        const div = document.createElement("div");
        div.className = "cell";
        div.textContent = cell || "";
        div.onclick = () => {
            socket.emit("move", { roomId, index: i });
        };

        if (i == 0) {
            div.style.borderRadius = "20% 0 0";
        } else if (i == 2) {
            div.style.borderRadius = "0 20% 0 0";
        } else if (i == 6) {
            div.style.borderRadius = "0 0 0 20%";
        } else if (i == 8) {
            div.style.borderRadius = "0 0 20% 0";
        }

        div.style.background = `hsl(${bg}, 100%, 50%)`;
        div.style.border = `2px solid hsl(${bg}, 100%, 30%)`;
        div.textContent = cell || "";
        boardDiv.appendChild(div);
    });
}
