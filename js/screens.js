// screens.js — 画面状態（タイトル/マップ/戦闘/リザルト/エンディング）
window.SBR = window.SBR || {};

// ===== DOMオーバーレイ操作ヘルパ =====
SBR.UI = {
  el(id) { return document.getElementById(id); },

  hideAllOverlays() {
    ['dialogue', 'talkMenu', 'knowledge', 'actionHint'].forEach(id => this.el(id).classList.add('hidden'));
  },

  clearScreenLayer() { this.el('screenLayer').innerHTML = ''; },

  // 会話バブル
  showDialogue(speaker, text) {
    const d = this.el('dialogue');
    this.el('dialogueSpeaker').textContent = speaker || '';
    this.el('dialogueText').textContent = text;
    d.classList.remove('hidden');
  },
  hideDialogue() { this.el('dialogue').classList.add('hidden'); },

  // トーク選択メニュー
  showTalkMenu(talks, onPick) {
    const m = this.el('talkMenu');
    m.innerHTML = '';
    talks.forEach((t, i) => {
      const b = document.createElement('button');
      b.className = 'talk-btn';
      b.style.animationDelay = (i * 0.06) + 's';
      b.innerHTML = `<span class="num">${i + 1}</span>${t.text}`;
      b.onclick = () => { SBR.Audio.play('select'); onPick(i); };
      m.appendChild(b);
    });
    m.classList.remove('hidden');
  },
  hideTalkMenu() { this.el('talkMenu').classList.add('hidden'); },

  // ナレッジトースト（クリックするまで消えない）
  showKnowledge(term, body) {
    this.el('knTerm').textContent = term;
    this.el('knBody').textContent = body;
    const k = this.el('knowledge');
    let hint = k.querySelector('.kn-hint');
    if (!hint) { hint = document.createElement('div'); hint.className = 'kn-hint'; k.appendChild(hint); }
    hint.textContent = '▶ クリック / Space で続ける';
    k.classList.remove('hidden');
    // トースト自体のクリックでも閉じられるように現在画面へ委譲
    k.onclick = () => { if (SBR.game.screen && SBR.game.screen.handleInput) SBR.game.screen.handleInput({ type: 'pointer' }); };
    // 再アニメーション
    k.style.animation = 'none'; void k.offsetWidth; k.style.animation = '';
  },
  hideKnowledge() { this.el('knowledge').classList.add('hidden'); },

  showActionHint(text) {
    const a = this.el('actionHint');
    a.textContent = text; a.classList.remove('hidden');
  },
  hideActionHint() { this.el('actionHint').classList.add('hidden'); },
};

SBR.Screens = {};

