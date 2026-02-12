const running=true
  const ctx=canvas.getContext("2d")
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const FIXED_STEP = 1 / 60;
  const STATE_PLAYING  = 0;
  const STATE_GAMEOVER = 1;
  const STATE_PAUSED   = 2;
  const STATE_WON      = 3;
  let gameState = STATE_PLAYING;
  const PLAYER_ID = 0;
  const PEAR_COUNT = 10;
  const ENEMY_COUNT = 10;
  const PEAR_START  = 2;
  const ENEMY_START = PEAR_START + PEAR_COUNT * 2;
  const ENTITY_SIZE = 42;
  const PLAYER_SIZE = 50;
  const PEAR_SIZE   = 60;
  const ENEMY_SIZE  = 50;
  const PEAR_RATE  = 1;
  const ENEMY_RATE = 8;
  const noOfPearsOnScreen  = 4;
  const noOfBombsOnScreen = 4;
  const position = new Float32Array(ENTITY_SIZE);
  const size     = new Float32Array(ENTITY_SIZE);
  const consumed = new Uint8Array(ENTITY_SIZE);
  let lastTime = 0;
  let accumulator = 0;
  let pearTimer = 0;
  let enemyTimer = 0;
// const audio=[new Audio("../assets/eat.mp3"),new Audio("../assets/explosion.mp3"),new Audio("../assets/fireworks.mp3")]
  const images = [
document.getElementById("background"),
document.getElementById("pear"),
document.getElementById("bomb"),
document.getElementById("player"),
  ];
  
  const restartBtn = {
    x: canvas.width / 2 - 80,
    y: canvas.height / 2 + 30,
    w: 160,
    h: 45
  };
  
  
  function resetGame() {
    gameState = STATE_PLAYING;
    pearTimer = enemyTimer = 0;
    consumed.fill(0);
    createPlayer();
    createPears();
    createEnemies();
  }
  canvas.addEventListener("resize",()=>{
canvas.width=window.innerWidth
canvas.height=window.innerHeight
resetGame()
  })
  function createPlayer() {
    size[PLAYER_ID]     = PLAYER_SIZE;
    size[PLAYER_ID + 1] = PLAYER_SIZE;
    position[PLAYER_ID]     = canvas.width / 2;
    position[PLAYER_ID + 1] = canvas.height / 2;
  }
  
  function createPears() {
    for (let i = PEAR_START; i < PEAR_START + PEAR_COUNT * 2; i += 2) {
      position[i]     = Math.random() * (canvas.width - PEAR_SIZE);
      position[i + 1] = Math.random() * (canvas.height - PEAR_SIZE);
      size[i] = size[i + 1] = PEAR_SIZE;
      consumed[i] = 0;
    }
  }
  
  function createEnemies() {
    for (let i = ENEMY_START; i < ENEMY_START + ENEMY_COUNT * 2; i += 2) {
      position[i]     = Math.random() * (canvas.width - ENEMY_SIZE);
      position[i + 1] = Math.random() * (canvas.height - ENEMY_SIZE);
      size[i] = size[i + 1] = ENEMY_SIZE;
      consumed[i] = 0;
    }
  }
  
  function drawEntity(sprite, x, y, w, h, angle) {
    if (!sprite || w <= 0 || h <= 0) return;
  
    const cx = x + w * 0.5;
    const cy = y + h * 0.5;
  
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.drawImage(sprite, -w * 0.5, -h * 0.5, w, h);
    ctx.restore();
  }
  
  
  function reduceSize(id, amt) {
    size[id]     -= amt;
    size[id + 1] -= amt;
  }
  
  function increaseSize(id, amt) {
    size[id]     += amt;
    size[id + 1] += amt;
  }
  const COLLISION_SCALE = {
    player: 0.6,
    pear:   0.75,
    enemy:  0.7
  };
  
  function broadPhase(playerId, start, count, targetScale) {
    const px = position[playerId];
    const py = position[playerId + 1];
    const ps = size[playerId];
  
    const pcx = px + ps * 0.5;
    const pcy = py + ps * 0.5;
    const pr  = ps * 0.5 * COLLISION_SCALE.player;
  
    for (let n = 0; n < count; n++) {
      const i = start + n * 2;
      if (consumed[i]) continue;
  
      const x = position[i];
      const y = position[i + 1];
      const s = size[i];
  
      const cx = x + s * 0.5;
      const cy = y + s * 0.5;
      const r  = s * 0.5 * targetScale;
  
      const dx = pcx - cx;
      const dy = pcy - cy;
      const rr = pr + r;
  
      if (dx * dx + dy * dy <= rr * rr) {
        return i;
      }
    }
  
    return -1;
  }
  function loadImage(src) {
    const img = new Image();
    img.src = src;
    return img;
  }
  
  function setPlayerPos(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  position[PLAYER_ID]     = (clientX - rect.left) * scaleX;
  position[PLAYER_ID + 1] = (clientY - rect.top) * scaleY;
  }
  
  canvas.addEventListener("mousemove", e => {
    if (gameState === STATE_PLAYING)
      setPlayerPos(e.clientX, e.clientY);
  });
  
  canvas.addEventListener("touchstart", e => {
    e.preventDefault();
    const t = e.touches[0];
    if (gameState === STATE_PLAYING)
      setPlayerPos(t.clientX, t.clientY);
    else handleRestart(t.clientX, t.clientY);
  }, { passive: false });
  
  canvas.addEventListener("touchmove", e => {
    e.preventDefault();
    const t = e.touches[0];
    if (gameState === STATE_PLAYING)
      setPlayerPos(t.clientX, t.clientY);
  }, { passive: false });
  
  canvas.addEventListener("click", e => {
    if (gameState !== STATE_PLAYING)
      handleRestart(e.clientX, e.clientY);
  });
  
  document.addEventListener("keydown", e => {
    if (e.code === "Space" || e.code === "KeyP") {
      if (gameState === STATE_PLAYING) gameState = STATE_PAUSED;
      else if (gameState === STATE_PAUSED) gameState = STATE_PLAYING;
    }
  });
  
  function handleRestart(x, y) {
    const r = canvas.getBoundingClientRect();
    x -= r.left;
    y -= r.top;
  
    if (
      x >= restartBtn.x &&
      x <= restartBtn.x + restartBtn.w &&
      y >= restartBtn.y &&
      y <= restartBtn.y + restartBtn.h
    ) {
      resetGame();
    }
  }
  
  function update(dt) {
    if (gameState !== STATE_PLAYING) return;
  
    pearTimer += dt;
    enemyTimer += dt;
  
    if (pearTimer >= PEAR_RATE) {
      createPears();
      pearTimer = 0;
    }
  
    if (enemyTimer >= ENEMY_RATE) {
      createEnemies();
      enemyTimer = 0;
    }
  
    const hitPear  = broadPhase(PLAYER_ID, PEAR_START, PEAR_COUNT, COLLISION_SCALE.pear);
    const hitEnemy = broadPhase(PLAYER_ID, ENEMY_START, ENEMY_COUNT, COLLISION_SCALE.enemy);
    
  
    if (hitPear !== -1) {
      consumed[hitPear] = 1;
      size[hitPear] = size[hitPear + 1] = 0;
      increaseSize(PLAYER_ID, 5);
    }
  
    if (hitEnemy !== -1) {
      consumed[hitEnemy] = 1;
      reduceSize(PLAYER_ID, 15);
    }
  
    for (let n = 0; n < noOfPearsOnScreen; n++) {
      const i = PEAR_START + n * 2;
      if (!consumed[i]) reduceSize(i, 0.1);
    }
  
    for (let n = 0; n < noOfBombsOnScreen; n++) {
      const i = ENEMY_START + n * 2;
      if (!consumed[i]) reduceSize(i, 0.2);
    }
  
    if (size[PLAYER_ID] >= 100) {
      gameState = STATE_WON;
    }
  
    if (size[PLAYER_ID] <= 0 || size[PLAYER_ID + 1] <= 0) {
      gameState = STATE_GAMEOVER;
    }
  }
  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawEntity(images[0],0,0,canvas.width,canvas.height,0);
    drawEntity(images[3],position[PLAYER_ID],position[PLAYER_ID+1],size[PLAYER_ID],size[PLAYER_ID+1],0);
    for (let n = 0; n < noOfPearsOnScreen; n++) {
      const i = PEAR_START + n * 2;
      if (!consumed[i])  drawEntity(images[1],position[i],position[i+1],size[i],size[i+1],0);;
    }
  
    for (let n = 0; n < noOfBombsOnScreen; n++) {
      const i = ENEMY_START + n * 2;
      if (!consumed[i])  if (!consumed[i])  drawEntity(images[2],position[i],position[i+1],size[i],size[i+1],0);;;
    }
  
    if (gameState !== STATE_PLAYING) {
      ctx.fillStyle = "#fff";
      ctx.font = "32px monospace";
      ctx.textAlign = "center";
  
      if (gameState === STATE_GAMEOVER)
        ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 30);
      if (gameState === STATE_WON)
        ctx.fillText("YOU WIN!", canvas.width / 2, canvas.height / 2 - 30);
      if (gameState === STATE_PAUSED)
        ctx.fillText("PAUSED", canvas.width / 2, canvas.height / 2 - 30);
  
      if (gameState !== STATE_PAUSED) {
        ctx.fillStyle = "#333";
        ctx.fillRect(restartBtn.x, restartBtn.y, restartBtn.w, restartBtn.h);
        ctx.fillStyle = "#fff";
        ctx.font = "20px monospace";
        ctx.fillText("RESTART", canvas.width / 2, restartBtn.y + 30);
      }
    }
  }
  function animate(ts) {
    if(!running) return
    requestAnimationFrame(animate);
  
    if (!lastTime) lastTime = ts;
    let dt = (ts - lastTime) / 1000;
    lastTime = ts;
  
    accumulator += dt;
    while (accumulator >= FIXED_STEP) {
      update(FIXED_STEP);
      accumulator -= FIXED_STEP;
    }
    render();
  }
  
  resetGame();
  requestAnimationFrame(animate);
