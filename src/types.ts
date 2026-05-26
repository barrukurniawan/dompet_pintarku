export type WorkspaceType = "Personal" | "Keluarga Barru" | "Toko Kopi Barru";

export interface Transaction {
  id: string;
  amount: number;
  type: "expense" | "income";
  category: string;
  note: string;
  date: string;
  wallet: "Cash" | "BCA" | "GoPay";
  workspace: WorkspaceType;
  receiptUrl?: string;
  source: "manual" | "ocr" | "voice" | "wa";
}

export interface Wallet {
  id: string;
  name: "Cash" | "BCA" | "GoPay";
  balance: number;
  type: string;
}

export interface Budget {
  id: string;
  category: string;
  monthlyLimit: number;
  spent: number;
  workspace: WorkspaceType;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  icon: string;
  workspace: WorkspaceType;
}

export interface BusinessCashflow {
  id: string;
  type: "hutang" | "piutang" | "modal" | "laba";
  amount: number;
  counterParty: string;
  dueDate?: string;
  isPaid: boolean;
  notes: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  parts: { text: string }[];
  timestamp: string;
  source?: "gemini_api" | "fallback_simulation";
}

export interface CategoryInfo {
  name: string;
  icon: string;
  color: string;
  bgLight: string;
}