// =========================================================
// タイトル画面
// =========================================================
SBR.Screens.title = {
  enter() {
    SBR.UI.hideAllOverlays();
    SBR.Audio.playBgm('menu');   // メニュー画面BGM（起動直後は無音、操作後に再生）
    const layer = SBR.UI.el('screenLayer');
    const hasSave = SBR.Save.exists();
    layer.innerHTML = `
      <div class="screen-panel" id="titlePanel">
        <div style="height:38%"></div>
        <button class="btn-main" id="btnStart">${hasSave ? 'つづきから' : 'ゲームスタート'}</button>
        ${hasSave ? '<button class="btn-sub" id="btnNew">最初から</button>' : ''}
        <button class="btn-sub" id="btnGlossary">用語集を見る</button>
      </div>`;
    SBR.UI.el('btnStart').onclick = async () => {
      await SBR.Audio.start();
      if (hasSave) SBR.loadGame();
      SBR.changeScreen('map');   // map.enter が playBgm('map')
    };
    if (hasSave) SBR.UI.el('btnNew').onclick = async () => {
      await SBR.Audio.start();
      SBR.Save.clear(); SBR.newGame(); SBR.changeScreen('map');
    };
    SBR.UI.el('btnGlossary').onclick = () => SBR.Screens.title.showGlossary();
  },
  showGlossary() {
    const unlocked = SBR.game.glossary;
    const layer = SBR.UI.el('screenLayer');
    const items = Object.values(SBR.OBJECTIONS)
      .map(o => o.learn)
      .filter((l, i, arr) => arr.findIndex(x => x.term === l.term) === i);
    const rows = items.map(l => {
      const ok = unlocked.includes(l.term);
      return `<div style="margin:6px 0;padding:8px 12px;border-radius:8px;background:rgba(20,28,66,.8);border:1px solid ${ok ? '#ffd166' : '#2a3360'};">
        <b style="color:${ok ? '#ffd166' : '#5a6a9c'}">${ok ? l.term : '？？？（未習得）'}</b>
        <div style="font-size:12px;color:${ok ? '#cfe0ff' : '#445'}">${ok ? l.body : 'プレイして習得しよう'}</div></div>`;
    }).join('');
    layer.innerHTML = `
      <div style="position:absolute;inset:6% 8%;background:rgba(8,12,32,.95);border:2px solid #4fd1ff;border-radius:14px;padding:16px;overflow:auto;">
        <h2 style="color:#ffd166;margin-bottom:8px;">📘 営業用語集 (${unlocked.length}/${items.length})</h2>
        ${rows}
        <div style="text-align:center;margin-top:12px;"><button class="btn-sub" id="btnBack">戻る</button></div>
      </div>`;
    SBR.UI.el('btnBack').onclick = () => SBR.Screens.title.enter();
  },
  exit() { SBR.UI.clearScreenLayer(); },
  update() {}, handleInput() {},
  draw(ctx, t) {
    SBR.Render.drawBackground(ctx, 'map', t);
    const C = SBR.CONFIG;
    // タイトルロゴ
    ctx.save(); ctx.textAlign = 'center';
    ctx.font = "900 52px 'Noto Sans JP'";
    ctx.fillStyle = '#fff';
    ctx.shadowColor = '#4fd1ff'; ctx.shadowBlur = 24;
    ctx.fillText('商談バトル', C.W / 2, 130 + Math.sin(t * 0.002) * 4);
    ctx.fillStyle = '#ffd166';
    ctx.fillText('R P G', C.W / 2, 190 + Math.sin(t * 0.002) * 4);
    ctx.shadowBlur = 0;
    ctx.font = "700 17px 'Noto Sans JP'"; ctx.fillStyle = '#cfe0ff';
    ctx.fillText('〜新米営業 成長物語〜', C.W / 2, 230);
    // 音声ONの案内（まだBGM未開始のときだけ点滅表示）
    if (!SBR.Audio.bgmKey) {
      ctx.globalAlpha = 0.5 + 0.5 * Math.abs(Math.sin(t * 0.004));
      ctx.font = "700 13px 'Noto Sans JP'"; ctx.fillStyle = '#ffd166';
      ctx.fillText('🔊 クリックで音楽スタート', C.W / 2, 256);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    // 主人公
    SBR.Render.drawCharacter(ctx, 'hero', 'joy', C.W / 2 - 70, 300, 140, 230, { t });
  },
};

// =========================================================
// マップ（営業ロードマップ）画面
// =========================================================
SBR.Screens.map = {
  enter() {
    SBR.UI.hideAllOverlays();
    SBR.Audio.playBgm('menu');
    const layer = SBR.UI.el('screenLayer');
    layer.innerHTML = '';
    // 次に挑めるステージを探す
    this.nodes = SBR.STAGES.map((s, i) => {
      const cleared = SBR.game.cleared.includes(s.id);
      const prevCleared = i === 0 || SBR.game.cleared.includes(SBR.STAGES[i - 1].id);
      return { stage: s, cleared, unlocked: cleared || prevCleared };
    });
    // クリックエリアを canvas 座標で持つ → handleInput で判定
    this.hot = this.nodes.map((n, i) => {
      const col = i % 4, row = Math.floor(i / 4);
      const x = 130 + col * 200, y = 200 + row * 170;
      return { ...n, x, y, r: 46 };
    });
    // 全クリアなら卒業ボタン
    if (SBR.game.cleared.length >= SBR.STAGES.length) {
      const b = document.createElement('button');
      b.className = 'btn-main';
      b.textContent = '🎓 卒業エンディングを見る';
      b.style.cssText += 'position:absolute;left:50%;bottom:6%;transform:translateX(-50%);';
      b.onclick = () => SBR.changeScreen('ending');
      layer.appendChild(b);
    }
    const home = document.createElement('button');
    home.className = 'btn-sub';
    home.textContent = 'タイトルへ';
    home.style.cssText += 'position:absolute;right:3%;top:3%;';
    home.onclick = () => SBR.changeScreen('title');
    layer.appendChild(home);
  },
  exit() { SBR.UI.clearScreenLayer(); },
  update() {},
  handleInput(input) {
    if (input.type !== 'pointer') return;
    for (const n of this.hot) {
      const d = Math.hypot(input.cx - n.x, input.cy - n.y);
      if (d <= n.r && n.unlocked) {
        SBR.Audio.play('select');
        SBR.startBattle(n.stage.id);
        return;
      }
    }
  },
  draw(ctx, t) {
    const C = SBR.CONFIG;
    SBR.Render.drawBackground(ctx, 'map', t);
    ctx.save(); ctx.textAlign = 'center';
    ctx.font = "900 28px 'Noto Sans JP'"; ctx.fillStyle = '#ffd166';
    ctx.fillText('営業ロードマップ', C.W / 2, 70);
    ctx.font = "700 14px 'Noto Sans JP'"; ctx.fillStyle = '#cfe0ff';
    ctx.fillText(`Lv.${SBR.game.player.level}  ステージを選んで商談に挑め（クリア ${SBR.game.cleared.length}/${SBR.STAGES.length}）`, C.W / 2, 96);

    // 接続線
    ctx.strokeStyle = 'rgba(79,209,255,0.3)'; ctx.lineWidth = 3;
    for (let i = 0; i < this.hot.length - 1; i++) {
      ctx.beginPath(); ctx.moveTo(this.hot[i].x, this.hot[i].y);
      ctx.lineTo(this.hot[i + 1].x, this.hot[i + 1].y); ctx.stroke();
    }
    // ノード
    for (const n of this.hot) {
      const pulse = n.unlocked && !n.cleared ? 1 + Math.sin(t * 0.005) * 0.06 : 1;
      ctx.save(); ctx.translate(n.x, n.y); ctx.scale(pulse, pulse);
      // 円の土台
      ctx.beginPath(); ctx.arc(0, 0, n.r, 0, Math.PI * 2);
      ctx.fillStyle = n.cleared ? '#2a8f5a' : (n.unlocked ? '#1b2a66' : '#1a1d33');
      ctx.fill();
      // プロセスアイコン（円内にクリップ）
      const icon = SBR.Assets.get('icon_' + n.stage.id);
      if (icon) {
        ctx.save();
        ctx.beginPath(); ctx.arc(0, 0, n.r - 4, 0, Math.PI * 2); ctx.clip();
        const d = (n.r - 4) * 2;
        if (!n.unlocked) ctx.globalAlpha = 0.32;   // 未開放はうっすら
        ctx.drawImage(icon, -d / 2, -d / 2, d, d);
        ctx.restore();
      }
      // 枠
      ctx.beginPath(); ctx.arc(0, 0, n.r, 0, Math.PI * 2);
      ctx.lineWidth = 3;
      ctx.strokeStyle = n.cleared ? '#5ee08a' : (n.unlocked ? '#4fd1ff' : '#333a55');
      ctx.stroke();
      // 状態バッジ（右上の小円：番号/✓/🔒）
      ctx.save();
      ctx.translate(n.r * 0.7, -n.r * 0.7);
      ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2);
      ctx.fillStyle = n.cleared ? '#2a8f5a' : (n.unlocked ? '#1b2a66' : '#22263c');
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = n.cleared ? '#5ee08a' : (n.unlocked ? '#4fd1ff' : '#444c6e');
      ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.font = "900 13px 'Noto Sans JP'";
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(n.cleared ? '✓' : (n.unlocked ? n.stage.order : '🔒'), 0, 1);
      ctx.restore();
      ctx.textBaseline = 'alphabetic';
      ctx.restore();
      // ステージ名（帯付きで視認性UP）
      ctx.save();
      ctx.font = "700 13px 'Noto Sans JP'"; ctx.textAlign = 'center';
      const label = n.stage.name;
      const lw = ctx.measureText(label).width + 16;
      ctx.fillStyle = 'rgba(8,12,32,0.72)';
      SBR.roundRect(ctx, n.x - lw / 2, n.y + n.r + 6, lw, 20, 6); ctx.fill();
      ctx.fillStyle = n.unlocked ? '#eaf2ff' : '#7a83a6';
      ctx.fillText(label, n.x, n.y + n.r + 20);
      ctx.restore();
    }
    ctx.restore();
  },
};

