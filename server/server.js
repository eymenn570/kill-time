
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;
const rooms = new Map();
const MAX_PLAYERS = 8;

app.get("/", (req, res) => {
  res.json({
    name: "KILL TIME SERVER",
    status: "online",
    rooms: rooms.size
  });
});

function makeCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code;

  do {
    code = "";
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
  } while (rooms.has(code));

  return code;
}

function roomInfo(room) {
  return {
    code: room.code,
    host: room.host,
    started: room.started,
    players: [...room.players.values()].map(p => ({
      id: p.id,
      name: p.name,
      isHost: p.id === room.host
    }))
  };
}

function updateRoom(room) {
  io.to(room.code).emit("roomUpdate", roomInfo(room));
}

io.on("connection", socket => {
  console.log("Bağlandı:", socket.id);

  socket.on("createRoom", (data, callback) => {
    const name = String(data?.name || "Oyuncu")
      .trim()
      .slice(0, 16) || "Oyuncu";

    const code = makeCode();

    const room = {
      code,
      host: socket.id,
      started: false,
      players: new Map()
    };

    room.players.set(socket.id, {
      id: socket.id,
      name
    });

    rooms.set(code, room);
    socket.join(code);

    callback?.({
      ok: true,
      code
    });

    updateRoom(room);
  });

  socket.on("joinRoom", (data, callback) => {
    const code = String(data?.code || "")
      .trim()
      .toUpperCase();

    const name = String(data?.name || "Oyuncu")
      .trim()
      .slice(0, 16) || "Oyuncu";

    const room = rooms.get(code);

    if (!room) {
      return callback?.({
        ok: false,
        error: "Sunucu bulunamadı."
      });
    }

    if (room.started) {
      return callback?.({
        ok: false,
        error: "Oyun zaten başladı."
      });
    }

    if (room.players.size >= MAX_PLAYERS) {
      return callback?.({
        ok: false,
        error: "Sunucu dolu."
      });
    }

    room.players.set(socket.id, {
      id: socket.id,
      name
    });

    socket.join(code);

    callback?.({
      ok: true,
      code
    });

    updateRoom(room);
  });

  socket.on("startGame", callback => {
    let room = [...rooms.values()].find(
      r => r.players.has(socket.id)
    );

    if (!room) {
      return callback?.({
        ok: false,
        error: "Önce bir odaya katıl."
      });
    }

    if (room.host !== socket.id) {
      return callback?.({
        ok: false,
        error: "Oyunu sadece oda sahibi başlatabilir."
      });
    }

    if (room.players.size < 2) {
      return callback?.({
        ok: false,
        error: "Başlamak için en az 2 oyuncu gerekli."
      });
    }

    room.started = true;

    const players = [...room.players.values()];
    const impostor = players[
      Math.floor(Math.random() * players.length)
    ];

    players.forEach(player => {
      io.to(player.id).emit("roleAssigned", {
        role: player.id === impostor.id
          ? "impostor"
          : "crew"
      });
    });

    io.to(room.code).emit("gameStarted");

    callback?.({ ok: true });
    updateRoom(room);
  });

  socket.on("disconnect", () => {
    for (const [code, room] of rooms) {
      if (!room.players.has(socket.id)) continue;

      room.players.delete(socket.id);

      if (room.players.size === 0) {
        rooms.delete(code);
        break;
      }

      if (room.host === socket.id) {
        room.host = room.players.keys().next().value;
      }

      updateRoom(room);
      break;
    }

    console.log("Ayrıldı:", socket.id);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("KILL TIME SERVER çalışıyor:", PORT);
});
      
