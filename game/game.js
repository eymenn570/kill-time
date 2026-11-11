
const canvas = document.getElementById("world");
const ctx = canvas.getContext("2d");
const menu = document.getElementById("menu");
const game = document.getElementById("game");

let player, bots = [], tasks = [], keys = {};
let completed = 0;
let role = "crew";
let running = false;
let sabotageActive = false;
let sabotageEndsAt = 0;
let sabotageCooldown = 0;
let impostorBot = -1;
let animationId = null;

const colors = [
  "#ed414c", "#36a9e1", "#50c878",
  "#f3ca40", "#a66cff", "#ff9138"
];

const sabotagePoint = { x: 400, y: 300 };

function random(a, b) {
  return Math.random() * (b - a) + a;
}

function setMessage(text) {
  document.getElementById("message").textContent = text;
}

function startGame() {
  if (animationId) cancelAnimationFrame(animationId);

  player = { x: 100, y: 100, color: colors[0], speed: 3 };
  bots = [];

  for (let i = 0; i < 5; i++) {
    bots.push({
      x: random(250, 700),
      y: random(100, 500),
      color: colors[i + 1],
      dx: random(-1, 1),
      dy: random(-1, 1),
      timer: 60
    });
  }

  tasks = [
    { x: 100, y: 300, done: false },
    { x: 390, y: 130, done: false },
    { x: 690, y: 300, done: false },
    { x: 390, y: 500, done: false },
    { x: 700, y: 480, done: false }
  ];

  completed = 0;
  role = Math.random() < 0.25 ? "impostor" : "crew";
  impostorBot = role === "crew"
    ? Math.floor(Math.random() * bots.length)
    : -1;

  sabotageActive = false;
  sabotageEndsAt = 0;
  sabotageCooldown = 0;

  document.getElementById("role").textContent =
    role === "crew" ? "MÜRETTEBAT" : "SAHTEKÂR";

  document.getElementById("tasks").textContent = "0/5 GÖREV";

  document.getElementById("task").textContent =
    role === "crew" ? "GÖREV / TAMİR" : "SABOTAJ";

  setMessage(role === "crew"
    ? "Görevlerini tamamla ve sahtekârı bul!"
    : "Sahtekârsın! Sabotaj başlat!");

  menu.classList.add("hidden");
  game.classList.remove("hidden");

  running = true;
  loop();
}

