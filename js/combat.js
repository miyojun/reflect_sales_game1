// combat.js — ダメージ計算 & アクション機構（タイミング/連打/ダブルタップ）
window.SBR = window.SBR || {};

// ===== ダメージ判定 =====
SBR.Combat = {
  // talkEff: 'correct'|'partial'|'wrong'、action: {score, rank}
  judge(objection, talkEff, action, player) {
    const C = SBR.CONFIG;
    const corr = C.TALK[talkEff] ?? C.TALK.wrong;
    const timing = C.TIMING[action.rank] ?? C.TIMING.MISS;
    const statBonus = (player.stats[objection.primaryStat] || 0) / C.STAT_DIVISOR;

    const damage = Math.round(C.BASE_DMG * corr * timing * (1 + statBonus));

    // カウンター: トーク失敗 or タイミングMISS で被弾（正解なら軽減）
    let counter = 0;
    if (talkEff === 'wrong' || action.rank === 'MISS') {
      const soak = 1 - (player.stats.trust || 0) / C.TRUST_SOAK;
      let base = objection.attack * Math.max(0.25, soak);
      // トークは正解だがタイミングだけMISSの場合は被弾を大幅軽減（理不尽さ回避）
      if (talkEff === 'correct') base *= 0.4;
      else if (talkEff === 'partial') base *= 0.7;
      counter = Math.max(2, Math.round(base));
    }

    return {
      damage,
      counter,
      crit: action.rank === 'PERFECT' && talkEff === 'correct',
      talkEff, rank: action.rank,
    };
  },
};

// ===== アクション機構 =====
// 各メーターは update(dt)/draw(ctx)/onKey()/onPointer() と、完了時に this.done({score,rank}) を呼ぶ。

// (A) タイミングバー：往復するマーカーをスイートスポットで止める
SBR.TimingMeter = class {
  constructor(spec, statBonus, onDone) {
    this.speed = spec.speed * 1.0;
    this.zoneW = Math.min(0.5, spec.zoneWidth + statBonus * 0.12); // ステータスでゾーン拡大
    this.perfectW = spec.perfectWidth + statBonus * 0.04;
    this.pos = 0; this.dir = 1;
    this.onDone = onDone; this.finished = false;
    this.center = 0.5;
  }
  update(dt) {
    if (this.finished) return;
    this.pos += this.dir * this.speed * (dt / 1000);
    if (this.pos > 1) { this.pos = 1; this.dir = -1; }
    if (this.pos < 0) { this.pos = 0; this.dir = 1; }
  }
  trigger() {
    if (this.finished) return;
    this.finished = true;
    const d = Math.abs(this.pos - this.center);
    let rank, score;
    if (d <= this.perfectW / 2) { rank = 'PERFECT'; score = 1; }
    else if (d <= this.zoneW / 2) { rank = 'GOOD'; score = 0.65; }
    else { rank = 'MISS'; score = 0.2; }
    this.onDone({ score, rank });
  }
  onKey() { this.trigger(); }
  onPointer() { this.trigger(); }
  draw(ctx) {
    const C = SBR.CONFIG;
    const w = 560, h = 30, x = (C.W - w) / 2, y = 360;
    ctx.save();
    // 枠
    ctx.fillStyle = 'rgba(8,12,32,0.9)';
    SBR.roundRect(ctx, x - 6, y - 6, w + 12, h + 12, 8); ctx.fill();
    ctx.strokeStyle = '#3a4a8c'; ctx.lineWidth = 2;
    SBR.roundRect(ctx, x - 6, y - 6, w + 12, h + 12, 8); ctx.stroke();
    // GOODゾーン
    const gz = this.zoneW * w, gx = x + (this.center * w) - gz / 2;
    ctx.fillStyle = 'rgba(94,224,138,0.35)'; ctx.fillRect(gx, y, gz, h);
    // PERFECTゾーン
    const pz = this.perfectW * w, px = x + (this.center * w) - pz / 2;
    ctx.fillStyle = 'rgba(255,225,77,0.7)'; ctx.fillRect(px, y, pz, h);
    // マーカー
    const mx = x + this.pos * w;
    ctx.fillStyle = '#fff'; ctx.fillRect(mx - 3, y - 8, 6, h + 16);
    ctx.fillStyle = '#4fd1ff'; ctx.fillRect(mx - 2, y - 8, 4, h + 16);
    ctx.restore();
  }
};

