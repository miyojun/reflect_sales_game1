// game.js — 起動・ゲームループ・状態管理・入力（最後に読み込む）
window.SBR = window.SBR || {};

SBR.game = {
  player: null,
  cleared: [],
  glossary: [],
  screenName: null,
  screen: null,
};

// ===== セーブ/ロード/初期化 =====
SBR.newGame = function () {
  const base = JSON.parse(JSON.stringify(SBR.PLAYER_BASE));
  SBR.game.player = base;
  SBR.game.cleared = [];
  SBR.game.glossary = [];
};

SBR.loadGame = function () {
  const data = SBR.Save.load();
  if (!data) { SBR.newGame(); return; }
  SBR.game.player = data.player || JSON.parse(JSON.stringify(SBR.PLAYER_BASE));
  SBR.game.cleared = data.cleared || [];
  SBR.game.glossary = data.glossary || [];
};

SBR.saveGame = function () { SBR.Save.save(SBR.game); };

// ===== 画面遷移 =====
SBR.changeScreen = function (name, payload) {
  if (SBR.game.screen && SBR.game.screen.exit) SBR.game.screen.exit();
  SBR.game.screen = SBR.Screens[name];
  SBR.game.screenName = name;
  if (SBR.game.screen.enter) SBR.game.screen.enter(payload || {});
};

SBR.startBattle = function (stageId) {
  SBR.changeScreen('battle', { stageId });
};

// ===== ループ =====
SBR._lastTs = 0;
SBR.loop = function (ts) {
  const dt = SBR._lastTs ? Math.min(40, ts - SBR._lastTs) : 16.67;
  SBR._lastTs = ts;

  const ctx = SBR.ctx;
  const C = SBR.CONFIG;

  if (SBR.game.screen) {
    if (SBR.game.screen.update) SBR.game.screen.update(dt);

    ctx.clearRect(0, 0, C.W, C.H);
    ctx.save();
    SBR.FX.applyShake(ctx);
    if (SBR.game.screen.draw) SBR.game.screen.draw(ctx, ts);
    ctx.restore();
    SBR.FX.drawFlash(ctx);
  }

  requestAnimationFrame(SBR.loop);
};

// ===== 入力（canvas座標へ正規化して現在画面へ委譲） =====
SBR._dispatchPointer = function (clientX, clientY) {
  const rect = SBR.canvas.getBoundingClientRect();
  const cx = (clientX - rect.left) / rect.width * SBR.CONFIG.W;
  const cy = (clientY - rect.top) / rect.height * SBR.CONFIG.H;
  if (SBR.game.screen && SBR.game.screen.handleInput)
    SBR.game.screen.handleInput({ type: 'pointer', cx, cy });
};

SBR.initInput = function () {
  // canvasクリック（DOMボタンの上は別途button側で処理されるのでcanvas直下のみ）
  SBR.canvas.addEventListener('pointerdown', (e) => {
    SBR._dispatchPointer(e.clientX, e.clientY);
  });
  // キー
  window.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') e.preventDefault();
    if (SBR.game.screen && SBR.game.screen.handleInput)
      SBR.game.screen.handleInput({ type: 'key', key: e.key });
  });

  // 最初のユーザー操作（ブラウザの自動再生制限解除）で音声を起動し、
  // 現在画面のBGM（タイトル/マップならメニュー曲）を即再生する。一度きり。
  const unlockAudio = async () => {
    await SBR.Audio.start();
    const name = SBR.game.screenName;
    if (name === 'title' || name === 'map') SBR.Audio.playBgm('menu');
  };
  window.addEventListener('pointerdown', unlockAudio, { once: true });
  window.addEventListener('keydown', unlockAudio, { once: true });
  window.addEventListener('touchstart', unlockAudio, { once: true });
};

// ===== 起動 =====
SBR.init = function () {
  SBR.canvas = document.getElementById('game');
  SBR.ctx = SBR.canvas.getContext('2d');
  SBR.Assets.init();
  SBR.initInput();
  SBR.newGame();           // 既存セーブはタイトルの「つづきから」でロード
  SBR.changeScreen('title');
  requestAnimationFrame(SBR.loop);
};

window.addEventListener('DOMContentLoaded', SBR.init);
