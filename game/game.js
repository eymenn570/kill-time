
const canvas = document.getElementById("world");
const ctx = canvas.getContext("2d");

const menu = document.getElementById("menu");
const game = document.getElementById("game");

let player;
let bots = [];
let tasks = [];
let keys = {};
let completed = 0;
let role = "crew";
let running = false;

const colors = [
  "#ed414c",
  "#36a9e1",
  "#50c878",
  "#f3ca40",
  "#a66cff",
  "#ff9138"
];

function random(a,b) {
  return Math.random() * (b-a) + a;
}

function startGame() {
  player = {
    x: 100,
    y: 100,
    color: colors[0],
    speed: 3
  };

  bots = [];

  for (let i=0; i<5; i++) {
    bots.push({
      x: random(250,700),
      y: random(100,500),
      color: colors[i+1],
      dx: random(-1,1),
      dy: random(-1,1),
      timer: 60
    });
  }

  tasks = [
    {x:100,y:300,done:false},
    {x:390,y:130,done:false},
    {x:690,y:300,done:false},
    {x:390,y:500,done:false},
    {x:700,y:480,done:false}
  ];

  completed = 0;
  role = Math.random() < 0.25 ? "impostor" : "crew";

  document.getElementById("role").textContent =
    role === "crew" ? "MÜRETTEBAT" : "SAHTEKÂR";

  document.getElementById("tasks").textContent = "0/5 GÖREV";

  document.getElementById("message").textContent =
    role === "crew" ? "Görevlerini tamamla!" : "Sistemi sabote et!";

  menu.classList.add("hidden");
  game.classList.remove("hidden");

  running = true;
  requestAnimationFrame(loop);
}

function drawCharacter(c,name) {
  ctx.fillStyle = c.color;
  ctx.beginPath();
  ctx.roundRect(c.x-12,c.y-12,24,30,10);
  ctx.fill();

  ctx.fillStyle = "#a9eaff";
  ctx.beginPath();
  ctx.ellipse(c.x+2,c.y-5,10,7,0,0,Math.PI*2);
  ctx.fill();

  ctx.fillStyle = "white";
  ctx.font = "11px Arial";
  ctx.textAlign = "center";
  ctx.fillText(name,c.x,c.y+30);
}

function drawWorld() {
  ctx.clearRect(0,0,800,600);

  ctx.fillStyle = "#14243b";
  ctx.fillRect(0,0,800,600);

  const rooms = [
    [20,20,180,170],
    [220,20,360,170],
    [600,20,180,170],
    [20,210,180,170],
    [220,210,360,170],
    [600,210,180,170],
    [20,400,180,180],
    [220,400,360,180],
    [600,400,180,180]
  ];

  rooms.forEach((r,i) => {
    ctx.fillStyle = i%2 ? "#203954" : "#1b304b";
    ctx.fillRect(...r);
    ctx.strokeStyle = "#496b91";
    ctx.lineWidth = 3;
    ctx.strokeRect(...r);
  });

  tasks.forEach(t => {
    ctx.fillStyle = t.done ? "#35e68c" : "#ffc94b";
    ctx.fillRect(t.x-12,t.y-12,24,24);
    ctx.fillStyle = "#111";
    ctx.font = "bold 14px Arial";
    ctx.fillText(t.done ? "✓" : "!",t.x-4,t.y+5);
  });

  bots.forEach((b,i) => drawCharacter(b,"BOT "+(i+1)));
  drawCharacter(player,"SEN");
}

function movePlayer() {
  let dx = 0;
  let dy = 0;

  if(keys.up || keys.ArrowUp || keys.w) dy--;
  if(keys.down || keys.ArrowDown || keys.s) dy++;
  if(keys.left || keys.ArrowLeft || keys.a) dx--;
  if(keys.right || keys.ArrowRight || keys.d) dx++;

  if(dx && dy) {
    dx *= .707;
    dy *= .707;
  }

  player.x += dx * player.speed;
  player.y += dy * player.speed;

  player.x = Math.max(20,Math.min(780,player.x));
  player.y = Math.max(20,Math.min(580,player.y));
}

function moveBots() {
  bots.forEach(b => {
    b.timer--;

    if(b.timer <= 0) {
      b.dx = random(-1,1);
      b.dy = random(-1,1);
      b.timer = 60;
    }

    b.x += b.dx;
    b.y += b.dy;

    b.x = Math.max(30,Math.min(770,b.x));
    b.y = Math.max(30,Math.min(570,b.y));
  });
}

function loop() {
  if(!running) return;

  movePlayer();
  moveBots();
  drawWorld();

  requestAnimationFrame(loop);
}

function doTask() {
  if(!running) return;

  if(role === "impostor") {
    document.getElementById("message").textContent =
      "Sahtekâr: Sabotaj özelliği sonraki sürümde!";
    return;
  }

  const task = tasks.find(t =>
    !t.done &&
    Math.hypot(player.x-t.x,player.y-t.y)<45
  );

  if(!task) {
    document.getElementById("message").textContent =
      "Sarı görev kutusuna yaklaş!";
    return;
  }

  task.done = true;
  completed++;

  document.getElementById("tasks").textContent =
    completed+"/5 GÖREV";

  document.getElementById("message").textContent =
    "Görev tamamlandı!";

  if(completed === 5) {
    running = false;
    document.getElementById("message").textContent =
      "MÜRETTEBAT KAZANDI!";
  }
}

function meeting() {
  if(!running) return;

  document.getElementById("message").textContent =
    "TOPLANTI: Şüphelileri incele!";

  running = false;
  alert("Toplantı bitti! Bu özellik sonraki sürümde geliştirilecek.");
  running = true;
  loop();
}

document.getElementById("start").onclick = startGame;
document.getElementById("task").onclick = doTask;
document.getElementById("meeting").onclick = meeting;

document.addEventListener("keydown",e => {
  keys[e.key] = true;
});

document.addEventListener("keyup",e => {
  keys[e.key] = false;
});

document.querySelectorAll("[data-key]").forEach(button => {
  const key = button.dataset.key;

  button.addEventListener("pointerdown",e => {
    e.preventDefault();
    keys[key] = true;
  });

  function release(e) {
    e.preventDefault();
    keys[key] = false;
  }

  button.addEventListener("pointerup",release);
  button.addEventListener("pointerleave",release);
  button.addEventListener("pointercancel",release);
});
    
