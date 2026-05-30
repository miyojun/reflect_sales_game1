// config.js — 定数・チューニング値
window.SBR = window.SBR || {};

SBR.CONFIG = {
  W: 960,
  H: 600,

  COLORS: {
    bg1: '#0f1226',
    bg2: '#1b2150',
    accent: '#4fd1ff',
    accent2: '#ffd166',
    hero: '#4fd1ff',
    enemy: '#ff6b8a',
    good: '#5ee08a',
    bad: '#ff5d5d',
    crit: '#ffe14d',
    panel: 'rgba(12,16,40,0.82)',
    text: '#eaf2ff',
  },

  // 戦闘バランス
  BASE_DMG: 30,
  CRIT_MULT: 1.7,
  STAT_DIVISOR: 90,   // statBonus = stat / DIVISOR
  TRUST_SOAK: 120,    // 信頼でカウンター被害を軽減（小さいほど軽減大）

  // タイミング判定の倍率
  TIMING: { PERFECT: 1.6, GOOD: 1.0, MISS: 0.35 },

  // トーク正誤の倍率
  TALK: { correct: 1.5, partial: 0.7, wrong: 0.15 },
};
