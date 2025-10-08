// web/src/data/products.js

const BASE = import.meta.env.BASE_URL || "/";

// 路徑 helper
const img3C = (name) => `${BASE}images/3C/${name}`;
const imgHome = (name) => `${BASE}images/home/${name}`;
const imgBeauty = (name) => `${BASE}images/beauty/${name}`;

/* -----------------------------------------------------------
 * A) 美妝「容量 → 通用價格」（僅作為後備）
 * ---------------------------------------------------------*/
const PRICE_TABLE = {
  '11ml': 800,
  '14ml': 1200,
  '50ml': 3600,
  '6.5g': 4800,
  '35g': 6000,
};

/* -----------------------------------------------------------
 * B) 每款香型的「客製價格」（優先於 PRICE_TABLE）
 *    key = 款名（如「藍扁柏」），value = { '容量': 價格 }
 * ---------------------------------------------------------*/
const PER_SCENT_PRICES = {
  '藍扁柏':        { '11ml': 1500, '14ml': 1600, '50ml': 4280 },
  '查莫':          { '11ml': 1300, '14ml': 1400, '50ml': 4000, '6.5g': 1580 },
  '陽光':          { '11ml': 1500, '50ml': 4280 },
  '博塔里':        { '11ml': 2200, '50ml': 4680, '6.5g': 1580 },
  '晚霞':          { '11ml': 1500, '50ml': 4000, '6.5g': 1580 },
  '貝爾加涼鞋':    { '50ml': 3800, '6.5g': 1580 },
  '拉萊':          { '50ml': 3800, '6.5g': 1580 },
  '未知烏木':      { '50ml': 3800 },
  '木知烏木':      { '50ml': 3800 }, // 同義別名也支援
  '白大吉嶺':      { '11ml': 1500, '50ml': 3600 },
  '乾草堆':        { '50ml': 3600 },
  '南瓜':          { '14ml': 1500, '50ml': 3800, '6.5g': 1580 },
  '木鹽海灘':      { '50ml': 3780 },
  '棕色':          { '50ml': 3780 },
  '深秋':          { '14ml': 1500, '50ml': 3800 },
  '湖中沐浴者':    { '50ml': 3780 },
  '鹹香草':        { '11ml': 1480 },
  '藍榿':          { '6.5g': 1580 },
  '聖金屬':        { '6.5g': 1580 },
  '絨面梨':        { '6.5g': 1580 },
  '藍色檜木':      { '35g': 1680 },
};

/* -----------------------------------------------------------
 * C) 款名 → 商品敘述（商品層 description）
 *    已填入你提供的文案；其餘先留 TODO
 * ---------------------------------------------------------*/
