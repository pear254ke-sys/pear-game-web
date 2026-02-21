let running=true
  const ctx=canvas.getContext("2d")
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const GAME_STATES={
    STATE_START:-1,
    STATE_PLAYING:0,
    STATE_PAUSED:1,
    STATE_WON:2,
    STATE_GAMEOVER:3
  }
  const PEAR={
    PEAR_START:2,
    PEAR_COUNT:10,
    PEAR_RATE:1,
    PEAR_SIZE:50,
    noOfPearsOnScreen:4,
pearTimer:0,
  }
  const ENEMY={
    ENEMY_COUNT:10,
    ENEMY_SIZE:50,
    ENEMY_RATE:8,
    ENEMY_START:PEAR.PEAR_START + PEAR.PEAR_COUNT * 2,
    noOfBombsOnScreen:4,
    enemyTimer:0,
  }
  const PLAYER={
    PLAYER_ID:0,
    PLAYER_SIZE:50
  }
  const TIMER={
    lastTime:0,
    accumulator:0,
    FIXED_STEP:1/60
  }
  let gameState =GAME_STATES.STATE_START;

  const ENTITY_SIZE = 42;
  const position = new Float32Array(ENTITY_SIZE);
  const size     = new Float32Array(ENTITY_SIZE);
  const consumed = new Uint8Array(ENTITY_SIZE);
