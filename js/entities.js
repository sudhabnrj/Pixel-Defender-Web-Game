/* ==========================================================================
   PIXEL DEFENDER — GAME ENTITIES & LARGER CHARACTER SCALING
   ========================================================================== */

// Preload Character, Background & Stone Assets
const char1Image = new Image(); char1Image.src = 'images/char1.webp';
const char2Image = new Image(); char2Image.src = 'images/char2.webp';
const char3Image = new Image(); char3Image.src = 'images/char3.webp';

const bgEasyImg = new Image(); bgEasyImg.src = 'images/bg-easy.webp';
const bgMediumImg = new Image(); bgMediumImg.src = 'images/bg-medium.webp';
const bgHardImg = new Image(); bgHardImg.src = 'images/bg-hard.webp';

// Danger Ship Images for Levels 1–50
const dangerShipImages = {
  easy: new Image(),
  easy8: new Image(),
  medium: new Image(),
  hard: new Image(),
  easy6: new Image(),
  easy5: new Image(),
  easy4: new Image(),
  easy9: new Image(),
  easy7: new Image()
};
dangerShipImages.easy.src = 'images/danger-ship-easy.webp';
dangerShipImages.easy8.src = 'images/danger-ship-easy8.webp';
dangerShipImages.medium.src = 'images/danger-ship-medium.webp';
dangerShipImages.hard.src = 'images/danger-ship-hard.webp';
dangerShipImages.easy6.src = 'images/danger-ship-easy6.webp';
dangerShipImages.easy5.src = 'images/danger-ship-easy5.webp';
dangerShipImages.easy4.src = 'images/danger-ship-easy4.webp';
dangerShipImages.easy9.src = 'images/danger-ship-easy9.webp';
dangerShipImages.easy7.src = 'images/danger-ship-easy7.webp';

// Preload Group Stone Sprite
const stoneGroupImg = new Image();
stoneGroupImg.src = 'images/stone-group.webp';

// Preload Custom Stone WebP Sprites
const stoneImages = [];
for (let i = 1; i <= 9; i++) {
  const img = new Image();
  img.src = `images/stone${i}.webp`;
  stoneImages.push(img);
}
const dangerStoneImage = new Image();
dangerStoneImage.src = 'images/stone-danger.webp';

const WEAPONS = {
  1: {
    id: 1,
    name: 'NORMAL - BLASTER',
    reqLevel: 1,
    cooldown: 140, // ms
    description: 'Standard Blaster Rifle'
  },
  2: {
    id: 2,
    name: 'PHOENIX SPREAD',
    reqLevel: 11,
    cooldown: 130, // ms
    description: '5-Way Plasma & Drone Cannon'
  },
  3: {
    id: 3,
    name: 'ADVANCE - HYPER BEAM',
    reqLevel: 26,
    cooldown: 110, // ms
    description: 'Heavy Advance Plasma Beam'
  }
};

class Star {
  constructor(canvasWidth, canvasHeight) { 
    this.reset(true, canvasWidth, canvasHeight); 
  }

  reset(randomY = false, canvasWidth = 800, canvasHeight = 600) {
    this.x = Math.random() * canvasWidth;
    this.y = randomY ? Math.random() * canvasHeight : 0;
    this.size = Math.random() * 2 + 0.5;
    this.speed = Math.random() * 70 + 20;
    this.alpha = Math.random() * 0.7 + 0.3;
    this.color = Math.random() > 0.3 ? '#ffffff' : (Math.random() > 0.5 ? '#ffaa00' : '#ff00aa');
  }

  update(dt, canvasWidth, canvasHeight) {
    this.y += this.speed * dt;
    if (this.y > canvasHeight) this.reset(false, canvasWidth, canvasHeight);
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.size, this.size);
    ctx.restore();
  }
}

// Shield Power-up Capsule Item
class ShieldItem {
  constructor(canvasWidth) {
    this.size = 26;
    this.x = Math.random() * (canvasWidth - this.size * 2) + this.size;
    this.y = -this.size * 2;
    this.speed = 100;
    this.markedForDeletion = false;
    this.pulseAngle = 0;
  }