function drawCharacter(c, name) {
  ctx.fillStyle = c.color;
  ctx.beginPath();
  ctx.roundRect(c.x - 12, c.y - 12, 24, 30, 10);
  ctx.fill();

  ctx.fillStyle = "#a9eaff";
  ctx.beginPath();
  ctx.ellipse(c.x + 2, c.y - 5, 10, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "white";
  ctx.font = "11px Arial";
  ctx.textAlign = "center";
  ctx.fillText(name, c.x, c.y + 30);
}

function drawWorld() {
  ctx.clearRect(0, 0, 800, 600);
  ctx.fillStyle = "#14243b";
  ctx.fillRect(0, 0, 800, 600);

  const rooms = [
    [20,20,180,170], [220,20,360,170],
    [600,20,180,170], [20,210,180,170],
    [220,210,360,170], [600,210,180,170],
    [20,400,180,180], [220,400,360,180],
    [600,400,180,180]
  ];

  rooms.forEach((r, i) => {
    ctx.fillStyle = i % 2 ? "#203954" : "#1b304b";
    ctx.fillRect(...r);
    ctx.strokeStyle = "#496b91";
    ctx.lineWidth = 3;
    ctx.strokeRect(...r);
  });

  tasks.forEach(t => {
    ctx.fillStyle = t.done ? "#35e68c" : "#ffc94b";
    ctx.fillRect(t.x - 12, t.y - 12, 24, 24);
    ctx.fillStyle = "#111";
    ctx.font = "bold 14px Arial";
    ctx.fillText(t.done ? "✓" : "!", t.x - 4, t.y + 5);
  });

  if (sabotageActive) {
    const pulse = 16 + Math.sin(Date.now() / 120) * 4;
    ctx.fillStyle = "#ff394d";
    ctx.beginPath();
    ctx.arc(sabotagePoint.x, sabotagePoint.y, pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "white";
    ctx.font = "bold 13px Arial";
    ctx.textAlign = "center";
    ctx.fillText("TAMİR", sabotagePoint.x, sabotagePoint.y - 27);
  }

  bots.forEach((b, i) => drawCharacter(b, "BOT " + (i + 1)));
  drawCharacter(player, "SEN");
}

function movePlayer() {
  let dx = 0, dy = 0;

  if (keys.up || keys.ArrowUp || keys.w) dy--;
  if (keys.down || keys.ArrowDown || keys.s) dy++;
  if (keys.left || keys.ArrowLeft || keys.a) dx--;
  if (keys.right || keys.ArrowRight || keys.d) dx++;

  if (dx && dy) {
    dx *= 0.707;
    dy *= 0.707;
  }

  player.x = Math.max(20, Math.min(780, player.x + dx * player.speed));
  player.y = Math.max(20, Math.min(580, player.y + dy * player.speed));
}

function moveBots() {
  bots.forEach(b => {
    b.timer--;

    if (b.timer <= 0) {
      b.dx = random(-1, 1);
      b.dy = random(-1, 1);
      b.timer = 60;
    }

    b.x = Math.max(30, Math.min(770, b.x + b.dx));
    b.y = Math.max(30, Math.min(570, b.y + b.dy));
  });
}

function updateSabotage() {
  if (!sabotageActive) return;

  const secondsLeft = Math.max(
    0,
    Math.ceil((sabotageEndsAt - Date.now()) / 1000)
  );

  setMessage("SABOTAJ! " + secondsLeft +
    " saniye kaldı. Tamir noktasına git!");

  if (secondsLeft <= 0) {
    sabotageActive = false;
    endGame("SAHTEKÂR KAZANDI! Sabotaj süresi doldu.");
  }
}

function loop() {
  if (!running) return;

  movePlayer();
  moveBots();
  updateSabotage();
  drawWorld();

  if (running) {
    animationId = requestAnimationFrame(loop);
  }
}

function doTask() {
  if (!running) return;

  if (role === "impostor") {
    if (sabotageActive) {
      setMessage("Zaten bir sabotaj devam ediyor!");
      return;
    }

    if (Date.now() < sabotageCooldown) {
      const left = Math.ceil(
        (sabotageCooldown - Date.now()) / 1000
      );
      setMessage("Sabotaj için " + left + " saniye bekle.");
      return;
    }

    sabotageActive = true;
    sabotageEndsAt = Date.now() + 20000;
    sabotageCooldown = Date.now() + 30000;
    setMessage("SABOTAJ BAŞLADI!");
    return;
  }

  if (sabotageActive) {
    if (Math.hypot(
      player.x - sabotagePoint.x,
      player.y - sabotagePoint.y
    ) < 55) {
      sabotageActive = false;
      setMessage("Sabotaj giderildi!");
    } else {
      setMessage("Kırmızı TAMİR noktasına yaklaş!");
    }
    return;
  }

  const task = tasks.find(t =>
    !t.done &&
    Math.hypot(player.x - t.x, player.y - t.y) < 45
  );

  if (!task) {
    setMessage("Sarı görev kutularından birine yaklaş!");
    return;
  }

  task.done = true;
  completed++;

  document.getElementById("tasks").textContent =
    completed + "/5 GÖREV";

  setMessage("Görev tamamlandı!");

  if (completed === 5) {
    endGame("MÜRETTEBAT KAZANDI! Tüm görevler tamamlandı.");
  }
}

function meeting() {
  if (!running) return;

  if (sabotageActive) {
    setMessage("Önce sabotajı düzeltmelisin!");
    return;
  }

  const answer = prompt(
    "TOPLANTI\nŞüpheli BOT numarasını yaz (1-5):"
  );

  if (answer === null) {
    setMessage("Toplantı iptal edildi.");
    return;
  }

  const vote = Number(answer);

  if (!Number.isInteger(vote) || vote < 1 || vote > 5) {
    setMessage("1 ile 5 arasında bir BOT seç.");
    return;
  }

  if (role === "crew" && vote - 1 === impostorBot) {
    endGame("DOĞRU OY! BOT " + vote +
      " sahtekârdı. MÜRETTEBAT KAZANDI!");
  } else if (role === "impostor") {
    setMessage("BOT " + vote +
      " toplantıdan çıkarıldı. Sahtekârlık devam ediyor!");
  } else {
    setMessage("BOT " + vote +
      " suçsuz çıktı. Görevlere devam!");
  }
}

function endGame(message) {
  running = false;

  if (animationId) {
    cancelAnimationFrame(animationId);
  }

  setMessage(message);
  document.getElementById("task").textContent = "OYUN BİTTİ";
}

document.getElementById("start").onclick = startGame;
document.getElementById("task").onclick = doTask;
document.getElementById("meeting").onclick = meeting;

document.addEventListener("keydown", e => {
  keys[e.key] = true;
});

document.addEventListener("keyup", e => {
  keys[e.key] = false;
});

document.querySelectorAll("[data-key]").forEach(button => {
  const key = button.dataset.key;

  button.addEventListener("pointerdown", e => {
    e.preventDefault();
    keys[key] = true;
  });

  function release(e) {
    e.preventDefault();
    keys[key] = false;
  }

  button.addEventListener("pointerup", release);
  button.addEventListener("pointerleave", release);
  button.addEventListener("pointercancel", release);
});
      
