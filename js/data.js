// data.js — ゲームデータ（ステージ / 反論=敵 / 用語集 / プレイヤー初期値 / アセットmanifest）
window.SBR = window.SBR || {};

// ===== プレイヤー初期値・成長 =====
SBR.PLAYER_BASE = {
  level: 1,
  exp: 0,
  stats: { hearing: 6, proposal: 6, trust: 12, mental: 60 },
  maxMental: 60,
  growth: { hearing: 3, proposal: 3, trust: 3, maxMental: 12 }, // レベルアップ毎
};

// 各レベルに到達するのに必要な累計EXP
SBR.LEVEL_TABLE = [0, 80, 200, 380, 620, 920, 1300, 1800, 2400];
SBR.expForLevel = (lvl) => SBR.LEVEL_TABLE[lvl - 1] ?? (2400 + (lvl - 8) * 800);

// ===== 反論（敵）定義 =====
// talks: ちょうど1つが correct。partial があれば中効果。primaryStat: そのステージで効くステータス。
SBR.OBJECTIONS = {
  // --- Stage1: アポ獲得 ---
  busy_brushoff: {
    label: '受付担当', sprite: 'receptionist', mood: 'neutral',
    quote: '「あいにく担当は席を外しておりまして…」',
    hp: 50, attack: 9, difficulty: 1, primaryStat: 'trust', exp: 30,
    action: { type: 'timing', speed: 0.55, zoneWidth: 0.34, perfectWidth: 0.12 },
    talks: [
      { text: 'では、また改めてお電話します…', eff: 'wrong' },
      { text: '◯◯の件で3分だけ。ご担当者様のお名前を伺えますか？', eff: 'correct' },
      { text: 'とにかく一度会ってください！', eff: 'wrong' },
    ],
    learn: { term: 'リード', body: '見込み客のこと。まずは「誰が決裁に関わるか」を特定するのが第一歩。' },
  },
  no_interest: {
    label: '多忙な課長', sprite: 'manager', mood: 'angry',
    quote: '「間に合ってるよ。今うちは忙しくてね」',
    hp: 60, attack: 11, difficulty: 1, primaryStat: 'trust', exp: 34,
    action: { type: 'timing', speed: 0.7, zoneWidth: 0.3, perfectWidth: 0.1 },
    talks: [
      { text: '安くしますので！', eff: 'wrong' },
      { text: '製品説明をさせてください', eff: 'partial' },
      { text: '同業の◯◯社様が「工数が3割減った」と。15分だけ比べてみませんか？', eff: 'correct' },
    ],
    learn: { term: '価値訴求', body: '製品の機能ではなく「相手が得る成果」を一言で示すと会う理由になる。' },
  },
  gatekeeper: {
    label: '【BOSS】鉄壁の受付', sprite: 'gatekeeper', mood: 'angry', boss: true,
    quote: '「アポのない方はお取次ぎできません」',
    hp: 120, attack: 13, difficulty: 2, primaryStat: 'trust', exp: 70,
    action: { type: 'timing', speed: 0.82, zoneWidth: 0.27, perfectWidth: 0.09 },
    talks: [
      { text: '何とかお願いします！', eff: 'wrong' },
      { text: '受付の方を通さず直接行きます', eff: 'wrong' },
      { text: '田中部長宛に資料をお送り済みです。ご感想だけ伺いたく、5分お時間を。', eff: 'correct' },
    ],
    learn: { term: '決裁者', body: '購入を最終決定する人。早く決裁者にたどり着くほど商談は速く進む。' },
  },

  // --- Stage2: ヒアリング ---
  no_problem: {
    label: '無関心な担当者', sprite: 'staff', mood: 'neutral',
    quote: '「特に困ってることはないですね」',
    hp: 68, attack: 11, difficulty: 2, primaryStat: 'hearing', exp: 40,
    action: { type: 'timing', speed: 0.7, zoneWidth: 0.3, perfectWidth: 0.1 },
    talks: [
      { text: 'では弊社製品の特徴を説明します', eff: 'wrong' },
      { text: '今の業務で一番お時間を取られているのはどの作業ですか？', eff: 'correct' },
      { text: '本当に何も困っていないのですか？', eff: 'wrong' },
    ],
    learn: { term: 'SPIN・状況質問', body: '事実・現状を尋ねる質問。相手に現状を語らせ、課題の入口を探る。' },
  },
  talkative: {
    label: 'おしゃべり担当', sprite: 'staff', mood: 'happy',
    quote: '「いやー色々あるんだけどね、まあ昔からこうでさ」',
    hp: 72, attack: 10, difficulty: 2, primaryStat: 'hearing', exp: 42,
    action: { type: 'mash', durationMs: 3200, target: 14 },
    talks: [
      { text: 'なるほど。その中で“今すぐ解決したい”のはどれですか？', eff: 'correct' },
      { text: 'それは大変ですね〜（相槌だけ）', eff: 'partial' },
      { text: 'では提案書を作りますね', eff: 'wrong' },
    ],
    learn: { term: '傾聴', body: '相手8割・自分2割。話を引き出しつつ、要点を一緒に整理するのが営業の傾聴。' },
  },
  silent_client: {
    label: '【BOSS】本音を見せない部長', sprite: 'manager', mood: 'neutral', boss: true,
    quote: '「……（腕を組んで黙っている）」',
    hp: 135, attack: 14, difficulty: 3, primaryStat: 'hearing', exp: 80,
    action: { type: 'timing', speed: 0.85, zoneWidth: 0.26, perfectWidth: 0.09 },
    talks: [
      { text: '何かご質問はありますか？（沈黙に焦る）', eff: 'wrong' },
      { text: 'もしこの課題が続くと、来期の数字にどう影響しそうですか？', eff: 'correct' },
      { text: 'とりあえず資料を置いていきます', eff: 'wrong' },
    ],
    learn: { term: 'SPIN・示唆質問', body: '課題を放置した場合の影響に気づかせる質問。本音と緊急度を引き出す。' },
  },

  // --- Stage3: 課題特定 ---
  vague_issue: {
    label: '曖昧な担当者', sprite: 'staff', mood: 'neutral',
    quote: '「なんとなく非効率な気はするんですけどね…」',
    hp: 78, attack: 12, difficulty: 2, primaryStat: 'hearing', exp: 46,
    action: { type: 'timing', speed: 0.78, zoneWidth: 0.28, perfectWidth: 0.1 },
    talks: [
      { text: '具体的には、月に何時間くらいかかっていますか？', eff: 'correct' },
      { text: '非効率なんですね、わかります', eff: 'partial' },
      { text: '弊社なら解決できます！', eff: 'wrong' },
    ],
    learn: { term: '定量化', body: '「なんとなく」を時間・金額・件数に変換すると、課題の大きさが共有できる。' },
  },
  special_company: {
    label: '特別意識の強い課長', sprite: 'manager', mood: 'angry',
    quote: '「うちは特殊だから、よそのやり方は合わないよ」',
    hp: 88, attack: 13, difficulty: 3, primaryStat: 'hearing', exp: 50,
    action: { type: 'timing', speed: 0.84, zoneWidth: 0.27, perfectWidth: 0.09 },
    talks: [
      { text: 'どの会社さんも同じことを言いますよ', eff: 'wrong' },
      { text: '御社ならではの事情、ぜひ詳しく教えてください', eff: 'correct' },
      { text: 'では標準プランでいきましょう', eff: 'wrong' },
    ],
    learn: { term: 'ペルソナ', body: '相手の立場・関心・前提を具体的に描くこと。否定せず相手基準で課題を捉える。' },
  },
  hidden_need: {
    label: '【BOSS】潜在ニーズの壁', sprite: 'manager', mood: 'neutral', boss: true,
    quote: '「課題はあるが、今やる必要はないかな」',
    hp: 150, attack: 15, difficulty: 3, primaryStat: 'hearing', exp: 90,
    action: { type: 'mash', durationMs: 3000, target: 16 },
    talks: [
      { text: '今すぐ始めないと損ですよ！', eff: 'wrong' },
      { text: '解決できたら、現場の方はどんな状態になれそうですか？', eff: 'correct' },
      { text: '一旦保留にしましょうか', eff: 'wrong' },
    ],
    learn: { term: 'SPIN・解決質問', body: '解決後の理想を相手に語らせる質問。自ら必要性に気づき、購買意欲が高まる。' },
  },

  // --- Stage4: 提案 ---
  price_first: {
    label: '価格重視の担当者', sprite: 'staff', mood: 'neutral',
    quote: '「で、結局おいくらなんですか？」',
    hp: 86, attack: 13, difficulty: 2, primaryStat: 'proposal', exp: 52,
    action: { type: 'timing', speed: 0.8, zoneWidth: 0.28, perfectWidth: 0.1 },
    talks: [
      { text: '月◯万円です（即答）', eff: 'partial' },
      { text: '先ほどの“月40時間の削減”が、人件費で年◯万円。投資回収は約3ヶ月です', eff: 'correct' },
      { text: 'まずは値引きを頑張ります', eff: 'wrong' },
    ],
    learn: { term: 'ROI', body: '投資対効果。価格は「効果」とセットで語ると高い/安いの基準が生まれる。' },
  },
  feature_overload: {
    label: '機能を比較する担当', sprite: 'staff', mood: 'neutral',
    quote: '「機能が多すぎて、結局どれが要るのか…」',
    hp: 92, attack: 13, difficulty: 3, primaryStat: 'proposal', exp: 54,
    action: { type: 'timing', speed: 0.84, zoneWidth: 0.27, perfectWidth: 0.09 },
    talks: [
      { text: '全機能ご利用いただけます！', eff: 'wrong' },
      { text: '御社の“月40時間削減”に直結するのは、この3機能です', eff: 'correct' },
      { text: '詳しくはマニュアルをご覧ください', eff: 'wrong' },
    ],
    learn: { term: 'ベネフィット', body: '機能(Feature)ではなく、相手が得る利益(Benefit)に翻訳して提案する。' },
  },
  price_wall: {
    label: '【BOSS】価格の壁', sprite: 'manager', mood: 'angry', boss: true,
    quote: '「高いなぁ。他社はもっと安いよ」',
    hp: 160, attack: 16, difficulty: 4, primaryStat: 'proposal', exp: 95,
    action: { type: 'timing', speed: 0.9, zoneWidth: 0.25, perfectWidth: 0.08 },
    talks: [
      { text: 'では同じ金額まで下げます', eff: 'wrong' },
      { text: '価格だけなら他社が上です。ただ“導入後の伴走支援”込みの総額では当社が有利です', eff: 'correct' },
      { text: '高いのは品質が良いからです', eff: 'partial' },
    ],
    learn: { term: '差別化', body: '同じ土俵(価格)で戦わない。自社だけの価値(支援・実績)で比較軸をずらす。' },
  },

  // --- Stage5: 反論処理 ---
  no_precedent: {
    label: '慎重な担当者', sprite: 'staff', mood: 'neutral',
    quote: '「社内に前例がないので不安で…」',
    hp: 92, attack: 14, difficulty: 3, primaryStat: 'trust', exp: 56,
    action: { type: 'timing', speed: 0.82, zoneWidth: 0.27, perfectWidth: 0.09 },
    talks: [
      { text: '前例はそのうちできますよ', eff: 'wrong' },
      { text: 'ご不安はもっともです。同業の導入事例と、スモールスタート案をご用意できます', eff: 'correct' },
      { text: '思い切ってやりましょう！', eff: 'wrong' },
    ],
    learn: { term: 'Yes,and法', body: '一度受け止めてから(Yes)、代替や事例で前進させる(and)。否定で返さない。' },
  },
  risk_worry: {
    label: 'リスクを恐れる課長', sprite: 'manager', mood: 'sad',
    quote: '「もし失敗したら、私の責任になる」',
    hp: 98, attack: 15, difficulty: 3, primaryStat: 'trust', exp: 58,
    action: { type: 'mash', durationMs: 2900, target: 16 },
    talks: [
      { text: '失敗しませんから大丈夫です', eff: 'wrong' },
      { text: '万一に備え、初月は解約自由＋当社が導入を伴走します。リスクを最小化しましょう', eff: 'correct' },
      { text: '責任は私が取ります', eff: 'partial' },
    ],
    learn: { term: 'リスクリバーサル', body: '相手の不安を保証・条件で肩代わりし、決断のハードルを下げる手法。' },
  },
  anxiety_wall: {
    label: '【BOSS】不安の壁', sprite: 'manager', mood: 'sad', boss: true,
    quote: '「本当にうちで使いこなせるのか…」',
    hp: 170, attack: 17, difficulty: 4, primaryStat: 'trust', exp: 100,
    action: { type: 'timing', speed: 0.92, zoneWidth: 0.24, perfectWidth: 0.08 },
    talks: [
      { text: '簡単なので誰でも使えます', eff: 'wrong' },
      { text: '操作研修と専任サポートが付きます。最初の3ヶ月は私が毎週伴走します', eff: 'correct' },
      { text: 'マニュアルがあるので大丈夫です', eff: 'partial' },
    ],
    learn: { term: 'カスタマーサクセス', body: '売って終わりでなく“顧客の成功”まで支える姿勢。信頼を生み解約を防ぐ。' },
  },

  // --- Stage6: クロージング ---
  postpone: {
    label: '先延ばし担当者', sprite: 'staff', mood: 'neutral',
    quote: '「一旦持ち帰って検討します」',
    hp: 96, attack: 15, difficulty: 3, primaryStat: 'trust', exp: 60,
    action: { type: 'mash', durationMs: 2800, target: 17 },
    talks: [
      { text: 'わかりました、ご連絡お待ちします', eff: 'wrong' },
      { text: '持ち帰りで判断が分かれそうな点は何でしょう？今ここで解消しませんか？', eff: 'correct' },
      { text: '今だけ特別価格です！', eff: 'partial' },
    ],
    learn: { term: 'テストクロージング', body: '「もし〜なら進めますか？」と仮の合意を取り、残る障害を表面化させる。' },
  },
  need_approval: {
    label: '稟議が必要な課長', sprite: 'manager', mood: 'neutral',
    quote: '「上の承認を取らないと決められなくて」',
    hp: 100, attack: 15, difficulty: 4, primaryStat: 'proposal', exp: 62,
    action: { type: 'timing', speed: 0.9, zoneWidth: 0.25, perfectWidth: 0.08 },
    talks: [
      { text: 'では承認が下りたらご連絡を', eff: 'wrong' },
      { text: '稟議を通しやすいよう、費用対効果の社内資料を一緒に作りましょう', eff: 'correct' },
      { text: '上司の方を紹介してください', eff: 'partial' },
    ],
    learn: { term: '稟議・BANT', body: 'B予算/A決裁権/N必要性/T時期。特に決裁プロセス(稟議)を支援すると受注が早まる。' },
  },
  decision_wall: {
    label: '【BOSS】決断の壁', sprite: 'manager', mood: 'neutral', boss: true,
    quote: '「うーん、もう少し考えさせて」',
    hp: 180, attack: 18, difficulty: 5, primaryStat: 'trust', exp: 110,
    action: { type: 'shrink', durationMs: 4400, taps: 3 },
    talks: [
      { text: '考える時間は十分ありましたよね？（圧をかける）', eff: 'wrong' },
      { text: 'ご懸念は◯◯ですね。それが解決すれば、来月開始で進めてよろしいですか？', eff: 'correct' },
      { text: 'みなさん導入されていますよ', eff: 'partial' },
    ],
    learn: { term: 'クロージング', body: '不安を一つずつ潰し、次の具体的な一歩(開始日)を合意すること。押し売りではない。' },
  },

  // --- Stage7: フォロー ---
  post_silence: {
    label: '導入後の担当者', sprite: 'staff', mood: 'sad',
    quote: '「導入したけど、放っておかれてる気が…」',
    hp: 96, attack: 15, difficulty: 3, primaryStat: 'trust', exp: 64,
    action: { type: 'timing', speed: 0.84, zoneWidth: 0.27, perfectWidth: 0.09 },
    talks: [
      { text: '何かあればご連絡ください', eff: 'wrong' },
      { text: '定例で活用状況を確認させてください。今月の効果を一緒に振り返りましょう', eff: 'correct' },
      { text: 'マニュアルを再送します', eff: 'partial' },
    ],
    learn: { term: 'オンボーディング', body: '導入直後に使いこなしを支援すること。最初の成功体験が継続利用を決める。' },
  },
  churn_risk: {
    label: '解約を考える課長', sprite: 'manager', mood: 'angry',
    quote: '「効果が見えないし、やめようかと」',
    hp: 104, attack: 16, difficulty: 4, primaryStat: 'proposal', exp: 66,
    action: { type: 'mash', durationMs: 2700, target: 17 },
    talks: [
      { text: '解約は困ります！', eff: 'wrong' },
      { text: '導入前後の数値を比較しました。月32時間削減できています。次はこの活用を', eff: 'correct' },
      { text: '割引しますので継続を', eff: 'partial' },
    ],
    learn: { term: 'チャーン(解約)', body: '効果を“数値で可視化”して示すと不満が信頼に変わり、解約を防げる。' },
  },
  upsell_chance: {
    label: '【BOSS】次の一歩', sprite: 'manager', mood: 'happy', boss: true,
    quote: '「おかげで助かってるよ。ありがとう」',
    hp: 190, attack: 17, difficulty: 5, primaryStat: 'proposal', exp: 130,
    action: { type: 'shrink', durationMs: 4200, taps: 3 },
    talks: [
      { text: '今後ともよろしくお願いします（で終了）', eff: 'partial' },
      { text: '成果が出た今、隣の部署にも展開しませんか？同じ効果が見込めます', eff: 'correct' },
      { text: 'もっと上位プランを買ってください', eff: 'wrong' },
    ],
    learn: { term: 'アップセル/紹介', body: '成功した顧客は最高の見込み客。横展開・紹介で次の商談が生まれる好循環。' },
  },
};

