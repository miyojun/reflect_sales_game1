// assets.js — スプライト抽象化（仮絵 ↔ gpt-image-2 PNG の差し替え）
window.SBR = window.SBR || {};

SBR.Assets = {
  images: {},   // key -> { img, loaded, meta }

  init() {
    const m = SBR.MANIFEST;
    for (const [key, meta] of Object.entries(m.sprites)) {
      const rec = { img: new Image(), loaded: false, meta, canvas: null };
      rec.img.onload = () => {
        // クロマキー指定（transparent:true）のキャラは緑を抜いてcanvas化
        if (meta.transparent) {
          try { rec.canvas = SBR.Assets.chromaKey(rec.img); } catch (e) { rec.canvas = null; }
        }
        rec.loaded = true;
      };
      rec.img.onerror = () => { rec.loaded = false; }; // 無ければ仮絵にフォールバック
      // PNGが存在すれば読み込む。無ければonerrorで仮絵描画に回る。
      rec.img.src = m.basePath + meta.file;
      this.images[key] = rec;
    }
  },

  // 緑(クロマキー)背景を透過させてオフスクリーンcanvasを返す
  chromaKey(img) {
    const w = img.naturalWidth, h = img.naturalHeight;
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const cx = cv.getContext('2d');
    cx.drawImage(img, 0, 0);
    const data = cx.getImageData(0, 0, w, h);
    const d = data.data;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i + 1], b = d[i + 2];
      // 緑が突出している画素を透過（クロマキー）
      if (g > 90 && g > r * 1.35 && g > b * 1.35) {
        d[i + 3] = 0;
      } else if (g > r * 1.15 && g > b * 1.15 && g > 80) {
        // 縁取りの緑かぶりを薄く（半透明＋緑成分を抑制）
        d[i + 3] = Math.min(d[i + 3], 130);
        d[i + 1] = Math.round((r + b) / 2);
      }
    }
    cx.putImageData(data, 0, 0);
    return cv;
  },

  // 読み込み済みなら描画ソース（canvas or Image）、無ければ null
  get(key) {
    const r = this.images[key];
    if (!r || !r.loaded) return null;
    return r.canvas || r.img;
  },

  meta(key) {
    const r = this.images[key];
    return r ? r.meta : null;
  },
};

// キャラ用: charId(例 'hero') + mood(例 'joy') → スプライト or null
SBR.getCharacterSprite = function (charId, mood) {
  // hero は mood別、敵は単一キー
  const key = SBR.Assets.images[`${charId}_${mood}`] ? `${charId}_${mood}` : charId;
  return SBR.Assets.get(key);
};
