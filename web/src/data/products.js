// web/src/data/products.js

// Vite 會注入 BASE_URL（預設 "/"；若 vite.config.js 設了 base，會是 "/你的子目錄/"）
const BASE = import.meta.env.BASE_URL || "/";

// ✅ 分類路徑設定
const img3C = (name) => `${BASE}images/3C/${name}`;
const imgHome = (name) => `${BASE}images/home/${name}`;

// 原始資料（只寫必要欄位）
const rawProducts = [
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

// 對外輸出
export const products = rawProducts.map((p) => ({
  ...p,
  id: Number(p.id),
  price: Number(p.price) || 0,
  images: Array.isArray(p.images) ? p.images : [p.images].filter(Boolean),
}));
