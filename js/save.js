// save.js — localStorage セーブ/ロード
window.SBR = window.SBR || {};

SBR.Save = {
  KEY: 'sbr_save_v1',

  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) { return null; }
  },

  save(state) {
    try {
      const data = {
        player: state.player,
        cleared: state.cleared,       // クリア済みステージidの配列
        glossary: state.glossary,     // 解放済み用語の配列
      };
      localStorage.setItem(this.KEY, JSON.stringify(data));
    } catch (e) { /* localStorage不可でも続行 */ }
  },

  clear() {
    try { localStorage.removeItem(this.KEY); } catch (e) {}
  },

  exists() {
    return !!this.load();
  },
};