  update(dt, canvasHeight) {
    this.y += this.speed * dt;
    this.pulseAngle += 4 * dt;
    if (this.y > canvasHeight + this.size * 2) {
      this.markedForDeletion = true;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    const glowSize = Math.sin(this.pulseAngle) * 3 + 15;
    ctx.fillStyle = 'rgba(0, 240, 255, 0.25)';
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00f0ff';

    ctx.beginPath();
    ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(9, -4);
    ctx.lineTo(7, 6);
    ctx.lineTo(0, 11);
    ctx.lineTo(-7, 6);
    ctx.lineTo(-9, -4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }
}

// Hero Character Defender (Larger Character Sizes: Normal 80x86, Medium 98x104, Hard 116x122)
class Player {
  constructor(canvasWidth, canvasHeight) {
    this.width = 80;
    this.height = 86;
    this.x = canvasWidth / 2 - this.width / 2;
    this.y = canvasHeight - 110;
    this.speed = 480;
    this.lastShotTime = 0;
    this.invulnerableTimer = 0;
    this.shieldHp = 0;
  }

  reset(canvasWidth, canvasHeight) {
    this.width = 80;
    this.height = 86;
    this.x = canvasWidth / 2 - this.width / 2;
    this.y = canvasHeight - 110;
    this.lastShotTime = 0;
    this.invulnerableTimer = 0;
    this.shieldHp = 0;
  }

  updateDimensions(selectedWeaponId) {
    if (selectedWeaponId === 3) {
      this.width = 116;
      this.height = 122;
    } else if (selectedWeaponId === 2) {
      this.width = 98;
      this.height = 104;
    } else {
      this.width = 80;
      this.height = 86;
    }
  }

  update(dt, currentTime, keys, selectedWeaponId, lasers, particles, sounds, canvasWidth, canvasHeight) {
    this.updateDimensions(selectedWeaponId);

    if (keys.left) this.x -= this.speed * dt;
    if (keys.right) this.x += this.speed * dt;
    if (keys.up) this.y -= this.speed * dt;
    if (keys.down) this.y += this.speed * dt;

    if (this.x < 10) this.x = 10;
    if (this.x > canvasWidth - this.width - 10) {
      this.x = canvasWidth - this.width - 10;
    }

    const minY = canvasHeight * 0.38;
    const maxY = canvasHeight - this.height - 10;
    if (this.y < minY) this.y = minY;
    if (this.y > maxY) this.y = maxY;

    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
    }

    const currentW = WEAPONS[selectedWeaponId] || WEAPONS[1];
    if (keys.shoot && currentTime - this.lastShotTime >= currentW.cooldown) {
      this.shoot(currentTime, currentW, lasers, particles, sounds);
    }
  }

  shoot(currentTime, weapon, lasers, particles, sounds) {
    this.lastShotTime = currentTime;
    sounds.playShoot(weapon.id);

    const centerX = this.x + this.width / 2;

    if (weapon.id === 1) {
      lasers.push(new Laser(centerX - 10, this.y, 0, -780, '#00f0ff', 5, 18));
      lasers.push(new Laser(centerX + 10, this.y, 0, -780, '#00f0ff', 5, 18));
    } 
    else if (weapon.id === 2) {
      lasers.push(new Laser(centerX, this.y - 5, 0, -840, '#ffcc00', 9, 26, true));
      lasers.push(new Laser(this.x + 10, this.y + 4, -130, -780, '#ffaa00', 6, 20));
      lasers.push(new Laser(this.x + this.width - 10, this.y + 4, 130, -780, '#ffaa00', 6, 20));
      lasers.push(new Laser(this.x - 24, this.y + 15, -230, -750, '#ff00aa', 5, 18));
      lasers.push(new Laser(this.x + this.width + 24, this.y + 15, 230, -750, '#ff00aa', 5, 18));
    } 
    else if (weapon.id === 3) {
      lasers.push(new Laser(centerX - 8, this.y - 8, 0, -920, '#ffffff', 16, 32, true));
      lasers.push(new Laser(this.x + 6, this.y + 2, -190, -820, '#ffaa00', 7, 22));
      lasers.push(new Laser(this.x + this.width - 6, this.y + 2, 190, -820, '#ffaa00', 7, 22));
      lasers.push(new Laser(this.x - 28, this.y + 12, -340, -780, '#ff00aa', 6, 20));
      lasers.push(new Laser(this.x + this.width + 28, this.y + 12, 340, -780, '#ff00aa', 6, 20));
    }

    for (let i = 0; i < 4; i++) {
      particles.push(new Particle(
        centerX, this.y + this.height, 
        (Math.random() - 0.5) * 50, Math.random() * 90 + 110, 
        '#ffaa00', Math.random() * 3 + 2, 0.25
      ));
    }
  }

  draw(ctx, selectedWeaponId) {
    if (this.invulnerableTimer > 0 && Math.floor(Date.now() / 80) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);

    if (selectedWeaponId >= 2) {
      const droneOffset = 38;

      ctx.save();
      ctx.translate(-droneOffset, 20);
      ctx.fillStyle = '#ff6600';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ff6600';
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(8, 8);
      ctx.lineTo(-8, 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ff00aa';
      ctx.fillRect(-2, 8, 4, 12 + Math.random() * 8);
      ctx.restore();

      ctx.save();
      ctx.translate(this.width + droneOffset, 20);
      ctx.fillStyle = '#ff6600';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ff6600';
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(8, 8);
      ctx.lineTo(-8, 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ff00aa';
      ctx.fillRect(-2, 8, 4, 12 + Math.random() * 8);
      ctx.restore();
    }

    if (this.shieldHp > 0) {
      ctx.save();
      const time = Date.now() / 150;
      const shieldRadius = Math.max(this.width, this.height) * 0.72 + Math.sin(time) * 3;
      ctx.fillStyle = 'rgba(0, 240, 255, 0.18)';
      ctx.strokeStyle = this.shieldHp > 1 ? '#00ffff' : '#ffaa00';
      ctx.lineWidth = 3;
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#00f0ff';

      ctx.beginPath();
      ctx.arc(this.width / 2, this.height / 2, shieldRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      for (let i = 0; i < 3; i++) {
        const orbitAngle = time + (i * Math.PI * 2 / 3);
        const nodeX = this.width / 2 + Math.cos(orbitAngle) * shieldRadius;
        const nodeY = this.height / 2 + Math.sin(orbitAngle) * shieldRadius;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(nodeX, nodeY, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    let charSprite = char1Image;
    if (selectedWeaponId === 2) charSprite = char2Image;
    else if (selectedWeaponId === 3) charSprite = char3Image;

    if (charSprite.complete && charSprite.naturalWidth !== 0) {
      ctx.shadowBlur = 15;
      ctx.shadowColor = selectedWeaponId === 3 ? '#ffaa00' : (selectedWeaponId === 2 ? '#ff00aa' : '#00f0ff');
      ctx.drawImage(charSprite, 0, 0, this.width, this.height);
    } else {
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(0, 0, this.width, this.height);
    }

    ctx.restore();
  }
}

class Laser {
  constructor(x, y, vx = 0, vy = -750, color = '#00f0ff', width = 4, height = 16, isCentral = false) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.width = width;
    this.height = height;
    this.isCentral = isCentral;
    this.markedForDeletion = false;
  }

  update(dt, canvasWidth) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.y < -this.height || this.x < -20 || this.x > canvasWidth + 20) {
      this.markedForDeletion = true;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 14;
    ctx.shadowColor = this.color;
    ctx.fillRect(this.x - this.width / 2, this.y, this.width, this.height);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(this.x - Math.max(1, this.width / 4), this.y + 2, Math.max(2, this.width / 2), this.height - 4);
    ctx.restore();
  }
}

class EnemyLaser {
  constructor(x, y, vx = 0, vy = 380) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.width = 6;
    this.height = 18;
    this.markedForDeletion = false;
  }

  update(dt, canvasHeight) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.y > canvasHeight + 20) {
      this.markedForDeletion = true;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.fillStyle = '#ff0055';
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#ff0055';
    ctx.fillRect(this.x - this.width / 2, this.y, this.width, this.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(this.x - 1, this.y + 2, 2, this.height - 4);
    ctx.restore();
  }
}

// Asteroid Enemy
class Enemy {
  constructor(lvl, mode, canvasWidth) {
    this.size = Math.random() * 10 + 16;
    this.x = Math.random() * (canvasWidth - this.size * 2) + this.size;
    this.y = -this.size * 2;

    const baseSpeed = Math.random() * 85 + 95;
    const speedMultiplier = 1 + (lvl - 1) * 0.022;
    this.speed = baseSpeed * speedMultiplier;

    this.rotation = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() - 0.5) * 2.5;
    this.markedForDeletion = false;
    this.hitFlashTimer = 0;

    const isDangerStone = mode === 'HARD' || Math.random() < 0.25;
    if (mode === 'HARD') {
      this.maxHp = isDangerStone ? 4 : 3;
    } else if (mode === 'MEDIUM') {
      this.maxHp = isDangerStone ? 2 : 1;
    } else {
      this.maxHp = 1;
    }
    this.hp = this.maxHp;

    if (isDangerStone && dangerStoneImage.complete) {
      this.spriteImg = dangerStoneImage;
      this.isDanger = true;
    } else {
      const idx = Math.floor(Math.random() * stoneImages.length);
      this.spriteImg = stoneImages[idx];
      this.isDanger = false;
    }
  }

  update(dt, canvasHeight) {
    this.y += this.speed * dt;
    this.rotation += this.rotSpeed * dt;
    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;

    if (this.y > canvasHeight + this.size * 2) {
      this.markedForDeletion = true;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    if (this.hitFlashTimer > 0) {
      ctx.shadowBlur = 25;
      ctx.shadowColor = '#ffffff';
    } else if (this.isDanger) {
      ctx.shadowBlur = 16;
      ctx.shadowColor = '#ff0055';
    } else {
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ffaa00';
    }

    if (this.spriteImg && this.spriteImg.complete && this.spriteImg.naturalWidth !== 0) {
      ctx.drawImage(this.spriteImg, -this.size, -this.size, this.size * 2, this.size * 2);
    } else {
      ctx.fillStyle = this.isDanger ? '#ff0055' : '#ffaa00';
      ctx.beginPath();
      ctx.arc(0, 0, this.size, 0, Math.PI * 2);
      ctx.fill();
    }

    if (this.maxHp > 1) {
      ctx.restore();
      ctx.save();
      const barW = this.size * 1.4;
      const barH = 4;
      const barX = this.x - barW / 2;
      const barY = this.y - this.size - 8;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = this.isDanger ? '#ff0055' : '#ffaa00';
      ctx.fillRect(barX, barY, (this.hp / this.maxHp) * barW, barH);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.8;
      ctx.strokeRect(barX, barY, barW, barH);
    }

    ctx.restore();
  }
}

// Large Group Asteroid (Spawns after Level 10, Harder to destroy)
class GroupStone {
  constructor(lvl, canvasWidth) {
    this.lvl = lvl;
    this.width = 72;
    this.height = 72;
    this.x = Math.random() * (canvasWidth - 140) + 70;
    this.y = -this.height * 1.5;
    this.speed = 115 + (lvl - 1) * 2;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 1.2;

    this.maxHp = 5;
    this.hp = this.maxHp;
    this.hitFlashTimer = 0;
    this.markedForDeletion = false;
  }

  update(dt, canvasHeight) {
    this.y += this.speed * dt;
    this.rotation += this.rotationSpeed * dt;

    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt;
    }

    if (this.y > canvasHeight + this.height * 2) {
      this.markedForDeletion = true;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    if (this.hitFlashTimer > 0) {
      ctx.shadowBlur = 24;
      ctx.shadowColor = '#00ffff';
    } else {
      ctx.shadowBlur = 14;
      ctx.shadowColor = '#ffaa00';
    }

    if (stoneGroupImg.complete && stoneGroupImg.naturalWidth !== 0) {
      ctx.drawImage(stoneGroupImg, -this.width / 2, -this.height / 2, this.width, this.height);
    } else {
      ctx.fillStyle = '#ffaa00';
      ctx.beginPath();
      ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // Render Health Bar
    ctx.save();
    const barW = 56;
    const barH = 5;
    const barX = this.x - barW / 2;
    const barY = this.y - this.height / 2 - 10;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = '#ffaa00';
    ctx.fillRect(barX, barY, (this.hp / this.maxHp) * barW, barH);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);
    ctx.restore();
  }
}

// Shooter Danger Ship Boss
class MegaStone {
  constructor(lvl, canvasWidth) {
    this.lvl = lvl;
    this.width = 90;
    this.height = 90;
    this.x = canvasWidth / 2;
    this.y = -this.height * 2;
    this.targetY = 85;
    this.descendSpeed = 75;

    this.vx = (130 + (lvl - 1) * 2) * (Math.random() > 0.5 ? 1 : -1);
    this.maxHp = Math.min(80, 30 + Math.floor((lvl - 1) * 1.1));
    this.hp = this.maxHp;
    
    this.lastShootTime = 0;
    this.markedForDeletion = false;
    this.hitFlashTimer = 0;
  }

  update(dt, timestamp, enemyLasers, canvasHeight, canvasWidth, currentMode = 'EASY') {
    if (this.y < this.targetY) {
      this.y += this.descendSpeed * dt;
    } else {
      this.x += this.vx * dt;
      if (this.x < 55) {
        this.x = 55;
        this.vx = Math.abs(this.vx);
      } else if (this.x > canvasWidth - 55) {
        this.x = canvasWidth - 55;
        this.vx = -Math.abs(this.vx);
      }
    }

    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt;
    }

    let shootInterval = Math.max(1.2, 1.6 - (this.lvl - 1) * 0.01);
    if (currentMode === 'HARD') {
      shootInterval = Math.max(1.0, 1.3 - (this.lvl - 1) * 0.01);
    } else if (currentMode === 'MEDIUM') {
      shootInterval = Math.max(1.1, 1.45 - (this.lvl - 1) * 0.01);
    }

    if (this.y >= 50 && timestamp / 1000 - this.lastShootTime >= shootInterval) {
      this.lastShootTime = timestamp / 1000;

      if (this.lvl <= 25) {
        // Normal Single Bullet Shooting (Before Level 25 - Straight & Simple)
        enemyLasers.push(new EnemyLaser(this.x, this.y + 40, 0, 380));
      } else {
        // Balanced Multi-Bullet Shooting (After Level 25 - Clean & Fair to Dodge)
        if (currentMode === 'HARD') {
          // Clean 5-bullet fan spread with clear gaps
          enemyLasers.push(new EnemyLaser(this.x, this.y + 40, 0, 420));
          enemyLasers.push(new EnemyLaser(this.x - 20, this.y + 35, -80, 400));
          enemyLasers.push(new EnemyLaser(this.x + 20, this.y + 35, 80, 400));
          enemyLasers.push(new EnemyLaser(this.x - 40, this.y + 30, -160, 380));
          enemyLasers.push(new EnemyLaser(this.x + 40, this.y + 30, 160, 380));
        } else {
          // Clean 3-bullet fan spread with wide gaps
          enemyLasers.push(new EnemyLaser(this.x, this.y + 40, 0, 400));
          enemyLasers.push(new EnemyLaser(this.x - 25, this.y + 35, -70, 380));
          enemyLasers.push(new EnemyLaser(this.x + 25, this.y + 35, 70, 380));
        }
      }
    }
  }

  draw(ctx, mode = 'EASY') {
    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.hitFlashTimer > 0) {
      ctx.shadowBlur = 35;
      ctx.shadowColor = '#00ffff';
    } else {
      ctx.shadowBlur = 25;
      ctx.shadowColor = '#ff0055';
    }

    let shipImg = dangerShipImages.easy;
    if (this.lvl >= 41) shipImg = dangerShipImages.easy7;
    else if (this.lvl >= 36) shipImg = dangerShipImages.easy9;
    else if (this.lvl >= 31) shipImg = dangerShipImages.easy4;
    else if (this.lvl >= 26) shipImg = dangerShipImages.easy5;
    else if (this.lvl >= 21) shipImg = dangerShipImages.easy6;
    else if (this.lvl >= 16) shipImg = dangerShipImages.hard;
    else if (this.lvl >= 11) shipImg = dangerShipImages.medium;
    else if (this.lvl >= 6) shipImg = dangerShipImages.easy8;
    else shipImg = dangerShipImages.easy;

    if (!shipImg.complete || shipImg.naturalWidth === 0) {
      shipImg = dangerShipImages.easy;
    }

    if (shipImg.complete && shipImg.naturalWidth !== 0) {
      ctx.drawImage(shipImg, -this.width / 2, -this.height / 2, this.width, this.height);
    } else {
      ctx.fillStyle = '#ff0055';
      ctx.beginPath();
      ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    ctx.save();
    const barW = 80;
    const barH = 8;
    const barX = this.x - barW / 2;
    const barY = this.y - this.height / 2 - 16;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(barX, barY, barW, barH);

    ctx.fillStyle = this.hp < this.maxHp * 0.3 ? '#ff0055' : '#ffaa00';
    ctx.fillRect(barX, barY, (this.hp / this.maxHp) * barW, barH);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(barX, barY, barW, barH);
    ctx.restore();
  }
}

class Particle {
  constructor(x, y, vx, vy, color, size, life) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy;
    this.color = color; this.size = size;
    this.maxLife = life; this.life = life;
    this.markedForDeletion = false;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    if (this.life <= 0) this.markedForDeletion = true;
  }

  draw(ctx) {
    ctx.save();
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 8;
    ctx.shadowColor = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
