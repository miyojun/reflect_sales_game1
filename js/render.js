// render.js — キャラ/背景/HPバー/ステータスの描画（仮絵は手続き描画）
window.SBR = window.SBR || {};

SBR.Render = {
  // ===== 背景（画像があれば使用・無ければグラデーション） =====
  drawBackground(ctx, bgId, t) {
    const C = SBR.CONFIG;
    const img = SBR.Assets.get('bg_' + bgId);
    if (img) {
      this.drawImageCover(ctx, img, 0, 0, C.W, C.H);
      // テキスト視認性のための薄暗オーバーレイ
      ctx.fillStyle = 'rgba(8,10,28,0.36)';
      ctx.fillRect(0, 0, C.W, C.H);
    } else {
      const themes = {
        lobby:   ['#1a1f44', '#0c1030'],
        meeting: ['#23244e', '#11132f'],
        office:  ['#1c2a4a', '#0c1226'],
        map:     ['#142046', '#070a1c'],
      };
      const [c1, c2] = themes[bgId] || themes.office;
      const g = ctx.createLinearGradient(0, 0, 0, C.H);
      g.addColorStop(0, c1); g.addColorStop(1, c2);
      ctx.fillStyle = g; ctx.fillRect(0, 0, C.W, C.H);
      // 床ライン（仮背景のみ）
      ctx.strokeStyle = 'rgba(79,209,255,0.12)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, C.H * 0.78); ctx.lineTo(C.W, C.H * 0.78); ctx.stroke();
    }

    // 動く光の粒（共通）
    ctx.save();
    for (let i = 0; i < 26; i++) {
      const x = (i * 137.5 + t * 0.01 * (1 + (i % 3))) % C.W;
      const y = (i * 53.3 + Math.sin(t * 0.001 + i) * 20 + 80) % C.H;
      ctx.globalAlpha = 0.12 + 0.08 * Math.sin(t * 0.002 + i);
      ctx.fillStyle = i % 2 ? '#4fd1ff' : '#ffd166';
      ctx.beginPath(); ctx.arc(x, y, 2 + (i % 3), 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  },

  // 画像を領域いっぱいにカバー描画（アスペクト維持・はみ出しトリミング）
  drawImageCover(ctx, img, dx, dy, dw, dh) {
    const iw = img.width, ih = img.height;
    if (!iw || !ih) return;
    const scale = Math.max(dw / iw, dh / ih);
    const w = iw * scale, h = ih * scale;
    const x = dx + (dw - w) / 2, y = dy + (dh - h) / 2;
    ctx.drawImage(img, x, y, w, h);
  },

  // 日本語テキストの折り返し（スペース無し対応）
  wrapText(ctx, text, maxWidth, font) {
    ctx.save();
    if (font) ctx.font = font;
    const lines = [];
    let line = '';
    for (const ch of String(text)) {
      if (ch === '\n') { lines.push(line); line = ''; continue; }
      const test = line + ch;
      if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = ch; }
      else line = test;
    }
    if (line) lines.push(line);
    ctx.restore();
    return lines;
  },

  // ===== キャラ（スプライト優先・無ければ仮絵） =====
  drawCharacter(ctx, charId, mood, x, y, w, h, opt = {}) {
    const t = opt.t || 0;
    const bob = Math.sin(t * 0.003 + (opt.phase || 0)) * 5;      // 上下アイドル
    const breath = 1 + Math.sin(t * 0.004 + (opt.phase || 0)) * 0.02;
    const yy = y + bob;
    const img = SBR.getCharacterSprite(charId, mood);
    ctx.save();
    if (img) {
      // アスペクト比を維持し、枠より少し大きめに・横中央・足元を枠下端に揃える
      const scale = 1.28;
      const baseH = h * scale * breath;
      const ratio = (img.width && img.height) ? img.width / img.height : 0.667;
      const dw = baseH * ratio;
      const dh = baseH;
      const dx = x + w / 2 - dw / 2;
      const dy = (y + h) - dh + bob;       // 下揃え＋アイドル
      // 接地の柔らかい影
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h - 2, dw * 0.30, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.drawImage(img, dx, dy, dw, dh);
      if (opt.hitFlash > 0) {
        ctx.globalAlpha = opt.hitFlash;
        ctx.globalCompositeOperation = 'lighter';
        ctx.drawImage(img, dx, dy, dw, dh); // ヒット時に白フラッシュ（シルエットを発光）
      }
    } else if (!SBR.spriteExpected(charId, mood)) {
      // PNGが登録されていないキャラのみ仮絵を描く。
      // 登録済み（＝読み込み中）の場合は何も描かず、本画像の表示を待つ（起動直後の仮絵チラつき防止）。
      const hue = (SBR.Assets.meta(charId) || {}).hue ?? (charId.startsWith('hero') ? 200 : 340);
      this.drawPlaceholderCharacter(ctx, charId, mood, x, yy, w, h * breath, hue, t);
      if (opt.hitFlash > 0) {
        ctx.globalAlpha = opt.hitFlash;
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = '#fff';
        SBR.roundRect(ctx, x, yy, w, h, 16); ctx.fill();
      }
    }
    ctx.restore();
  },

  // 手続き描画の仮キャラ（喜怒哀楽で表情が変わる）
  drawPlaceholderCharacter(ctx, charId, mood, x, y, w, h, hue, t) {
    const cx = x + w / 2;
    const isHero = charId.startsWith('hero');
    const bodyTop = y + h * 0.34;
    const headR = w * 0.26;
    const headCy = y + h * 0.22;

    // 影
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.ellipse(cx, y + h + 6, w * 0.32, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // 体（スーツ）
    const bodyGrad = ctx.createLinearGradient(0, bodyTop, 0, y + h);
    bodyGrad.addColorStop(0, `hsl(${hue},55%,42%)`);
    bodyGrad.addColorStop(1, `hsl(${hue},55%,26%)`);
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.30, y + h);
    ctx.lineTo(cx - w * 0.22, bodyTop);
    ctx.quadraticCurveTo(cx, bodyTop - h * 0.04, cx + w * 0.22, bodyTop);
    ctx.lineTo(cx + w * 0.30, y + h);
    ctx.closePath(); ctx.fill();

    // ネクタイ/襟
    ctx.fillStyle = isHero ? '#ffd166' : '#dce6ff';
    ctx.beginPath();
    ctx.moveTo(cx, bodyTop);
    ctx.lineTo(cx - w * 0.05, bodyTop + h * 0.06);
    ctx.lineTo(cx, y + h * 0.62);
    ctx.lineTo(cx + w * 0.05, bodyTop + h * 0.06);
    ctx.closePath(); ctx.fill();

    // 首
    ctx.fillStyle = '#f2c9a0';
    ctx.fillRect(cx - w * 0.06, headCy + headR * 0.6, w * 0.12, h * 0.08);

    // 頭
    ctx.fillStyle = '#f7d3ab';
    ctx.beginPath(); ctx.arc(cx, headCy, headR, 0, Math.PI * 2); ctx.fill();
    // 髪
    ctx.fillStyle = isHero ? '#2b2b3a' : '#3a2f2a';
    ctx.beginPath();
    ctx.arc(cx, headCy - headR * 0.15, headR, Math.PI, 0);
    ctx.lineTo(cx + headR, headCy - headR * 0.15);
    ctx.quadraticCurveTo(cx + headR * 0.6, headCy - headR * 1.2, cx, headCy - headR * 1.05);
    ctx.quadraticCurveTo(cx - headR * 0.6, headCy - headR * 1.2, cx - headR, headCy - headR * 0.15);
    ctx.closePath(); ctx.fill();

    // 顔（表情）
    this.drawFace(ctx, cx, headCy + headR * 0.08, headR, mood, t);
  },

  // 表情（喜怒哀楽 + neutral/surprise）
  drawFace(ctx, cx, cy, r, mood, t) {
    const ex = r * 0.42, ey = -r * 0.05, eR = r * 0.14;
    const blink = (Math.floor(t / 220) % 18 === 0) ? 0.12 : 1; // たまにまばたき
    ctx.save();
    ctx.fillStyle = '#22232e';

    const eye = (sx) => {
      ctx.save(); ctx.translate(cx + sx, cy + ey);
      ctx.beginPath(); ctx.ellipse(0, 0, eR * 0.7, eR * blink, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    };

    // 眉
    const brow = (sx, ang) => {
      ctx.save(); ctx.translate(cx + sx, cy + ey - r * 0.32); ctx.rotate(ang);
      ctx.fillStyle = '#22232e'; ctx.fillRect(-eR, -2, eR * 1.8, 4);
      ctx.restore();
    };

    switch (mood) {
      case 'joy':
        // ^ ^ の目
        ctx.lineWidth = 3; ctx.strokeStyle = '#22232e';
        ctx.beginPath();
        ctx.arc(cx - ex, cy + ey + eR * 0.3, eR, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx + ex, cy + ey + eR * 0.3, eR, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
        // 笑い口
        ctx.beginPath(); ctx.arc(cx, cy + r * 0.4, r * 0.32, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke();
        // ほお
        ctx.fillStyle = 'rgba(255,120,120,0.4)';
        ctx.beginPath(); ctx.arc(cx - ex, cy + r * 0.32, r * 0.13, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + ex, cy + r * 0.32, r * 0.13, 0, 7); ctx.fill();
        break;
      case 'anger':
        eye(-ex); eye(ex);
        brow(-ex, 0.4); brow(ex, -0.4);
        ctx.lineWidth = 3; ctx.strokeStyle = '#22232e';
        ctx.beginPath(); ctx.arc(cx, cy + r * 0.55, r * 0.22, 1.1 * Math.PI, 1.9 * Math.PI); ctx.stroke();
        // 怒りマーク
        ctx.strokeStyle = '#ff5d5d'; ctx.lineWidth = 2.5;
        const ax = cx + r * 0.7, ay = cy - r * 0.5;
        ctx.beginPath();
        ctx.moveTo(ax, ay); ctx.lineTo(ax + 8, ay); ctx.moveTo(ax + 4, ay - 4); ctx.lineTo(ax + 4, ay + 4);
        ctx.moveTo(ax + 10, ay + 2); ctx.lineTo(ax + 16, ay + 2); ctx.stroke();
        break;
      case 'sad':
        eye(-ex); eye(ex);
        brow(-ex, -0.3); brow(ex, 0.3);
        ctx.lineWidth = 3; ctx.strokeStyle = '#22232e';
        ctx.beginPath(); ctx.arc(cx, cy + r * 0.62, r * 0.22, 1.15 * Math.PI, 1.85 * Math.PI); ctx.stroke();
        // 汗
        ctx.fillStyle = 'rgba(120,200,255,0.85)';
        ctx.beginPath(); ctx.ellipse(cx + r * 0.55, cy, r * 0.08, r * 0.13, 0, 0, 7); ctx.fill();
        break;
      case 'surprise':
        ctx.fillStyle = '#22232e';
        ctx.beginPath(); ctx.arc(cx - ex, cy + ey, eR * 0.95, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + ex, cy + ey, eR * 0.95, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.arc(cx, cy + r * 0.45, r * 0.14, 0, 7); ctx.fill();
        break;
      default: // neutral
        eye(-ex); eye(ex);
        ctx.lineWidth = 3; ctx.strokeStyle = '#22232e';
        ctx.beginPath(); ctx.moveTo(cx - r * 0.18, cy + r * 0.45); ctx.lineTo(cx + r * 0.18, cy + r * 0.45); ctx.stroke();
    }
    ctx.restore();
  },

  // ===== HPバー =====
  drawHPBar(ctx, x, y, w, h, ratio, color, label) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    SBR.roundRect(ctx, x, y, w, h, h / 2); ctx.fill();
    ctx.fillStyle = color;
    SBR.roundRect(ctx, x, y, w * Math.max(0, ratio), h, h / 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1;
    SBR.roundRect(ctx, x, y, w, h, h / 2); ctx.stroke();
    if (label) {
      ctx.font = "700 13px 'Noto Sans JP'"; ctx.fillStyle = '#fff'; ctx.textAlign = 'left';
      ctx.fillText(label, x, y - 5);
    }
    ctx.restore();
  },

  // ===== プレイヤーステータスHUD（戦闘中・左上） =====
  drawPlayerHUD(ctx, player) {
    const x = 24, y = 20, w = 250;
    ctx.save();
    ctx.fillStyle = SBR.CONFIG.panel;
    SBR.roundRect(ctx, x, y, w, 96, 10); ctx.fill();
    ctx.strokeStyle = '#3a4a8c'; ctx.lineWidth = 1.5;
    SBR.roundRect(ctx, x, y, w, 96, 10); ctx.stroke();

    ctx.font = "900 14px 'Noto Sans JP'"; ctx.fillStyle = '#ffd166'; ctx.textAlign = 'left';
    ctx.fillText(`新米営業  Lv.${player.level}`, x + 12, y + 22);

    // メンタル(HP)
    this.drawHPBar(ctx, x + 12, y + 34, w - 24, 14, player.stats.mental / player.maxMental, '#5ee08a');
    ctx.font = "700 11px 'Noto Sans JP'"; ctx.fillStyle = '#fff';
    ctx.fillText(`メンタル ${Math.max(0, Math.ceil(player.stats.mental))}/${player.maxMental}`, x + 16, y + 45);

    // ステータス
    ctx.font = "700 11px 'Noto Sans JP'"; ctx.fillStyle = '#cfe0ff';
    ctx.fillText(`ヒアリング ${player.stats.hearing}`, x + 12, y + 68);
    ctx.fillText(`提案 ${player.stats.proposal}`, x + 140, y + 68);
    ctx.fillText(`信頼 ${player.stats.trust}`, x + 12, y + 86);
    ctx.restore();
  },
};