// ===== ステージ（営業プロセス） =====
SBR.STAGES = [
  { id: 'apo', name: 'アポ獲得', order: 1, relStat: 'trust', bg: 'lobby',
    intro: '配属初日。まずは会ってもらわなければ始まらない。電話と飛び込みで“会う約束(アポ)”を取れ！',
    enemies: ['busy_brushoff', 'no_interest'], boss: 'gatekeeper' },
  { id: 'hearing', name: 'ヒアリング', order: 2, relStat: 'hearing', bg: 'meeting',
    intro: '商談の席についた。いきなり売り込んではいけない。相手の“現状”を聞き出せ！',
    enemies: ['no_problem', 'talkative'], boss: 'silent_client' },
  { id: 'issue', name: '課題特定', order: 3, relStat: 'hearing', bg: 'meeting',
    intro: '会話の中に課題の種がある。曖昧な不満を“具体的な課題”へと掘り下げろ！',
    enemies: ['vague_issue', 'special_company'], boss: 'hidden_need' },
  { id: 'proposal', name: '提案', order: 4, relStat: 'proposal', bg: 'office',
    intro: 'いよいよ提案。機能ではなく“相手の得る成果”で語れ。価格は効果とセットだ！',
    enemies: ['price_first', 'feature_overload'], boss: 'price_wall' },
  { id: 'rebuttal', name: '反論処理', order: 5, relStat: 'trust', bg: 'office',
    intro: '前向きな反論こそ購入のサイン。不安を否定せず、受け止めて前進させろ！',
    enemies: ['no_precedent', 'risk_worry'], boss: 'anxiety_wall' },
  { id: 'closing', name: 'クロージング', order: 6, relStat: 'trust', bg: 'office',
    intro: '最後の一押し。押し売りではない。次の具体的な一歩を一緒に決めるのだ！',
    enemies: ['postpone', 'need_approval'], boss: 'decision_wall' },
  { id: 'follow', name: 'フォロー', order: 7, relStat: 'proposal', bg: 'meeting',
    intro: '売って終わりではない。顧客の成功を支え、次の商談へつなげろ。営業は循環する！',
    enemies: ['post_silence', 'churn_risk'], boss: 'upsell_chance' },
];