// =========================================================
// 戦闘画面
// =========================================================
SBR.Screens.battle = {
  enter(payload) {
    SBR.UI.hideAllOverlays();
    SBR.UI.clearScreenLayer();
    SBR.FX.reset();
    const stage = SBR.STAGES.find(s => s.id === payload.stageId);
    this.stage = stage;
    this.player = SBR.game.player;
    this.player.stats.mental = this.player.maxMental; // 戦闘開始時に回復
    // 敵キュー
    this.queue = [...stage.enemies, stage.boss].map(id => {
      const base = SBR.OBJECTIONS[id];
      return Object.assign({}, base, { id, hp: base.hp, maxHp: base.hp });
    });
    this.idx = 0;
    this.earnedExp = 0;
    this.seenTerms = [];
    this.heroMood = 'neutral';
    this.enemyMood = null;
    this.heroHit = 0; this.enemyHit = 0;
    this.action = null;
    this.knTimer = 0;
    this.waitingKnowledge = false;
    this.timer = 0;
    this.lastResult = null;
    SBR.Audio.playBgm(this.stage.id);   // ステージ別BGM
    this.setPhase('intro');
  },
  exit() { SBR.UI.hideAllOverlays(); SBR.UI.clearScreenLayer(); },

  cur() { return this.queue[this.idx]; },

  setPhase(p) {
    this.phase = p;
    SBR.UI.hideTalkMenu(); SBR.UI.hideActionHint(); SBR.UI.hideDialogue();
    if (p === 'intro') {
      SBR.UI.showDialogue('📋 ' + this.stage.name, this.stage.intro);
    } else if (p === 'enemyAppear') {
      // 反論はキャンバス上部に常時表示（drawObjection）。クリックで select へ。
      const e = this.cur();
      this.enemyMood = e.mood;
      // BGMはステージ別（battle.enterで設定済み）を継続。ボスでも切り替えない。
      this.timer = 0;
    } else if (p === 'select') {
      const e = this.cur();
      SBR.UI.showTalkMenu(e.talks, (i) => this.onTalkPick(i));
    } else if (p === 'action') {
      const e = this.cur();
      const statBonus = (this.player.stats[e.primaryStat] || 0) / SBR.CONFIG.STAT_DIVISOR;
      this.action = SBR.makeAction(e.action, statBonus, (res) => this.onActionDone(res));
      const hint = e.action.type === 'mash' ? '⚡ 連打！ Space / クリック連打！'
        : e.action.type === 'shrink' ? '🎯 円が的に重なる瞬間にタップ！(Space/クリック)'
        : '⏱ バーが中央(金色)で Space / クリック！';
      SBR.UI.showActionHint(hint);
    } else if (p === 'resolve') {
      this.timer = 0;
    } else if (p === 'win') {
      this.timer = 0;
      SBR.Audio.play('win');
      SBR.FX.sparkle(SBR.CONFIG.W / 2, 200, '#ffe14d', 30);
    } else if (p === 'lose') {
      this.timer = 0;
      SBR.Audio.play('lose');
      SBR.UI.showDialogue('💧 商談決裂…', 'メンタルが尽きてしまった。落ち込まず、もう一度挑もう！');
      const layer = SBR.UI.el('screenLayer');
      layer.innerHTML = `<div class="screen-panel" style="justify-content:flex-end;padding-bottom:18%;">
        <button class="btn-main" id="btnRetry">もう一度挑戦</button>
        <button class="btn-sub" id="btnToMap">マップへ戻る</button></div>`;
      SBR.UI.el('btnRetry').onclick = () => SBR.startBattle(this.stage.id);
      SBR.UI.el('btnToMap').onclick = () => SBR.changeScreen('map');
    }
  },

  onTalkPick(i) {
    const e = this.cur();
    this.chosen = e.talks[i];
    SBR.UI.hideTalkMenu();
    this.setPhase('action');
  },

  onActionDone(res) {
    SBR.UI.hideActionHint();
    const e = this.cur();
    const result = SBR.Combat.judge(e, this.chosen.eff, res, this.player);
    this.lastResult = result;

    const C = SBR.CONFIG;
    const ex = C.W * 0.72, ey = 230;     // 敵位置の目安
    const hx = C.W * 0.26, hy = 360;     // 主人公位置

    // ランク表示（浮遊テキスト）
    const rankColor = { PERFECT: C.COLORS.crit, GOOD: C.COLORS.good, MISS: C.COLORS.bad };
    SBR.FX.floatText(C.W / 2, 340, res.rank, rankColor[res.rank] || '#fff', 26);

    // 敵へダメージ
    e.hp -= result.damage;
    this.enemyHit = 1;
    SBR.FX.floatText(ex, ey, `${result.damage}`, result.crit ? C.COLORS.crit : '#fff', result.crit ? 44 : 30);
    SBR.FX.burst(ex, ey, result.crit ? C.COLORS.crit : C.COLORS.accent, result.crit ? 22 : 12, result.crit ? 6 : 4);

    if (result.crit) {
      SBR.Audio.play('crit'); SBR.FX.shake(12); SBR.FX.freeze(80);
      SBR.FX.doFlash(255, 225, 77, 0.4);
      this.heroMood = 'joy'; this.enemyMood = 'surprise';
      SBR.FX.floatText(ex, ey - 50, 'クリティカル!', C.COLORS.crit, 24);
    } else if (this.chosen.eff === 'correct') {
      SBR.Audio.play('good'); this.heroMood = 'joy'; this.enemyMood = 'surprise';
    } else if (this.chosen.eff === 'partial') {
      SBR.Audio.play('hit'); this.heroMood = 'neutral';
    } else {
      SBR.Audio.play('hit'); this.heroMood = 'neutral';
    }

    // カウンター（被弾）
    if (result.counter > 0) {
      this.player.stats.mental -= result.counter;
      this.heroHit = 1;
      SBR.FX.floatText(hx, hy, `-${result.counter}`, C.COLORS.bad, 28);
      SBR.FX.burst(hx, hy, C.COLORS.bad, 10, 3);
      SBR.FX.shake(8); SBR.Audio.play('damage');
      this.heroMood = 'sad'; this.enemyMood = 'angry';
    }

    // ナレッジ習得（correct で初出のみ）
    if (this.chosen.eff === 'correct' && !this.seenTerms.includes(e.learn.term)) {
      this.seenTerms.push(e.learn.term);
      if (!SBR.game.glossary.includes(e.learn.term)) SBR.game.glossary.push(e.learn.term);
      SBR.UI.showKnowledge(e.learn.term, e.learn.body);
      SBR.Audio.play('knowledge');
      this.waitingKnowledge = true;   // クリックするまで消えない
    }

    this.setPhase('resolve');
  },

  update(dt) {
    SBR.FX.update(dt);
    this.heroHit = Math.max(0, this.heroHit - dt / 200);
    this.enemyHit = Math.max(0, this.enemyHit - dt / 200);
    if (this.knTimer > 0) { this.knTimer -= dt; if (this.knTimer <= 0) SBR.UI.hideKnowledge(); }

    if (this.phase === 'enemyAppear') {
      // クリック待ち（反論を読む時間。自動では進めない）
    } else if (this.phase === 'action' && this.action) {
      this.action.update(dt);
    } else if (this.phase === 'resolve') {
      this.timer += dt;
      if (this.timer > 850 && !this.waitingKnowledge) {
        const e = this.cur();
        if (this.player.stats.mental <= 0) { this.setPhase('lose'); return; }
        if (e.hp <= 0) {
          // 撃破
          this.earnedExp += e.exp;
          SBR.FX.floatText(SBR.CONFIG.W * 0.72, 200, '撃破!', SBR.CONFIG.COLORS.good, 30);
          SBR.FX.burst(SBR.CONFIG.W * 0.72, 220, SBR.CONFIG.COLORS.good, 18, 5);
          this.idx++;
          if (this.idx >= this.queue.length) { this.setPhase('win'); }
          else { this.setPhase('enemyAppear'); }
        } else {
          this.setPhase('select');
        }
      }
    } else if (this.phase === 'win') {
      this.timer += dt;
      if (this.timer > 1400) {
        if (!SBR.game.cleared.includes(this.stage.id)) SBR.game.cleared.push(this.stage.id);
        SBR.saveGame();
        SBR.changeScreen('result', { stageId: this.stage.id, exp: this.earnedExp, terms: this.seenTerms });
      }
    }
  },

  handleInput(input) {
    const go = input.type === 'pointer' || input.key === ' ' || input.key === 'Enter';
    // ナレッジ表示中は、まずそれを閉じる（学びを確認してから進む）
    if (this.waitingKnowledge) {
      if (go) { SBR.UI.hideKnowledge(); this.waitingKnowledge = false; }
      return;
    }
    if (this.phase === 'intro') { if (go) this.setPhase('enemyAppear'); return; }
    if (this.phase === 'enemyAppear') { if (go) this.setPhase('select'); return; }
    if (this.phase === 'action' && this.action) {
      if (input.type === 'pointer' || input.key === ' ') this.action.onKey();
      return;
    }
  },

  draw(ctx, t) {
    const C = SBR.CONFIG;
    SBR.Render.drawBackground(ctx, this.stage.bg, t);

    // ステージ名 帯
    ctx.save(); ctx.textAlign = 'center';
    ctx.font = "900 16px 'Noto Sans JP'"; ctx.fillStyle = 'rgba(255,209,102,0.9)';
    ctx.fillText(`${this.stage.name}  [${this.idx + 1}/${this.queue.length}]`, C.W / 2, 30);
    ctx.restore();

    const e = this.cur();
    // 敵（頭が上部ネームプレートに被らないよう topAnchor で下げる）
    if (this.phase !== 'win') {
      const ex = C.W * 0.72;
      SBR.Render.drawCharacter(ctx, e.sprite, this.enemyMood || e.mood, ex - 110, 150, 220, 300,
        { t, phase: 1.5, hitFlash: this.enemyHit, scaleMul: 1.05, topAnchor: 168 });
      // 敵ネームプレート（名前＋HPを上部パネルにまとめてキャラと分離）
      this.drawEnemyPlate(ctx, e);
    }

    // 反論（問題）バブル：選択中もずっと表示して確認できるようにする
    if (e && ['enemyAppear', 'select', 'action', 'resolve'].includes(this.phase)) {
      this.drawObjection(ctx, e);
    }

    // 主人公（勝利演出時は中央で別途描画）
    if (this.phase !== 'win') {
      SBR.Render.drawCharacter(ctx, 'hero', this.heroMood, C.W * 0.26 - 70, 335, 150, 240,
        { t, hitFlash: this.heroHit });
    }

    // プレイヤーHUD
    SBR.Render.drawPlayerHUD(ctx, this.player);

    // アクションメーター
    if (this.phase === 'action' && this.action) this.action.draw(ctx);

    // 勝利演出
    if (this.phase === 'win') {
      ctx.save(); ctx.textAlign = 'center';
      ctx.font = "900 44px 'Noto Sans JP'"; ctx.fillStyle = '#ffd166';
      ctx.shadowColor = '#ffd166'; ctx.shadowBlur = 20;
      ctx.fillText('商談成立！', C.W / 2, 280 + Math.sin(t * 0.006) * 6);
      ctx.restore();
      SBR.Render.drawCharacter(ctx, 'hero', 'joy', C.W / 2 - 70, 320, 150, 240, { t });
    }

    // FX（キャラの上）
    SBR.FX.drawParticles(ctx);
    SBR.FX.drawFloats(ctx);
  },

  // 敵ネームプレート（名前＋HPを上部パネルにまとめ、キャラ画像と被らせない）
  drawEnemyPlate(ctx, e) {
    const C = SBR.CONFIG;
    const ex = C.W * 0.72;
    const w = 320, x = ex - w / 2, y = 14, h = 52;
    ctx.save();
    ctx.fillStyle = 'rgba(8,12,32,0.82)';
    SBR.roundRect(ctx, x, y, w, h, 10); ctx.fill();
    ctx.strokeStyle = e.boss ? '#ff4d6d' : '#ff8aa0'; ctx.lineWidth = 2;
    SBR.roundRect(ctx, x, y, w, h, 10); ctx.stroke();
    // 名前
    ctx.textAlign = 'center';
    ctx.font = "900 14px 'Noto Sans JP'";
    ctx.fillStyle = e.boss ? '#ff9db0' : '#ffd0da';
    ctx.fillText(e.label, ex, y + 20);
    // HPバー（ラベルなし）
    SBR.Render.drawHPBar(ctx, x + 16, y + 30, w - 32, 12, e.hp / e.maxHp,
      e.boss ? '#ff4d6d' : '#ff8aa0');
    ctx.restore();
  },

  // 反論（顧客の問題発言）を上部に常時表示（プレイヤーHUDの右側）
  drawObjection(ctx, e) {
    const C = SBR.CONFIG;
    const x = 24, y = 124, w = 540;
    const lines = SBR.Render.wrapText(ctx, e.quote, w - 40, "700 18px 'Noto Sans JP'");
    const h = 50 + lines.length * 26 + (this.phase === 'enemyAppear' ? 20 : 6);
    ctx.save();
    ctx.fillStyle = 'rgba(8,12,32,0.92)';
    SBR.roundRect(ctx, x, y, w, h, 12); ctx.fill();
    ctx.strokeStyle = e.boss ? '#ff4d6d' : '#ff8aa0'; ctx.lineWidth = 2.5;
    SBR.roundRect(ctx, x, y, w, h, 12); ctx.stroke();
    // ラベル
    ctx.textAlign = 'left';
    ctx.font = "900 15px 'Noto Sans JP'";
    ctx.fillStyle = e.boss ? '#ff7d95' : '#ffb3c1';
    ctx.fillText('💬 ' + e.label + (e.boss ? '（強敵）' : ''), x + 18, y + 26);
    // 反論本文
    ctx.font = "700 18px 'Noto Sans JP'"; ctx.fillStyle = '#fff';
    lines.forEach((ln, i) => ctx.fillText(ln, x + 18, y + 52 + i * 26));
    // ヒント
    if (this.phase === 'enemyAppear') {
      ctx.font = "700 13px 'Noto Sans JP'"; ctx.fillStyle = '#8aa0c8';
      ctx.fillText('▼ クリック / Space で切り返しを選ぶ', x + 18, y + h - 10);
    }
    ctx.restore();
  },
};

