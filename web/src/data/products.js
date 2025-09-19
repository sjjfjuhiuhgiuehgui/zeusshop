const rawProducts = [
  {
    name: "電腦A",
    description: "入門款，效能穩定",
    price: 1000000,
    imageUrl: "/images/01.jpg",
    category: "套裝電腦",
    specs: [
      "CPU: Intel i5",
      "RAM: 16GB",
      "SSD: 512GB"
    ]
  },
  {
    name: "電腦B",
    description: "中階款，適合遊戲與工作",
    price: 1500000,
    imageUrl: "/images/02.jpg",
    category: "套裝電腦",
    specs: [
      "CPU: Intel i7",
      "RAM: 32GB",
      "SSD: 1TB"
    ]
  },
  {
    name: "電腦C",
    description: "高階款，旗艦效能",
    price: 2000000,
    imageUrl: "/images/03.jpg",
    category: "列表機",
    specs: [
      "CPU: AMD Ryzen 9",
      "RAM: 64GB",
      "SSD: 2TB"
    ]
  },
  {
    name: "泡腳機",
    description: "放鬆必備，溫熱按摩泡腳",
    price: 250000,
    imageUrl: "/images/04.jpg",
    category: "小型家電",
    specs: [
      "功率: 500W",
      "容量: 6L",
      "模式: 氣泡 / 加熱 / 按摩"
    ]
  }
]

// 自動加上 id
export const products = rawProducts.map((p, idx) => ({
  id: idx + 1,
  ...p
}))
