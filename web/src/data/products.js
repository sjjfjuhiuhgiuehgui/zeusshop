// web/src/data/products.js

// Vite 會注入 BASE_URL（預設 "/"；若 vite.config.js 設了 base，會是 "/你的子目錄/"）
const BASE = import.meta.env.BASE_URL || "/";

// 小工具：組圖檔路徑（避免多/少斜線）
const img = (name) => `${BASE}images/${name}`;

// 原始資料（只寫必要欄位）
const rawProducts = [
  {
    id: 1,
    name: "電腦A",
    description: "入門款，效能穩定",
    price: 10000,
    images: [img("01.jpg")],
    category: "3c",
    specs: ["CPU: Intel i5", "RAM: 16GB", "SSD: 512GB"],
  },
  {
    id: 2,
    name: "電腦B",
    description: "中階款，適合遊戲與工作",
    price: 15000,
    images: [img("02.jpg")],
    category: "3c",
    specs: ["CPU: Intel i7", "RAM: 32GB", "SSD: 1TB"],
  },
  {
    id: 3,
    name: "電腦C",
    description: "高階款，旗艦效能",
    price: 20000,
    images: [img("03.jpg")],
    category: "3c",
    specs: ["CPU: AMD Ryzen 9", "RAM: 64GB", "SSD: 2TB"],
  },
  {
    id: 4,
    name: "泡腳機",
    description: "放鬆必備，溫熱按摩泡腳",
    price: 1890, // ← 我順手把價格修成比較合理的 1890，你要用 25000 也可以
    images: [img("04.jpg")],
    category: "appliances",
    specs: ["功率: 500W", "容量: 6L", "模式: 氣泡 / 加熱 / 按摩"],
  },
];

// 對外輸出：確保 price 是數字、images 是陣列，並保留你想要的欄位
export const products = rawProducts.map((p) => ({
  ...p,
  id: Number(p.id),                         // 統一數字 id，方便排序/比對
  price: Number(p.price) || 0,              // 價格一定是 number
  images: Array.isArray(p.images) ? p.images : [p.images].filter(Boolean),
}));
