import { Transaction, Budget, SavingsGoal, BusinessCashflow, CategoryInfo } from "./types";

// Rupiah currency formatter
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Abbreviated Rupiah currency formatter (e.g. Rp 31,55 Jt, Rp 210 Rb)
export function formatRupiahAbbr(amount: number): string {
  const isNegative = amount < 0;
  const absVal = Math.abs(amount);
  let str = "";
  if (absVal >= 1_000_000_000) {
    const val = absVal / 1_000_000_000;
    str = `${val.toFixed(2).replace(/\.00$/, "").replace(".", ",")} M`;
  } else if (absVal >= 1_000_000) {
    const val = absVal / 1_000_000;
    str = `${val.toFixed(2).replace(/\.00$/, "").replace(".", ",")} Jt`;
  } else if (absVal >= 1_000) {
    const val = absVal / 1_000;
    str = `${val.toFixed(1).replace(/\.0$/, "").replace(".", ",")} Rb`;
  } else {
    str = `${absVal}`;
  }
  return `${isNegative ? "-" : ""}Rp ${str}`;
}

// Map Indonesian categories to Lucide-react icons and Tailwind styles
export const categoriesConfig: Record<string, CategoryInfo> = {
  Makan: {
    name: "Makan",
    icon: "Utensils",
    color: "text-orange-500 bg-orange-100 dark:bg-orange-950/40 dark:text-orange-400 border-orange-200",
    bgLight: "bg-orange-50",
  },
  Transport: {
    name: "Transport",
    icon: "Car",
    color: "text-blue-500 bg-blue-100 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200",
    bgLight: "bg-blue-50",
  },
  Belanja: {
    name: "Belanja",
    icon: "Locate",
    color: "text-purple-500 bg-purple-100 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200",
    bgLight: "bg-purple-50",
  },
  Tagihan: {
    name: "Tagihan",
    icon: "Zap",
    color: "text-red-500 bg-red-100 dark:bg-red-950/40 dark:text-red-400 border-red-200",
    bgLight: "bg-red-50",
  },
  Hiburan: {
    name: "Hiburan",
    icon: "Compass",
    color: "text-pink-500 bg-pink-100 dark:bg-pink-950/40 dark:text-pink-400 border-pink-200",
    bgLight: "bg-pink-50",
  },
  Kesehatan: {
    name: "Kesehatan",
    icon: "HeartPulse",
    color: "text-emerald-500 bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200",
    bgLight: "bg-emerald-50",
  },
  Pendidikan: {
    name: "Pendidikan",
    icon: "BookOpen",
    color: "text-indigo-500 bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-200",
    bgLight: "bg-indigo-50",
  },
  Bisnis: {
    name: "Bisnis",
    icon: "Briefcase",
    color: "text-amber-500 bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200",
    bgLight: "bg-amber-50",
  },
  Gaji: {
    name: "Gaji",
    icon: "Wallet",
    color: "text-green-500 bg-green-100 dark:bg-green-950/40 dark:text-green-400 border-green-200",
    bgLight: "bg-green-50",
  },
  Lainnya: {
    name: "Lainnya",
    icon: "HelpCircle",
    color: "text-slate-500 bg-slate-100 dark:bg-slate-950/40 dark:text-slate-450 border-slate-200",
    bgLight: "bg-slate-55",
  },
};

