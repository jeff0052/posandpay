// Mock data for POS prototype

export type TableStatus = "available" | "reserved" | "ordering" | "ordered" | "dirty" | "cleaning";
export type ServiceMode = "dine-in" | "takeaway" | "delivery" | "pickup" | "kiosk" | "qr";
export type OrderStatus = "open" | "sent" | "preparing" | "ready" | "served" | "paid" | "void";
export type KDSStatus = "new" | "preparing" | "ready" | "served";

export interface Table {
  id: string;
  number: string;
  zone: string;
  seats: number;
  status: TableStatus;
  guestCount?: number;
  server?: string;
  openAmount?: number;
  elapsedMinutes?: number;
  orderId?: string;
  mergedWith?: string[]; // IDs of tables merged with this one
  reservationName?: string;
  reservationTime?: string;
  reservationPhone?: string;
  reservationNotes?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  nameZh?: string;
  price: number;
  category: string;
  description?: string;
  image?: string;
  available: boolean;
  popular?: boolean;
  modifierGroups?: string[];
  isCombo?: boolean;
  isFlexCombo?: boolean;
  comboGroups?: ComboGroup[];
  comboIncludes?: string[]; // display names for fixed combos
}

export interface ComboGroup {
  id: string;
  name: string;
  nameZh?: string;
  required: boolean;
  allowedItems: string[];
  maxSelect: number;
}

export interface ModifierGroup {
  id: string;
  name: string;
  nameZh?: string;
  required: boolean;
  multiSelect: boolean;
  options: ModifierOption[];
}

export interface ModifierOption {
  id: string;
  name: string;
  nameZh?: string;
  price: number;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  modifiers: { name: string; price: number }[];
  notes?: string;
  seat?: number;
  status: KDSStatus;
  firedAt?: string;
  comboItems?: { name: string; groupName: string }[];
}

export interface Order {
  id: string;
  tableId?: string;
  tableNumber?: string;
  serviceMode: ServiceMode;
  items: OrderItem[];
  status: OrderStatus;
  guestCount: number;
  createdAt: string;
  subtotal: number;
  serviceCharge: number;
  gst: number;
  total: number;
  customerId?: string;
  // Buffet
  buffetPlanId?: string;
  buffetStartTime?: string;
  buffetPax?: number;
  buffetDuration?: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  visits: number;
  points: number;
  tier: "bronze" | "silver" | "gold" | "platinum";
  lastVisit: string;
}

export type ReservationStatus = "pending" | "seated" | "cancelled" | "no-show";
export type CancelReason = "no-show" | "customer-cancel" | "other";

export interface Reservation {
  id: string;
  tableId: string;
  tableNumber: string;
  zone: string;
  guestName: string;
  guestCount: number;
  phone?: string;
  reservationTime?: string;
  createdAt: string;
  status: ReservationStatus;
  cancelReason?: CancelReason;
  cancelNote?: string;
  notes?: string;
  customerId?: string;
}

export const zones = ["Main Hall", "Patio", "Private", "Bar"];

export const tables: Table[] = [
  { id: "t1", number: "1", zone: "Main Hall", seats: 2, status: "available" },
  { id: "t2", number: "2", zone: "Main Hall", seats: 4, status: "ordered", guestCount: 3, server: "Sarah", openAmount: 45.80, elapsedMinutes: 25, orderId: "o1" },
  { id: "t3", number: "3", zone: "Main Hall", seats: 4, status: "ordered", guestCount: 4, server: "Mike", openAmount: 78.50, elapsedMinutes: 42, orderId: "o2" },
  { id: "t4", number: "4", zone: "Main Hall", seats: 6, status: "reserved", guestCount: 5, reservationName: "Mr. Chen", reservationPhone: "91234567", reservationTime: new Date(new Date().setHours(19, 0, 0, 0)).toISOString() },
  { id: "t5", number: "5", zone: "Main Hall", seats: 2, status: "available" },
  { id: "t6", number: "6", zone: "Main Hall", seats: 4, status: "dirty" },
  { id: "t7", number: "7", zone: "Patio", seats: 2, status: "available" },
  { id: "t8", number: "8", zone: "Patio", seats: 4, status: "ordering", guestCount: 2, server: "Sarah", openAmount: 0, elapsedMinutes: 3, orderId: "o5" },
  { id: "t9", number: "9", zone: "Patio", seats: 6, status: "available" },
  { id: "t10", number: "10", zone: "Private", seats: 8, status: "reserved", guestCount: 8, reservationName: "Mrs. Tan", reservationPhone: "98765432" },
  { id: "t11", number: "11", zone: "Private", seats: 10, status: "available" },
  { id: "t12", number: "12", zone: "Bar", seats: 2, status: "ordered", guestCount: 1, server: "Mike", openAmount: 18.00, elapsedMinutes: 10, orderId: "o4" },
  { id: "t13", number: "13", zone: "Bar", seats: 2, status: "available" },
  { id: "t14", number: "14", zone: "Bar", seats: 2, status: "cleaning" },
  { id: "t15", number: "15", zone: "Main Hall", seats: 8, status: "available" },
  { id: "t16", number: "16", zone: "Main Hall", seats: 2, status: "ordering", guestCount: 2, server: "Sarah", elapsedMinutes: 1 },
  { id: "t17", number: "17", zone: "Patio", seats: 4, status: "available" },
  { id: "t18", number: "18", zone: "Private", seats: 12, status: "reserved", guestCount: 10, reservationName: "Lee Family", reservationPhone: "92223333", reservationTime: new Date(new Date().setHours(20, 0, 0, 0)).toISOString(), reservationNotes: "Birthday dinner" },
];

