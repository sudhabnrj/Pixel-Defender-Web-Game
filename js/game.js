/* ==========================================================================
   PIXEL DEFENDER — MAIN GAME ENGINE (8-WAY MOVEMENT & DYNAMIC MODE BACKGROUNDS)
   ========================================================================== */

(function () {
  'use strict';

  // ------------------------------------------------------------------------
  // 1. DOM & CANVAS SETUP
  // ------------------------------------------------------------------------
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const gameContainer = document.getElementById('gameContainer');
  const gameWrapper = document.querySelector('.game-wrapper');

  let canvasWidth = 760;
  let canvasHeight = 570;

  const sounds = new SoundSystem();
  let selectedWeaponId = 1;

  function resizeCanvasToContainer() {
    const rect = gameContainer.getBoundingClientRect();
    canvasWidth = Math.floor(rect.width);
    canvasHeight = Math.floor(rect.height);
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    if (player) {
      player.updateDimensions(selectedWeaponId);
      if (player.x > canvasWidth - player.width) {
        player.x = canvasWidth - player.width - 10;
      }
    }
  }

  function updateContainerSizeForLevel(lvl) {
    resizeCanvasToContainer();
  }

  const GALAXY_WORLDS = [
    { id: 1, name: "WORLD 1 — PIXEL GALAXY", range: "Levels 1–10", minLvl: 1, maxLvl: 10, bg: "images/bg-theme/Pixel-Galaxy.webp" },
    { id: 2, name: "WORLD 2 — RED NEBULA", range: "Levels 11–20", minLvl: 11, maxLvl: 20, bg: "images/bg-theme/Red-Nebula.webp" },
    { id: 3, name: "WORLD 3 — ALIEN SECTOR", range: "Levels 21–30", minLvl: 21, maxLvl: 30, bg: "images/bg-theme/Alien-Sector.webp" },
    { id: 4, name: "WORLD 4 — BLACK HOLE", range: "Levels 31–40", minLvl: 31, maxLvl: 40, bg: "images/bg-theme/Black-Hole.webp" },
    { id: 5, name: "WORLD 5 — CYBER SPACE", range: "Levels 41–50", minLvl: 41, maxLvl: 50, bg: "images/bg-theme/Cyber-Space.webp" },
    { id: 6, name: "WORLD 6 — ICE GALAXY", range: "Levels 51–60", minLvl: 51, maxLvl: 60, bg: "images/bg-theme/Ice-Galaxy.webp" },
    { id: 7, name: "WORLD 7 — DESTROYED EARTH", range: "Levels 61–70", minLvl: 61, maxLvl: 70, bg: "images/bg-theme/Destroyed-Earth.webp" },
    { id: 8, name: "WORLD 8 — DARK DIMENSION", range: "Levels 71–80", minLvl: 71, maxLvl: 80, bg: "images/bg-theme/Dark-Dimension.webp" },
    { id: 9, name: "WORLD 9 — ALIEN EMPIRE", range: "Levels 81–90", minLvl: 81, maxLvl: 90, bg: "images/bg-theme/Alien-Empire.webp" },
    { id: 10, name: "WORLD 10 — FINAL GALAXY", range: "Levels 91–100", minLvl: 91, maxLvl: 100, bg: "images/bg-theme/Final-Galaxy.webp" }
  ];

  let currentWorldId = 0;

  function updateWorldBackground(lvl, forceBanner = false) {
    const safeLvl = Math.max(1, Math.min(100, lvl));
    const world = GALAXY_WORLDS.find(w => safeLvl >= w.minLvl && safeLvl <= w.maxLvl) || GALAXY_WORLDS[0];

    const bgUrl = `url("${encodeURI(world.bg)}")`;
    if (gameContainer) gameContainer.style.backgroundImage = bgUrl;
    if (gameWrapper) gameWrapper.style.backgroundImage = bgUrl;

    if (world.id !== currentWorldId || forceBanner) {
      currentWorldId = world.id;
      showBanner(`🌌 ${world.name} (${world.range})`);
    }
    return world;
  }

  function showBanner(text, isDanger = false) {
    const banner = document.getElementById('bannerNotif');
    if (!banner) return;
    banner.textContent = text;
    if (isDanger) banner.classList.add('danger-banner');
    else banner.classList.remove('danger-banner');

    banner.classList.add('show');
    setTimeout(() => {
      banner.classList.remove('show');
      banner.classList.remove('danger-banner');
    }, 3600);
  }

  function triggerDangerBossAlert() {
    sounds.playDangerSiren();
    showBanner('⚠️ DANGER DETECTED! DANGER SHIP BOSS APPROACHING! ⚠️', true);

    const dangerOverlay = document.getElementById('dangerOverlay');
    if (dangerOverlay) {
      dangerOverlay.classList.add('active');
      setTimeout(() => { dangerOverlay.classList.remove('active'); }, 3000);
    }
  }

  window.addEventListener('resize', resizeCanvasToContainer);

  // HUD & UI Elements
  const hudScore = document.getElementById('hudScore');
  const hudLevel = document.getElementById('hudLevel');
  const hudLives = document.getElementById('hudLives');
  const hudModeBadge = document.getElementById('hudModeBadge');
  const hudWeaponName = document.getElementById('hudWeaponName');
  const hudWeaponImg = document.getElementById('hudWeaponImg');
  const hudUserBadge = document.getElementById('hudUserBadge');

  const startScreen = document.getElementById('startScreen');
  const pauseScreen = document.getElementById('pauseScreen');
  const gameOverScreen = document.getElementById('gameOverScreen');
  const victoryScreen = document.getElementById('victoryScreen');
  const victoryScore = document.getElementById('victoryScore');
  const victoryHighScore = document.getElementById('victoryHighScore');
  const guestConvertBox = document.getElementById('guestConvertBox');

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
    GAME_OVER: 'GAME_OVER',
    VICTORY: 'VICTORY'
  };

  let gameState = STATES.START;
  let score = 0;
  let level = 1;
  let lives = 3;
  let currentMode = 'EASY';
  let highScore = parseInt(localStorage.getItem('pixel_defender_highscore') || '0', 10);
  let lastTime = 0;
  let spawnTimer = 0;
  let megaStoneSpawnTimer = 0;
  let sideAttackSpawnTimer = 0;
  let shieldItemSpawnTimer = 0;
  let screenShake = 0;

  const stars = Array.from({ length: 80 }, () => new Star(canvasWidth, canvasHeight));
  const player = new Player(canvasWidth, canvasHeight);
  let lasers = [];
  let enemyLasers = [];
  let enemies = [];
  let megaStones = [];
  let sideAttackShips = [];
  let shieldItems = [];
  let particles = [];

  // ------------------------------------------------------------------------
  // 3. 8-WAY INPUT HANDLING & QUIT GAME
  // ------------------------------------------------------------------------
  const keys = { left: false, right: false, up: false, down: false, shoot: false };

  window.addEventListener('keydown', (e) => {
    if (['Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyA', 'KeyD', 'KeyW', 'KeyS'].includes(e.code)) {
      if (document.activeElement.tagName !== 'INPUT') {
        e.preventDefault();
      }
    }

    if (document.activeElement.tagName === 'INPUT') return;

    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = true;
    if (e.code === 'ArrowUp' || e.code === 'KeyW') keys.up = true;
    if (e.code === 'ArrowDown' || e.code === 'KeyS') keys.down = true;

    if (e.code === 'Digit1') selectWeapon(1);
    if (e.code === 'Digit2') selectWeapon(2);
    if (e.code === 'Digit3') selectWeapon(3);

    if (e.code === 'KeyP' || e.code === 'Escape') togglePause();
    if (e.code === 'KeyC') toggleControls();
    if (e.code === 'KeyM') { sounds.init(); sounds.toggleMute(); }


    if (e.code === 'KeyR') {
      if (gameState === STATES.PLAYING || gameState === STATES.PAUSED || gameState === STATES.GAME_OVER || gameState === STATES.VICTORY) {
        sounds.init(); startGame();
      }
    }

    if (e.code === 'Space') {
      keys.shoot = true;
      if (gameState === STATES.START || gameState === STATES.GAME_OVER || gameState === STATES.VICTORY) {
        startGame();
      }
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
    if (e.code === 'ArrowUp' || e.code === 'KeyW') keys.up = false;
    if (e.code === 'ArrowDown' || e.code === 'KeyS') keys.down = false;
    if (e.code === 'Space') keys.shoot = false;
  });

  function selectWeapon(wId) {
    const wDef = WEAPONS[wId];
    if (!wDef) return;

    if (level < wDef.reqLevel) {
      showBanner(`LOCKED! ${wDef.name} UNLOCKS AT LEVEL ${wDef.reqLevel}`);
      return;
    }

    selectedWeaponId = wId;
    player.updateDimensions(selectedWeaponId);

    hudWeaponName.textContent = wDef.name;
    if (hudWeaponImg) {
      hudWeaponImg.src = `images/char${wId}.webp`;
    }

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

  startBtn.addEventListener('click', () => { sounds.init(); startGame(); });
  resumeBtn.addEventListener('click', () => { togglePause(); });
  restartBtn.addEventListener('click', () => { sounds.init(); startGame(); });

  const controlsModal = document.getElementById('controlsModal');
  const closeControlsBtn = document.getElementById('closeControlsBtn');
  let previousStateBeforeControls = null;

  function toggleControls(forceOpen) {
    if (!controlsModal) return;
    const isHidden = controlsModal.classList.contains('hidden');
    const shouldOpen = forceOpen !== undefined ? forceOpen : isHidden;

    if (shouldOpen) {
      if (gameState === STATES.PLAYING) {
        previousStateBeforeControls = STATES.PLAYING;
        gameState = STATES.PAUSED;
      } else {
        previousStateBeforeControls = gameState;
      }
      controlsModal.classList.remove('hidden');
    } else {
      controlsModal.classList.add('hidden');
      if (previousStateBeforeControls === STATES.PLAYING && gameState === STATES.PAUSED) {
        gameState = STATES.PLAYING;
      }
      previousStateBeforeControls = null;
    }
  }

  document.querySelectorAll('.js-controls-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleControls(true);
    });
  });

  if (closeControlsBtn) {
    closeControlsBtn.addEventListener('click', () => {
      toggleControls(false);
    });
  }

  document.querySelectorAll('.js-pause-btn').forEach(btn => {
    btn.addEventListener('click', () => { togglePause(); });
  });

  document.querySelectorAll('.js-restart-btn').forEach(btn => {
    btn.addEventListener('click', () => { sounds.init(); startGame(); });
  });

  document.querySelectorAll('.js-audio-btn').forEach(btn => {
    btn.addEventListener('click', () => { sounds.init(); sounds.toggleMute(); });
  });

  document.querySelectorAll('.js-quit-btn').forEach(btn => {
    btn.addEventListener('click', () => { quitGame(); });
  });


  function quitGame() {
    gameState = STATES.START;
    gameContainer.className = 'game-container stage-1 mode-easy';
    if (gameWrapper) gameWrapper.className = 'game-wrapper mode-easy';
    setTimeout(resizeCanvasToContainer, 300);

    pauseScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    if (victoryScreen) victoryScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
  }

  function togglePause() {
    if (gameState === STATES.PLAYING) {
      gameState = STATES.PAUSED;
      if (window.authManager) {
        authManager.updateUserUI(authManager.user ? (authManager.user.name || authManager.user.displayName || '') : 'Guest Player', '');
      }
      pauseScreen.classList.remove('hidden');
      updateWeaponLockUI();
    } else if (gameState === STATES.PAUSED) {
      gameState = STATES.PLAYING;
      pauseScreen.classList.add('hidden');
      resizeCanvasToContainer();
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
  // 5. DIFFICULTY MODES & DYNAMIC BACKGROUND SWITCHING (bg-easy, bg-medium, bg-hard)
  // ------------------------------------------------------------------------
  function checkDifficultyMode() {
    let newMode = 'EASY';
    if (score >= 5000) {
      newMode = 'HARD';
    } else if (score >= 2000) {
      newMode = 'MEDIUM';
    }

    if (newMode !== currentMode) {
      currentMode = newMode;
      showBanner(`DIFFICULTY MODE: ${currentMode}!`);

      // Switch mode background class dynamically!
      const modeClass = `mode-${currentMode.toLowerCase()}`;
      if (gameWrapper) {
        gameWrapper.className = `game-wrapper ${modeClass}`;
      }
      gameContainer.className = gameContainer.className.replace(/mode-(easy|medium|hard)/g, '') + ` ${modeClass}`;

      updateHUD();
    }
  }

  // ------------------------------------------------------------------------
  // 6. COLLISION DETECTION
  // ------------------------------------------------------------------------
  function checkCollisions() {
    const pCenterX = player.x + player.width / 2;
    const pCenterY = player.y + player.height / 2;

    for (let s = shieldItems.length - 1; s >= 0; s--) {
      const item = shieldItems[s];
      const dx = pCenterX - item.x;
      const dy = pCenterY - item.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < item.size + player.width * 0.4) {
        item.markedForDeletion = true;
        player.shieldHp = 2;
        sounds.playShieldPickup();
        showBanner('🛡️ PROTECTIVE FORCEFIELD SHIELD ACTIVATED!');
        createExplosion(item.x, item.y, '#00ffff', 25);
      }
    }

    for (let l = lasers.length - 1; l >= 0; l--) {
      const laser = lasers[l];

      for (let e = enemies.length - 1; e >= 0; e--) {
        const enemy = enemies[e];
        const dx = laser.x - enemy.x;
        const dy = laser.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < enemy.size + laser.width) {
          if (!laser.isCentral) laser.markedForDeletion = true;
          enemy.hp -= 1;
          enemy.hitFlashTimer = 0.08;

          createExplosion(laser.x, laser.y, enemy.isDanger ? '#ff0055' : '#ffaa00', 5);

          if (enemy.hp <= 0) {
            enemy.markedForDeletion = true;
            score += 100;
            checkDifficultyMode();
            updateHUD();

            const newLevel = Math.min(100, Math.floor(score / 1200) + 1);
            if (newLevel > level) {
              level = newLevel;
              sounds.playLevelUp();
              updateHUD();

              updateContainerSizeForLevel(level);
              updateWorldBackground(level);
              updateWeaponLockUI();

              if (level === 5) {
                selectWeapon(2);
                showBanner('AUTOMATIC UPGRADE: HERO EVOLVED TO PHOENIX SPREAD!');
              } else if (level === 10) {
                selectWeapon(3);
                showBanner('AUTOMATIC UPGRADE: HERO EVOLVED TO HYPER BEAM!');
              }

              createExplosion(canvasWidth / 2, canvasHeight / 3, '#ffaa00', 45, true);

              if (level === 100 && score >= 1200 * 99 + 100) {
                triggerVictory();
                return;
              }
            }

            createExplosion(enemy.x, enemy.y, enemy.isDanger ? '#ff0055' : '#ffaa00', 18);
          }
          break;
        }
      }

      for (let ms = megaStones.length - 1; ms >= 0; ms--) {
        const stone = megaStones[ms];
        const dx = laser.x - stone.x;
        const dy = laser.y - stone.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < stone.width / 2 + laser.width) {
          if (!laser.isCentral) laser.markedForDeletion = true;
          stone.hp -= 1;
          stone.hitFlashTimer = 0.08;

          createExplosion(laser.x, laser.y, '#ff00aa', 6);

          if (stone.hp <= 0) {
            stone.markedForDeletion = true;
            score += 500;
            lives = Math.min(5, lives + 1);
            sounds.playLevelUp();

            showBanner('DANGER SHIP DESTROYED! +500 PTS & +1 EXTRA LIFE!');
            createExplosion(stone.x, stone.y, '#ff00aa', 75, true);
            updateHUD();
          }
          break;
        }
      }

      for (let sa = sideAttackShips.length - 1; sa >= 0; sa--) {
        const sideShip = sideAttackShips[sa];
        const dx = laser.x - sideShip.x;
        const dy = laser.y - sideShip.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < sideShip.width / 2 + laser.width) {
          if (!laser.isCentral) laser.markedForDeletion = true;
          sideShip.hp -= 1;
          sideShip.hitFlashTimer = 0.08;

          createExplosion(laser.x, laser.y, '#ff00aa', 6);

          if (sideShip.hp <= 0) {
            sideShip.markedForDeletion = true;
            score += 300;
            sounds.playLevelUp();

            showBanner('RIGHT-SIDE DANGER SHIP DESTROYED! +300 PTS!');
            createExplosion(sideShip.x, sideShip.y, '#ff00aa', 55, true);
            updateHUD();
          }
          break;
        }
      }
    }

    if (player.invulnerableTimer <= 0) {

      for (let el = enemyLasers.length - 1; el >= 0; el--) {
        const eLaser = enemyLasers[el];
        const dx = pCenterX - eLaser.x;
        const dy = pCenterY - eLaser.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < player.width * 0.45) {
          eLaser.markedForDeletion = true;

          if (player.shieldHp > 0) {
            player.shieldHp -= 1;
            sounds.playShieldHit();
            screenShake = 0.15;
            player.invulnerableTimer = 0.6;
            createExplosion(eLaser.x, eLaser.y, '#00ffff', 18);
            if (player.shieldHp === 0) {
              showBanner('🛡️ FORCEFIELD SHIELD SHATTERED!');
            }
          } else {
            lives--;
            updateHUD();
            sounds.playHit();
            screenShake = 0.3;
            player.invulnerableTimer = 1.5;
            createExplosion(eLaser.x, eLaser.y, '#ff0055', 20, true);
            if (lives <= 0) triggerGameOver();
          }
          break;
        }
      }

      for (let e = enemies.length - 1; e >= 0; e--) {
        const enemy = enemies[e];
        const dx = pCenterX - enemy.x;
        const dy = pCenterY - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < enemy.size + player.width * 0.4) {
          enemy.markedForDeletion = true;

          if (player.shieldHp > 0) {
            player.shieldHp -= 1;
            sounds.playShieldHit();
            screenShake = 0.2;
            player.invulnerableTimer = 0.8;
            createExplosion(enemy.x, enemy.y, '#00ffff', 24, true);
            if (player.shieldHp === 0) {
              showBanner('🛡️ FORCEFIELD SHIELD SHATTERED!');
            }
          } else {
            lives--;
            updateHUD();
            sounds.playHit();
            screenShake = 0.3;
            player.invulnerableTimer = 1.5;
            createExplosion(enemy.x, enemy.y, '#ff0055', 26, true);
            if (lives <= 0) triggerGameOver();
          }
          break;
        }
      }
    }
  }

  // ------------------------------------------------------------------------
  // 7. SPAWNING SYSTEM
  // ------------------------------------------------------------------------
  function handleSpawning(dt, timestamp) {
    const baseInterval = currentMode === 'HARD' ? 0.7 : (currentMode === 'MEDIUM' ? 0.9 : 1.15);
    const minInterval = 0.38;
    const currentInterval = Math.max(minInterval, baseInterval - (level - 1) * 0.007);

    spawnTimer += dt;
    if (spawnTimer >= currentInterval) {
      spawnTimer = 0;
      enemies.push(new Enemy(level, currentMode, canvasWidth));
    }

    megaStoneSpawnTimer += dt;
    const megaInterval = currentMode === 'HARD' ? 14 : (currentMode === 'MEDIUM' ? 18 : 24);
    if (megaStoneSpawnTimer >= megaInterval && megaStones.length === 0) {
      megaStoneSpawnTimer = 0;
      megaStones.push(new MegaStone(level, canvasWidth));
      triggerDangerBossAlert();
    }

    sideAttackSpawnTimer += dt;
    const sideInterval = currentMode === 'HARD' ? 12 : (currentMode === 'MEDIUM' ? 16 : 22);
    if (sideAttackSpawnTimer >= sideInterval && sideAttackShips.length === 0) {
      sideAttackSpawnTimer = 0;
      sideAttackShips.push(new SideAttackShip(level, canvasWidth));
      showBanner('⚠️ WARNING: RIGHT-SIDE DANGER SHIP APPROACHING!', true);
    }

    shieldItemSpawnTimer += dt;
    if (shieldItemSpawnTimer >= 75 && shieldItems.length === 0) {
      shieldItemSpawnTimer = 0;
      shieldItems.push(new ShieldItem(canvasWidth));
    }
  }

  // ------------------------------------------------------------------------
  // 8. HUD & LIFECYCLE MANAGEMENT
  // ------------------------------------------------------------------------
  function updateHUD() {
    hudScore.textContent = score.toString().padStart(6, '0');
    hudLevel.textContent = level;

    hudModeBadge.textContent = currentMode;
    hudModeBadge.className = `mode-badge ${currentMode.toLowerCase()}`;

    if (hudLives) {
      hudLives.innerHTML = '';
      const displayCount = Math.max(3, lives);
      for (let i = 0; i < displayCount; i++) {
        const img = document.createElement('img');
        img.src = 'images/helth.png';
        img.alt = 'Health Kit';
        img.className = 'health-kit-icon' + (i >= lives ? ' lost' : '');
        hudLives.appendChild(img);
      }
    }
  }

  function startGame() {
    score = 0;
    level = 1;
    lives = 3;
    currentMode = 'EASY';
    spawnTimer = 0;
    megaStoneSpawnTimer = 0;
    sideAttackSpawnTimer = 0;
    shieldItemSpawnTimer = 0;
    screenShake = 0;
    selectedWeaponId = 1;

    lasers = [];
    enemyLasers = [];
    enemies = [];
    megaStones = [];
    sideAttackShips = [];
    shieldItems = [];
    particles = [];

    if (gameWrapper) gameWrapper.className = 'game-wrapper';
    gameContainer.className = 'game-container';
    updateWorldBackground(1, true);
    resizeCanvasToContainer();

    player.reset(canvasWidth, canvasHeight);
    updateHUD();
    updateWeaponLockUI();

    hudWeaponName.textContent = WEAPONS[1].name;
    if (hudWeaponImg) hudWeaponImg.src = 'images/char1.webp';

    gameState = STATES.PLAYING;
    startScreen.classList.add('hidden');
    pauseScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    if (victoryScreen) victoryScreen.classList.add('hidden');
  }

  window.startGame = startGame;

  function triggerVictory() {
    gameState = STATES.VICTORY;
    sounds.playLevelUp();

    if (score > highScore) {
      highScore = score;
      localStorage.setItem('pixel_defender_highscore', highScore.toString());
    }

    if (window.authManager) {
      authManager.saveHighScore(score);
    }

    if (victoryScore) victoryScore.textContent = score;
    if (victoryHighScore) victoryHighScore.textContent = highScore;
    if (victoryScreen) victoryScreen.classList.remove('hidden');
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

    if (window.authManager) {
      authManager.saveHighScore(score);
    }

    finalScoreEl.textContent = score;
    finalLevelEl.textContent = level;
    highScoreEl.textContent = highScore;

    if (isNewHigh) newHighScoreTag.classList.remove('hidden');
    else newHighScoreTag.classList.add('hidden');

    const isRegistered = window.authManager && (window.authManager.isUserRegistered ? window.authManager.isUserRegistered() : !window.authManager.isGuest);
    if (guestConvertBox) {
      if (!isRegistered) {
        guestConvertBox.classList.remove('hidden');
      } else {
        guestConvertBox.classList.add('hidden');
      }
    }

    gameOverScreen.classList.remove('hidden');
  }

  // ------------------------------------------------------------------------
  // 9. MAIN GAME LOOP
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

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    stars.forEach(star => {
      star.update(dt, canvasWidth, canvasHeight);
      star.draw(ctx);
    });

    if (gameState === STATES.PLAYING) {
      handleSpawning(dt, timestamp);
      player.update(dt, timestamp, keys, selectedWeaponId, lasers, particles, sounds, canvasWidth, canvasHeight);

      lasers.forEach(l => l.update(dt, canvasWidth));
      enemyLasers.forEach(el => el.update(dt, canvasHeight));
      enemies.forEach(e => e.update(dt, canvasHeight));
      megaStones.forEach(ms => ms.update(dt, timestamp, enemyLasers, canvasHeight, canvasWidth, currentMode));
      sideAttackShips.forEach(sas => sas.update(dt, timestamp, enemyLasers, canvasHeight, currentMode));
      shieldItems.forEach(si => si.update(dt, canvasHeight));
      particles.forEach(p => p.update(dt));

      checkCollisions();

      lasers = lasers.filter(l => !l.markedForDeletion);
      enemyLasers.forEach(el => el.draw(ctx));
      enemies = enemies.filter(e => !e.markedForDeletion);
      megaStones = megaStones.filter(ms => !ms.markedForDeletion);
      sideAttackShips = sideAttackShips.filter(sas => !sas.markedForDeletion);
      shieldItems = shieldItems.filter(si => !si.markedForDeletion);
      particles = particles.filter(p => !p.markedForDeletion);

      lasers.forEach(l => l.draw(ctx));
      enemies.forEach(e => e.draw(ctx));
      megaStones.forEach(ms => ms.draw(ctx, currentMode));
      sideAttackShips.forEach(sas => sas.draw(ctx));
      shieldItems.forEach(si => si.draw(ctx));
      particles.forEach(p => p.draw(ctx));
      player.draw(ctx, selectedWeaponId);

    } else if (gameState === STATES.PAUSED || gameState === STATES.VICTORY) {
      lasers.forEach(l => l.draw(ctx));
      enemyLasers.forEach(el => el.draw(ctx));
      enemies.forEach(e => e.draw(ctx));
      megaStones.forEach(ms => ms.draw(ctx, currentMode));
      sideAttackShips.forEach(sas => sas.draw(ctx));
      shieldItems.forEach(si => si.draw(ctx));
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
  updateWorldBackground(1, true);
  resizeCanvasToContainer();
  updateHUD();
  requestAnimationFrame(gameLoop);

})();
