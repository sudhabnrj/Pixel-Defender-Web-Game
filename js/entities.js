/* ==========================================================================
   PIXEL DEFENDER — GAME ENTITIES & WEAPONS
   ========================================================================== */

const WEAPONS = {
  1: {
    id: 1,
    name: 'CYAN DUAL',
    reqLevel: 1,
    cooldown: 140, // ms
    description: 'Standard Wing Lasers'
  },
  2: {
    id: 2,
    name: 'PHOENIX SPREAD',
    reqLevel: 3,
    cooldown: 130, // ms
    description: '5-Way Plasma & Drone Fire'
  },
  3: {
    id: 3,
    name: 'HYPER BEAM',
    reqLevel: 6,
    cooldown: 110, // ms
    description: 'Heavy Golden Plasma Beam'
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

// Advanced Spaceship Fighter Jet (Matching Reference Image)
class Player {
  constructor(canvasWidth, canvasHeight) {
    this.width = 56;
    this.height = 48;
    this.x = canvasWidth / 2 - this.width / 2;
    this.y = canvasHeight - 75;
    this.speed = 480;
    this.lastShotTime = 0;
    this.invulnerableTimer = 0;
  }

  reset(canvasWidth, canvasHeight) {
    this.x = canvasWidth / 2 - this.width / 2;
    this.y = canvasHeight - 75;
    this.lastShotTime = 0;
    this.invulnerableTimer = 0;
  }

  update(dt, currentTime, keys, selectedWeaponId, lasers, particles, sounds, canvasWidth) {
    if (keys.left) this.x -= this.speed * dt;
    if (keys.right) this.x += this.speed * dt;

    if (this.x < 10) this.x = 10;
    if (this.x > canvasWidth - this.width - 10) {
      this.x = canvasWidth - this.width - 10;
    }

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
      // Standard Dual Cyan Lasers
      lasers.push(new Laser(this.x + 10, this.y, 0, -750, '#00f0ff', 4, 16));
      lasers.push(new Laser(this.x + this.width - 10, this.y, 0, -750, '#00f0ff', 4, 16));
    } 
    else if (weapon.id === 2) {
      // Phoenix 5-Way Golden Cannon & Option Drone Barrage (Matching Reference Image)
      lasers.push(new Laser(centerX, this.y - 5, 0, -820, '#ffcc00', 8, 24, true)); // Central heavy beam
      lasers.push(new Laser(this.x + 8, this.y + 4, -120, -780, '#ffaa00', 5, 18));
      lasers.push(new Laser(this.x + this.width - 8, this.y + 4, 120, -780, '#ffaa00', 5, 18));
      // Option Drone Support Fire
      lasers.push(new Laser(this.x - 22, this.y + 15, -220, -750, '#ff00aa', 4, 16));
      lasers.push(new Laser(this.x + this.width + 22, this.y + 15, 220, -750, '#ff00aa', 4, 16));
    } 
    else if (weapon.id === 3) {
      // Hyper Beam Barrage
      lasers.push(new Laser(centerX - 6, this.y - 8, 0, -900, '#ffffff', 14, 30, true));
      lasers.push(new Laser(this.x + 4, this.y + 2, -180, -820, '#ffaa00', 6, 20));
      lasers.push(new Laser(this.x + this.width - 4, this.y + 2, 180, -820, '#ffaa00', 6, 20));
      lasers.push(new Laser(this.x - 26, this.y + 12, -320, -780, '#ff00aa', 5, 18));
      lasers.push(new Laser(this.x + this.width + 26, this.y + 12, 320, -780, '#ff00aa', 5, 18));
    }

    // Recoil particles
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

    // Draw Option Drones (Side Pods matching reference image!)
    if (selectedWeaponId >= 2) {
      const droneOffset = 30;

      // Left Drone Pod
      ctx.save();
      ctx.translate(-droneOffset, 15);
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

      // Pink Trail Stream
      ctx.fillStyle = '#ff00aa';
      ctx.fillRect(-2, 8, 4, 12 + Math.random() * 8);
      ctx.restore();

      // Right Drone Pod
      ctx.save();
      ctx.translate(this.width + droneOffset, 15);
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

      // Pink Trail Stream
      ctx.fillStyle = '#ff00aa';
      ctx.fillRect(-2, 8, 4, 12 + Math.random() * 8);
      ctx.restore();
    }

    // Main Thruster Flames
    const flameH = Math.random() * 12 + 14;
    ctx.fillStyle = '#ffaa00';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ffaa00';
    ctx.beginPath();
    ctx.moveTo(this.width / 2 - 8, this.height - 4);
    ctx.lineTo(this.width / 2, this.height - 4 + flameH);
    ctx.lineTo(this.width / 2 + 8, this.height - 4);
    ctx.closePath();
    ctx.fill();

    // Main Ship Body (Red/Orange/Silver Metallic Fighter Jet)
    ctx.fillStyle = '#e65c00'; // Orange hull
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#ffaa00';

    ctx.beginPath();
    // Nose tip
    ctx.moveTo(this.width / 2, 0);
    // Right wing upper
    ctx.lineTo(this.width - 4, this.height - 18);
    // Right wingtip fin
    ctx.lineTo(this.width, this.height - 4);
    // Right wing lower
    ctx.lineTo(this.width - 12, this.height);
    // Center back
    ctx.lineTo(this.width / 2, this.height - 6);
    // Left wing lower
    ctx.lineTo(12, this.height);
    // Left wingtip fin
    ctx.lineTo(0, this.height - 4);
    // Left wing upper
    ctx.lineTo(4, this.height - 18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Metallic Armor Plates & Cannons
    ctx.fillStyle = '#2a2d34';
    ctx.fillRect(this.width / 2 - 14, 14, 6, 22);
    ctx.fillRect(this.width / 2 + 8, 14, 6, 22);

    // Glowing Red/Orange Oval Cockpit Glass
    ctx.fillStyle = '#ff0033';
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#ff0033';
    ctx.beginPath();
    ctx.ellipse(this.width / 2, 22, 6, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffcc00';
    ctx.stroke();

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

class Enemy {
  constructor(lvl, canvasWidth) {
    this.size = Math.random() * 24 + 20;
    this.x = Math.random() * (canvasWidth - this.size * 2) + this.size;
    this.y = -this.size * 2;

    const baseSpeed = Math.random() * 85 + 95;
    const speedMultiplier = 1 + (lvl - 1) * 0.15;
    this.speed = baseSpeed * speedMultiplier;

    this.rotation = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() - 0.5) * 2.5;
    this.markedForDeletion = false;

    this.points = [];
    const numVerts = Math.floor(Math.random() * 3) + 6;
    for (let i = 0; i < numVerts; i++) {
      const angle = (i / numVerts) * Math.PI * 2;
      const variance = Math.random() * 0.35 + 0.8;
      this.points.push({
        x: Math.cos(angle) * this.size * variance,
        y: Math.sin(angle) * this.size * variance
      });
    }

    const rand = Math.random();
    if (rand > 0.7) {
      this.color = '#ff0055'; this.glow = '#ff0055';
    } else if (rand > 0.4) {
      this.color = '#ffaa00'; this.glow = '#ffaa00';
    } else {
      this.color = '#aa00ff'; this.glow = '#aa00ff';
    }
  }

  update(dt, canvasHeight) {
    this.y += this.speed * dt;
    this.rotation += this.rotSpeed * dt;
    if (this.y > canvasHeight + this.size * 2) {
      this.markedForDeletion = true;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    ctx.fillStyle = '#0a0514';
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.glow;

    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.moveTo(this.points[0].x * 0.4, this.points[0].y * 0.4);
    ctx.lineTo(this.points[2].x * 0.5, this.points[2].y * 0.5);
    ctx.stroke();

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