// =========================================================
// リザルト（EXP・レベルアップ・用語習得）画面
// =========================================================
SBR.Screens.result = {
  enter(payload) {
    SBR.UI.hideAllOverlays();
    SBR.Audio.playBgm('fanfare');   // 受注のファンファーレ
    const p = SBR.game.player;
    const before = { level: p.level, stats: { ...p.stats } };
    p.exp += payload.exp;

    // レベルアップ判定
    let leveled = 0;
    while (p.exp >= SBR.expForLevel(p.level + 1)) {
      p.level++; leveled++;
      p.stats.hearing += SBR.PLAYER_BASE.growth.hearing;
      p.stats.proposal += SBR.PLAYER_BASE.growth.proposal;
      p.stats.trust += SBR.PLAYER_BASE.growth.trust;
      p.maxMental += SBR.PLAYER_BASE.growth.maxMental;
    }
    p.stats.mental = p.maxMental;
    SBR.saveGame();
    if (leveled > 0) SBR.Audio.play('levelup');

    const stage = SBR.STAGES.find(s => s.id === payload.stageId);
    const isLast = SBR.game.cleared.length >= SBR.STAGES.length;
    const termRows = payload.terms.length
      ? payload.terms.map(term => {
          const l = Object.values(SBR.OBJECTIONS).map(o => o.learn).find(x => x.term === term);
          return `<div style="margin:4px 0;padding:6px 10px;background:rgba(255,209,102,.12);border-left:3px solid #ffd166;border-radius:4px;font-size:13px;"><b style="color:#ffd166;">💡 ${term}</b> — ${l ? l.body : ''}</div>`;
        }).join('')
      : '<div style="color:#8aa0c8;font-size:13px;">（今回の新規習得用語なし）</div>';

    const statDiff = (k, label) => {
      const d = p.stats[k] - before.stats[k];
      return `<div>${label}: <b>${p.stats[k]}</b>${d > 0 ? `<span style="color:#5ee08a;"> (+${d})</span>` : ''}</div>`;
    };

    const layer = SBR.UI.el('screenLayer');
    layer.innerHTML = `
      <div style="position:absolute;inset:5% 8%;background:rgba(8,12,32,.95);border:2px solid #5ee08a;border-radius:16px;padding:18px 24px;overflow:auto;box-shadow:0 0 40px rgba(94,224,138,.4);">
        <h2 style="color:#5ee08a;text-align:center;margin-bottom:6px;">🎉 ${stage.name} クリア！</h2>
        ${leveled > 0 ? `<div style="text-align:center;color:#ffd166;font-weight:900;font-size:22px;animation:popIn .5s;margin:6px 0;">⬆ LEVEL UP！ Lv.${before.level} → Lv.${p.level}</div>` : ''}
        <div style="text-align:center;margin:8px 0;">獲得EXP <b style="color:#4fd1ff;font-size:20px;">+${payload.exp}</b>（累計 ${p.exp} / 次のLvまで ${Math.max(0, SBR.expForLevel(p.level + 1) - p.exp)}）</div>
        <div style="display:flex;justify-content:center;gap:22px;margin:10px 0;font-size:14px;color:#cfe0ff;">
          ${statDiff('hearing', 'ヒアリング力')} ${statDiff('proposal', '提案力')} ${statDiff('trust', '信頼')}
          <div>最大メンタル: <b>${p.maxMental}</b></div>
        </div>
        <h3 style="color:#ffd166;margin:10px 0 4px;font-size:15px;">📚 このステージで学んだこと</h3>
        ${termRows}
        <div style="text-align:center;margin-top:16px;">
          <button class="btn-main" id="btnNext">${isLast ? '🎓 卒業エンディングへ' : 'マップへ戻る'}</button>
        </div>
      </div>`;
    SBR.UI.el('btnNext').onclick = () => SBR.changeScreen(isLast ? 'ending' : 'map');
  },
  exit() { SBR.UI.clearScreenLayer(); },
  update() {}, handleInput() {},
  draw(ctx, t) {
    SBR.Render.drawBackground(ctx, 'office', t);
    if (Math.floor(t / 120) % 2 === 0) SBR.FX.sparkle(Math.random() * SBR.CONFIG.W, 80, '#ffd166', 2);
    SBR.FX.update(16); SBR.FX.drawParticles(ctx);
  },
};