const BEAUTY_DESCRIPTIONS = {
  '藍扁柏': `新鮮松油 | 藍色檜木 | 浮木

碧波蕩漾的檜木，與清新的松香和清涼的佛手柑交相輝映，如同海風拂過，清新怡人。飽受鹽漬的木紋，經受海水不斷漲落的侵蝕，柔化成波紋。歷經日曬風霜，歲月滄桑，最終與乳香的靜謐共鳴，重生為蘊含著靜謐大海色調的木紋`,
  '查莫': `濃厚的洋甘菊 | 柔和的木紋 | 麝香

洋甘菊的草本香氣濃鬱甜美，如同蜂蜜，與苦澀的快樂鼠尾草交相輝映，呈現出令人沉醉的芬芳，微妙地融合在一起。優雅柔和的金色木質香與溫暖的麝香，包裹著略帶冰冷的濕潤苔蘚，如同一份特別的禮物，為疲憊的心靈帶來一絲慰藉`,
  '陽光': `當歸 | 鈴蘭 | 雲甲

這款香氛令人聯想到在盛開著當歸的森林中自由奔跑的感覺。
披著銀色盔甲，輕盈如雲，在閃耀的陽光下飛馳——這純粹自由的時刻喚醒了原始的感官。鈴蘭的柔和香氣中帶著一絲鹹鹹的礦物氣息，如同盛開的薄霧般瀰漫開來，在寧靜的秋夜中緩緩展開，瀰漫著癒創木和麝香的柔和溫暖。`,
  '博塔里': `清爽的阿基加拉木 | 柔軟的苔蘚和蘑菇 | 琥珀麝香

Bottari 捕捉了蘑菇孢子迸發的活力，讓周圍瀰漫著濃鬱而性感的香氣。`,
  '晚霞': `日落玫瑰色 | 覆盆子 | 麝香

玫瑰就是玫瑰。
每一刻，玫瑰都完美地展現它作為玫瑰的本質。從種子萌發的初芽到綻放的盛放，它不斷蛻變，卻始終保留著玫瑰的精緻之美。夕陽將玫瑰染成覆盆子般的紅色，新鮮蒔蘿和檸檬皮的層層光輝傾瀉而下，泥土般的廣藿香和莎草醇的芬芳增添了深邃的氣息，如同堅韌優雅的荊棘守護著嬌嫩的花瓣，展現出另一朵完美的玫瑰`,
  '貝爾加涼鞋': `地中海佛手柑 | 苦甜青橘 | 檀香

源自地中海綠色能量的佛手柑，以及青檸荳蔻清新而微苦的香氣，令人聯想到溫暖陽光下緩緩成熟的青橘。檀香的餘韻蜿蜒迴盪，令人回想起陽光明媚的夏日，周圍環繞著柔和的氣息。`,
  '拉萊': `帶露水的青蘋果 | 白色鬱金香 | 檀香

Lale，鬱金香的首字母，如同一朵含苞待放的花蕾，散發著清新卻低調的甜美，如同一口浸透晨露的青蘋果。翠綠的花香如同白色的鬱金香葉片般綻放。辛辣的皮革和含羞草的芬芳，與濃鬱的檀香交相輝映，留下深邃而細膩的餘韻。`,
  '未知烏木': `尤加利 | 覆盆子 | 焦木

尤加利的清新香氣，因一滴濃稠覆盆子糖漿的甜美而更加濃鬱。沉香的濕潤泥土與焦木的韻味，令人聯想到深林深處獨自燃燒的火焰的痕跡。`,
  '木知烏木': `尤加利 | 覆盆子 | 焦木

尤加利的清新香氣，因一滴濃稠覆盆子糖漿的甜美而更加濃鬱。沉香的濕潤泥土與焦木的韻味，令人聯想到深林深處獨自燃燒的火焰的痕跡。`,
  '白大吉嶺': `白香檳 | 大吉嶺茶 | 奶油麝香

白香檳細膩的氣泡優雅地舞動，與苦澀的大吉嶺茶甜美的果香交相輝映，和諧地交織成一場茶杯盛宴。麝香與檀香的柔和餘韻從鼻尖悠悠飄蕩而來。`,

  // 預留 TODO，之後直接補上字串即可
  '鹹香草': 'TODO：補敘述',
  '南瓜': 'TODO：補敘述',
  '深秋': 'TODO：補敘述',
  '乾草堆': 'TODO：補敘述',
  '木鹽海灘': 'TODO：補敘述',
  '棕色': 'TODO：補敘述',
  '湖中沐浴者': 'TODO：補敘述',
  '藍榿': 'TODO：補敘述',
  '絨面梨': 'TODO：補敘述',
  '聖金屬': 'TODO：補敘述',
  '藍色檜木': 'TODO：補敘述',
};

/* -----------------------------------------------------------
 * D) 扁平的美妝清單（每一筆=一個容量）
 *    後續新增/修改，只動這裡即可
 * ---------------------------------------------------------*/
