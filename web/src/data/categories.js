// web/src/data/categories.js
// 分類設定：對齊台灣登記的批發業代碼，並映射到電商常見分類。
// Icon 來自 lucide-react（在這支檔案直接 import，供 Home/Drawer 使用）

import {
  BedDouble, Utensils, Lamp, Shirt, BookOpen, Hammer,
  WashingMachine, Microscope, Monitor, RadioTower, Car
} from 'lucide-react'

// 將 keywords 做簡單包含比對（比對 name + category）
export const makeMatcher = (keywords) => (p) => {
  const text = `${p.category || ''} ${p.name || ''}`.toLowerCase()
  return keywords.some(k => text.includes(k.toLowerCase()))
}

// 規劃好的 11 個分類（slug = key）
// 對應你提供的業別：
// - F105050 拆成：家具/寢具、廚房器具、家飾裝設
// - F104110：時尚服飾
// - F109070：文教/樂器/育樂
// - F111090：建材
// - F113020：家電
// - F113030：精密儀器
// - F113050：電腦/事務設備
// - F113070：電信器材
// - F114010：汽車用品
export const CATEGORIES = [
  {
    key: 'furniture-bedding',
    label: '家具／寢具',
    Icon: BedDouble,
    keywords: ['家具','寢具','床','床墊','枕','棉被','衣櫃','書桌','餐桌','椅','沙發','床包']
  },
  {
    key: 'kitchen',
    label: '廚房器具',
    Icon: Utensils,
    keywords: ['廚房','鍋','鍋具','平底鍋','湯鍋','餐具','刀','砧板','保鮮盒','杯','碗','烘焙','料理']
  },
  {
    key: 'home-decor',
    label: '家飾／裝設',
    Icon: Lamp,
    keywords: ['家飾','裝設','燈','檯燈','落地燈','窗簾','地毯','掛畫','擺件','置物架','收納','佈置']
  },
  {
    key: 'fashion',
    label: '時尚服飾',
    Icon: Shirt,
    keywords: ['布疋','服飾','衣著','上衣','外套','褲','裙','鞋','帽','傘','內衣','配件','圍巾']
  },
  {
    key: 'edu-music-toys',
    label: '文教／樂器／育樂',
    Icon: BookOpen,
    keywords: ['文教','文具','書','教具','教材','樂器','吉他','烏克麗麗','鋼琴','玩具','積木','桌遊','育樂']
  },
  {
    key: 'building-materials',
    label: '建材／DIY',
    Icon: Hammer,
    keywords: ['建材','木材','五金','螺絲','油漆','瓷磚','水泥','管件','水電','工具','砂紙','膠']
  },
  {
    key: 'appliances',
    label: '家電',
    Icon: WashingMachine,
    keywords: ['家電','電器','洗衣機','冰箱','冷氣','吸塵器','除濕機','電鍋','微波爐','電風扇','烤箱','氣炸']
  },
  {
    key: 'precision-instruments',
    label: '精密儀器',
    Icon: Microscope,
    keywords: ['精密','儀器','量測','卡尺','顯微鏡','光學','示波器','測距','天平','量規','感測']
  },
  {
    key: 'computers-office',
    label: '電腦／事務設備',
    Icon: Monitor,
    keywords: ['電腦','主機','筆電','螢幕','顯卡','滑鼠','鍵盤','印表機','事務機','掃描','NAS','路由器']
  },
  {
    key: 'telecom',
    label: '電信器材',
    Icon: RadioTower,
    keywords: ['電信','通訊','手機','基地台','路由','交換器','天線','對講','光纖','SIM','網通']
  },
  {
    key: 'automotive',
    label: '汽車用品',
    Icon: Car,
    keywords: ['汽車','機車','車用','機油','雨刷','胎壓','腳踏墊','行車紀錄器','車燈','保養','清潔']
  }
]