export const reservations: Reservation[] = [
  { id: "r1", tableId: "t4", tableNumber: "4", zone: "Main Hall", guestName: "Mr. Chen", guestCount: 5, phone: "91234567", reservationTime: new Date(new Date().setHours(19, 0, 0, 0)).toISOString(), createdAt: new Date(new Date().setHours(10, 0, 0, 0)).toISOString(), status: "pending" },
  { id: "r2", tableId: "t10", tableNumber: "10", zone: "Private", guestName: "Mrs. Tan", guestCount: 8, phone: "98765432", createdAt: new Date(new Date().setHours(11, 30, 0, 0)).toISOString(), status: "pending" },
  { id: "r3", tableId: "t18", tableNumber: "18", zone: "Private", guestName: "Lee Family", guestCount: 10, phone: "92223333", reservationTime: new Date(new Date().setHours(20, 0, 0, 0)).toISOString(), createdAt: new Date(new Date().setHours(9, 0, 0, 0)).toISOString(), status: "pending", notes: "Birthday dinner" },
  { id: "r4", tableId: "t5", tableNumber: "5", zone: "Main Hall", guestName: "David Wong", guestCount: 2, phone: "93334444", createdAt: new Date(new Date().setHours(12, 0, 0, 0)).toISOString(), status: "seated", customerId: "c1" },
  { id: "r5", tableId: "t7", tableNumber: "7", zone: "Patio", guestName: "Sarah Lim", guestCount: 2, createdAt: new Date(new Date().setHours(11, 0, 0, 0)).toISOString(), status: "cancelled", cancelReason: "customer-cancel" },
];

export const categories = [
  "All", "Popular", "Combos", "Starters", "Mains", "Noodles", "Rice", "Sides", "Desserts", "Beverages", "Alcohol"
];

