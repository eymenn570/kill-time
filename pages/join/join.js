
const socket = io();

const status = document.getElementById("status");
const button = document.getElementById("joinButton");

socket.on("connect", () => {
  status.textContent = "Sunucuya bağlandı!";
});

socket.on("connect_error", () => {
  status.textContent = "Sunucuya bağlanılamadı.";
});

button.addEventListener("click", () => {
  const name =
    document.getElementById("playerName").value.trim() || "Oyuncu";

  const code =
    document.getElementById("roomCode").value.trim().toUpperCase();

  if (code.length !== 5) {
    status.textContent = "5 karakterli oda kodu gir.";
    return;
  }

  button.disabled = true;
  status.textContent = "Partiye bağlanılıyor...";

  socket.emit("joinRoom", { name, code }, response => {
    button.disabled = false;

    if (!response || !response.ok) {
      status.textContent = response?.error || "Bir hata oluştu.";
      return;
    }

    sessionStorage.setItem("killTimeRoom", response.room.code);
    sessionStorage.setItem("killTimeName", name);

    status.textContent = "Partiye katıldın!";
    window.location.href = "/game/";
  });
});
