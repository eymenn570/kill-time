const socket = io();

const $ = id => document.getElementById(id);

const lobby = $("lobby");
const gamePanel = $("gamePanel");
const statusText = $("status");
const roomPanel = $("roomPanel");
const playerList = $("playerList");
const startButton = $("startButton");
const canvas = $("gameCanvas");
const ctx = canvas.getContext("2d");

let roomCode = "";
let hostId = "";
let started = false;
let myRole = "";
let players = new Map();

const keys = {};
let myX = 450;
let myY = 260;

function playerName() {
  return $("playerName").value.trim() || "Oyuncu";
}

function showStatus(message) {
  statusText.textContent = message;
}

socket.on("connect", () => {
  showStatus("Sunucuya bağlandı!");
});

socket.on("disconnect", () => {
  showStatus("Sunucu bağlantısı kesildi.");
});

function handleRoomResponse(response) {
  if (!response || !response.ok) {
    showStatus(response?.error || "Bir hata oluştu.");
    return;
  }

  showStatus("Odaya bağlandın!");
  roomPanel.hidden = false;
  $("roomCodeText").textContent = response.room.code;
}

$("createButton").addEventListener("click", () => {
  socket.emit("createRoom", {
    name: playerName()
  }, handleRoomResponse);
});

$("joinButton").addEventListener("click", () => {
  socket.emit("joinRoom", {
    name: playerName(),
    code: $("roomCode").value
  }, handleRoomResponse);
});

startButton.addEventListener("click", () => {
  socket.emit("startGame");
});

socket.on("roomUpdate", room => {
  roomCode = room.code;
  hostId = room.hostId;

  $("roomCodeText").textContent = room.code;

  players = new Map(
    room.players.map(player => [player.id, player])
  );

  playerList.innerHTML = "";

  room.players.forEach(player => {
    const li = document.createElement("li");
    li.textContent =
      player.name + (player.id === hostId ? " (Oda sahibi)" : "");
    playerList.appendChild(li);
  });

  startButton.hidden = socket.id !== hostId;
  $("waitingText").textContent =
    room.players.length < 2
      ? "Başlamak için en az 2 oyuncu gerekli."
      : "Oyun sahibi oyunu başlatabilir.";
});

socket.on("gameStarted", data => {
  started = true;
  myRole = data.role;

  players = new Map(
    data.players.map(player => [player.id, player])
  );

  const me = players.get(socket.id);
  if (me) {
    myX = me.x;
    myY = me.y;
  }

  lobby.hidden = true;
  gamePanel.hidden = false;

  $("roleText").textContent =
    myRole === "IMPOSTOR"
      ? "ROLÜN: IMPOSTOR"
      : "ROLÜN: CREWMATE";

  draw();
});

socket.on("playerMoved", data => {
  const player = players.get(data.id);
  if (!player) return;

  player.x = data.x;
  player.y = data.y;

  draw();
});

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#20283a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "#303d55";
  ctx.lineWidth = 1;

  for (let x = 0; x < canvas.width; x += 45) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  for (let y = 0; y < canvas.height; y += 45) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  players.forEach(player => {
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "white";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.fillText(player.name, player.x, player.y - 27);
  });
}

window.addEventListener("keydown", event => {
  if ([
    "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
    " "
  ].includes(event.key)) {
    event.preventDefault();
  }

  keys[event.key.toLowerCase()] = true;
});

window.addEventListener("keyup", event => {
  keys[event.key.toLowerCase()] = false;
});

function movePlayer() {
  if (!started) return;

  let dx = 0;
  let dy = 0;

  if (keys["w"] || keys["arrowup"]) dy -= 4;
  if (keys["s"] || keys["arrowdown"]) dy += 4;
  if (keys["a"] || keys["arrowleft"]) dx -= 4;
  if (keys["d"] || keys["arrowright"]) dx += 4;

  if (dx === 0 && dy === 0) return;

  myX = Math.max(30, Math.min(870, myX + dx));
  myY = Math.max(30, Math.min(490, myY + dy));

  const me = players.get(socket.id);
  if (me) {
    me.x = myX;
    me.y = myY;
  }

  socket.emit("move", {
    x: myX,
    y: myY
  });

  draw();
}

setInterval(movePlayer, 50);
