
const socket = io();

const status = document.getElementById("status");
const button = document.getElementById("createButton");

socket.on("connect", () => {
  status.textContent = "Sunucuya bağlandı!";
});

socket.on("connect_error", () => {
  status.textContent = "Sunucuya bağlanılamadı.";
});

button.addEventListener("click", () => {
  const name =
    document.getElementById("playerName").value.trim() || "Oyuncu";

  button.disabled = true;
  status.textContent = "Oda oluşturuluyor...";

  socket.emit("createRoom", { name }, response => {
    button.disabled = false;

    if (!response || !response.ok) {
      status.textContent = response?.error || "Oda oluşturulamadı.";
      return;
    }

    const code = response.room.code;

    sessionStorage.setItem("killTimeRoom", code);
    sessionStorage.setItem("killTimeName", name);

    document.getElementById("roomCode").textContent = code;
    document.getElementById("result").hidden = false;
    status.textContent = "Odan hazır!";
  });
});

document.getElementById("copyButton").addEventListener("click", async () => {
  const code = document.getElementById("roomCode").textContent;

  try {
    await navigator.clipboard.writeText(code);
    status.textContent = "Oda kodu kopyalandı!";
  } catch {
    status.textContent = "Kod: " + code;
  }
});