// Image imports
import chickenRiceImg from "@/assets/chicken-rice.jpg";
import laksaImg from "@/assets/laksa.jpg";
import charKwayTeowImg from "@/assets/char-kway-teow.jpg";
import chilliCrabImg from "@/assets/chilli-crab.jpg";
import nasiLemakImg from "@/assets/nasi-lemak.jpg";
import satayImg from "@/assets/satay.jpg";
import hokkienMeeImg from "@/assets/hokkien-mee.jpg";
import bakKutTehImg from "@/assets/bak-kut-teh.jpg";
import tehTarikImg from "@/assets/teh-tarik.jpg";
import iceKachangImg from "@/assets/ice-kachang.jpg";
import tigerBeerImg from "@/assets/tiger-beer.jpg";
import claypotRiceImg from "@/assets/claypot-rice.jpg";
import springRollsImg from "@/assets/spring-rolls.jpg";
import miloDinosaurImg from "@/assets/milo-dinosaur.jpg";
import kangkongImg from "@/assets/kangkong.jpg";
import wontonNoodlesImg from "@/assets/wonton-noodles.jpg";
import blackPepperCrabImg from "@/assets/black-pepper-crab.jpg";
import rendangBeefImg from "@/assets/rendang-beef.jpg";
import curryFishHeadImg from "@/assets/curry-fish-head.jpg";
import saltedEggChickenImg from "@/assets/salted-egg-chicken.jpg";
import ayamPenyetImg from "@/assets/ayam-penyet.jpg";
import bakChorMeeImg from "@/assets/bak-chor-mee.jpg";
import nasiGorengImg from "@/assets/nasi-goreng.jpg";
import duckRiceImg from "@/assets/duck-rice.jpg";
import prawnNoodleImg from "@/assets/prawn-noodle.jpg";
import rojakImg from "@/assets/rojak.jpg";
import otakOtakImg from "@/assets/otak-otak.jpg";
import chendolImg from "@/assets/chendol.jpg";
import ondehOndehImg from "@/assets/ondeh-ondeh.jpg";
import pandanCakeImg from "@/assets/pandan-cake.jpg";
import kopiOImg from "@/assets/kopi-o.jpg";
import bandungImg from "@/assets/bandung.jpg";
import friedMantouImg from "@/assets/fried-mantou.jpg";
import mangoSagoImg from "@/assets/mango-sago.jpg";
import nasiBriyaniImg from "@/assets/nasi-briyani.jpg";
import lorMeeImg from "@/assets/lor-mee.jpg";
// New unique images
import cerealPrawnImg from "@/assets/cereal-prawn.jpg";
import sambalStingrayImg from "@/assets/sambal-stingray.jpg";
import saltedEggFishSkinImg from "@/assets/salted-egg-fish-skin.jpg";
import steamedSeaBassImg from "@/assets/steamed-sea-bass.jpg";
import harCheongGaiImg from "@/assets/har-cheong-gai.jpg";
import prawnCrackersImg from "@/assets/prawn-crackers.jpg";
import popiahImg from "@/assets/popiah.jpg";
import ngohHiangImg from "@/assets/ngoh-hiang.jpg";
import kuehPieTeeImg from "@/assets/kueh-pie-tee.jpg";
import tauHuayImg from "@/assets/tau-huay.jpg";
import meeSiamImg from "@/assets/mee-siam.jpg";
import meeRebusImg from "@/assets/mee-rebus.jpg";
import kwayChapImg from "@/assets/kway-chap.jpg";
import beeHoonGorengImg from "@/assets/bee-hoon-goreng.jpg";
import thunderTeaRiceImg from "@/assets/thunder-tea-rice.jpg";
import yongTauFooImg from "@/assets/yong-tau-foo.jpg";
import economyRiceImg from "@/assets/economy-rice.jpg";
import sambalPetaiImg from "@/assets/sambal-petai.jpg";
import friedTofuImg from "@/assets/fried-tofu.jpg";
import steamedEggImg from "@/assets/steamed-egg.jpg";
import sayurLodehImg from "@/assets/sayur-lodeh.jpg";
import acharImg from "@/assets/achar.jpg";
import garlicSpinachImg from "@/assets/garlic-spinach.jpg";
import pulutHitamImg from "@/assets/pulut-hitam.jpg";
import buburChaChaImg from "@/assets/bubur-cha-cha.jpg";
import kuehLapisImg from "@/assets/kueh-lapis.jpg";
import limeJuiceImg from "@/assets/lime-juice.jpg";
import youTiaoImg from "@/assets/you-tiao.jpg";
import kopiCPengImg from "@/assets/kopi-c-peng.jpg";
import tehOPengImg from "@/assets/teh-o-peng.jpg";
import barleyWaterImg from "@/assets/barley-water.jpg";
import sugarcaneJuiceImg from "@/assets/sugarcane-juice.jpg";
import coconutWaterImg from "@/assets/coconut-water.jpg";
import chrysanthemumTeaImg from "@/assets/chrysanthemum-tea.jpg";
import icedLemonTeaImg from "@/assets/iced-lemon-tea.jpg";
import singhaBeerImg from "@/assets/singha-beer.jpg";
import houseWineImg from "@/assets/house-wine.jpg";
import asahiBeerImg from "@/assets/asahi-beer.jpg";
import heinekenImg from "@/assets/heineken.jpg";
import sakeImg from "@/assets/sake.jpg";
import sojuImg from "@/assets/soju.jpg";
import whiskyHighballImg from "@/assets/whisky-highball.jpg";