const BEAUTY_PRODUCTS = [
  // 藍扁柏
  { name: '藍扁柏11ml', image: 'TM11001-藍扁柏11ml.jpg' },
  { name: '藍扁柏14ml', image: 'TM14001-藍扁柏14ml.jpg' },
  { name: '藍扁柏50ml', image: 'TM50001-藍扁柏50ml.jpg' },

  // 查莫
  { name: '查莫11ml', image: 'TM11002-查莫11ml.jpg' },
  { name: '查莫14ml', image: 'TM14002-查莫14ml.jpg' },
  { name: '查莫50ml', image: 'TM50002-查莫50ml.jpg' },
  { name: '查莫6.5g', image: 'TMB005-查莫6.5g.jpg' },

  // 博塔里
  { name: '博塔里11ml', image: 'TM11004-博塔里11ml.jpg' },
  { name: '博塔里50ml', image: 'TM50004-博塔里50ml.jpg' },
  { name: '博塔里6.5g', image: 'TMB002-博塔里6.5g.jpg' },

  // 晚霞
  { name: '晚霞11ml', image: 'TM11005-晚霞11ml.jpg' },
  { name: '晚霞50ml', image: 'TM50005-晚霞50ml.jpg' },
  { name: '晚霞6.5g', image: 'TMB003-晚霞6.5g.jpg' },

  // 白大吉嶺
  { name: '白大吉嶺11ml', image: 'TM11006-白大吉嶺11ml.jpg' },
  { name: '白大吉嶺50ml', image: 'TM50009-白大吉嶺50ml.jpg' },

  // 鹹香草
  { name: '鹹香草11ml', image: 'TM11008-鹹香草11ml.jpg' },

  // 南瓜
  { name: '南瓜14ml', image: 'TM14003-南瓜14ml.jpg' },
  { name: '南瓜50ml', image: 'TM50011-南瓜50ml.jpg' },
  { name: '南瓜6.5g', image: 'TMB004-南瓜6.5g.jpg' },

  // 深秋
  { name: '深秋14ml', image: 'TM14007-深秋14ml.jpg' },
  { name: '深秋50ml', image: 'TM50015-深秋50ml.jpg' },

  // 陽光
  { name: '陽光50ml', image: 'TM50003-陽光50ml.jpg' },

  // 貝爾加涼鞋
  { name: '貝爾加涼鞋50ml', image: 'TM50006-貝爾加涼鞋50ml.jpg' },
  { name: '貝爾加涼鞋6.5g', image: 'TMB007-貝爾加涼鞋6.5g.jpg' },

  // 拉萊
  { name: '拉萊50ml', image: 'TM50007-拉萊50ml.jpg' },
  { name: '拉萊6.5g', image: 'TMB008-拉萊6.5g.jpg' },

  // 未知/木知烏木
  { name: '未知烏木50ml', image: 'TM50008-未知烏木50ml.jpg' },

  // 乾草堆
  { name: '乾草堆50ml', image: 'TM50010-乾草堆50ml.jpg' },

  // 木鹽海灘
  { name: '木鹽海灘50ml', image: 'TM50012-木鹽海灘50ml.jpg' },

  // 棕色
  { name: '棕色50ml', image: 'TM50013-棕色50ml.jpg' },

  // 湖中沐浴者
  { name: '湖中沐浴者50ml', image: 'TM50015-湖中沐浴者50ml.jpg' },

  // 藍榿
  { name: '藍榿6.5g', image: 'TMB001-藍榿6.5g.jpg' },

  // 絨面梨
  { name: '絨面梨6.5g', image: 'TMB009-絨面梨6.5g.jpg' },

  // 聖金屬
  { name: '聖金屬6.5g', image: 'TMB006-聖金屬6.5g.jpg' },

  // 藍色檜木
  { name: '藍色檜木35g', image: 'TMB010-藍色檜木35g.jpg' },
];

/* -----------------------------------------------------------
 * E) 分組工具：把「款名+容量」字串 → { base(款名), capacity(容量) }
 * ---------------------------------------------------------*/
function parseName(name) {
  // 支援 11ml / 6.5g / 35 g 等寫法
  const m = String(name).match(/^(.*?)(\d+(?:\.\d+)?\s?(?:ml|g))\s*$/i);
  if (!m) return { base: name.trim(), capacity: null };
  const base = m[1].trim().replace(/[－–—\-]\s*$/, ''); // 去尾破折號
  const capacity = m[2].replace(/\s+/g, '').toLowerCase(); // 正規化 '6.5g'、'11ml'
  return { base, capacity };
}

/* -----------------------------------------------------------
 * F) 扁平 → variants 群組 + 套用客製價/通用價 + 款別敘述 + 變體圖做畫廊
 * ---------------------------------------------------------*/
