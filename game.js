'use strict';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = 800;
const H = 600;

// ── Input ─────────────────────────────────────────────────────────────────────
const keys = {};
const justPressed = {};

window.addEventListener('keydown', e => {
  justPressed[e.code] = !keys[e.code];
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code))
    e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function pressed(code) {
  const val = justPressed[code];
  justPressed[code] = false;
  return val;
}

// ── Utils ─────────────────────────────────────────────────────────────────────
const wrap  = (v, max) => ((v % max) + max) % max;
const dist  = (a, b)   => Math.hypot(a.x - b.x, a.y - b.y);
const rand  = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));

// ── Bullet ────────────────────────────────────────────────────────────────────
class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    const SPEED = 520;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
    this.ttl  = 1.1;
    this.radius = 2;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Asteroid ──────────────────────────────────────────────────────────────────
const RADII  = [0, 16, 30, 50];   // por tamaño 1, 2, 3
const SPEEDS = [0, 85, 55, 32];   // velocidad base por tamaño
const POINTS = [0, 100, 50, 20];  // puntos por tamaño

class Asteroid {
  constructor(x, y, size = 3) {
    this.x    = x;
    this.y    = y;
    this.size = size;
    this.radius = RADII[size];
    this.dead = false;
    this.points = POINTS[size];

    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size] + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);

    // Polígono irregular
    const n = randInt(8, 13);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt) {
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
  }

  split() {
    if (this.size <= 1) return [];
    return [
      new Asteroid(this.x, this.y, this.size - 1),
      new Asteroid(this.x, this.y, this.size - 1),
    ];
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Estrella fugaz ────────────────────────────────────────────────────────────
const ESTRELLA_COLOR     = '#ffd23f';
const ESTRELLA_SPEED_MIN = 280;   // px/s — mucho más rápido que un asteroide normal
const ESTRELLA_SPEED_MAX = 330;
const ESTRELLA_TTL       = 7;     // segundos en pantalla antes de desvanecerse
const ESTRELLA_POINTS    = 250;   // bonus por destruirla
const ESTRELLA_EVERY_MIN = 10;   // segundos entre apariciones
const ESTRELLA_EVERY_MAX = 15;

class EstrellaFugaz extends Asteroid {
  constructor(x, y, angle) {
    super(x, y, 1);
    this.radius  = 14;
    this.points  = ESTRELLA_POINTS;
    this.ttl     = ESTRELLA_TTL;
    this.special = true;   // excluida del drop del power-up

    const speed = rand(ESTRELLA_SPEED_MIN, ESTRELLA_SPEED_MAX);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
  }

  update(dt) {
    super.update(dt);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;   // se desvanece sola con el tiempo
  }

  split() { return []; }   // no se parte en fragmentos

  draw() {
    // Se apaga gradualmente durante sus últimos 2 segundos
    const alpha = Math.min(1, this.ttl / 2);

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.strokeStyle = ESTRELLA_COLOR;
    ctx.fillStyle   = ESTRELLA_COLOR;
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';

    // Cola: triángulo afinado detrás, alineado con la velocidad
    const n  = Math.hypot(this.vx, this.vy);
    const dx = this.vx / n, dy = this.vy / n;
    const tx = -dx * 42, ty = -dy * 42;      // punta de la cola
    const px = -dy * 4,  py = dx * 4;        // base perpendicular
    ctx.globalAlpha = alpha * 0.35;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(px, py);
    ctx.lineTo(-px, -py);
    ctx.closePath();
    ctx.fill();

    // Estrella de 5 puntas (polígono de 10 vértices)
    ctx.globalAlpha = alpha;
    ctx.rotate(this.rot);
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      const r = i % 2 === 0 ? this.radius : this.radius * 0.45;
      if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else         ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Skins de la nave ──────────────────────────────────────────────────────────
const SKINS = [
  {
    name:   'Clásica',      // silueta original: triángulo con muesca trasera
    stroke: '#fff',
    flame:  'rgba(255, 130, 0, 0.85)',
    verts:  [[20, 0], [-12, -9], [-7, 0], [-12, 9]],
  },
  {
    name:   'Interceptor',  // dardo estrecho con aletas traseras
    stroke: '#4fd8eb',
    flame:  'rgba(120, 230, 255, 0.85)',
    verts:  [[22, 0], [-4, -5], [-14, -11], [-9, -3], [-9, 3], [-14, 11], [-4, 5]],
  },
  {
    name:   'Halcón',       // flecha ancha con morro de puntas gemelas
    stroke: '#ff9a3c',
    flame:  'rgba(255, 60, 30, 0.85)',
    verts:  [[16, -5], [8, 0], [16, 5], [-4, 10], [-12, 5], [-8, 0], [-12, -5], [-4, -10]],
  },
  {
    name:   'Espectro',     // silueta facetada, estilo sigilo
    stroke: '#7dff8a',
    flame:  'rgba(160, 255, 120, 0.85)',
    verts:  [[20, 0], [6, -6], [-6, -11], [-13, -6], [-7, 0], [-13, 6], [-6, 11], [6, 6]],
  },
];

const SKIN_KEY   = 'asteroids-skin';  // clave de localStorage
const SKIN_TOAST = 1.5;               // segundos que se muestra el nombre de la skin

function loadSkin() {
  // localStorage puede lanzar (p. ej. cookies bloqueadas en file://)
  try {
    const i = parseInt(localStorage.getItem(SKIN_KEY), 10);
    return i >= 0 && i < SKINS.length ? i : 0;
  } catch { return 0; }
}

function saveSkin(i) {
  try { localStorage.setItem(SKIN_KEY, String(i)); } catch {}
}

let skinIndex = loadSkin();
let skinToast = 0;   // segundos restantes del aviso en pantalla

function cycleSkin() {
  skinIndex = (skinIndex + 1) % SKINS.length;
  skinToast = SKIN_TOAST;
  saveSkin(skinIndex);
}

// ── Ship ──────────────────────────────────────────────────────────────────────
class Ship {
  constructor() { this.reset(); }

  reset() {
    this.x      = W / 2;
    this.y      = H / 2;
    this.angle  = -Math.PI / 2;
    this.vx     = 0;
    this.vy     = 0;
    this.radius = 12;
    this.thrusting     = false;
    this.invincible    = 3;
    this.shootCooldown = 0;
    this.dead          = false;
    this.speedBoost    = 0;
    this.tripleShot    = 0;
  }

  update(dt) {
    if (this.dead) return;
    if (this.invincible    > 0) this.invincible    -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.speedBoost    > 0) this.speedBoost    -= dt;
    if (this.tripleShot    > 0) this.tripleShot    -= dt;

    const ROT   = 3.5;   // rad/s
    const THRUST = this.speedBoost > 0 ? 260 * 2 : 260;  // px/s² — doble con power-up de velocidad
    const DRAG   = 0.987;

    if (keys['ArrowLeft'])  this.angle -= ROT * dt;
    if (keys['ArrowRight']) this.angle += ROT * dt;

    this.thrusting = !!keys['ArrowUp'];
    if (this.thrusting) {
      this.vx += Math.cos(this.angle) * THRUST * dt;
      this.vy += Math.sin(this.angle) * THRUST * dt;
    }

    this.vx *= DRAG;
    this.vy *= DRAG;
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
  }

  tryShoot() {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = 0.2;
    const NOSE = 21;
    const ox = this.x + Math.cos(this.angle) * NOSE;
    const oy = this.y + Math.sin(this.angle) * NOSE;

    // Triple disparo: 3 balas paralelas (mismo ángulo, offset perpendicular)
    if (this.tripleShot > 0) {
      const px = -Math.sin(this.angle);
      const py =  Math.cos(this.angle);
      return [-TRIPLE_GAP, 0, TRIPLE_GAP].map(o =>
        new Bullet(ox + px * o, oy + py * o, this.angle));
    }

    return [new Bullet(ox, oy, this.angle)];
  }

  draw() {
    if (this.dead) return;
    // Parpadeo durante invencibilidad de reaparición
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0) return;

    const skin = SKINS[skinIndex];

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.strokeStyle = skin.stroke;
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';

    // Silueta de la skin activa
    ctx.beginPath();
    ctx.moveTo(skin.verts[0][0], skin.verts[0][1]);
    for (let i = 1; i < skin.verts.length; i++)
      ctx.lineTo(skin.verts[i][0], skin.verts[i][1]);
    ctx.closePath();
    ctx.stroke();

    // Llama del propulsor
    if (this.thrusting && Math.random() > 0.35) {
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(-8 - rand(6, 14), 0);
      ctx.lineTo(-8, 4);
      // Llama amarilla mientras dura el power-up de velocidad
      ctx.strokeStyle = this.speedBoost > 0
        ? 'rgba(255, 210, 63, 0.9)'
        : skin.flame;
      ctx.stroke();
    }

    ctx.restore();
  }
}

// ── Partículas (explosión) ────────────────────────────────────────────────────
class Particle {
  constructor(x, y) {
    this.x  = x;
    this.y  = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx   = Math.cos(angle) * speed;
    this.vy   = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl  = this.life;
    this.dead = false;
  }

  update(dt) {
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = this.ttl / this.life;
    ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
  }
}

// ── Power-up (velocidad) ──────────────────────────────────────────────────────
const POWERUP_COLOR = '#ffd23f';
const POWERUP_TTL   = 10;    // segundos en pantalla
const BOOST_TIME    = 5;     // duración del efecto en la nave
const DROP_CHANCE   = 0.12;  // probabilidad de drop por asteroide destruido
const TRIPLE_TIME   = 5;     // duración del triple disparo (bonus de la estrella fugaz)
const TRIPLE_GAP    = 6;     // separación entre balas paralelas

class PowerUp {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 12;
    this.dead = false;
    this.ttl  = POWERUP_TTL;

    // Deriva lenta en dirección aleatoria
    const angle = rand(0, Math.PI * 2);
    this.vx = Math.cos(angle) * 40;
    this.vy = Math.sin(angle) * 40;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    // Parpadeo cuando está por expirar
    if (this.ttl < 3 && Math.floor(this.ttl * 8) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.strokeStyle = POWERUP_COLOR;
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';

    // Rayo estilizado
    ctx.beginPath();
    ctx.moveTo( 3, -10);
    ctx.lineTo(-4,   1);
    ctx.lineTo( 0,   1);
    ctx.lineTo(-3,  10);
    ctx.lineTo( 4,  -1);
    ctx.lineTo( 0,  -1);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Estado del juego ──────────────────────────────────────────────────────────
let ship, bullets, asteroids, particles, powerUps;
let score, lives, level;
let state;      // 'playing' | 'dead' | 'gameover'
let deadTimer;
let estrellaTimer;

function spawnAsteroids(count) {
  const SAFE_DIST = 130;
  for (let i = 0; i < count; i++) {
    let x, y;
    do {
      x = rand(0, W);
      y = rand(0, H);
    } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
    asteroids.push(new Asteroid(x, y, 3));
  }
}

function spawnEstrella() {
  // Nace en un borde y apunta hacia el interior de la pantalla
  const edge = randInt(0, 3);
  let x, y;
  if (edge === 0)      { x = rand(0, W); y = 0; }   // arriba
  else if (edge === 1) { x = W; y = rand(0, H); }   // derecha
  else if (edge === 2) { x = rand(0, W); y = H; }   // abajo
  else                 { x = 0; y = rand(0, H); }   // izquierda
  const angle = Math.atan2(H / 2 - y, W / 2 - x) + rand(-0.5, 0.5);
  asteroids.push(new EstrellaFugaz(x, y, angle));
}

function initGame() {
  ship          = new Ship();
  bullets   = [];
  asteroids = [];
  particles = [];
  powerUps  = [];
  score  = 0;
  lives  = 3;
  level  = 1;
  state  = 'playing';
  spawnAsteroids(4);
  estrellaTimer = rand(ESTRELLA_EVERY_MIN, ESTRELLA_EVERY_MAX);
}

function nextLevel() {
  level++;
  bullets   = [];
  particles = [];
  powerUps  = [];
  ship.reset();
  spawnAsteroids(3 + level);
}

function explode(x, y, count = 8) {
  for (let i = 0; i < count; i++) particles.push(new Particle(x, y));
}

function killShip() {
  explode(ship.x, ship.y, 14);
  ship.dead = true;
  ship.speedBoost = 0;   // el power-up se pierde al morir
  ship.tripleShot = 0;   // el triple disparo también
  lives--;
  if (lives <= 0) {
    state = 'gameover';
  } else {
    state     = 'dead';
    deadTimer = 2;
  }
}

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt) {
  // Cambio de skin con C (disponible en cualquier estado)
  if (pressed('KeyC')) cycleSkin();
  if (skinToast > 0) skinToast -= dt;

  if (state === 'gameover') {
    if (pressed('Space')) initGame();
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    return;
  }

  if (state === 'dead') {
    deadTimer -= dt;
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    asteroids.forEach(a => a.update(dt));
    powerUps.forEach(p => p.update(dt));
    powerUps = powerUps.filter(p => !p.dead);
    if (deadTimer <= 0) { state = 'playing'; ship.reset(); }
    return;
  }

  // Disparar
  if (pressed('Space')) {
    bullets.push(...ship.tryShoot());
  }

  ship.update(dt);
  bullets.forEach(b => b.update(dt));
  asteroids.forEach(a => a.update(dt));
  powerUps.forEach(p => p.update(dt));
  particles.forEach(p => p.update(dt));

  // Aparición periódica de la estrella fugaz (solo una a la vez)
  estrellaTimer -= dt;
  if (estrellaTimer <= 0) {
    if (!asteroids.some(a => a instanceof EstrellaFugaz)) spawnEstrella();
    estrellaTimer = rand(ESTRELLA_EVERY_MIN, ESTRELLA_EVERY_MAX);
  }

  bullets   = bullets.filter(b => !b.dead);
  particles = particles.filter(p => !p.dead);

  // Bala vs asteroide
  const newAsteroids = [];
  for (const b of bullets) {
    for (const a of asteroids) {
      if (!a.dead && !b.dead && dist(b, a) < a.radius) {
        b.dead = true;
        a.dead = true;
        score += a.points;
        explode(a.x, a.y, a.size * 5);
        newAsteroids.push(...a.split());
        // La estrella fugaz otorga triple disparo; los asteroides normales pueden soltar velocidad
        if (a.special) {
          ship.tripleShot = TRIPLE_TIME;   // se refresca si ya estaba activo
        } else if (powerUps.length === 0 && Math.random() < DROP_CHANCE) {
          powerUps.push(new PowerUp(a.x, a.y));
        }
      }
    }
  }
  asteroids = asteroids.filter(a => !a.dead).concat(newAsteroids);
  bullets   = bullets.filter(b => !b.dead);

  // Nave vs asteroide
  if (ship.invincible <= 0) {
    for (const a of asteroids) {
      if (dist(ship, a) < ship.radius + a.radius * 0.82) {
        killShip();
        break;
      }
    }
  }

  // Nave vs power-up (pickup)
  for (const pu of powerUps) {
    if (!pu.dead && !ship.dead && dist(ship, pu) < ship.radius + pu.radius) {
      pu.dead = true;
      ship.speedBoost = BOOST_TIME;   // se refresca si ya estaba activo
      explode(pu.x, pu.y, 6);
    }
  }
  powerUps = powerUps.filter(p => !p.dead);

  // Nivel completado
  if (asteroids.length === 0) nextLevel();
}

// ── Draw ──────────────────────────────────────────────────────────────────────
function drawLifeIcon(x, y) {
  const skin = SKINS[skinIndex];
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  ctx.strokeStyle = skin.stroke;
  ctx.lineWidth   = 1.2;
  ctx.lineJoin    = 'round';
  // Silueta de la skin activa a escala reducida
  ctx.beginPath();
  ctx.moveTo(skin.verts[0][0] * 0.5, skin.verts[0][1] * 0.5);
  for (let i = 1; i < skin.verts.length; i++)
    ctx.lineTo(skin.verts[i][0] * 0.5, skin.verts[i][1] * 0.5);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.font = '15px monospace';

  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${score}`, 14, 26);

  // Cuenta regresiva de los efectos activos (velocidad / triple disparo)
  let effectY = 48;
  if (!ship.dead && ship.speedBoost > 0) {
    ctx.fillStyle = POWERUP_COLOR;
    ctx.fillText(`VELOZ ${ship.speedBoost.toFixed(1)}s`, 14, effectY);
    effectY += 22;
  }
  if (!ship.dead && ship.tripleShot > 0) {
    ctx.fillStyle = POWERUP_COLOR;
    ctx.fillText(`TRIPLE ${ship.tripleShot.toFixed(1)}s`, 14, effectY);
  }
  ctx.fillStyle = '#fff';

  ctx.textAlign = 'center';
  ctx.fillText(`NIVEL ${level}`, W / 2, 26);

  for (let i = 0; i < lives; i++)
    drawLifeIcon(W - 16 - i * 22, 18);

  // Aviso temporal al cambiar de skin (se desvanece al expirar)
  if (skinToast > 0) {
    ctx.textAlign = 'center';
    ctx.fillStyle = `rgba(255,255,255,${Math.min(1, skinToast).toFixed(2)})`;
    ctx.fillText(`SKIN: ${SKINS[skinIndex].name.toUpperCase()}`, W / 2, H - 20);
    ctx.fillStyle = '#fff';
  }

}

function drawOverlay(title, sub) {
  ctx.textAlign   = 'center';
  ctx.fillStyle   = '#fff';
  ctx.font        = 'bold 46px monospace';
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.font        = '18px monospace';
  ctx.fillStyle   = 'rgba(255,255,255,0.65)';
  ctx.fillText(sub, W / 2, H / 2 + 22);
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  particles.forEach(p => p.draw());
  asteroids.forEach(a => a.draw());
  powerUps.forEach(p => p.draw());
  bullets.forEach(b => b.draw());
  ship.draw();

  drawHUD();

  if (state === 'gameover')
    drawOverlay('GAME OVER', `PUNTAJE: ${score}   —   ESPACIO PARA REINICIAR`);
}

// ── Loop principal ────────────────────────────────────────────────────────────
let lastTime = null;

function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

initGame();
requestAnimationFrame(loop);