// (B) 連打ゲージ：制限時間内に連打でゲージを満たす
SBR.MashGauge = class {
  constructor(spec, statBonus, onDone) {
    this.duration = spec.durationMs;
    this.target = Math.max(8, spec.target - Math.round(statBonus * 4));
    this.count = 0; this.t = 0;
    this.onDone = onDone; this.finished = false;
    this.pulse = 0;
  }
  update(dt) {
    if (this.finished) return;
    this.t += dt; this.pulse *= 0.9;
    if (this.t >= this.duration) this.finish();
  }
  hit() {
    if (this.finished) return;
    this.count++; this.pulse = 1;
    SBR.FX.sparkle(SBR.CONFIG.W / 2, 380, '#ffd166', 4);
    if (this.count >= this.target) this.finish();
  }
  finish() {
    if (this.finished) return;
    this.finished = true;
    const ratio = Math.min(1, this.count / this.target);
    let rank, score;
    if (ratio >= 1) { rank = 'PERFECT'; score = 1; }
    else if (ratio >= 0.6) { rank = 'GOOD'; score = 0.6 + (ratio - 0.6); }
    else { rank = 'MISS'; score = 0.2; }
    this.onDone({ score, rank });
  }
  onKey() { this.hit(); }
  onPointer() { this.hit(); }
  draw(ctx) {
    const C = SBR.CONFIG;
    const w = 500, h = 34, x = (C.W - w) / 2, y = 360;
    const ratio = Math.min(1, this.count / this.target);
    ctx.save();
    ctx.fillStyle = 'rgba(8,12,32,0.9)';
    SBR.roundRect(ctx, x - 6, y - 6, w + 12, h + 12, 8); ctx.fill();
    ctx.strokeStyle = '#3a4a8c'; ctx.lineWidth = 2;
    SBR.roundRect(ctx, x - 6, y - 6, w + 12, h + 12, 8); ctx.stroke();
    // ゲージ
    const grad = ctx.createLinearGradient(x, 0, x + w, 0);
    grad.addColorStop(0, '#4fd1ff'); grad.addColorStop(1, '#5ee08a');
    ctx.fillStyle = grad; ctx.fillRect(x, y, w * ratio, h);
    // タイマー
    const tr = 1 - this.t / this.duration;
    ctx.fillStyle = '#ff6b8a'; ctx.fillRect(x, y + h + 6, w * Math.max(0, tr), 5);
    // カウント
    ctx.font = "900 22px 'Noto Sans JP'"; ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.fillText(`${this.count} / ${this.target}`, C.W / 2, y - 14 - this.pulse * 4);
    ctx.restore();
  }
};

// (C) 縮小ダブルタップ：縮む円が的に重なる瞬間に複数回タップ
SBR.ShrinkTap = class {
  constructor(spec, statBonus, onDone) {
    this.totalTaps = spec.taps;
    this.duration = spec.durationMs;
    this.t = 0; this.tapsDone = 0; this.scores = [];
    this.onDone = onDone; this.finished = false;
    this.targetR = 60; this.startR = 260;
    this.bonus = statBonus;
    this.flashT = 0;
  }
  curR() {
    // ノコギリ波: 各タップ区間で startR から targetR 付近まで縮む
    const seg = this.duration / this.totalTaps;
    const local = (this.t % seg) / seg;            // 0→1
    return this.startR - (this.startR - this.targetR + 30) * local;
  }
  update(dt) {
    if (this.finished) return;
    this.t += dt; this.flashT *= 0.9;
    if (this.t >= this.duration) this.finish();
  }
  tap() {
    if (this.finished) return;
    const r = this.curR();
    const d = Math.abs(r - this.targetR);
    let s;
    if (d < 18 + this.bonus * 20) s = 1;
    else if (d < 45) s = 0.6;
    else s = 0.2;
    this.scores.push(s);
    this.flashT = 1;
    SBR.FX.sparkle(SBR.CONFIG.W / 2, 300, s >= 1 ? '#ffe14d' : '#4fd1ff', 6);
    this.tapsDone++;
    if (this.tapsDone >= this.totalTaps) this.finish();
  }
  finish() {
    if (this.finished) return;
    this.finished = true;
    while (this.scores.length < this.totalTaps) this.scores.push(0.2);
    const avg = this.scores.reduce((a, b) => a + b, 0) / this.scores.length;
    let rank;
    if (avg >= 0.95) rank = 'PERFECT';
    else if (avg >= 0.55) rank = 'GOOD';
    else rank = 'MISS';
    this.onDone({ score: avg, rank });
  }
  onKey() { this.tap(); }
  onPointer() { this.tap(); }
  draw(ctx) {
    const C = SBR.CONFIG;
    const cx = C.W / 2, cy = 300;
    ctx.save();
    // 的
    ctx.strokeStyle = '#5ee08a'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx, cy, this.targetR, 0, Math.PI * 2); ctx.stroke();
    // 縮む円
    const r = Math.max(this.targetR * 0.5, this.curR());
    ctx.strokeStyle = this.flashT > 0.1 ? '#ffe14d' : '#4fd1ff';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    // 残りタップ
    ctx.font = "900 20px 'Noto Sans JP'"; ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
    ctx.fillText(`決断！ ${this.tapsDone}/${this.totalTaps}`, cx, cy - this.startR - 16);
    ctx.restore();
  }
};

// アクション仕様からインスタンス生成
SBR.makeAction = function (spec, statBonus, onDone) {
  if (spec.type === 'mash') return new SBR.MashGauge(spec, statBonus, onDone);
  if (spec.type === 'shrink') return new SBR.ShrinkTap(spec, statBonus, onDone);
  return new SBR.TimingMeter(spec, statBonus, onDone);
};

// 共通: 角丸矩形パス
SBR.roundRect = function (ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};