const grouped = new Map();
for (const item of BEAUTY_PRODUCTS) {
  const { base, capacity } = parseName(item.name);
  const key = base;
  if (!grouped.has(key)) {
    grouped.set(key, { base, variants: [], descriptions: [] });
  }
  const cap = capacity || 'default';
  const capNorm = cap.toLowerCase();

  grouped.get(key).variants.push({
    key: capNorm,
    label: capNorm,
    // 先找每款客製價；沒有就退回通用表；再沒有才 0/原始價
    price: ((PER_SCENT_PRICES[base]?.[capNorm] ?? PRICE_TABLE[capNorm] ?? Number(item.price)) || 0),
    image: imgBeauty(item.image),
    specs: [
      capacity ? `容量：${capNorm}` : null,
      '產地：韓國進口',
      '適用膚質：一般膚質',
    ].filter(Boolean),
  });

  // 扁平描述收集（通常留空）；最終以 BEAUTY_DESCRIPTIONS 覆寫
  if (item.description) grouped.get(key).descriptions.push(item.description);
}

function uniq(arr) { return Array.from(new Set(arr.filter(Boolean))); }

const beautyGroupedProducts = [];
let runningId = 5; // 接在 1~4 之後
for (const [, grp] of grouped) {
  const defaultVariantKey = grp.variants[0]?.key || 'default';
  const imagesAll = uniq(grp.variants.map(v => v.image));
  const finalDesc =
    BEAUTY_DESCRIPTIONS[grp.base] ||
    uniq(grp.descriptions).join('\n\n') ||
    '精選美妝商品，展現自然光采。';

  beautyGroupedProducts.push({
    id: runningId++,
    name: grp.base,            // 商品名稱為香型（不含容量）
    description: finalDesc,    // 款別敘述
    images: imagesAll,         // 全部變體圖片當畫廊
    price: grp.variants[0]?.price || 0, // 列表保底價（詳情頁用變體價）
    category: 'beauty',
    specs: ['產地：韓國進口', '適用膚質：一般膚質'],
    defaultVariantKey,
    variants: grp.variants,
  });
}

/* -----------------------------------------------------------
 * G) 其他（非美妝）原始商品
 * ---------------------------------------------------------*/
const rawProductsBase = [
  {
    id: 1,
    name: 'Zeus Core i5 商務桌機',
    description: '高效能入門首選，滿足日常辦公與學習需求，穩定耐用，輕鬆應對多工處理。',
    price: 10000,
    images: [img3C('01.jpg')],
    category: 'computers-office',
    specs: ['CPU: Intel i5', 'RAM: 16GB', 'SSD: 512GB'],
  },
  {
    id: 2,
    name: 'Zeus Pro i7 遊戲工作站',
    description: '搭載 Intel i7 與高速 SSD，兼具遊戲娛樂與專業工作效能，流暢不卡頓。',
    price: 15000,
    images: [img3C('02.jpg')],
    category: 'computers-office',
    specs: ['CPU: Intel i7', 'RAM: 32GB', 'SSD: 1TB'],
  },
  {
    id: 3,
    name: 'Zeus Titan Ryzen 旗艦電腦',
    description: '頂規 AMD Ryzen 9 與 64GB 大容量記憶體，旗艦級效能，滿足重度遊戲與專業創作。',
    price: 20000,
    images: [img3C('03.jpg')],
    category: 'computers-office',
    specs: ['CPU: AMD Ryzen 9', 'RAM: 64GB', 'SSD: 2TB'],
  },
  {
    id: 4,
    name: 'Zeus Spa 溫熱按摩泡腳機',
    description: '三合一氣泡、加熱與按摩功能，讓您在家即可享受專屬足浴，舒緩疲勞、放鬆身心。',
    price: 1890,
    images: [imgHome('04.jpg')],
    category: 'appliances',
    specs: ['功率: 500W', '容量: 6L', '模式: 氣泡 / 加熱 / 按摩'],
  },
];

/* -----------------------------------------------------------
 * H) 合併並輸出（保留你的清理器）
 * ---------------------------------------------------------*/
const rawProducts = [
  ...rawProductsBase,
  ...beautyGroupedProducts,
];

export const products = rawProducts.map((p) => ({
  ...p,
  id: Number(p.id),
  price: Number(p.price) || 0,
  images: Array.isArray(p.images) ? p.images : [p.images].filter(Boolean),
}));