// =========================================================
// エンディング（卒業）
// =========================================================
SBR.Screens.ending = {
  enter() {
    SBR.UI.hideAllOverlays();
    SBR.Audio.playBgm('fanfare');   // 卒業＝受注のファンファーレ
    SBR.Audio.play('win');
    const p = SBR.game.player;
    const rank = p.level >= 7 ? 'S（トップセールス候補）' : p.level >= 5 ? 'A（一人前の営業）' : 'B（成長中の営業）';
    this.confetti = [];   // 紙吹雪の状態
    this.fireworks = [];  // 打ち上げ花火
    this.startT = null;
    const layer = SBR.UI.el('screenLayer');
    layer.innerHTML = `
      <div class="screen-panel" style="justify-content:flex-end;padding-bottom:6%;gap:14px;">
        <button class="btn-main" id="btnTitle">タイトルへ</button>
        <a id="endingCta" href="https://reflect.page/contact/corporation" target="_blank" rel="noopener">
          本格的にAIとロープレ営業研修をしたい方はこちら ▶
        </a>
      </div>`;
    SBR.UI.el('btnTitle').onclick = () => SBR.changeScreen('title');
    this.rank = rank;
    // 卒業シーンはCTAが画面下部に来るため、ロゴを右上へ退避（重なり回避）
    const logo = document.getElementById('siteLogo');
    if (logo) { logo.style.left = 'auto'; logo.style.right = '14px'; logo.style.bottom = 'auto'; logo.style.top = '14px'; }
  },
  exit() {
    SBR.UI.clearScreenLayer();
    // ロゴを通常の左下位置へ戻す
    const logo = document.getElementById('siteLogo');
    if (logo) { logo.style.left = ''; logo.style.right = ''; logo.style.bottom = ''; logo.style.top = ''; }
  },

  _palette: ['#ffd166', '#4fd1ff', '#5ee08a', '#ff6b8a', '#c792ff', '#ffffff'],

  _spawnConfetti() {
    const C = SBR.CONFIG;
    const col = this._palette[Math.floor(Math.random() * this._palette.length)];
    this.confetti.push({
      x: Math.random() * C.W, y: -10,
      vx: (Math.random() - 0.5) * 1.6, vy: 1.5 + Math.random() * 2.2,
      size: 5 + Math.random() * 7, rot: Math.random() * 6.28,
      vr: (Math.random() - 0.5) * 0.3, sway: Math.random() * 6.28,
      color: col,
    });
  },

  _spawnFirework() {
    const C = SBR.CONFIG;
    const cx = 120 + Math.random() * (C.W - 240);
    const cy = 70 + Math.random() * 180;
    const col = this._palette[Math.floor(Math.random() * this._palette.length)];
    const n = 26 + Math.floor(Math.random() * 14);
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 * i) / n + Math.random() * 0.1;
      const sp = 2.2 + Math.random() * 2.6;
      this.fireworks.push({
        x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: 1, decay: 0.012 + Math.random() * 0.012, color: col, size: 2.5 + Math.random() * 2,
      });
    }
  },

  update(dt) {
    if (this.startT == null) this.startT = 0; else this.startT += dt;
    SBR.FX.update(dt);
    // 紙吹雪を絶えず供給
    for (let i = 0; i < 3; i++) this._spawnConfetti();
    for (const c of this.confetti) {
      c.sway += 0.05; c.x += c.vx + Math.sin(c.sway) * 0.8; c.y += c.vy; c.rot += c.vr;
    }
    this.confetti = this.confetti.filter(c => c.y < SBR.CONFIG.H + 20);
    if (this.confetti.length > 220) this.confetti.splice(0, this.confetti.length - 220);
    // 花火を定期的に打ち上げ
    if (Math.random() < 0.06) this._spawnFirework();
    for (const f of this.fireworks) { f.x += f.vx; f.y += f.vy; f.vy += 0.03; f.vx *= 0.99; f.life -= f.decay; }
    this.fireworks = this.fireworks.filter(f => f.life > 0);
    // キラキラ
    if (Math.random() < 0.4) SBR.FX.sparkle(Math.random() * SBR.CONFIG.W, Math.random() * SBR.CONFIG.H * 0.6,
      this._palette[Math.floor(Math.random() * this._palette.length)], 3);
  },
  handleInput() {},

  draw(ctx, t) {
    const C = SBR.CONFIG;
    // ===== 特別背景：虹色グラデ ＋ 回転する放射光 =====
    const hue = (t * 0.02) % 360;
    const g = ctx.createLinearGradient(0, 0, 0, C.H);
    g.addColorStop(0, `hsl(${(hue) % 360}, 60%, 20%)`);
    g.addColorStop(0.5, `hsl(${(hue + 40) % 360}, 55%, 12%)`);
    g.addColorStop(1, `hsl(${(hue + 80) % 360}, 60%, 8%)`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, C.W, C.H);

    // 回転放射光（中央上から扇状に伸びる光線）
    ctx.save();
    ctx.translate(C.W / 2, 170);
    ctx.globalCompositeOperation = 'lighter';
    const rays = 16;
    for (let i = 0; i < rays; i++) {
      const a = (Math.PI * 2 * i) / rays + t * 0.0006;
      ctx.save(); ctx.rotate(a);
      const grd = ctx.createLinearGradient(0, 0, 0, -700);
      grd.addColorStop(0, `hsla(${(hue + i * 22) % 360}, 90%, 65%, 0.16)`);
      grd.addColorStop(1, 'hsla(0,0%,100%,0)');
      ctx.fillStyle = grd;
      ctx.beginPath(); ctx.moveTo(-26, 0); ctx.lineTo(26, 0); ctx.lineTo(70, -700); ctx.lineTo(-70, -700);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    ctx.restore();

    // 花火
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const f of this.fireworks) {
      ctx.globalAlpha = Math.max(0, f.life);
      ctx.fillStyle = f.color;
      ctx.beginPath(); ctx.arc(f.x, f.y, f.size * f.life, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();

    // ===== 文字（虹色＋脈動） =====
    const pulse = 1 + Math.sin(t * 0.006) * 0.06;
    ctx.save(); ctx.textAlign = 'center';
    ctx.translate(C.W / 2, 118);
    ctx.scale(pulse, pulse);
    ctx.font = "900 44px 'Noto Sans JP'";
    ctx.fillStyle = `hsl(${(t * 0.2) % 360}, 95%, 65%)`;
    ctx.shadowColor = `hsl(${(t * 0.2 + 180) % 360}, 95%, 60%)`; ctx.shadowBlur = 28;
    ctx.fillText('🎓 卒業おめでとう！', 0, 0);
    ctx.restore();

    ctx.save(); ctx.textAlign = 'center'; ctx.shadowBlur = 0;
    ctx.font = "700 18px 'Noto Sans JP'"; ctx.fillStyle = '#eaf2ff';
    ctx.fillText('あなたは営業プロセスの全7段階を踏破した。', C.W / 2, 170);
    ctx.fillText('アポ獲得から顧客フォローまで——もう立派な営業だ。', C.W / 2, 200);
    ctx.font = "900 24px 'Noto Sans JP'";
    ctx.fillStyle = '#ffe14d'; ctx.shadowColor = '#ffd166'; ctx.shadowBlur = 16;
    ctx.fillText(`営業ランク: ${this.rank}`, C.W / 2, 250);
    ctx.shadowBlur = 0;
    ctx.font = "700 14px 'Noto Sans JP'"; ctx.fillStyle = '#cfe0ff';
    ctx.fillText(`Lv.${SBR.game.player.level}  習得用語 ${SBR.game.glossary.length}個`, C.W / 2, 282);
    ctx.restore();

    // ===== 主人公：ぴょんぴょん跳ねる＋スポットライト =====
    const jump = Math.abs(Math.sin(t * 0.005)) * 28;       // 上下バウンド
    const tilt = Math.sin(t * 0.004) * 0.06;               // 左右ゆれ
    const hx = C.W / 2, hbase = 560;
    ctx.save();
    // スポットライト
    ctx.globalCompositeOperation = 'lighter';
    const sg = ctx.createRadialGradient(hx, hbase - 120, 20, hx, hbase - 120, 220);
    sg.addColorStop(0, 'rgba(255,240,180,0.22)'); sg.addColorStop(1, 'rgba(255,240,180,0)');
    ctx.fillStyle = sg; ctx.fillRect(hx - 220, hbase - 340, 440, 360);
    ctx.restore();

    ctx.save();
    ctx.translate(hx, hbase - jump);
    ctx.rotate(tilt);
    SBR.Render.drawCharacter(ctx, 'hero', 'joy', -75, -240, 150, 240, { t });
    ctx.restore();

    // ===== 紙吹雪（最前面） =====
    for (const c of this.confetti) {
      ctx.save();
      ctx.translate(c.x, c.y); ctx.rotate(c.rot);
      ctx.fillStyle = c.color;
      ctx.fillRect(-c.size / 2, -c.size / 4, c.size, c.size / 2);
      ctx.restore();
    }

    SBR.FX.drawParticles(ctx);
  },
};