export const menuItems: MenuItem[] = [
  // Starters
  { id: "m4", name: "Satay (10pc)", nameZh: "沙爹 (10串)", price: 12.00, category: "Starters", available: true, modifierGroups: ["mg2"], image: satayImg },
  { id: "m5", name: "Prawn Crackers", nameZh: "虾片", price: 4.50, category: "Starters", available: true, image: prawnCrackersImg },
  { id: "m6", name: "Spring Rolls (4pc)", nameZh: "春卷 (4个)", price: 6.00, category: "Starters", available: true, image: springRollsImg },
  { id: "m7", name: "Popiah", nameZh: "薄饼", price: 3.50, category: "Starters", available: true, image: popiahImg },
  { id: "m30", name: "Otak-Otak (3pc)", nameZh: "乌达 (3条)", price: 5.50, category: "Starters", available: true, image: otakOtakImg },
  { id: "m31", name: "Ngoh Hiang (5pc)", nameZh: "五香 (5条)", price: 8.00, category: "Starters", available: true, image: ngohHiangImg },
  { id: "m32", name: "Rojak", nameZh: "罗惹", price: 6.50, category: "Starters", available: true, image: rojakImg },
  { id: "m33", name: "Kueh Pie Tee (5pc)", nameZh: "薄饼粿 (5个)", price: 7.00, category: "Starters", available: true, image: kuehPieTeeImg },
  { id: "m34", name: "Tau Huay Soup", nameZh: "豆花汤", price: 3.00, category: "Starters", available: true, image: tauHuayImg },
  { id: "m35", name: "You Tiao (Pair)", nameZh: "油条 (一对)", price: 2.50, category: "Starters", available: true, image: youTiaoImg },

  // Mains
  { id: "m8", name: "Chilli Crab", nameZh: "辣椒螃蟹", price: 38.00, category: "Mains", available: true, popular: true, modifierGroups: ["mg1"], image: chilliCrabImg },
  { id: "m60", name: "Bak Kut Teh", nameZh: "肉骨茶", price: 9.80, category: "Mains", available: true, popular: true, modifierGroups: ["mg1", "mg3"], image: bakKutTehImg },
  { id: "m9", name: "Black Pepper Crab", nameZh: "黑胡椒螃蟹", price: 38.00, category: "Mains", available: true, modifierGroups: ["mg1"], image: blackPepperCrabImg },
  { id: "m10", name: "Cereal Prawn", nameZh: "麦片虾", price: 22.00, category: "Mains", available: true, image: cerealPrawnImg },
  { id: "m11", name: "Sambal Stingray", nameZh: "叁巴魔鬼鱼", price: 15.00, category: "Mains", available: false, image: sambalStingrayImg },
  { id: "m36", name: "Salted Egg Fish Skin", nameZh: "咸蛋鱼皮", price: 16.00, category: "Mains", available: true, image: saltedEggFishSkinImg },
  { id: "m37", name: "Steamed Sea Bass", nameZh: "清蒸鲈鱼", price: 28.00, category: "Mains", available: true, modifierGroups: ["mg1"], image: steamedSeaBassImg },
  { id: "m38", name: "Har Cheong Gai", nameZh: "虾酱鸡", price: 14.00, category: "Mains", available: true, image: harCheongGaiImg },
  { id: "m39", name: "Ayam Penyet", nameZh: "印尼碎鸡", price: 10.50, category: "Mains", available: true, modifierGroups: ["mg1"], image: ayamPenyetImg },
  { id: "m40", name: "Rendang Beef", nameZh: "仁当牛肉", price: 13.00, category: "Mains", available: true, modifierGroups: ["mg1"], image: rendangBeefImg },
  { id: "m41", name: "Curry Fish Head", nameZh: "咖喱鱼头", price: 32.00, category: "Mains", available: true, modifierGroups: ["mg1"], image: curryFishHeadImg },
  { id: "m42", name: "Salted Egg Chicken", nameZh: "咸蛋鸡", price: 12.00, category: "Mains", available: true, image: saltedEggChickenImg },

  // Noodles
  { id: "m2", name: "Laksa", nameZh: "叻沙", price: 7.00, category: "Noodles", available: true, popular: true, modifierGroups: ["mg1"], image: laksaImg },
  { id: "m3", name: "Char Kway Teow", nameZh: "炒粿条", price: 6.50, category: "Noodles", available: true, popular: true, modifierGroups: ["mg1"], image: charKwayTeowImg },
  { id: "m12", name: "Hokkien Mee", nameZh: "福建面", price: 7.50, category: "Noodles", available: true, popular: true, modifierGroups: ["mg1"], image: hokkienMeeImg },
  { id: "m13", name: "Bak Chor Mee", nameZh: "肉脞面", price: 6.00, category: "Noodles", available: true, modifierGroups: ["mg1", "mg4"], image: bakChorMeeImg },
  { id: "m14", name: "Wonton Noodles", nameZh: "云吞面", price: 5.50, category: "Noodles", available: true, modifierGroups: ["mg4"], image: wontonNoodlesImg },
  { id: "m43", name: "Mee Siam", nameZh: "米暹", price: 5.00, category: "Noodles", available: true, modifierGroups: ["mg1"], image: meeSiamImg },
  { id: "m44", name: "Mee Rebus", nameZh: "马来卤面", price: 5.50, category: "Noodles", available: true, modifierGroups: ["mg1"], image: meeRebusImg },
  { id: "m45", name: "Lor Mee", nameZh: "卤面", price: 6.00, category: "Noodles", available: true, image: lorMeeImg },
  { id: "m46", name: "Prawn Noodle Soup", nameZh: "虾面汤", price: 7.00, category: "Noodles", available: true, modifierGroups: ["mg1"], image: prawnNoodleImg },
  { id: "m47", name: "Kway Chap", nameZh: "粿汁", price: 6.50, category: "Noodles", available: true, image: kwayChapImg },
  { id: "m48", name: "Bee Hoon Goreng", nameZh: "炒米粉", price: 5.00, category: "Noodles", available: true, modifierGroups: ["mg1"], image: beeHoonGorengImg },

  // Rice
  { id: "m1", name: "Chicken Rice", nameZh: "海南鸡饭", price: 5.50, category: "Rice", available: true, popular: true, modifierGroups: ["mg1", "mg3"], image: chickenRiceImg },
  { id: "m15", name: "Nasi Lemak", nameZh: "椰浆饭", price: 6.50, category: "Rice", available: true, popular: true, modifierGroups: ["mg1", "mg3"], image: nasiLemakImg },
  { id: "m16", name: "Nasi Goreng", nameZh: "炒饭", price: 7.00, category: "Rice", available: true, modifierGroups: ["mg1"], image: nasiGorengImg },
  { id: "m17", name: "Claypot Rice", nameZh: "砂锅饭", price: 9.50, category: "Rice", available: true, image: claypotRiceImg },
  { id: "m49", name: "Thunder Tea Rice", nameZh: "擂茶饭", price: 6.50, category: "Rice", available: true, image: thunderTeaRiceImg },
  { id: "m50", name: "Yong Tau Foo Rice", nameZh: "酿豆腐饭", price: 7.50, category: "Rice", available: true, modifierGroups: ["mg3"], image: yongTauFooImg },
  { id: "m51", name: "Nasi Briyani", nameZh: "印度香饭", price: 9.00, category: "Rice", available: true, modifierGroups: ["mg1"], image: nasiBriyaniImg },
  { id: "m52", name: "Economy Rice (2 veg 1 meat)", nameZh: "杂菜饭", price: 5.00, category: "Rice", available: true, image: economyRiceImg },
  { id: "m53", name: "Duck Rice", nameZh: "鸭饭", price: 6.00, category: "Rice", available: true, image: duckRiceImg },

  // Sides
  { id: "m18", name: "Kangkong Belacan", nameZh: "马来风光", price: 8.00, category: "Sides", available: true, modifierGroups: ["mg1"], image: kangkongImg },
  { id: "m19", name: "Sambal Petai", nameZh: "叁巴臭豆", price: 10.00, category: "Sides", available: true, image: sambalPetaiImg },
  { id: "m54", name: "Fried Tofu", nameZh: "炸豆腐", price: 5.00, category: "Sides", available: true, image: friedTofuImg },
  { id: "m55", name: "Steamed Egg", nameZh: "蒸蛋", price: 4.50, category: "Sides", available: true, image: steamedEggImg },
  { id: "m56", name: "Sayur Lodeh", nameZh: "杂菜咖喱", price: 6.00, category: "Sides", available: true, image: sayurLodehImg },
  { id: "m57", name: "Achar", nameZh: "腌菜", price: 3.50, category: "Sides", available: true, image: acharImg },
  { id: "m58", name: "Fried Mantou (4pc)", nameZh: "炸馒头 (4个)", price: 5.00, category: "Sides", available: true, image: friedMantouImg },
  { id: "m59", name: "Garlic Spinach", nameZh: "蒜蓉菠菜", price: 7.00, category: "Sides", available: true, image: garlicSpinachImg },

  // Desserts
  { id: "m20", name: "Ice Kachang", nameZh: "红豆冰", price: 4.00, category: "Desserts", available: true, image: iceKachangImg },
  { id: "m21", name: "Chendol", nameZh: "煎蕊", price: 3.50, category: "Desserts", available: true, image: chendolImg },
  { id: "m61", name: "Pulut Hitam", nameZh: "黑糯米", price: 3.50, category: "Desserts", available: true, image: pulutHitamImg },
  { id: "m62", name: "Bubur Cha Cha", nameZh: "摩摩喳喳", price: 4.00, category: "Desserts", available: true, image: buburChaChaImg },
  { id: "m63", name: "Kueh Lapis", nameZh: "千层糕", price: 5.00, category: "Desserts", available: true, image: kuehLapisImg },
  { id: "m64", name: "Ondeh Ondeh (6pc)", nameZh: "椰丝球 (6个)", price: 4.50, category: "Desserts", available: true, image: ondehOndehImg },
  { id: "m65", name: "Mango Sago", nameZh: "杨枝甘露", price: 5.50, category: "Desserts", available: true, image: mangoSagoImg },
  { id: "m66", name: "Pandan Cake", nameZh: "班兰蛋糕", price: 5.00, category: "Desserts", available: true, image: pandanCakeImg },

  // Beverages
  { id: "m22", name: "Teh Tarik", nameZh: "拉茶", price: 2.50, category: "Beverages", available: true, popular: true, image: tehTarikImg },
  { id: "m23", name: "Kopi O", nameZh: "咖啡乌", price: 1.80, category: "Beverages", available: true, image: kopiOImg },
  { id: "m24", name: "Milo Dinosaur", nameZh: "美禄恐龙", price: 4.00, category: "Beverages", available: true, image: miloDinosaurImg },
  { id: "m25", name: "Lime Juice", nameZh: "酸柑水", price: 2.50, category: "Beverages", available: true, image: limeJuiceImg },
  { id: "m67", name: "Kopi C Peng", nameZh: "咖啡C冰", price: 2.20, category: "Beverages", available: true, image: kopiCPengImg },
  { id: "m68", name: "Teh O Peng", nameZh: "茶乌冰", price: 2.00, category: "Beverages", available: true, image: tehOPengImg },
  { id: "m69", name: "Bandung", nameZh: "玫瑰露", price: 2.50, category: "Beverages", available: true, image: bandungImg },
  { id: "m70", name: "Barley Water", nameZh: "薏米水", price: 2.00, category: "Beverages", available: true, image: barleyWaterImg },
  { id: "m71", name: "Sugarcane Juice", nameZh: "甘蔗水", price: 3.00, category: "Beverages", available: true, image: sugarcaneJuiceImg },
  { id: "m72", name: "Coconut Water", nameZh: "椰水", price: 3.50, category: "Beverages", available: true, image: coconutWaterImg },
  { id: "m73", name: "Chrysanthemum Tea", nameZh: "菊花茶", price: 2.00, category: "Beverages", available: true, image: chrysanthemumTeaImg },
  { id: "m74", name: "Iced Lemon Tea", nameZh: "冰柠檬茶", price: 2.50, category: "Beverages", available: true, image: icedLemonTeaImg },

  // Alcohol
  { id: "m26", name: "Tiger Beer", nameZh: "虎牌啤酒", price: 10.00, category: "Alcohol", available: true, image: tigerBeerImg },
  { id: "m27", name: "Singha Beer", nameZh: "胜狮啤酒", price: 10.00, category: "Alcohol", available: true, image: singhaBeerImg },
  { id: "m28", name: "House Wine (Glass)", nameZh: "红酒 (杯)", price: 14.00, category: "Alcohol", available: true, image: houseWineImg },
  { id: "m75", name: "Asahi Draft", nameZh: "朝日生啤", price: 12.00, category: "Alcohol", available: true, image: asahiBeerImg },
  { id: "m76", name: "Heineken", nameZh: "喜力啤酒", price: 11.00, category: "Alcohol", available: true, image: heinekenImg },
  { id: "m77", name: "Sake (Carafe)", nameZh: "清酒 (壶)", price: 18.00, category: "Alcohol", available: true, image: sakeImg },
  { id: "m78", name: "Soju", nameZh: "烧酒", price: 15.00, category: "Alcohol", available: true, image: sojuImg },
  { id: "m79", name: "Whisky Highball", nameZh: "威士忌嗨棒", price: 16.00, category: "Alcohol", available: true, image: whiskyHighballImg },

  // Combos - Fixed
  {
    id: "combo1", name: "Lunch Set A", nameZh: "午餐套餐 A", price: 12.90, category: "Combos", available: true, popular: true, isCombo: true,
    image: chickenRiceImg,
    comboIncludes: ["Chicken Rice", "Prawn Crackers", "Teh Tarik"],
    comboGroups: [
      { id: "cg1", name: "Main", nameZh: "主食", required: true, maxSelect: 1, allowedItems: ["m1", "m15", "m13", "m14"] },
      { id: "cg2", name: "Side", nameZh: "配菜", required: true, maxSelect: 1, allowedItems: ["m54", "m55", "m57", "m5"] },
      { id: "cg3", name: "Drink", nameZh: "饮料", required: true, maxSelect: 1, allowedItems: ["m22", "m23", "m68", "m70"] },
    ],
  },
  {
    id: "combo2", name: "Lunch Set B", nameZh: "午餐套餐 B", price: 16.90, category: "Combos", available: true, isCombo: true,
    image: nasiLemakImg,
    comboIncludes: ["Nasi Lemak", "Kangkong", "Teh Tarik"],
    comboGroups: [
      { id: "cg4", name: "Main", nameZh: "主食", required: true, maxSelect: 1, allowedItems: ["m15b", "m16", "m39", "m40"] },
      { id: "cg5", name: "Side", nameZh: "配菜", required: true, maxSelect: 1, allowedItems: ["m18", "m54", "m58", "m59"] },
      { id: "cg6", name: "Drink", nameZh: "饮料", required: true, maxSelect: 1, allowedItems: ["m22b", "m24", "m25", "m69"] },
    ],
  },
  {
    id: "combo3", name: "Family Feast (4 pax)", nameZh: "家庭盛宴 (4人)", price: 68.00, category: "Combos", available: true, isCombo: true,
    image: chilliCrabImg,
    comboIncludes: ["Chilli Crab", "Nasi Lemak", "Kangkong", "Drinks x4"],
    comboGroups: [
      { id: "cg7", name: "Mains (pick 2)", nameZh: "主菜 (选2)", required: true, maxSelect: 2, allowedItems: ["m8b", "m9", "m41", "m37", "m42"] },
      { id: "cg8", name: "Rice / Noodle", nameZh: "饭/面", required: true, maxSelect: 1, allowedItems: ["m1", "m15b", "m12b", "m16"] },
      { id: "cg9", name: "Sides (pick 2)", nameZh: "配菜 (选2)", required: true, maxSelect: 2, allowedItems: ["m18", "m19", "m59", "m56", "m58"] },
      { id: "cg10", name: "Drinks (pick 4)", nameZh: "饮料 (选4)", required: true, maxSelect: 4, allowedItems: ["m22b", "m23", "m25", "m70", "m74"] },
    ],
  },
  {
    id: "combo4", name: "Tea Time Set", nameZh: "下午茶套餐", price: 8.90, category: "Combos", available: true, isCombo: true,
    image: tehTarikImg,
    comboIncludes: ["Snack", "Hot Drink"],
    comboGroups: [
      { id: "cg11", name: "Snack", nameZh: "小食", required: true, maxSelect: 1, allowedItems: ["m35", "m58", "m63", "m66"] },
      { id: "cg12", name: "Drink", nameZh: "饮料", required: true, maxSelect: 1, allowedItems: ["m22b", "m23", "m67", "m73"] },
    ],
  },
  // Flexible Combos
  {
    id: "combo5", name: "Build Your Own Set", nameZh: "自选套餐", price: 13.90, category: "Combos", available: true, isCombo: true, isFlexCombo: true,
    image: nasiGorengImg,
    comboGroups: [
      { id: "cg13", name: "Main", nameZh: "主食", required: true, maxSelect: 1, allowedItems: ["m1", "m15b", "m13", "m14", "m16", "m39", "m53"] },
      { id: "cg14", name: "Side", nameZh: "配菜", required: true, maxSelect: 1, allowedItems: ["m18", "m54", "m55", "m57", "m58", "m59"] },
      { id: "cg15", name: "Drink", nameZh: "饮料", required: true, maxSelect: 1, allowedItems: ["m22b", "m23", "m24", "m25", "m68", "m69", "m70"] },
    ],
  },
  {
    id: "combo6", name: "Premium Dinner Set", nameZh: "精选晚餐套餐", price: 45.00, category: "Combos", available: true, isCombo: true, isFlexCombo: true,
    image: chilliCrabImg,
    comboGroups: [
      { id: "cg16", name: "Main", nameZh: "主菜", required: true, maxSelect: 1, allowedItems: ["m8b", "m9", "m41", "m37", "m40"] },
      { id: "cg17", name: "Rice / Noodle", nameZh: "饭/面", required: true, maxSelect: 1, allowedItems: ["m1", "m15b", "m16", "m12b", "m17"] },
      { id: "cg18", name: "Side", nameZh: "配菜", required: true, maxSelect: 1, allowedItems: ["m18", "m19", "m59", "m56"] },
      { id: "cg19", name: "Drink", nameZh: "饮料", required: true, maxSelect: 1, allowedItems: ["m22b", "m24", "m26", "m25"] },
    ],
  },
];