// const audio=[new Audio("../assets/eat.mp3"),new Audio("../assets/explosion.mp3"),new Audio("../assets/fireworks.mp3")]
  const images = {backgroud:document.getElementById("background"),
    pear:document.getElementById("pear"),
    bomb:document.getElementById("bomb"),
    player:document.getElementById("player"),
    loadingScreen:document.getElementById("loading_screen"),
    gameOverScreen:document.getElementById("gameover_screen"),
    gameWonScreen:document.getElementById("win_screen"),
    pausedScreen:document.getElementById("paused_screen")
  }
  const restartBtn = {
    x: canvas.width / 2 - 80,
    y: canvas.height / 2 + 30,
    w: 160,
    h: 45
  };
  
  
  function resetGame() {
    gameState = GAME_STATES.STATE_START;
    PEAR.pearTimer = ENEMY.enemyTimer = 0;
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
    size[PLAYER.PLAYER_ID]     = PLAYER.PLAYER_SIZE;
    size[PLAYER.PLAYER_ID + 1] = PLAYER.PLAYER_SIZE;
    position[PLAYER.PLAYER_ID]     = canvas.width / 2;
    position[PLAYER.PLAYER_ID + 1] = canvas.height / 2;
  }
  
  function createPears() {
    for (let i = PEAR.PEAR_START; i < PEAR.PEAR_START + PEAR.PEAR_COUNT * 2; i += 2) {
      position[i]     = Math.random() * (canvas.width - PEAR.PEAR_SIZE);
      position[i + 1] = Math.random() * (canvas.height - PEAR.PEAR_SIZE);
      size[i] = size[i + 1] = PEAR.PEAR_SIZE;
      consumed[i] = 0;
    }
  }
  
  function createEnemies() {
    for (let i = ENEMY.ENEMY_START; i < ENEMY.ENEMY_START + ENEMY.ENEMY_COUNT * 2; i += 2) {
      position[i]     = Math.random() * (canvas.width - ENEMY.ENEMY_SIZE);
      position[i + 1] = Math.random() * (canvas.height - ENEMY.ENEMY_SIZE);
      size[i] = size[i + 1] = ENEMY.ENEMY_SIZE;
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
  
  function setPlayerPos(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  position[PLAYER.PLAYER_ID]     = (clientX - rect.left) * scaleX;
  position[PLAYER.PLAYER_ID + 1] = (clientY - rect.top) * scaleY;
  }
  
  canvas.addEventListener("mousemove", e => {
    if (gameState === GAME_STATES.STATE_PLAYING)
      setPlayerPos(e.clientX, e.clientY);
  });
  
  canvas.addEventListener("touchstart", e => {
    e.preventDefault();
    const t = e.touches[0];
    if (gameState === GAME_STATES.STATE_PLAYING)
      setPlayerPos(t.clientX, t.clientY);
    else handleRestart(t.clientX, t.clientY);
  }, { passive: false });
  
  canvas.addEventListener("touchmove", e => {
    e.preventDefault();
    const t = e.touches[0];
    if (gameState === GAME_STATES.STATE_PLAYING)
      setPlayerPos(t.clientX, t.clientY);
  }, { passive: false });
  
  canvas.addEventListener("click", e => {
    if (gameState !== GAME_STATES.STATE_PLAYING)
      handleRestart(e.clientX, e.clientY);
  });
  
  // document.addEventListener("keydown", e => {
  //   if (e.code === "Space" || e.code === "KeyP") {
  //     if (gameState === STATE_PLAYING) gameState = STATE_PAUSED;
  //     else if (gameState === STATE_PAUSED) gameState = STATE_PLAYING;
  //   }
  // });
  
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
    PEAR.pearTimer += dt;
    ENEMY.enemyTimer += dt;
  
    if (PEAR.pearTimer >= PEAR.PEAR_RATE) {
      createPears();
      PEAR.pearTimer = 0;
    }
  
    if (ENEMY.enemyTimer >= ENEMY.ENEMY_RATE) {
      createEnemies();
      ENEMY.enemyTimer = 0;
    }
  
    const hitPear  = broadPhase(PLAYER.PLAYER_ID, PEAR.PEAR_START, PEAR.PEAR_COUNT, COLLISION_SCALE.pear);
    const hitEnemy = broadPhase(PLAYER.PLAYER_ID, ENEMY.ENEMY_START, ENEMY.ENEMY_COUNT, COLLISION_SCALE.enemy);
    
  
    if (hitPear !== -1) {
      consumed[hitPear] = 1;
      size[hitPear] = size[hitPear + 1] = 0;
      increaseSize(PLAYER.PLAYER_ID, 5);
    }
  
    if (hitEnemy !== -1) {
      consumed[hitEnemy] = 1;
      reduceSize(PLAYER.PLAYER_ID, 15);
    }
  
    for (let n = 0; n < PEAR.noOfPearsOnScreen; n++) {
      const i = PEAR.PEAR_START + n * 2;
      if (!consumed[i]) reduceSize(i, 0.1);
    }
  
    for (let n = 0; n < ENEMY.noOfBombsOnScreen; n++) {
      const i = ENEMY.ENEMY_START + n * 2;
      if (!consumed[i]) reduceSize(i, 0.2);
    }
  
    if (size[PLAYER.PLAYER_ID] >= 100) {
      gameState = GAME_STATES.STATE_WON;
    }
  
    if (size[PLAYER.PLAYER_ID] <= 0 || size[PLAYER.PLAYER_ID + 1] <= 0) {
      gameState = GAME_STATES.STATE_GAMEOVER;
    }
  }
  function gameLoad(){
    drawEntity(images.loadingScreen,0,0,canvas.width,canvas.height,0);
    drawText("Start")
  }
  function gameOver(){
    drawEntity(images.gameOverScreen,0,0,canvas.width,canvas.height,0);  
  }
  function gamePaused(){
    drawEntity(images.pausedScreen,0,0,canvas.width,canvas.height,0); 
  }
  function gameWon(){
    drawEntity(images.gameWonScreen,0,0,canvas.width,canvas.height,0); 
  }
  function gamePlaying(){
    render()
    update(TIMER.FIXED_STEP);
  }
  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawEntity(images.backgroud,0,0,canvas.width,canvas.height,0);
    drawEntity(images.player,position[PLAYER.PLAYER_ID],position[PLAYER.PLAYER_ID+1],size[PLAYER.PLAYER_ID],size[PLAYER.PLAYER_ID+1],0);
    for (let n = 0; n < PEAR.noOfPearsOnScreen; n++) {
      const i = PEAR.PEAR_START + n * 2;
      if (!consumed[i])  drawEntity(images.pear,position[i],position[i+1],size[i],size[i+1],0);;
    }
  
    for (let n = 0; n < ENEMY.noOfBombsOnScreen; n++) {
      const i = ENEMY.ENEMY_START + n * 2;
      if (!consumed[i])  if (!consumed[i])  drawEntity(images.bomb,position[i],position[i+1],size[i],size[i+1],0);;;
    }
  }
  function gameStatesEffects(){
    if(gameState===GAME_STATES.STATE_START){
    gameLoad()
      
    }
    if(gameState===GAME_STATES.STATE_PLAYING){
    gamePlaying()
    }
    if(gameState==GAME_STATES.STATE_GAMEOVER){
      gameOver()
    }
    if(gameState===GAME_STATES.STATE_PAUSED){
gamePaused()
    }
    if(gameState===GAME_STATES.STATE_WON){
      gameWon()
          }
  }
  function drawText(text){
 
      ctx.fillText(`${text}`, canvas.width / 2, canvas.height / 2 - 30);
      ctx.fillStyle = "#333";
        ctx.fillRect(restartBtn.x, restartBtn.y, restartBtn.w, restartBtn.h);
        ctx.fillStyle = "#fff";
        ctx.font = "20px monospace";
        ctx.fillText(`${text}`, canvas.width / 2, restartBtn.y + 30)
    }
  
  function animate(ts) {
    if(!running) return
    requestAnimationFrame(animate);
  
    if (!TIMER.lastTime) TIMER.lastTime = ts;
    let dt = (ts - TIMER.lastTime) / 1000;
    TIMER.lastTime = ts;
  
    TIMER.accumulator += dt;
    while (TIMER.accumulator >= TIMER.FIXED_STEP) {
      TIMER.accumulator -= TIMER.FIXED_STEP;
    }
    gameStatesEffects()
  }
  
  resetGame();
  requestAnimationFrame(animate);
