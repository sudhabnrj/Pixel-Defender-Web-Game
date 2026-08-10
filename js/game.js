/* ==========================================================================
   PIXEL DEFENDER — MAIN GAME ENGINE & CONTROLLER
   ========================================================================== */

(function() {
  'use strict';

  // ------------------------------------------------------------------------
  // 1. DOM & CANVAS SETUP
  // ------------------------------------------------------------------------
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const gameContainer = document.getElementById('gameContainer');

  let canvasWidth = 760;
  let canvasHeight = 570;

  const sounds = new SoundSystem();
  let selectedWeaponId = 1;

  function resizeCanvasToContainer() {
    const rect = gameContainer.getBoundingClientRect();
    canvasWidth = rect.width;
    canvasHeight = rect.height;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    if (player) {
      player.y = canvasHeight - 75;
      if (player.x > canvasWidth - player.width) {
        player.x = canvasWidth - player.width - 10;
      }
    }
  }

  // Dynamic Window Size Stages (Every 3 Levels)
  function updateContainerSizeForLevel(lvl) {
    let stageClass = 'stage-1';
    if (lvl >= 10) {
      stageClass = 'stage-4'; // 100% full screen
    } else if (lvl >= 7) {
      stageClass = 'stage-3';
    } else if (lvl >= 4) {
      stageClass = 'stage-2';
    }

    if (!gameContainer.classList.contains(stageClass)) {
      gameContainer.className = 'game-container ' + stageClass;
      setTimeout(() => {
        resizeCanvasToContainer();
      }, 400);

      showBanner(`LEVEL ${lvl}: DEFENSE ZONE EXPANDED!`);
    }
  }

  function showBanner(text) {
    const banner = document.getElementById('bannerNotif');
    banner.textContent = text;
    banner.classList.add('show');
    setTimeout(() => {
      banner.classList.remove('show');
    }, 3200);
  }

  window.addEventListener('resize', resizeCanvasToContainer);

  // HUD & UI Elements
  const hudScore = document.getElementById('hudScore');
  const hudLevel = document.getElementById('hudLevel');
  const hudLives = document.getElementById('hudLives');
  const hudWeaponName = document.getElementById('hudWeaponName');

  const startScreen = document.getElementById('startScreen');
  const pauseScreen = document.getElementById('pauseScreen');
  const gameOverScreen = document.getElementById('gameOverScreen');

  const startBtn = document.getElementById('startBtn');
  const resumeBtn = document.getElementById('resumeBtn');
  const restartBtn = document.getElementById('restartBtn');
  const finalScoreEl = document.getElementById('finalScore');
  const finalLevelEl = document.getElementById('finalLevel');
  const highScoreEl = document.getElementById('highScore');
  const newHighScoreTag = document.getElementById('newHighScoreTag');

  // ------------------------------------------------------------------------
  // 2. GAME STATES & ARRAYS
  // ------------------------------------------------------------------------
  const STATES = {
    START: 'START',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    GAME_OVER: 'GAME_OVER'
  };

  let gameState = STATES.START;
  let score = 0;
  let level = 1;
  let lives = 3;
  let highScore = parseInt(localStorage.getItem('pixel_defender_highscore') || '0', 10);
  let lastTime = 0;
  let spawnTimer = 0;
  let screenShake = 0;

  const stars = Array.from({ length: 80 }, () => new Star(canvasWidth, canvasHeight));
  const player = new Player(canvasWidth, canvasHeight);
  let lasers = [];
  let enemies = [];
  let particles = [];

  // ------------------------------------------------------------------------
  // 3. INPUT HANDLING
  // ------------------------------------------------------------------------
  const keys = {
    left: false,
    right: false,
    shoot: false
  };

  window.addEventListener('keydown', (e) => {
    if (['Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyA', 'KeyD'].includes(e.code)) {
      e.preventDefault();
    }

    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = true;

    if (e.code === 'Digit1') selectWeapon(1);
    if (e.code === 'Digit2') selectWeapon(2);
    if (e.code === 'Digit3') selectWeapon(3);

    if (e.code === 'KeyP' || e.code === 'Escape') {
      togglePause();
    }

    if (e.code === 'KeyM') {
      sounds.init();
      sounds.toggleMute();
    }

    if (e.code === 'KeyR') {
      if (gameState === STATES.PLAYING || gameState === STATES.PAUSED || gameState === STATES.GAME_OVER) {
        sounds.init();
        startGame();
      }
    }

    if (e.code === 'Space') {
      keys.shoot = true;
      if (gameState === STATES.START || gameState === STATES.GAME_OVER) {
        startGame();
      }
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
    if (e.code === 'Space') keys.shoot = false;
  });

  // Weapon Selector Handler
  function selectWeapon(wId) {
    const wDef = WEAPONS[wId];
    if (!wDef) return;

    if (level < wDef.reqLevel) {
      showBanner(`LOCKED! ${wDef.name} UNLOCKS AT LEVEL ${wDef.reqLevel}`);
      return;
    }

    selectedWeaponId = wId;
    hudWeaponName.textContent = wDef.name;

    [1, 2, 3].forEach(id => {
      const card = document.getElementById(`wCard${id}`);
      if (card) {
        if (id === selectedWeaponId) card.classList.add('active');
        else card.classList.remove('active');
      }
    });
  }

  window.selectWeapon = selectWeapon;

  function updateWeaponLockUI() {
    [1, 2, 3].forEach(id => {
      const card = document.getElementById(`wCard${id}`);
      if (card) {
        if (level >= WEAPONS[id].reqLevel) card.classList.remove('locked');
        else card.classList.add('locked');
      }
    });
  }

  // Bind Buttons & Icon Buttons
  startBtn.addEventListener('click', () => { sounds.init(); startGame(); });
  resumeBtn.addEventListener('click', () => { togglePause(); });
  restartBtn.addEventListener('click', () => { sounds.init(); startGame(); });

  document.querySelectorAll('.js-pause-btn').forEach(btn => {
    btn.addEventListener('click', () => { togglePause(); });
  });

  document.querySelectorAll('.js-restart-btn').forEach(btn => {
    btn.addEventListener('click', () => { sounds.init(); startGame(); });
  });

  document.querySelectorAll('.js-audio-btn').forEach(btn => {
    btn.addEventListener('click', () => { sounds.init(); sounds.toggleMute(); });
  });

  function togglePause() {
    if (gameState === STATES.PLAYING) {
      gameState = STATES.PAUSED;
      pauseScreen.classList.remove('hidden');
      updateWeaponLockUI();
    } else if (gameState === STATES.PAUSED) {
      gameState = STATES.PLAYING;
      pauseScreen.classList.add('hidden');
    }
  }

  // ------------------------------------------------------------------------
  // 4. PARTICLES & EXPLOSIONS
  // ------------------------------------------------------------------------
  function createExplosion(x, y, color, count = 22, isLarge = false) {
    sounds.playExplosion(isLarge);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * (isLarge ? 300 : 190) + 35;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const pColor = Math.random() > 0.4 ? color : (Math.random() > 0.5 ? '#ffffff' : '#ffcc00');
      const size = Math.random() * (isLarge ? 4.5 : 3) + 1.5;
      const life = Math.random() * (isLarge ? 0.65 : 0.4) + 0.2;

      particles.push(new Particle(x, y, vx, vy, pColor, size, life));
    }
  }

  // ------------------------------------------------------------------------
  // 5. COLLISION DETECTION
  // ------------------------------------------------------------------------
  function checkCollisions() {
    for (let l = lasers.length - 1; l >= 0; l--) {
      const laser = lasers[l];
      for (let e = enemies.length - 1; e >= 0; e--) {
        const enemy = enemies[e];

        const dx = laser.x - enemy.x;
        const dy = laser.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < enemy.size + laser.width) {
          if (!laser.isCentral) laser.markedForDeletion = true;
          enemy.markedForDeletion = true;

          score += 100;
          updateHUD();

          const newLevel = Math.floor(score / 1000) + 1;
          if (newLevel > level) {
            level = newLevel;
            sounds.playLevelUp();
            updateHUD();

            updateContainerSizeForLevel(level);
            updateWeaponLockUI();

            if (level === 3) {
              showBanner('NEW ADVANCE GUN UNLOCKED: PHOENIX SPREAD (PRESS 2)!');
            } else if (level === 6) {
              showBanner('NEW ADVANCE GUN UNLOCKED: HYPER BEAM (PRESS 3)!');
            }

            createExplosion(canvasWidth / 2, canvasHeight / 3, '#ffaa00', 45, true);
          }

          createExplosion(enemy.x, enemy.y, enemy.color, 16);
          break;
        }
      }
    }

    if (player.invulnerableTimer <= 0) {
      const pCenterX = player.x + player.width / 2;
      const pCenterY = player.y + player.height / 2;

      for (let e = enemies.length - 1; e >= 0; e--) {
        const enemy = enemies[e];
        const dx = pCenterX - enemy.x;
        const dy = pCenterY - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < enemy.size + player.width * 0.4) {
          enemy.markedForDeletion = true;
          lives--;
          updateHUD();

          sounds.playHit();
          screenShake = 0.3;
          player.invulnerableTimer = 1.5;

          createExplosion(enemy.x, enemy.y, '#ff0055', 26, true);

          if (lives <= 0) {
            triggerGameOver();
          }
          break;
        }
      }
    }
  }

  // ------------------------------------------------------------------------
  // 6. SPAWNING SYSTEM
  // ------------------------------------------------------------------------
  function handleSpawning(dt) {
    const baseInterval = 1.1;
    const minInterval = 0.32;
    const currentInterval = Math.max(minInterval, baseInterval - (level - 1) * 0.08);

    spawnTimer += dt;
    if (spawnTimer >= currentInterval) {
      spawnTimer = 0;
      enemies.push(new Enemy(level, canvasWidth));
    }
  }

  // ------------------------------------------------------------------------
  // 7. HUD & LIFECYCLE MANAGEMENT
  // ------------------------------------------------------------------------
  function updateHUD() {
    hudScore.textContent = score.toString().padStart(6, '0');
    hudLevel.textContent = level.toString();

    let heartsStr = '';
    for (let i = 0; i < 3; i++) {
      heartsStr += (i < lives) ? '♥ ' : '♡ ';
    }
    hudLives.textContent = heartsStr.trim();
  }

  function startGame() {
    score = 0;
    level = 1;
    lives = 3;
    spawnTimer = 0;
    screenShake = 0;
    selectedWeaponId = 1;

    lasers = [];
    enemies = [];
    particles = [];

    gameContainer.className = 'game-container stage-1';
    setTimeout(resizeCanvasToContainer, 300);

    player.reset(canvasWidth, canvasHeight);
    updateHUD();
    updateWeaponLockUI();

    hudWeaponName.textContent = WEAPONS[1].name;

    gameState = STATES.PLAYING;
    startScreen.classList.add('hidden');
    pauseScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
  }

  function triggerGameOver() {
    gameState = STATES.GAME_OVER;
    sounds.playGameOver();

    let isNewHigh = false;
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('pixel_defender_highscore', highScore.toString());
      isNewHigh = true;
    }

    finalScoreEl.textContent = score;
    finalLevelEl.textContent = level;
    highScoreEl.textContent = highScore;

    if (isNewHigh) {
      newHighScoreTag.classList.remove('hidden');
    } else {
      newHighScoreTag.classList.add('hidden');
    }

    gameOverScreen.classList.remove('hidden');
  }

  // ------------------------------------------------------------------------
  // 8. MAIN GAME LOOP
  // ------------------------------------------------------------------------
  function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    ctx.save();

    if (screenShake > 0) {
      screenShake -= dt;
      const shakeX = (Math.random() - 0.5) * 16;
      const shakeY = (Math.random() - 0.5) * 16;
      ctx.translate(shakeX, shakeY);
    }

    ctx.fillStyle = '#020208';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    stars.forEach(star => {
      star.update(dt, canvasWidth, canvasHeight);
      star.draw(ctx);
    });

    if (gameState === STATES.PLAYING) {
      handleSpawning(dt);
      player.update(dt, timestamp, keys, selectedWeaponId, lasers, particles, sounds, canvasWidth);

      lasers.forEach(l => l.update(dt, canvasWidth));
      enemies.forEach(e => e.update(dt, canvasHeight));
      particles.forEach(p => p.update(dt));

      checkCollisions();

      lasers = lasers.filter(l => !l.markedForDeletion);
      enemies = enemies.filter(e => !e.markedForDeletion);
      particles = particles.filter(p => !p.markedForDeletion);

      lasers.forEach(l => l.draw(ctx));
      enemies.forEach(e => e.draw(ctx));
      particles.forEach(p => p.draw(ctx));
      player.draw(ctx, selectedWeaponId);

    } else if (gameState === STATES.PAUSED) {
      lasers.forEach(l => l.draw(ctx));
      enemies.forEach(e => e.draw(ctx));
      particles.forEach(p => p.draw(ctx));
      player.draw(ctx, selectedWeaponId);

    } else if (gameState === STATES.START || gameState === STATES.GAME_OVER) {
      particles.forEach(p => { p.update(dt); p.draw(ctx); });
      particles = particles.filter(p => !p.markedForDeletion);
    }

    ctx.restore();
    requestAnimationFrame(gameLoop);
  }

  // Initialization
  sounds.updateUI();
  resizeCanvasToContainer();
  updateHUD();
  requestAnimationFrame(gameLoop);

})();