// ===== アセットmanifest（file://対応のためJS埋め込み。assets/manifest.json と同期） =====
// gpt-image-2は透過非対応 → キャラは緑(クロマキー)背景で生成し js/assets.js が緑を透過化する。
// transparent:true = クロマキー対象。size: キャラ1024x1536 / 背景1536x1024。
SBR.MANIFEST = {
  version: 2,
  basePath: 'assets/',
  sprites: {
    hero_neutral:  { file: 'characters/hero_neutral.png',  status: 'ready', hue: 200, w: 1024, h: 1536, transparent: true },
    hero_joy:      { file: 'characters/hero_joy.png',      status: 'ready', hue: 200, w: 1024, h: 1536, transparent: true },
    hero_anger:    { file: 'characters/hero_anger.png',    status: 'ready', hue: 200, w: 1024, h: 1536, transparent: true },
    hero_sad:      { file: 'characters/hero_sad.png',      status: 'ready', hue: 200, w: 1024, h: 1536, transparent: true },
    hero_surprise: { file: 'characters/hero_surprise.png', status: 'ready', hue: 200, w: 1024, h: 1536, transparent: true },
    receptionist:  { file: 'enemies/receptionist.png',     status: 'ready', hue: 330, w: 1024, h: 1536, transparent: true },
    manager:       { file: 'enemies/manager.png',          status: 'ready', hue: 350, w: 1024, h: 1536, transparent: true },
    staff:         { file: 'enemies/staff.png',            status: 'ready', hue: 280, w: 1024, h: 1536, transparent: true },
    gatekeeper:    { file: 'enemies/gatekeeper.png',        status: 'ready', hue: 0,   w: 1024, h: 1536, transparent: true },
    bg_lobby:      { file: 'bg/lobby.png',   status: 'ready', w: 1536, h: 1024, transparent: false },
    bg_meeting:    { file: 'bg/meeting.png', status: 'ready', w: 1536, h: 1024, transparent: false },
    bg_office:     { file: 'bg/office.png',  status: 'ready', w: 1536, h: 1024, transparent: false },
    bg_map:        { file: 'bg/map.png',     status: 'ready', w: 1536, h: 1024, transparent: false },
  },
};