export const modifierGroups: ModifierGroup[] = [
  {
    id: "mg1", name: "Spice Level", nameZh: "辣度", required: true, multiSelect: false,
    options: [
      { id: "mo1", name: "Mild", nameZh: "微辣", price: 0 },
      { id: "mo2", name: "Medium", nameZh: "中辣", price: 0 },
      { id: "mo3", name: "Spicy", nameZh: "辣", price: 0 },
      { id: "mo4", name: "Extra Spicy", nameZh: "特辣", price: 0.50 },
    ],
  },
  {
    id: "mg2", name: "Sauce", nameZh: "酱料", required: false, multiSelect: true,
    options: [
      { id: "mo5", name: "Peanut Sauce", nameZh: "花生酱", price: 0 },
      { id: "mo6", name: "Chilli Sauce", nameZh: "辣椒酱", price: 0 },
      { id: "mo7", name: "Extra Sauce", nameZh: "加酱", price: 1.00 },
    ],
  },
  {
    id: "mg3", name: "Add-ons", nameZh: "加料", required: false, multiSelect: true,
    options: [
      { id: "mo8", name: "Extra Rice", nameZh: "加饭", price: 1.00 },
      { id: "mo9", name: "Egg", nameZh: "加蛋", price: 1.50 },
      { id: "mo10", name: "Extra Meat", nameZh: "加肉", price: 3.00 },
    ],
  },
  {
    id: "mg4", name: "Noodle Type", nameZh: "面条类型", required: true, multiSelect: false,
    options: [
      { id: "mo11", name: "Dry", nameZh: "干", price: 0 },
      { id: "mo12", name: "Soup", nameZh: "汤", price: 0 },
    ],
  },
];

