# 商談バトルRPG 〜新米営業 成長物語〜

営業部門に配属された新人が、**B2B営業プロセスの全7段階**をアクション付きの商談バトルで学べるブラウザゲーム。

> 顧客の「反論・不安」が敵として現れ、**正しいトークを選ぶ（知識）× タイミングよく攻撃する（アクション）** で撃破。
> 新米主人公がレベルアップして一人前の営業に育つ。

## 遊び方（起動）

`index.html` を**ダブルクリック**するだけ。ビルド不要・サーバー不要で動きます（バニラHTML5 Canvas）。

> ※ 音（Tone.js）はネット接続時のみ。最初の「スタート」ボタンで音が有効化されます。

操作:
- **クリック / Space** … 会話を進める、トークを実行する
- **トーク選択** … 画面下のボタンをクリック（顧客の反論に効く一手を選ぶ）
- **アクション**
  - ⏱ タイミングバー: 中央(金色)で Space/クリック → PERFECT
  - ⚡ 連打ゲージ: 制限時間内に連打
  - 🎯 決断タップ: 縮む円が的に重なる瞬間にタップ

## 学べること

| ステージ | 営業プロセス | 主な用語 |
|---|---|---|
| 1 | アポ獲得 | リード / 価値訴求 / 決裁者 |
| 2 | ヒアリング | SPIN(状況・示唆質問) / 傾聴 |
| 3 | 課題特定 | 定量化 / ペルソナ / 解決質問 |
| 4 | 提案 | ROI / ベネフィット / 差別化 |
| 5 | 反論処理 | Yes,and法 / リスクリバーサル / カスタマーサクセス |
| 6 | クロージング | テストクロージング / BANT / 稟議 |
| 7 | フォロー | オンボーディング / チャーン / アップセル |

撃破時の「💡ナレッジ」とタイトルの「用語集」で用語を復習できます。

## キャラクター画像の差し替え（gpt-image-2）

最初は**手続き描画の仮絵**で動作します。`assets/` に PNG を置くと**コード変更なしで自動的に差し替わります**。

1. `assets/manifest.json`（＝ `js/data.js` の `SBR.MANIFEST` と同期）の各スロットを確認
2. 生成ツールを実行（**有料API・費用確認のうえ**）:
   ```bash
   python tools/gen_assets.py          # placeholder のものを生成
   python tools/gen_assets.py --only hero_joy   # 個別生成
   ```
   - `OPENAI_API_KEY` は `marketing/reflect-x-poster/.env` から読み込み
   - 画像CLI: `~/.codex/skills/.system/imagegen/scripts/image_gen.py`
3. 生成された PNG が `assets/characters/` `assets/enemies/` に入り、次回起動時に反映

## ファイル構成

```
sales_battle_rpg/
├─ index.html          # 入口（script を依存順に読み込み）
├─ css/style.css       # レイアウト・アニメ
├─ js/
│  ├─ config.js   定数・バランス
│  ├─ data.js     ★ステージ/反論(敵)/用語/初期値/MANIFEST
│  ├─ save.js     localStorageセーブ
│  ├─ assets.js   スプライト抽象化(仮絵↔PNG)
│  ├─ audio.js    Tone.js 効果音/BGM
│  ├─ fx.js       パーティクル/シェイク/浮遊テキスト
│  ├─ combat.js   ダメージ計算 & アクション機構
│  ├─ render.js   キャラ/背景/HPバー描画
│  ├─ screens.js  タイトル/マップ/戦闘/リザルト/エンディング
│  └─ game.js     ループ・入力・状態管理(最後に読込)
├─ assets/        画像(PNG)と manifest.json
└─ tools/gen_assets.py   gpt-image-2 生成ツール(手動)
```

技術メモ: `file://` でも動くよう、全モジュールは `window.SBR` 名前空間に集約し、manifest は `data.js` に埋め込み済み（`fetch` 不使用）。
