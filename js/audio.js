// audio.js — 効果音(Tone.js合成) ＆ シーン別BGM(MP3再生)
// BGMは bgm/ フォルダの mp3 を HTMLAudio でループ再生。file:// でも http でも動作。
// 効果音は従来どおり Tone.js のシンセ音。
window.SBR = window.SBR || {};

SBR.Audio = {
  ready: false,        // Tone(効果音)初期化済み
  enabled: true,
  // 効果音シンセ
  se: null, seMetal: null, seNoise: null, seMembrane: null,

  // ===== BGM(MP3) =====
  // キー → ファイル（シーン/ステージごとに割当）
  BGM_FILES: {
    menu:     'bgm/メニュー画面.mp3',      // タイトル / マップ
    apo:      'bgm/受付突破.mp3',          // アポ獲得
    hearing:  'bgm/受付突破.mp3',          // ヒアリング
    issue:    'bgm/受付突破2.mp3',         // 課題特定
    proposal: 'bgm/受付突破2.mp3',         // 提案
    rebuttal: 'bgm/クロージング.mp3',      // 反論処理
    closing:  'bgm/クロージング.mp3',      // クロージング
    follow:   'bgm/フォロー.mp3',          // フォロー
    fanfare:  'bgm/受注のファンファーレ.mp3', // リザルト / 卒業
  },
  bgmEl: null,         // HTMLAudioElement（使い回す）
  bgmKey: null,        // 現在再生中のキー
  bgmVolume: 0.55,

  async start() {
    if (typeof Tone !== 'undefined' && !this.ready) {
      try {
        await Tone.start();
        this.se = new Tone.PolySynth(Tone.Synth).toDestination(); this.se.volume.value = -10;
        this.seMetal = new Tone.MetalSynth({ frequency: 200, envelope: { decay: 0.2 } }).toDestination(); this.seMetal.volume.value = -22;
        this.seNoise = new Tone.NoiseSynth({ envelope: { attack: 0.005, decay: 0.1, sustain: 0 } }).toDestination(); this.seNoise.volume.value = -20;
        this.seMembrane = new Tone.MembraneSynth().toDestination(); this.seMembrane.volume.value = -8;
        this.ready = true;
      } catch (e) { /* 効果音なしでも続行 */ }
    }
    // ユーザー操作後に再生が解禁されるので、保留中のBGMを鳴らす
    if (this.bgmKey && this.bgmEl && this.bgmEl.paused) {
      this.bgmEl.play().catch(() => {});
    }
  },

  play(type) {
    if (!this.ready || !this.enabled || !this.se) return;
    try {
      const n = Tone.now();
      switch (type) {
        case 'select':   this.se.triggerAttackRelease('C5', '16n', n); break;
        case 'hit':      this.seMetal.triggerAttackRelease('16n', n); break;
        case 'crit':     this.se.triggerAttackRelease(['C5', 'G5', 'C6'], '8n', n); break;
        case 'good':     this.se.triggerAttackRelease(['E5', 'B5'], '16n', n); break;
        case 'miss':     this.seNoise.triggerAttackRelease('8n', n); break;
        case 'damage':   this.seMembrane.triggerAttackRelease('C2', '8n', n); break;
        case 'win':      this.se.triggerAttackRelease(['C5', 'E5', 'G5', 'C6'], '4n', n); break;
        case 'lose':     this.se.triggerAttackRelease(['C4', 'A3', 'F3'], '4n', n); break;
        case 'levelup':  this.se.triggerAttackRelease(['G5', 'C6', 'E6'], '8n', n); break;
        case 'knowledge':this.se.triggerAttackRelease('A5', '16n', n); break;
      }
    } catch (e) {}
  },

  // シーン/ステージ別BGM。key は BGM_FILES のキー。
  playBgm(key) {
    const file = this.BGM_FILES[key];
    if (!file) return;
    // 同じ曲なら継続（同一ファイルを共有するキー間でも切り替えない）
    if (this.bgmKey && this.BGM_FILES[this.bgmKey] === file) { this.bgmKey = key; return; }
    this.bgmKey = key;
    try {
      if (!this.bgmEl) {
        this.bgmEl = new Audio();
        this.bgmEl.loop = true;
        this.bgmEl.preload = 'auto';
      }
      this.bgmEl.pause();
      this.bgmEl.src = encodeURI(file);   // 日本語ファイル名対応
      this.bgmEl.volume = this.bgmVolume;
      this.bgmEl.currentTime = 0;
      // ユーザー操作前は play() が拒否される→ start() 後に再開
      this.bgmEl.play().catch(() => {});
    } catch (e) {}
  },

  stopBgm() {
    try { if (this.bgmEl) { this.bgmEl.pause(); } this.bgmKey = null; } catch (e) {}
  },
};