export const sampleOrders: Order[] = [
  {
    id: "o1", tableId: "t2", tableNumber: "2", serviceMode: "dine-in",
    guestCount: 3, status: "open", createdAt: "2024-01-15T12:30:00",
    items: [
      { id: "oi1", menuItemId: "m1", name: "Chicken Rice", price: 5.50, quantity: 2, modifiers: [{ name: "Mild", price: 0 }], seat: 1, status: "served", firedAt: "2024-01-15T12:32:00" },
      { id: "oi2", menuItemId: "m2", name: "Laksa", price: 7.00, quantity: 1, modifiers: [{ name: "Spicy", price: 0 }], notes: "Extra sambal on side", seat: 2, status: "served", firedAt: "2024-01-15T12:32:00" },
      { id: "oi3", menuItemId: "m22", name: "Teh Tarik", price: 2.50, quantity: 3, modifiers: [], status: "ready", firedAt: "2024-01-15T12:35:00" },
      { id: "oi4", menuItemId: "m5", name: "Prawn Crackers", price: 4.50, quantity: 1, modifiers: [], seat: 3, status: "preparing", firedAt: "2024-01-15T12:40:00" },
    ],
    subtotal: 40.00, serviceCharge: 4.00, gst: 3.52, total: 47.52,
  },
  {
    id: "o2", tableId: "t3", tableNumber: "3", serviceMode: "dine-in",
    guestCount: 4, status: "open", createdAt: "2024-01-15T12:15:00",
    items: [
      { id: "oi5", menuItemId: "m8", name: "Chilli Crab", price: 38.00, quantity: 1, modifiers: [{ name: "Medium", price: 0 }], notes: "No mantou, allergic to gluten", status: "preparing", firedAt: "2024-01-15T12:20:00" },
      { id: "oi6", menuItemId: "m15", name: "Nasi Lemak", price: 6.50, quantity: 2, modifiers: [{ name: "Mild", price: 0 }, { name: "Extra Rice", price: 1.00 }], notes: "Less sambal for 1 portion", status: "ready", firedAt: "2024-01-15T12:18:00" },
      { id: "oi7", menuItemId: "m26", name: "Tiger Beer", price: 10.00, quantity: 3, modifiers: [], status: "served", firedAt: "2024-01-15T12:16:00" },
      { id: "oi12", menuItemId: "m18", name: "Kangkong Belacan", price: 8.00, quantity: 1, modifiers: [{ name: "Spicy", price: 0 }], status: "new", firedAt: "2024-01-15T12:50:00" },
    ],
    subtotal: 81.00, serviceCharge: 8.10, gst: 7.13, total: 96.23,
  },
  {
    id: "o3", tableId: "t8", tableNumber: "8", serviceMode: "dine-in",
    guestCount: 2, status: "open", createdAt: "2024-01-15T12:45:00",
    items: [
      { id: "oi8", menuItemId: "m22", name: "Teh Tarik", price: 2.50, quantity: 2, modifiers: [], status: "served", firedAt: "2024-01-15T12:46:00" },
      { id: "oi9", menuItemId: "m3", name: "Char Kway Teow", price: 6.50, quantity: 2, modifiers: [{ name: "Medium", price: 0 }], notes: "No cockles", status: "new", firedAt: "2024-01-15T12:48:00" },
      { id: "oi13", menuItemId: "combo1", name: "Lunch Set A", price: 12.90, quantity: 1, modifiers: [], status: "new", firedAt: "2024-01-15T12:49:00", comboItems: [
        { name: "Chicken Rice", groupName: "Main" },
        { name: "Prawn Crackers", groupName: "Side" },
        { name: "Teh Tarik", groupName: "Drink" },
      ]},
    ],
    subtotal: 30.90, serviceCharge: 3.09, gst: 2.72, total: 36.71,
  },
  {
    id: "o4", tableId: "t12", tableNumber: "12", serviceMode: "dine-in",
    guestCount: 1, status: "open", createdAt: "2024-01-15T12:50:00",
    items: [
      { id: "oi10", menuItemId: "m26", name: "Tiger Beer", price: 10.00, quantity: 1, modifiers: [], status: "served", firedAt: "2024-01-15T12:51:00" },
      { id: "oi11", menuItemId: "m4", name: "Satay (10pc)", price: 12.00, quantity: 1, modifiers: [{ name: "Peanut Sauce", price: 0 }], notes: "Extra peanut sauce pls", status: "preparing", firedAt: "2024-01-15T12:52:00" },
    ],
    subtotal: 22.00, serviceCharge: 2.20, gst: 1.94, total: 26.14,
  },
  {
    id: "o5", tableId: "t8", tableNumber: "8", serviceMode: "dine-in",
    guestCount: 2, status: "open", createdAt: "2024-01-15T12:55:00",
    items: [],
    subtotal: 0, serviceCharge: 0, gst: 0, total: 0,
  },
];