// Seeding high quality Indonesian mock financial transactions
export const defaultTransactions: Transaction[] = [
  // 1. Workspace: Personal
  {
    id: "tx-p1",
    amount: 15000000,
    type: "income",
    category: "Gaji",
    note: "Gaji Bulanan Software Engineer",
    date: "2026-05-20",
    wallet: "BCA",
    workspace: "Personal",
    source: "manual",
  },
  {
    id: "tx-p2",
    amount: 45000,
    type: "expense",
    category: "Makan",
    note: "Kopi Kenangan & Roti Bakar",
    date: "2026-05-25",
    wallet: "GoPay",
    workspace: "Personal",
    source: "manual",
  },
  {
    id: "tx-p3",
    amount: 120000,
    type: "expense",
    category: "Transport",
    note: "GoCar ke Kantor Pusat",
    date: "2026-05-24",
    wallet: "GoPay",
    workspace: "Personal",
    source: "voice",
  },
  {
    id: "tx-p4",
    amount: 650000,
    type: "expense",
    category: "Tagihan",
    note: "Tagihan Listrik PLN & Internet IndiHome",
    date: "2026-05-22",
    wallet: "BCA",
    workspace: "Personal",
    source: "ocr",
  },
  {
    id: "tx-p5",
    amount: 1200000,
    type: "expense",
    category: "Belanja",
    note: "Sepatu Olahraga Adidas Tokopedia",
    date: "2026-05-18",
    wallet: "BCA",
    workspace: "Personal",
    source: "manual",
  },
  {
    id: "tx-p6",
    amount: 85000,
    type: "expense",
    category: "Hiburan",
    note: "Bioskop XXI Premiere & Popcorn",
    date: "2026-05-15",
    wallet: "Cash",
    workspace: "Personal",
    source: "manual",
  },

  // 2. Workspace: Keluarga Budi
  {
    id: "tx-f1",
    amount: 8000000,
    type: "income",
    category: "Gaji",
    note: "Sumbangan Uang Kas Bersama Budi & Istri",
    date: "2026-05-18",
    wallet: "BCA",
    workspace: "Keluarga Budi",
    source: "manual",
  },
  {
    id: "tx-f2",
    amount: 1450000,
    type: "expense",
    category: "Belanja",
    note: "Belanja Bulanan Sayur & Susu Anak di Supermarket",
    date: "2026-05-24",
    wallet: "BCA",
    workspace: "Keluarga Budi",
    source: "ocr",
  },
  {
    id: "tx-f3",
    amount: 250000,
    type: "expense",
    category: "Kesehatan",
    note: "Obat Apotek & Vitamin Keluarga",
    date: "2026-05-25",
    wallet: "GoPay",
    workspace: "Keluarga Budi",
    source: "voice",
  },
  {
    id: "tx-f4",
    amount: 2100000,
    type: "expense",
    category: "Pendidikan",
    note: "SPP Bulanan Sekolah Anak & Kursus Piano",
    date: "2026-05-21",
    wallet: "BCA",
    workspace: "Keluarga Budi",
    source: "manual",
  },
  {
    id: "tx-f5",
    amount: 550000,
    type: "expense",
    category: "Makan",
    note: "Makan Malam Bersama Mertua di Resto Seafood",
    date: "2026-05-23",
    wallet: "Cash",
    workspace: "Keluarga Budi",
    source: "manual",
  },

  // 3. Workspace: Toko Kopi Budi (Business/UMKM)
  {
    id: "tx-b1",
    amount: 2450000,
    type: "income",
    category: "Bisnis",
    note: "Penjualan Kopi Harian (80 cup Espresso Latte)",
    date: "2026-05-25",
    wallet: "GoPay",
    workspace: "Toko Kopi Budi",
    source: "manual",
  },
  {
    id: "tx-b2",
    amount: 1950000,
    type: "income",
    category: "Bisnis",
    note: "Penjualan Kopi Akhir Pekan (Event Bazar Kampus)",
    date: "2026-05-24",
    wallet: "BCA",
    workspace: "Toko Kopi Budi",
    source: "manual",
  },
  {
    id: "tx-b3",
    amount: 11200000,
    type: "income",
    category: "Bisnis",
    note: "Pesanan Catering Kopi Kapsul Kantor Tokopedia",
    date: "2026-05-15",
    wallet: "BCA",
    workspace: "Toko Kopi Budi",
    source: "manual",
  },
  {
    id: "tx-b4",
    amount: 450000,
    type: "expense",
    category: "Bisnis",
    note: "Beli Bahan Baku Susu UHT Greenfields 2 Karton",
    date: "2026-05-23",
    wallet: "Cash",
    workspace: "Toko Kopi Budi",
    source: "ocr",
  },
  {
    id: "tx-b5",
    amount: 850000,
    type: "expense",
    category: "Bisnis",
    note: "Beli Biji Kopi Roast-bean Arabica Gayo 5Kg",
    date: "2026-05-22",
    wallet: "BCA",
    workspace: "Toko Kopi Budi",
    source: "manual",
  },
  {
    id: "tx-b6",
    amount: 1200000,
    type: "expense",
    category: "Tagihan",
    note: "Sewa Tempat & Listrik Kios Bulanan",
    date: "2026-05-10",
    wallet: "BCA",
    workspace: "Toko Kopi Budi",
    source: "manual",
  },
];

export const defaultBudgets: Budget[] = [
  // Personal
  { id: "b1", category: "Makan", monthlyLimit: 2500000, spent: 45000, workspace: "Personal" },
  { id: "b2", category: "Transport", monthlyLimit: 1200000, spent: 120000, workspace: "Personal" },
  { id: "b3", category: "Belanja", monthlyLimit: 3000000, spent: 1200000, workspace: "Personal" },
  { id: "b4", category: "Tagihan", monthlyLimit: 1500000, spent: 650000, workspace: "Personal" },
  // Keluarga
  { id: "b5", category: "Belanja", monthlyLimit: 4000000, spent: 1450000, workspace: "Keluarga Budi" },
  { id: "b6", category: "Kesehatan", monthlyLimit: 1000000, spent: 250000, workspace: "Keluarga Budi" },
  { id: "b7", category: "Pendidikan", monthlyLimit: 5000000, spent: 2100000, workspace: "Keluarga Budi" },
  // Bisnis
  { id: "b8", category: "Bisnis", monthlyLimit: 10000000, spent: 1300000, workspace: "Toko Kopi Budi" },
];

export const defaultGoals: SavingsGoal[] = [
  // Personal
  { id: "g1", name: "Beli iPhone 17 Pro", targetAmount: 22000000, currentAmount: 14500000, deadline: "2026-12", icon: "Smartphone", workspace: "Personal" },
  { id: "g2", name: "DP Motor Vespa Matic", targetAmount: 15000000, currentAmount: 8000000, deadline: "2026-09", icon: "Bike", workspace: "Personal" },
  // Keluarga
  { id: "g3", name: "Dana Liburan Keluarga ke Bali", targetAmount: 18000000, currentAmount: 12000000, deadline: "2026-10", icon: "Palmtree", workspace: "Keluarga Budi" },
  // Bisnis
  { id: "g4", name: "Beli Mesin Espresso La Marzocco", targetAmount: 45000000, currentAmount: 15000000, deadline: "2026-11", icon: "Coffee", workspace: "Toko Kopi Budi" },
];

export const defaultBusinessItems: BusinessCashflow[] = [
  { id: "bf1", type: "piutang", amount: 450000, counterParty: "Kantor Kelurahan (Pak Lurah)", dueDate: "2026-06-03", isPaid: false, notes: "Kopi untuk rapat koordinasi sisa pembayaran" },
  { id: "bf2", type: "hutang", amount: 1500000, counterParty: "Supplier Cup Plastik (Hendra)", dueDate: "2026-05-29", isPaid: false, notes: "Utang nota pasokan 1000 cup sablon" },
  { id: "bf3", type: "piutang", amount: 300000, counterParty: "Budi Santoso (Teman Dekat)", dueDate: "2026-06-05", isPaid: false, notes: "Grosir kopi bubuk 2kg belum ditransfer" },
];
