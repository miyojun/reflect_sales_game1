// fx.js — パーティクル / 浮遊テキスト / 画面シェイク / フラッシュ / ヒットストップ
window.SBR = window.SBR || {};

SBR.FX = {
  particles: [],
  floats: [],
  shakeMag: 0,
  flash: null,      // { r,g,b,a }
  hitstop: 0,       // ms 残り（>0 の間 update を止める）

  reset() {
    this.particles = []; this.floats = [];
    this.shakeMag = 0; this.flash = null; this.hitstop = 0;
  },

  // --- パーティクル ---
  burst(x, y, color, count = 14, power = 4) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = power * (0.4 + Math.random());
      this.particles.push({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1,
        life: 1, decay: 0.018 + Math.random() * 0.02,
        size: 2 + Math.random() * 4, color,
      });
    }
  },

  sparkle(x, y, color = '#ffe14d', count = 8) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      this.particles.push({
        x, y, vx: Math.cos(a) * 2, vy: Math.sin(a) * 2,
        life: 1, decay: 0.03, size: 2 + Math.random() * 3, color, star: true,
      });
    }
  },

  // --- 浮遊テキスト（ダメージ等） ---
  floatText(x, y, text, color = '#fff', size = 28) {
    this.floats.push({ x, y, text, color, size, life: 1, vy: -1.1 });
  },

  // --- 画面シェイク ---
  shake(mag = 8) { this.shakeMag = Math.max(this.shakeMag, mag); },

  // --- フラッシュ ---
  doFlash(r, g, b, a = 0.5) { this.flash = { r, g, b, a }; },

  // --- ヒットストップ ---
  freeze(ms = 70) { this.hitstop = Math.max(this.hitstop, ms); },

  update(dt) {
    if (this.hitstop > 0) { this.hitstop -= dt; return; }

    for (const p of this.particles) {
      p.x += p.vx; p.y += p.vy; p.vy += 0.18; p.life -= p.decay;
    }
    this.particles = this.particles.filter(p => p.life > 0);

    for (const f of this.floats) { f.y += f.vy; f.vy *= 0.96; f.life -= 0.02; }
    this.floats = this.floats.filter(f => f.life > 0);

    if (this.shakeMag > 0) this.shakeMag *= 0.86;
    if (this.shakeMag < 0.3) this.shakeMag = 0;

    if (this.flash) { this.flash.a -= 0.04; if (this.flash.a <= 0) this.flash = null; }
  },

  applyShake(ctx) {
    if (this.shakeMag > 0) {
      const dx = (Math.random() * 2 - 1) * this.shakeMag;
      const dy = (Math.random() * 2 - 1) * this.shakeMag;
      ctx.translate(dx, dy);
    }
  },

  drawParticles(ctx) {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      if (p.star) {
        ctx.translate(p.x, p.y);
        ctx.rotate((1 - p.life) * 6);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  },

  drawFloats(ctx) {
    for (const f of this.floats) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, f.life);
      ctx.font = `900 ${f.size}px 'Noto Sans JP', sans-serif`;
      ctx.textAlign = 'center';
      ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,0.7)';
      ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
      ctx.restore();
    }
  },

  drawFlash(ctx) {
    if (this.flash) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.flash.a);
      ctx.fillStyle = `rgb(${this.flash.r},${this.flash.g},${this.flash.b})`;
      ctx.fillRect(0, 0, SBR.CONFIG.W, SBR.CONFIG.H);
      ctx.restore();
    }
  },
};
