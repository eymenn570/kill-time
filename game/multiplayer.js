
(() => {
  const SERVER_URL = window.KILL_TIME_SERVER;

  const nameInput = document.getElementById("playerName");
  const codeInput = document.getElementById("roomCode");
  const createBtn = document.getElementById("createRoom");
  const joinBtn = document.getElementById("joinRoom");
  const startBtn = document.getElementById("startOnline");
  const roomCode = document.getElementById("roomCodeText");
  const playerList = document.getElementById("playerList");
  const status = document.getElementById("serverStatus");

  let socket = null;
  let isHost = false;

  function showStatus(message) {
    status.textContent = message;
  }

  function connect() {
    if (socket?.connected) return;

    if (!SERVER_URL || SERVER_URL.includes("YOUR-SERVICE")) {
      showStatus("Önce sunucu adresini ayarla.");
      return;
    }

    showStatus("Sunucuya bağlanılıyor...");

    const script = document.createElement("script");
    script.src = SERVER_URL + "/socket.io/socket.io.js";

    script.onload = () => {
      socket = io(SERVER_URL, {
        transports: ["websocket", "polling"]
      });

      socket.on("connect", () => {
        showStatus("Sunucuya bağlandı!");
      });

      socket.on("connect_error", () => {
        showStatus("Bağlantı hatası. Sunucuyu kontrol et.");
      });

      socket.on("disconnect", () => {
        showStatus("Sunucu bağlantısı kesildi.");
      });

      socket.on("roomUpdate", data => {
        roomCode.textContent = data.code;
        isHost = data.host === socket.id;

        playerList.innerHTML = "";

        data.players.forEach(player => {
          const item = document.createElement("li");
          item.textContent =
            player.name + (player.isHost ? " 👑" : "");
          playerList.appendChild(item);
        });

        startBtn.hidden = !isHost || data.started;
      });

      socket.on("roleAssigned", data => {
        const role = document.getElementById("role");

        if (role) {
          role.textContent = data.role === "impostor"
            ? "IMPOSTOR"
            : "MÜRETTEBAT";
        }

        showStatus("Rolün sunucu tarafından atandı!");
      });

      socket.on("gameStarted", () => {
        showStatus("Oyun başlıyor!");

        const localStart = document.getElementById("start");

        if (localStart) {
          localStart.click();
        }
      });
    };

    script.onerror = () => {
      showStatus("Socket.IO dosyası yüklenemedi.");
    };

    document.head.appendChild(script);
  }

  function playerName() {
    return nameInput.value.trim().slice(0, 16) || "Oyuncu";
  }

  createBtn.addEventListener("click", () => {
    connect();

    const wait = () => {
      if (!socket?.connected) {
        setTimeout(wait, 300);
        return;
      }

      socket.emit("createRoom", {
        name: playerName()
      }, result => {
        if (!result?.ok) {
          showStatus(result?.error || "Oda oluşturulamadı.");
          return;
        }

        codeInput.value = result.code;
        showStatus("Sunucu oluşturuldu!");
      });
    };

    wait();
  });

  joinBtn.addEventListener("click", () => {
    connect();

    const wait = () => {
      if (!socket?.connected) {
        setTimeout(wait, 300);
        return;
      }

      socket.emit("joinRoom", {
        name: playerName(),
        code: codeInput.value
      }, result => {
        if (!result?.ok) {
          showStatus(result?.error || "Odaya katılınamadı.");
          return;
        }

        showStatus("Sunucuya katıldın!");
      });
    };

    wait();
  });

  startBtn.addEventListener("click", () => {
    if (!socket?.connected) {
      showStatus("Sunucu bağlantısı yok.");
      return;
    }

    socket.emit("startGame", result => {
      if (!result?.ok) {
        showStatus(result?.error || "Oyun başlatılamadı.");
      }
    });
  });

  connect();
})();
      
