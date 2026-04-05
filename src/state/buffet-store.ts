export interface BuffetPlan {
  id: string;
  name: string;
  nameZh?: string;
  price: number;       // per person
  duration: number;    // minutes
  available: boolean;
}

export interface BuffetMenuItem {
  id: string;
  name: string;
  nameZh?: string;
  surcharge: number;   // 0 = included free, >0 = extra charge
  image?: string;
  available: boolean;
}

export const buffetPlans: BuffetPlan[] = [
  { id: "bp1", name: "Lunch Buffet", nameZh: "午餐自助", price: 28.80, duration: 90, available: true },
  { id: "bp2", name: "Dinner Buffet", nameZh: "晚餐自助", price: 38.80, duration: 90, available: true },
  { id: "bp3", name: "Weekend Premium", nameZh: "周末豪华自助", price: 48.80, duration: 120, available: true },
];

// Import images from existing assets
import satayImg from "@/assets/satay.jpg";
import chickenRiceImg from "@/assets/chicken-rice.jpg";
import nasiLemakImg from "@/assets/nasi-lemak.jpg";
import rendangBeefImg from "@/assets/rendang-beef.jpg";
import ayamPenyetImg from "@/assets/ayam-penyet.jpg";
import bakKutTehImg from "@/assets/bak-kut-teh.jpg";
import chilliCrabImg from "@/assets/chilli-crab.jpg";
import blackPepperCrabImg from "@/assets/black-pepper-crab.jpg";
import saltedEggChickenImg from "@/assets/salted-egg-chicken.jpg";
import cerealPrawnImg from "@/assets/cereal-prawn.jpg";

// 6 free meats + 4 surcharge meats
export const buffetMenuItems: BuffetMenuItem[] = [
  // Free meats (surcharge: 0)
  { id: "bf1", name: "Satay (Unlimited)", nameZh: "沙爹（无限量）", surcharge: 0, image: satayImg, available: true },
  { id: "bf2", name: "Chicken Rice", nameZh: "海南鸡饭", surcharge: 0, image: chickenRiceImg, available: true },
  { id: "bf3", name: "Nasi Lemak", nameZh: "椰浆饭", surcharge: 0, image: nasiLemakImg, available: true },
  { id: "bf4", name: "Rendang Beef", nameZh: "仁当牛肉", surcharge: 0, image: rendangBeefImg, available: true },
  { id: "bf5", name: "Ayam Penyet", nameZh: "印尼碎鸡", surcharge: 0, image: ayamPenyetImg, available: true },
  { id: "bf6", name: "Bak Kut Teh", nameZh: "肉骨茶", surcharge: 0, image: bakKutTehImg, available: true },
  // Premium meats (surcharge: $5)
  { id: "bf7", name: "Chilli Crab", nameZh: "辣椒螃蟹", surcharge: 5, image: chilliCrabImg, available: true },
  { id: "bf8", name: "Black Pepper Crab", nameZh: "黑胡椒螃蟹", surcharge: 5, image: blackPepperCrabImg, available: true },
  { id: "bf9", name: "Salted Egg Chicken", nameZh: "咸蛋鸡", surcharge: 5, image: saltedEggChickenImg, available: true },
  { id: "bf10", name: "Cereal Prawn", nameZh: "麦片虾", surcharge: 5, image: cerealPrawnImg, available: true },
];