export const customers: Customer[] = [
  { id: "c1", name: "Tan Wei Ming", phone: "+65 9123 4567", email: "weiming@email.com", visits: 24, points: 1250, tier: "gold", lastVisit: "2024-01-14" },
  { id: "c2", name: "Sarah Lim", phone: "+65 8234 5678", visits: 8, points: 420, tier: "silver", lastVisit: "2024-01-12" },
  { id: "c3", name: "Ahmad bin Hassan", phone: "+65 9345 6789", visits: 3, points: 150, tier: "bronze", lastVisit: "2024-01-10" },
  { id: "c4", name: "Priya Sharma", phone: "+65 8456 7890", email: "priya@email.com", visits: 45, points: 3200, tier: "platinum", lastVisit: "2024-01-15" },
];

export const staffMembers = [
  { id: "s1", name: "Sarah Lim", role: "manager" as const, pin: "1234" },
  { id: "s2", name: "Mike Tan", role: "server" as const, pin: "5678" },
  { id: "s3", name: "David Chen", role: "server" as const, pin: "9012" },
  { id: "s4", name: "Lisa Wang", role: "cashier" as const, pin: "3456" },
  { id: "s5", name: "Ahmad Razak", role: "kitchen" as const, pin: "7890" },
  { id: "s6", name: "Jennifer Ng", role: "server" as const, pin: "2345" },
  { id: "s7", name: "Kevin Loh", role: "kitchen" as const, pin: "6789" },
  { id: "s8", name: "Rachel Goh", role: "cashier" as const, pin: "0123" },
  { id: "s9", name: "Tommy Koh", role: "server" as const, pin: "4567" },
  { id: "s10", name: "Priya Devi", role: "kitchen" as const, pin: "8901" },
];
