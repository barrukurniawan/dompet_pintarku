import React, { useState, useEffect, useRef } from "react";
import {
  Wallet,
  Plus,
  Mic,
  Camera,
  TrendingUp,
  TrendingDown,
  User,
  Users,
  Coffee,
  Smartphone,
  Bike,
  Compass,
  HeartPulse,
  BookOpen,
  Briefcase,
  HelpCircle,
  Zap,
  Utensils,
  Car,
  MessageSquare,
  Award,
  Play,
  Check,
  Trash2,
  Sparkles,
  Eye,
  EyeOff,
  Bell,
  ChevronRight,
  Send,
  Upload,
  Clock,
  CircleAlert,
  X,
  Volume2,
  Info,
  Calendar,
  Layers,
  ShoppingBag,
  ExternalLink,
  PlusCircle
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";
import { WorkspaceType, Transaction, Budget, SavingsGoal, BusinessCashflow, ChatMessage } from "./types";
import { formatRupiah, formatRupiahAbbr, categoriesConfig, defaultTransactions, defaultBudgets, defaultGoals, defaultBusinessItems } from "./utils";

export default function App() {
  // ---- 1. CORE APPLICATION STATE ----
  const [workspace, setWorkspace] = useState<WorkspaceType>("Personal");
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem("dopi_transactions");
    return saved ? JSON.parse(saved) : defaultTransactions;
  });
  const [budgets, setBudgets] = useState<Budget[]>(() => {
    const saved = localStorage.getItem("dopi_budgets");
    return saved ? JSON.parse(saved) : defaultBudgets;
  });
  const [goals, setGoals] = useState<SavingsGoal[]>(() => {
    const saved = localStorage.getItem("dopi_goals");
    return saved ? JSON.parse(saved) : defaultGoals;
  });
  const [businessItems, setBusinessItems] = useState<BusinessCashflow[]>(() => {
    const saved = localStorage.getItem("dopi_business");
    return saved ? JSON.parse(saved) : defaultBusinessItems;
  });

  // Gamification state
  const [userPoints, setUserPoints] = useState<number>(() => {
    const saved = localStorage.getItem("dopi_points");
    return saved ? parseInt(saved, 10) : 1350;
  });
  const [showAdModal, setShowAdModal] = useState(false);
  const [adCountdown, setAdCountdown] = useState(0);
  const [isAdPlaying, setIsAdPlaying] = useState(false);

  // UI state filters
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("All");
  const [txTypeFilter, setTxTypeFilter] = useState<"all" | "expense" | "income">("all");
  const [hideBalance, setHideBalance] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "warning" | "info" } | null>(null);

  // Modals / Overlays
  const [showManualModal, setShowManualModal] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showOcrModal, setShowOcrModal] = useState(false);

  // Form states
  const [manualForm, setManualForm] = useState({
    amount: "",
    type: "expense" as "expense" | "income",
    category: "Makan",
    note: "",
    date: new Date().toISOString().split("T")[0],
    wallet: "Cash" as "Cash" | "BCA" | "GoPay"
  });

  // OCR Simulator
  const [ocrSelectedSample, setOcrSelectedSample] = useState<number | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrPreviewResult, setOcrPreviewResult] = useState<any | null>(null);

  // Voice Simulator
  const [voiceInputText, setVoiceInputText] = useState("");
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [voicePreviewResult, setVoicePreviewResult] = useState<any | null>(null);

  // Chatbot State
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem("dopi_chat_history");
    const defaultChat: ChatMessage[] = [
      {
        id: "m0",
        role: "model",
        parts: [{ text: "Halo Kak Budi! Aku Dopi, asisten pintarmu. Mau asisten bantu pantau catatan keuangan atau butuh tips hebat seputar hemat bulan ini? Yuk, ceritakan keperluanmu!" }],
        timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
      }
    ];
    return saved ? JSON.parse(saved) : defaultChat;
  });

  // ---- 2. SYNC STATE TO LOCAL STORAGE ----
  useEffect(() => {
    localStorage.setItem("dopi_transactions", JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem("dopi_budgets", JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem("dopi_goals", JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem("dopi_business", JSON.stringify(businessItems));
  }, [businessItems]);

  useEffect(() => {
    localStorage.setItem("dopi_points", userPoints.toString());
  }, [userPoints]);

  useEffect(() => {
    localStorage.setItem("dopi_chat_history", JSON.stringify(chatMessages));
  }, [chatMessages]);

  // Recalculate category spending in current active workspace based on current transaction lists
  useEffect(() => {
    const updatedBudgets = budgets.map(b => {
      // Aggregate transactions in this workspace for this category
      const spent = transactions
        .filter(t => t.workspace === b.workspace && t.category === b.category && t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);
      return { ...b, spent };
    });
    
    // Check if any budget is severely exceeded, trigger toast warning
    const previouslyOverbudget = budgets.some(b => b.spent > b.monthlyLimit && b.workspace === workspace);
    const currentlyOverbudget = updatedBudgets.some(b => b.spent > b.monthlyLimit && b.workspace === workspace);
    
    if (currentlyOverbudget && !previouslyOverbudget) {
      const exceededCategory = updatedBudgets.find(b => b.spent > b.monthlyLimit && b.workspace === workspace);
      if (exceededCategory) {
        showToast(
          `Waduh! Anggaran kategori "${exceededCategory.category}" di workspace ${workspace} sudah melebihi batas limit bulanan kamu! 🛑`,
          "warning"
        );
      }
    }
  }, [transactions, workspace]);

  // Toast System Helper
  const showToast = (message: string, type: "success" | "warning" | "info" = "info") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 5500);
  };

  // ---- 3. SEEDED SAMPLES FOR SIMULATING ACTIONS ----
  const ocrSampleReceipts = [
    {
      id: 1,
      name: "Struk Makan Kedai Soto Ayam",
      imgUrl: "🍳",
      text: "SOTO AYAM NUSANTARA\nJl. Merdeka No. 45 Jakarta\nSoto Spesial Campur: Rp 35.000\nEs Teh Manis: Rp 10.000\nTOTAL BAYAR: Rp 45.000\nMetode: CASH\nTerima Kasih atas Kunjungan Anda!",
      detectData: { amount: 45000, type: "expense" as const, category: "Makan", note: "Soto Spesial Campur & Es Teh Manis", wallet: "Cash" as const }
    },
    {
      id: 2,
      name: "Bukti Transfer M-Banking Tagihan Listrik",
      imgUrl: "⚡",
      text: "TRANSFER BERHASIL m-BCA\nTanggal: 25/05/2026\nKe Rekening: 2314-889 PLN METRO JAYA\nNominal: IDR 650.000\nBiaya Admin: IDR 2.500\nTOTAL: Rp 652.500\nStatus: SUKSES",
      detectData: { amount: 650000, type: "expense" as const, category: "Tagihan", note: "Tagihan Listrik PLN Bulanan", wallet: "BCA" as const }
    },
    {
      id: 3,
      name: "GoFood Delivery Martabak Manis",
      imgUrl: "🥞",
      text: "Gofood Order #GF-88921\nMartabak Keju Cokelat: Rp 85.000\nOngkos Kirim: Rp 12.000\nDiskon Gopay: -Rp 12.000\nTotal Terbayar: Rp 85.000\nMetode Pembayaran: GOPAY - SUCCESS",
      detectData: { amount: 85000, type: "expense" as const, category: "Makan", note: "Martabak Keju Cokelat GoFood", wallet: "GoPay" as const }
    }
  ];

  const speechSamples = [
    "Beli boba brown sugar abis lima puluh ribu pakai gopay dong",
    "Gajian masuk dari bos bca delapan juta rupiah",
    "Sewa tempat kios warung kopi satu juta dua ratus ribu bayar pakai bca",
    "Belanja sayur dan susu anak seratus empat puluh lima ribu rupiah cash",
  ];

  // ---- 4. CALCULATED FINANCIAL METRICS (WORKSPACE AWARE) ----
  const filteredTransactions = transactions.filter(t => t.workspace === workspace);
  
  // Balance calculation
  const totalIncome = filteredTransactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = filteredTransactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
  
  // Specific Wallet Balances in this Workspace (dynamic aggregation)
  const getWalletBalance = (walletName: "Cash" | "BCA" | "GoPay") => {
    const startBalance = walletName === "BCA" ? 15000000 : walletName === "GoPay" ? 2800000 : 850000;
    const income = filteredTransactions.filter(t => t.wallet === walletName && t.type === "income").reduce((sum, t) => sum + t.amount, 0);
    const expense = filteredTransactions.filter(t => t.wallet === walletName && t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
    return startBalance + income - expense;
  };

  const bcaBalance = getWalletBalance("BCA");
  const gopayBalance = getWalletBalance("GoPay");
  const cashBalance = getWalletBalance("Cash");
  const totalBalance = bcaBalance + gopayBalance + cashBalance;

  // Active workspace budgets
  const activeBudgets = budgets.filter(b => b.workspace === workspace);
  const totalBudgetLimit = activeBudgets.reduce((sum, b) => sum + b.monthlyLimit, 0);
  const totalBudgetSpent = activeBudgets.reduce((sum, b) => sum + b.spent, 0);

  // Active workspace savings goals
  const activeGoals = goals.filter(g => g.workspace === workspace);

  // ---- 5. DYNAMIC COLOR SCHEME DEPENDING ON WORKSPACE ----
  const themeColor = {
    Personal: {
      primary: "emerald-600",
      bgGradient: "from-emerald-50 to-teal-50",
      accent: "emerald-500",
      accentBg: "bg-emerald-50 border-emerald-100",
      text: "text-emerald-700",
      btn: "bg-emerald-600 hover:bg-emerald-700 text-white",
      badge: "bg-emerald-100 text-emerald-800",
      sidebarBg: "bg-slate-900",
    },
    "Keluarga Budi": {
      primary: "indigo-600",
      bgGradient: "from-indigo-50 to-violet-50",
      accent: "indigo-500",
      accentBg: "bg-indigo-50 border-indigo-100",
      text: "text-indigo-700",
      btn: "bg-indigo-600 hover:bg-indigo-700 text-white",
      badge: "bg-indigo-100 text-indigo-800",
      sidebarBg: "bg-indigo-950",
    },
    "Toko Kopi Budi": {
      primary: "amber-700",
      bgGradient: "from-amber-50 to-amber-100/40",
      accent: "amber-600",
      accentBg: "bg-amber-50 border-amber-100",
      text: "text-amber-800",
      btn: "bg-amber-700 hover:bg-amber-800 text-white",
      badge: "bg-amber-100 text-amber-800",
      sidebarBg: "bg-amber-950",
    }
  }[workspace];

  // ---- 6. CHART DATA SYNTHESIS ----
  const getChartData = () => {
    // Generate dates for past 7 days
    const dataList = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dateLabel = d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
      
      const incomeVal = filteredTransactions
        .filter(t => t.date === dateStr && t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);
        
      const expenseVal = filteredTransactions
        .filter(t => t.date === dateStr && t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);

      dataList.push({
        name: dateLabel,
        pemasukan: incomeVal,
        pengeluaran: expenseVal
      });
    }
    return dataList;
  };

  const chartData = getChartData();

  // ---- 7. TRANSACTION EVENT HANDLERS ----
  const handleSaveManual = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseInt(manualForm.amount.replace(/\D/g, ""), 10);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert("Masukkan nominal transaksi yang valid!");
      return;
    }

    const newTx: Transaction = {
      id: "tx-m-" + Date.now(),
      amount: amountNum,
      type: manualForm.type,
      category: manualForm.category,
      note: manualForm.note || `${manualForm.type === "income" ? "Pemasukan" : "Pengeluaran"} Manual`,
      date: manualForm.date,
      wallet: manualForm.wallet,
      workspace: workspace,
      source: "manual"
    };

    setTransactions(prev => [newTx, ...prev]);
    setShowManualModal(false);
    showToast(`Transaksi "${newTx.note}" senilai ${formatRupiah(newTx.amount)} berhasil ditambahkan! 💳`, "success");
    setUserPoints(pts => pts + 15); // Add points for disciplined recording!
    
    // reset form
    setManualForm({
      amount: "",
      type: "expense",
      category: "Makan",
      note: "",
      date: new Date().toISOString().split("T")[0],
      wallet: "Cash"
    });
  };

  const handleDeleteTransaction = (id: string) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;
    if (confirm(`Yakin ingin menghapus transaksi "${tx.note || "Transaksi"}"?`)) {
      setTransactions(prev => prev.filter(t => t.id !== id));
      showToast("Transaksi berhasil dihapus dari catatan keuangan.", "info");
    }
  };

  // ---- 8. INTELLECTUAL SIMULATIONS (OCR SCAN & VOICE RECOGNITION) ---
  const handleSimulateOcrChoose = (sampleId: number) => {
    const sample = ocrSampleReceipts.find(s => s.id === sampleId);
    if (!sample) return;
    setOcrSelectedSample(sampleId);
    setOcrLoading(true);
    setOcrPreviewResult(null);

    // Call API /api/parse-input to parse the textual content extracted by receipt
    fetch("/api/parse-input", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: sample.text })
    })
      .then(res => res.json())
      .then(data => {
        setOcrLoading(false);
        setOcrPreviewResult({
          text: sample.text,
          parsed: data
        });
      })
      .catch(err => {
        console.error("OCR API Parsing Error", err);
        setOcrLoading(false);
        // Fallback
        setOcrPreviewResult({
          text: sample.text,
          parsed: sample.detectData
        });
      });
  };

  const handleSaveOcrResult = () => {
    if (!ocrPreviewResult) return;
    const parsed = ocrPreviewResult.parsed;
    
    const newTx: Transaction = {
      id: "tx-ocr-" + Date.now(),
      amount: parsed.amount || 0,
      type: parsed.type || "expense",
      category: parsed.category || "Lainnya",
      note: parsed.note || "Struk Pembelian OCR",
      date: new Date().toISOString().split("T")[0],
      wallet: parsed.wallet || "Cash",
      workspace: workspace,
      source: "ocr"
    };

    setTransactions(prev => [newTx, ...prev]);
    setShowOcrModal(false);
    setOcrSelectedSample(null);
    setOcrPreviewResult(null);
    showToast(`📸 OCR Sukses! Transaksi "${newTx.note}" senilai ${formatRupiah(newTx.amount)} diposting otomatis ke dompet ${newTx.wallet}!`, "success");
    setUserPoints(pts => pts + 30); // Higher points for OCR auto integration
  };

  const handleSimulateVoiceParse = (textToUse?: string) => {
    const speechText = textToUse || voiceInputText;
    if (!speechText.trim()) {
      showToast("Tolong tulis kalimat manual atau pilih template suara pintas!", "warning");
      return;
    }

    setVoiceLoading(true);
    setVoicePreviewResult(null);

    // Hit node endpoint
    fetch("/api/parse-input", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: speechText })
    })
      .then(res => res.json())
      .then(data => {
        setVoiceLoading(false);
        setVoicePreviewResult(data);
      })
      .catch(err => {
        console.error("Voice parse error", err);
        setVoiceLoading(false);
        showToast("Gagal melakukan voice parsing, tapi jangan khawatir, dicoba lagi!", "warning");
      });
  };

  const handleStartSimulatedMicrophone = () => {
    setIsRecording(true);
    setVoiceInputText("");
    
    // Set simulated recording stream timeout
    setTimeout(() => {
      setIsRecording(false);
      // Pick a random cool speech text that demonstrates capabilities
      const randomPrompt = speechSamples[Math.floor(Math.random() * speechSamples.length)];
      setVoiceInputText(randomPrompt);
      showToast("Voice capture selesai! Dopi sedang memproses rekaman suaramu...", "success");
      handleSimulateVoiceParse(randomPrompt);
    }, 2500);
  };

  const handleSaveVoiceResult = () => {
    if (!voicePreviewResult) return;
    
    const newTx: Transaction = {
      id: "tx-v-" + Date.now(),
      amount: voicePreviewResult.amount || 0,
      type: voicePreviewResult.type || "expense",
      category: voicePreviewResult.category || "Lainnya",
      note: voicePreviewResult.note || "Catatan Suara Dopi",
      date: new Date().toISOString().split("T")[0],
      wallet: voicePreviewResult.wallet || "Cash",
      workspace: workspace,
      source: "voice"
    };

    setTransactions(prev => [newTx, ...prev]);
    setShowVoiceModal(false);
    setVoicePreviewResult(null);
    setVoiceInputText("");
    showToast(`🎤 Voice Posted! "${newTx.note}" senilai ${formatRupiah(newTx.amount)} tersimpan dengan 2 klik saja!`, "success");
    setUserPoints(pts => pts + 25);
  };

  // ---- 9. CHAT ASSISTANT DOPI CALLS ----
  const handleSendChatMessage = async () => {
    if (!chatInput.trim()) return;
    
    const userMsg: ChatMessage = {
      id: "chat-u-" + Date.now(),
      role: "user",
      parts: [{ text: chatInput }],
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    };

    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setIsChatLoading(true);

    // Dynamic Financial context payload to pass the actual numeric health statistics
    const financialSummary = `
      Informasi keuangan saat ini di Workspace "${workspace}":
      - Total Pemasukan tercatat: ${formatRupiah(totalIncome)}
      - Total Pengeluaran tercatat: ${formatRupiah(totalExpense)}
      - Sisa Anggaran (Limits): ${formatRupiah(totalBudgetLimit - totalBudgetSpent)} dari total anggaran ${formatRupiah(totalBudgetLimit)}
      - Rincian Saldo Bank: BCA (${formatRupiah(bcaBalance)}), GoPay (${formatRupiah(gopayBalance)}), Cash (${formatRupiah(cashBalance)})
      - Total Likuiditas saat ini: ${formatRupiah(totalBalance)}
    `;

    // Map history to server schema
    const formattedHistory = [...chatMessages, userMsg].map(m => ({
      role: m.role,
      parts: m.parts
    }));

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: formattedHistory,
          workspace: workspace,
          financialSummary: financialSummary
        })
      });

      const resData = await response.json();
      setIsChatLoading(false);

      if (resData.text) {
        setChatMessages(prev => [...prev, {
          id: "chat-m-" + Date.now(),
          role: "model",
          parts: [{ text: resData.text }],
          timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
          source: resData.source
        }]);
      } else {
        throw new Error("No text response returned");
      }
    } catch (err: any) {
      console.error("Chat Assist Dopi Service Error:", err);
      setIsChatLoading(false);
      // Append gentle fallback message
      setChatMessages(prev => [...prev, {
        id: "chat-m-" + Date.now(),
        role: "model",
        parts: [{ text: "Maaf ya Kak, koneksiku sedang terganggu sebentar. Tapi ingat, asisten sarankan pisah pos BCA & GoPay bulanan kamu biar gak khilaf beli kopi kenangan ya!" }],
        timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
      }]);
    }
  };

  const handleTriggerQuickSuggest = (text: string) => {
    setChatInput(text);
    // Focus or submit after a short moment
    setTimeout(() => {
      const chatSubmitBtn = document.getElementById("send-chat-btn");
      if (chatSubmitBtn) chatSubmitBtn.click();
    }, 100);
  };

  // ---- 10. REWARDED ADS SIMULATOR FOR GAMIFICATION ----
  const handleStartRewardedAd = () => {
    setShowAdModal(true);
    setIsAdPlaying(true);
    setAdCountdown(5);

    const interval = setInterval(() => {
      setAdCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsAdPlaying(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleClaimAdReward = () => {
    setUserPoints(pts => pts + 50);
    setShowAdModal(false);
    showToast("🎉 Hebat! Kamu menonton video promosi dan mendapat +50 Dopi Points! Level XP kamu bertambah.", "success");
    
    // Play virtual audio bell ring sound
    try {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, context.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, context.currentTime + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, context.currentTime + 0.2); // G5
      osc.frequency.setValueAtTime(1046.50, context.currentTime + 0.3); // C6
      osc.connect(gain);
      gain.connect(context.destination);
      gain.gain.setValueAtTime(0.1, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.6);
      osc.start();
      osc.stop(context.currentTime + 0.6);
    } catch (e) {
      console.log("Audio not supported or blocked");
    }
  };

  // ---- 11. EXTRA FUNCTIONALITIES FOR BUSINESS SPACE (UMKM) & SAVINGS ----
  const handleToggleBusinessPaid = (id: string) => {
    setBusinessItems(prev => prev.map(item => {
      if (item.id === id) {
        const nextPaid = !item.isPaid;
        showToast(`Status pembayaran ${item.counterParty} berhasil diubah menjadi ${nextPaid ? "Lunas" : "Belum Lunas"}.`, "success");
        return { ...item, isPaid: nextPaid };
      }
      return item;
    }));
  };

  const [newBusinessItem, setNewBusinessItem] = useState({
    type: "piutang" as "piutang" | "hutang",
    amount: "",
    counterParty: "",
    dueDate: new Date().toISOString().split("T")[0],
    notes: ""
  });

  const handleAddBusinessItem = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseInt(newBusinessItem.amount.replace(/\D/g, ""), 10);
    if (isNaN(amountNum) || amountNum <= 0 || !newBusinessItem.counterParty.trim()) {
      showToast("Data kas bisnis belum lengkap / tidak valid!", "warning");
      return;
    }

    const newItem: BusinessCashflow = {
      id: "bf-" + Date.now(),
      type: newBusinessItem.type,
      amount: amountNum,
      counterParty: newBusinessItem.counterParty,
      dueDate: newBusinessItem.dueDate,
      isPaid: false,
      notes: newBusinessItem.notes || "Catatan transaksi kedai"
    };

    setBusinessItems(prev => [newItem, ...prev]);
    showToast(`Berhasil menambahkan catatan ${newItem.type.toUpperCase()} sebesar ${formatRupiah(newItem.amount)}!`, "success");
    setNewBusinessItem({
      type: "piutang",
      amount: "",
      counterParty: "",
      dueDate: new Date().toISOString().split("T")[0],
      notes: ""
    });
  };

  const handleAddGoalSavingsAmount = (id: string) => {
    const goal = goals.find(g => g.id === id);
    if (!goal) return;
    const addAmt = prompt(`Berapa nominal uang yang ingin kamu tabung sekarang untuk target "${goal.name}"? (Masukkan angka saja)`, "500000");
    if (addAmt === null) return;
    
    const amt = parseInt(addAmt.replace(/\D/g, ""), 10);
    if (isNaN(amt) || amt <= 0) {
      showToast("Masukkan angka kontribusi menabung yang valid!", "warning");
      return;
    }

    if (amt > cashBalance && amt > bcaBalance && amt > gopayBalance) {
      if (!confirm("Nominal tabungan ini melebihi saldo kas tercatat kamu. Tetap lanjutkan?")) {
        return;
      }
    }

    setGoals(prev => prev.map(g => {
      if (g.id === id) {
        const nextAmt = Math.min(g.targetAmount, g.currentAmount + amt);
        if (nextAmt >= g.targetAmount) {
          showToast(`🏆 SELAMAT! Impian menabungmu "${g.name}" akhirnya berhasil tercapai seluruhnya! Dopi sangat bangga denganmu! 🥳`, "success");
          setUserPoints(pts => pts + 150);
        } else {
          showToast(`Saldo tabungan untuk "${g.name}" berhasil bertambah sebesar ${formatRupiah(amt)}! Selangkah lagi menuju impianmu! ⭐`, "success");
          setUserPoints(pts => pts + 40);
        }
        return { ...g, currentAmount: nextAmt };
      }
      return g;
    }));
  };

  // Convert categories object config into iterable array for selections mapping
  const activeCategoriesList = Object.keys(categoriesConfig);

  // Level computation for gamification XP tiers
  const getLevelInfo = (xp: number) => {
    if (xp < 500) return { level: 1, title: "Pejuang Kantong Kering", badge: "🌱", nextThreshold: 500 };
    if (xp < 1200) return { level: 2, title: "Sobat Promo Tokopedia", badge: "💼", nextThreshold: 1200 };
    if (xp < 2500) return { level: 3, title: "Sultan Hemat BCA", badge: "⭐", nextThreshold: 2500 };
    return { level: 4, title: "Naga Finansial Indonesia", badge: "🐉", nextThreshold: 10000 };
  };

  const levelInfo = getLevelInfo(userPoints);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans">
      
      {/* ==================== LEFT SIDEBAR: LOGO, WORKSPACE SWITCHER & GAMIFICATION ==================== */}
      <aside className={`w-full md:w-80 ${themeColor.sidebarBg} shrink-0 p-6 flex flex-col border-b md:border-b-0 md:border-r border-slate-800 transition-colors duration-500 justify-between`}>
        <div>
          {/* Logo & Branding Brand Name */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-xl shadow-lg ring-2 ring-emerald-400">
              D
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                Dompet Pintarku 
                <span className="text-xs bg-slate-800 font-normal px-2 py-0.5 rounded text-slate-400 border border-slate-700">v1.2</span>
              </h1>
              <p className="text-xs text-slate-400">Smart Financial Assistant</p>
            </div>
          </div>

          {/* Gamification Level & XP Progress Widget */}
          <div className="bg-slate-850/90 rounded-2xl p-4 border border-slate-750 mb-6 relative overflow-hidden backdrop-blur-sm shadow-xl">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-500/10 to-transparent pointer-none rounded-full"></div>
            
            <div className="flex items-center gap-2.5 mb-2.5">
              <span className="text-2xl">{levelInfo.badge}</span>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">LEVEL</p>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white mb-0.5">{levelInfo.title}</h4>
                  <span className="text-[10px] uppercase px-1.5 bg-emerald-500/20 text-emerald-400 rounded-full font-bold border border-emerald-500/20">Lv. {levelInfo.level}</span>
                </div>
              </div>
            </div>

            <div className="w-full bg-slate-800 rounded-full h-2 mb-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-indigo-500 h-full rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(100, (userPoints / levelInfo.nextThreshold) * 100)}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">Progress: <strong className="text-slate-200">{userPoints}</strong> / {levelInfo.nextThreshold} XP</span>
              <button 
                onClick={handleStartRewardedAd}
                className="text-[10px] bg-indigo-505 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1 px-2.5 rounded-lg flex items-center gap-1 transition shadow-md active:scale-95"
              >
                <Play size={10} className="fill-current" />
                Dapatkan XP (+50)
              </button>
            </div>
          </div>

          {/* Workspace Switcher Selector */}
          <div className="mb-6">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-2.5 px-1">Pilih Workspace</span>
            <div className="space-y-2">
              {[
                { id: "Personal" as WorkspaceType, name: "Personal (Harian)", icon: User, color: "border-emerald-500/20 text-emerald-400 hover:bg-emerald-950/20" },
                { id: "Keluarga Budi" as WorkspaceType, name: "Keluarga Budi", icon: Users, color: "border-indigo-500/20 text-indigo-400 hover:bg-indigo-950/20" },
                { id: "Toko Kopi Budi" as WorkspaceType, name: "Toko Kopi Budi (UMKM)", icon: Coffee, color: "border-amber-500/20 text-amber-400 hover:bg-amber-950/20" }
              ].map(w => {
                const IconComp = w.icon;
                const isActive = workspace === w.id;
                return (
                  <button
                    id={`workspace-btn-${w.id.replace(/\s+/g, "-")}`}
                    key={w.id}
                    onClick={() => {
                      setWorkspace(w.id);
                      showToast(`Berhasil beralih ke Ruang Kerja "${w.name}"!`, "info");
                    }}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all duration-300 ${
                      isActive
                        ? "bg-slate-800 text-white border-slate-600 font-bold shadow-inner"
                        : "bg-slate-900/40 text-slate-350 border-slate-800 hover:text-white"
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg ${isActive ? "bg-slate-700" : "bg-slate-805 bg-slate-800"}`}>
                      <IconComp size={16} />
                    </div>
                    <span className="text-sm leading-tight flex-1">{w.name}</span>
                    {isActive && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer info showing workspace status */}
        <div className="pt-4 border-t border-slate-850 text-xs text-slate-400 space-y-2">
          <div className="bg-slate-850/60 p-2.5 rounded-lg border border-slate-800">
            <p className="font-semibold text-slate-300 mb-0.5 flex items-center gap-1">
              <Info size={12} className="text-indigo-400" />
              Dopi Premium
            </p>
            <p className="text-[10px] text-slate-400 leading-normal">
              Status Akun: <span className="text-amber-500 font-bold">Dopi Premium</span> (Sewa premium hingga Des 2026).
            </p>
          </div>
          <p className="text-center text-[10px] text-slate-500 pt-1">
            © 2026 Dompet Pintarku. Built with ❤️ for Indonesian UMKM.
          </p>
        </div>
      </aside>

      {/* ==================== CENTRAL CONTENT ZONE: METRICS, CHARTS, BUDGETS & TRANSACTIONS ==================== */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full transition-colors duration-500">
        
        {/* Dynamic Theme Banner Greeting */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-5 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-bold py-0.5 px-2 rounded-full uppercase ${themeColor.badge}`}>
                {workspace}
              </span>
            </div>
            
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              {workspace === "Personal" && "Selamat Pagi Budi! 👋"}
              {workspace === "Keluarga Budi" && "Ruang Kas Keluarga Budi 🏠"}
              {workspace === "Toko Kopi Budi" && "Kedai Kopi Budi (UMKM) ☕"}
            </h2>
            
            <p className="text-slate-450 text-sm mt-0.5 flex items-center gap-1 text-slate-400">
              <Sparkles size={14} className="text-amber-400 animate-bounce" />
              <span>DoPi AI : </span>
              <strong className="text-white">
                {workspace === "Personal" && "Sisa anggaran jajan minggu ini tinggal Rp 35.000 saja loh, yuk kurangi nongkrong."}
                {workspace === "Keluarga Budi" && "Sumbangan kas bulanan sudah lengkap. Belanja bulanan sayur terdeteksi aman dari budget limit."}
                {workspace === "Toko Kopi Budi" && "Pendapatan katering kemarin mantap! Segera tagih piutang di Pak Lurah ya."}
              </strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <Calendar size={13} className="text-emerald-400" />
              {new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </span>
          </div>
        </header>

        {/* Global Toast Alert Prompt if exists */}
        {notification && (
          <div className={`p-4 rounded-xl mb-6 flex items-start gap-3 border transition-all duration-300 animate-slide-in ${
            notification.type === "success" 
              ? "bg-emerald-950/40 text-emerald-250 border-emerald-800" 
              : notification.type === "warning"
              ? "bg-red-950/40 text-red-250 border-red-800"
              : "bg-indigo-950/40 text-indigo-250 border-indigo-800"
          }`}>
            <CircleAlert className="shrink-0 mt-0.5" size={18} />
            <div className="flex-1 text-sm">{notification.message}</div>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white shrink-0">
              <X size={16} />
            </button>
          </div>
        )}

        {/* ==================== SECTION 1: WALLET METRICS ==================== */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* Main Card Total Liquid Balance */}
          <div className="md:col-span-1 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 border border-slate-750 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[190px]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs uppercase tracking-widest text-slate-400 font-bold block mb-1">SALDO TERSEDIA</span>
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                    {hideBalance ? "••••••••" : formatRupiahAbbr(totalBalance)}
                  </h3>
                  <button onClick={() => setHideBalance(!hideBalance)} className="text-slate-400 hover:text-white">
                    {hideBalance ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                <Wallet size={20} />
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col gap-2.5 text-xs">
              <div>
                <p className="text-slate-400">Total Pemasukan</p>
                <p className="text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                  <TrendingUp size={12} /> {formatRupiah(totalIncome)}
                </p>
              </div>
              <div>
                <p className="text-slate-400">Total Pengeluaran</p>
                <p className="text-rose-400 font-bold flex items-center gap-1 mt-0.5">
                  <TrendingDown size={12} /> {formatRupiah(totalExpense)}
                </p>
              </div>
            </div>
          </div>

          {/* Sub accounts distribution breakdown cards */}
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* BCA Bank */}
            <div className="bg-slate-900/60 rounded-2xl p-5 border border-slate-800 shadow-md flex flex-col justify-between relative overflow-hidden h-full">
              <div>
                <div className="flex flex-col gap-1 mb-2">
                  <div>
                    <span className="inline-block text-[9px] font-bold tracking-wider px-2 py-0.5 bg-blue-600/20 text-blue-400 rounded-full border border-blue-500/30 shrink-0">M-BANKING</span>
                  </div>
                  <p className="text-xs text-slate-400 font-semibold leading-tight">Bank Central Asia (BCA)</p>
                </div>
                <h4 className="text-lg font-bold text-white tracking-tight">{hideBalance ? "••••••••" : formatRupiahAbbr(bcaBalance)}</h4>
              </div>
              <div className="flex flex-col gap-1 mt-4 pt-2.5 border-t border-slate-850 text-[11px] text-slate-450">
                <span className="text-slate-300">Acc ID: 2314-889-**</span>
                <span className="text-emerald-400 font-medium">Status: BCA Fast-Sync</span>
              </div>
            </div>

            {/* GoPay E-Wallet */}
            <div className="bg-slate-900/60 rounded-2xl p-5 border border-slate-800 shadow-md flex flex-col justify-between relative overflow-hidden h-full">
              <div>
                <div className="flex flex-col gap-1 mb-2">
                  <div>
                    <span className="inline-block text-[9px] font-bold tracking-wider px-2 py-0.5 bg-cyan-600/20 text-cyan-400 rounded-full border border-cyan-500/30 shrink-0">E-WALLET</span>
                  </div>
                  <p className="text-xs text-slate-400 font-semibold leading-tight">GoPay Digital</p>
                </div>
                <h4 className="text-lg font-bold text-white tracking-tight">{hideBalance ? "••••••••" : formatRupiahAbbr(gopayBalance)}</h4>
              </div>
              <div className="flex flex-col gap-1 mt-4 pt-2.5 border-t border-slate-850 text-[11px] text-slate-450">
                <span className="text-slate-300">0812-4521-****</span>
                <span className="text-cyan-400 font-medium">Status: Active Connected</span>
              </div>
            </div>

            {/* Cash on Hand */}
            <div className="bg-slate-900/60 rounded-2xl p-5 border border-slate-800 shadow-md flex flex-col justify-between relative overflow-hidden h-full font-sans">
              <div>
                <div className="flex flex-col gap-1 mb-2">
                  <div>
                    <span className="inline-block text-[9px] font-bold tracking-wider px-2 py-0.5 bg-amber-600/20 text-amber-400 rounded-full border border-amber-500/30 shrink-0">CASH</span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium leading-tight dark:text-slate-450">Dompet Tunai</p>
                </div>
                <h4 className="text-lg font-bold text-white tracking-tight">{hideBalance ? "••••••••" : formatRupiahAbbr(cashBalance)}</h4>
              </div>
              <div className="flex flex-col gap-1 mt-4 pt-2.5 border-t border-slate-850 text-[11px] text-slate-450">
                <span className="text-slate-300">Fisik Laci/Dompet</span>
                <span className="text-amber-500/90 font-medium">Status: Kurangi Tunai</span>
              </div>
            </div>

          </div>
        </section>

        {/* ==================== ACTION BAR: THE SMART INPUT PLATFORM BUTTONS ==================== */}
        <section className="bg-slate-900 rounded-2xl p-4 md:p-5 border border-slate-800 shadow-lg text-slate-100 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                <Sparkles size={17} className="text-indigo-400" />
                DoPi AI
              </h3>
              <p className="text-xs text-slate-400">Catat belanja mu sekarang!</p>
            </div>

            {/* Core Action Callouts */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                id="btn-trigger-ocr"
                onClick={() => setShowOcrModal(true)}
                className="flex-1 md:flex-initial bg-slate-800 hover:bg-slate-755 hover:bg-slate-700 text-teal-400 font-bold py-2.5 px-4 rounded-xl border border-teal-500/20 shadow-md flex items-center justify-center gap-2 transition"
              >
                <Camera size={20} />
                <span>Scan Struk</span>
              </button>

              <button
                id="btn-trigger-voice"
                onClick={() => setShowVoiceModal(true)}
                className="flex-1 md:flex-initial bg-slate-800 hover:bg-slate-755 hover:bg-slate-700 text-indigo-400 font-bold py-2.5 px-4 rounded-xl border border-indigo-500/20 shadow-md flex items-center justify-center gap-2 transition"
              >
                <Mic size={20} />
                <span>Perintah Suara</span>
              </button>

              <button
                id="btn-trigger-manual"
                onClick={() => setShowManualModal(true)}
                className={`flex-1 md:flex-initial ${themeColor.btn} font-bold py-2.5 px-5 rounded-xl shadow-md flex items-center justify-center gap-2 transition`}
              >
                <Plus size={20} />
                <span>Catat Manual</span>
              </button>
            </div>
          </div>
        </section>

        {/* ==================== CORE TRANSACTIONS MANAGER TABLE & FILTERS ==================== */}
        <section className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-1.5">
                <Layers size={20} className="text-emerald-400" />
                Daftar Catatan Transaksi {workspace}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Mutasi kas digital</p>
            </div>

            {/* Inbuilt filter actions bar */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setTxTypeFilter("all")}
                  className={`text-xs px-3 py-1.5 rounded-lg font-bold transition ${txTypeFilter === "all" ? "bg-slate-800 text-white" : "text-slate-400"}`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setTxTypeFilter("expense")}
                  className={`text-xs px-3 py-1.5 rounded-lg font-bold transition ${txTypeFilter === "expense" ? "bg-red-500/20 text-red-400" : "text-slate-400"}`}
                >
                  Expense
                </button>
                <button
                  onClick={() => setTxTypeFilter("income")}
                  className={`text-xs px-3 py-1.5 rounded-lg font-bold transition ${txTypeFilter === "income" ? "bg-emerald-500/20 text-emerald-400" : "text-slate-400"}`}
                >
                  Income
                </button>
              </div>

              <select
                value={selectedCategoryFilter}
                onChange={e => setSelectedCategoryFilter(e.target.value)}
                className="bg-slate-950 text-slate-300 border border-slate-800 rounded-xl text-xs px-3 py-2 focus:outline-none"
              >
                <option value="All">Semua Kategori</option>
                {activeCategoriesList.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Filtering Engine implementation */}
          {(() => {
            const filteredList = filteredTransactions.filter(t => {
              const matchesType = txTypeFilter === "all" ? true : t.type === txTypeFilter;
              const matchesCategory = selectedCategoryFilter === "All" ? true : t.category === selectedCategoryFilter;
              return matchesType && matchesCategory;
            });

            if (filteredList.length === 0) {
              return (
                <div className="py-16 text-center text-slate-450 text-sm italic">
                  Belum ada transaksi tercatat yang sesuai filter ini.
                </div>
              );
            }

            return (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-xs">
                      <th className="py-3 px-4 font-bold">INFO TRANSAKSI & HASIL PARSING</th>
                      <th className="py-3 px-4 font-bold">MUTASI DOMPET</th>
                      <th className="py-3 px-4 font-bold">METODE CATAT</th>
                      <th className="py-3 px-4 font-bold text-right">NOMINAL NOMINAL</th>
                      <th className="py-3 px-4 font-bold text-center">TINDAKAN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {filteredList.map(tx => {
                      const catConf = categoriesConfig[tx.category] || { icon: "HelpCircle", color: "text-slate-400 bg-slate-800 border-slate-700" };
                      
                      return (
                        <tr key={tx.id} className="hover:bg-slate-850/30 transition text-xs">
                          {/* Left Column: Category icon & detail text */}
                          <td className="py-4 px-4 flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold relative border ${catConf.color}`}>
                              <span className="text-base">
                                {tx.category === "Makan" ? "🍳" : 
                                 tx.category === "Transport" ? "🚗" : 
                                 tx.category === "Belanja" ? "🛍️" : 
                                 tx.category === "Tagihan" ? "⚡" : 
                                 tx.category === "Hiburan" ? "🎬" : 
                                 tx.category === "Kesehatan" ? "🩹" : 
                                 tx.category === "Pendidikan" ? "📚" : 
                                 tx.category === "Bisnis" ? "☕" : 
                                 tx.category === "Gaji" ? "💵" : "❓"}
                              </span>
                            </div>
                            <div>
                              <p className="font-extrabold text-white text-sm">{tx.note}</p>
                              <div className="flex items-center gap-2 text-slate-400 mt-0.5">
                                <span className="font-medium text-slate-300">{tx.category}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Clock size={11} /> {tx.date}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Center Column: Specific wallet utilized */}
                          <td className="py-4 px-4 font-bold text-slate-200">
                            <span className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-[11px]">
                              💰 {tx.wallet}
                            </span>
                          </td>

                          {/* Source dynamic badges */}
                          <td className="py-4 px-4 font-medium text-slate-400">
                            <span className={`inline-flex items-center gap-1 font-bold text-[9px] px-2 py-0.5 rounded-full border ${
                              tx.source === "ocr" ? "bg-teal-950/40 text-teal-400 border-teal-800/45" : 
                              tx.source === "voice" ? "bg-indigo-950/40 text-indigo-400 border-indigo-800/45" :
                              tx.source === "wa" ? "bg-green-950/40 text-green-400 border-green-800/45" :
                              "bg-slate-850 text-slate-400 border-slate-750"
                            }`}>
                              {tx.source === "ocr" && "📸 OCR Struk"}
                              {tx.source === "voice" && "🎤 Suara AI"}
                              {tx.source === "wa" && "💬 WA Sync"}
                              {tx.source === "manual" && "✍️ Manual"}
                            </span>
                          </td>

                          {/* Transaction Amount colorized */}
                          <td className="py-4 px-4 text-right">
                            <p className={`font-black tracking-tight text-sm ${tx.type === "income" ? "text-emerald-400 animate-fade-in" : "text-rose-400"}`}>
                              {tx.type === "income" ? "+" : "-"} {formatRupiah(tx.amount)}
                            </p>
                          </td>

                          {/* Right Action Trigger buttons */}
                          <td className="py-4 px-4 text-center">
                            <button
                              id={`delete-tx-${tx.id}`}
                              onClick={() => handleDeleteTransaction(tx.id)}
                              className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition block mx-auto"
                              title="Hapus Transaksi"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </section>

        {/* ==================== SECTION 2: CHARTS & CORE BUDGET METER ANALYTICS ==================== */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          
          {/* Recharts Analytics curve chart */}
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                  <TrendingUp size={20} className="text-emerald-400" />
                  Tren Finansial 7 Hari Terakhir
                </h3>
              </div>
              <span className="text-[10px] uppercase font-bold text-indigo-400 bg-indigo-550/20 px-2.5 py-1 rounded border border-indigo-500/25">7 DAYS</span>
            </div>

            <div className="h-64 mt-4 text-xs font-semibold">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748B" tickLine={false} />
                  <YAxis stroke="#64748B" tickLine={false} width={45} tickFormatter={(val) => Math.abs(val) > 1000000 ? `${(val/1000000).toFixed(1)}jt` : `${val/1000}rb`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#0F172A", borderColor: "#1E293B", borderRadius: "12px" }}
                    labelStyle={{ color: "#94A3B8" }}
                    formatter={(val: number) => [formatRupiah(val), ""]}
                  />
                  <Area type="monotone" dataKey="pemasukan" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorInc)" />
                  <Area type="monotone" dataKey="pengeluaran" stroke="#EF4444" strokeWidth={2.5} fillOpacity={1} fill="url(#colorExp)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Budget progress bars */}
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                  <Zap size={20} className="text-amber-400" />
                  Batas Anggaran Kategori (Budgets)
                </h3>
              </div>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-1 rounded">Bulanan</span>
            </div>

            <div className="space-y-4">
              {activeBudgets.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  Belum ada batas anggaran diatur untuk tipe workspace ini.
                </div>
              ) : (
                activeBudgets.map(b => {
                  const percent = b.monthlyLimit > 0 ? (b.spent / b.monthlyLimit) * 100 : 0;
                  const isHigh = percent >= 80 && percent < 100;
                  const isExceeded = percent >= 100;
                  
                  let barColor = "bg-emerald-500";
                  let textColor = "text-emerald-400";
                  if (isHigh) {
                    barColor = "bg-amber-500";
                    textColor = "text-amber-400";
                  } else if (isExceeded) {
                    barColor = "bg-red-500 animate-pulse";
                    textColor = "text-red-400";
                  }

                  const categoryConf = categoriesConfig[b.category] || { icon: "HelpCircle" };

                  return (
                    <div key={b.id} className="p-3 bg-slate-950/40 rounded-xl border border-slate-800">
                      <div className="flex justify-between items-center text-xs mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{b.category}</span>
                          {isExceeded && <span className="text-[9px] bg-red-950 text-red-400 font-extrabold px-1.5 py-0.5 rounded border border-red-800">OVER-BUDGET</span>}
                          {isHigh && <span className="text-[9px] bg-amber-950 text-amber-500 font-bold px-1.5 py-0.5 rounded border border-amber-900">LIMIT AWAS</span>}
                        </div>
                        <span className="text-slate-400">
                          {formatRupiah(b.spent)} / <strong className="text-slate-200">{formatRupiah(b.monthlyLimit)}</strong>
                        </span>
                      </div>
                      
                      <div className="w-full bg-slate-850 rounded-full h-2 overflow-hidden border border-slate-800/50">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                          style={{ width: `${Math.min(100, percent)}%` }}
                        ></div>
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1">
                        <span>Pemakaian: {percent.toFixed(0)}%</span>
                        <span>Sisa anggaran: <strong className={textColor}>{formatRupiah(Math.max(0, b.monthlyLimit - b.spent))}</strong></span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </section>

        {/* ==================== SECTION 3: WORKSPACE WORK CONTEXTS: SAVINGS GOAL & UMKM PAYABLES/RECEIVABLES ==================== */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          
          {/* Target Savings Goals View */}
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
            <h3 className="text-base font-bold text-white flex items-center gap-1.5 mb-1">
              <Award size={20} className="text-yellow-400" />
              Target & Rencana Impian (Tabungan)
            </h3>
            <p className="text-xs text-slate-400 mb-4">Investasi cerdas untuk masa depan</p>

            <div className="space-y-4">
              {activeGoals.map(g => {
                const pct = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0;
                return (
                  <div key={g.id} className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl flex flex-col gap-3">
                    {/* Bottom Row: Icon, Title & "+ Tabung" button positioned before details */}
                    <div className="flex justify-between items-center gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-lg shadow-md shrink-0">
                          {g.icon === "Smartphone" && "📱"}
                          {g.icon === "Bike" && "🛵"}
                          {g.icon === "Palmtree" && "🌴"}
                          {g.icon === "Coffee" && "☕"}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white leading-tight">{g.name}</h4>
                          <span className="text-[10px] text-slate-400">Tempo: <strong className="text-slate-300">{g.deadline}</strong></span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAddGoalSavingsAmount(g.id)}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-1.5 px-3.5 rounded-lg text-xs transition shrink-0 active:scale-95 shadow-md"
                      >
                        + Tabung
                      </button>
                    </div>

                    {/* Progress tracking details below */}
                    <div className="pt-2 border-t border-slate-850/60">
                      <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                        <span>Target: <strong className="text-slate-200">{formatRupiah(g.targetAmount)}</strong></span>
                        <span>{pct.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-slate-850 rounded-full h-2 overflow-hidden border border-slate-800/80">
                        <div
                          className="bg-amber-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, pct)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                        <span>Terkumpul</span>
                        <span className="font-bold text-slate-200">{formatRupiah(g.currentAmount)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* UMKM Merchant business cashflow debts section (Visible always, highly details under Toko Kopi Budi) */}
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                <Briefcase size={20} className="text-cyan-400" />
                Daftar Hutang / Piutang Usaha
              </h3>
              <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800 font-bold px-2 py-0.5 rounded-full">UMKM Space</span>
            </div>
            <p className="text-xs text-slate-400 mb-4">Pencatatan kas bisnis</p>

            {/* Quick Add Form Mini */}
            <form onSubmit={handleAddBusinessItem} className="flex flex-col gap-2 mb-4 p-3 bg-slate-950/50 rounded-xl border border-slate-800">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <select
                    value={newBusinessItem.type}
                    onChange={e => setNewBusinessItem(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg text-xs p-2 text-slate-300 focus:outline-none"
                  >
                    <option value="piutang">Piutang</option>
                    <option value="hutang">Hutang</option>
                  </select>
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Nama Kontak"
                    required
                    value={newBusinessItem.counterParty}
                    onChange={e => setNewBusinessItem(prev => ({ ...prev, counterParty: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg text-xs p-2 text-slate-300 focus:outline-none placeholder-slate-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <input
                    type="number"
                    placeholder="Nominal (Rp)"
                    required
                    value={newBusinessItem.amount}
                    onChange={e => setNewBusinessItem(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg text-xs p-2 text-slate-300 focus:outline-none"
                  />
                </div>
                <div className="col-span-2 flex gap-1.5">
                  <input
                    type="text"
                    placeholder="Keterangan singkat"
                    value={newBusinessItem.notes}
                    onChange={e => setNewBusinessItem(prev => ({ ...prev, notes: e.target.value }))}
                    className="flex-1 min-w-[50px] bg-slate-900 border border-slate-700 rounded-lg text-xs p-2 text-slate-300 focus:outline-none placeholder-slate-500"
                  />
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-2 rounded-lg text-xs active:scale-95 transition shrink-0 whitespace-nowrap shadow-sm"
                  >
                    + Tambah
                  </button>
                </div>
              </div>
            </form>

            <div className="space-y-2 max-h-[350px] overflow-y-auto">
              {businessItems.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-850">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${item.type === "piutang" ? "bg-amber-400" : "bg-red-400"}`}></span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">{item.counterParty}</h4>
                      <p className="text-[10px] text-slate-400">{item.notes} • Tempo: {item.dueDate || "Segera"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className={`text-xs font-bold ${item.type === "piutang" ? "text-amber-400" : "text-red-400"}`}>
                        {item.type === "piutang" ? "+" : "-"} {formatRupiah(item.amount)}
                      </p>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${item.isPaid ? "bg-emerald-900 text-emerald-400" : "bg-rose-950 text-rose-400"}`}>
                        {item.isPaid ? "LUNAS" : "BELUM LUNAS"}
                      </span>
                    </div>

                    <button
                      onClick={() => handleToggleBusinessPaid(item.id)}
                      className="bg-slate-800 hover:bg-slate-700 p-1 rounded-lg border border-slate-700 text-slate-300 transition"
                      title="Ubah Status Bayar"
                    >
                      <Check size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </section>

      </main>

      {/* ==================== RIGHT COLUMN: AI PERSONAL ASSISTANT CHAT PANELS ==================== */}
      <aside className="w-full md:w-96 bg-slate-900 border-t md:border-t-0 md:border-l border-slate-800 p-6 flex flex-col justify-between shrink-0 h-[600px] md:h-screen sticky top-0 md:sticky">
        
        {/* Assistant Headers */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-emerald-400 flex items-center justify-center text-white text-lg font-bold animate-pulse shadow-md">
                🤖
              </div>
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                  DoPi Assistant
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                </h3>
                <p className="text-[10px] text-slate-400">Workspace: <strong className="text-indigo-400">{workspace}</strong></p>
              </div>
            </div>
            
            <span className="text-[9px] font-bold text-slate-400 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded">
              Gemini AI Active
            </span>
          </div>

          {/* Quick chips suggested queries to click */}
          <div className="mb-3 shrink-0">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1 px-1">Tanyakan Sesuatu:</p>
            <div className="flex flex-wrap gap-1">
              {[
                { label: "💡 Beri Tips Hemat", action: "Beri tips menghemat anggaran jajan di BCA" },
                { label: "📊 Analisis Budgetku", action: "Analisa anggaran belanja di workspace ini dong Dopi" },
                { label: "🌱 Tempat Investasi", action: "Di mana rekomendasi investasi reksadana aman?" },
                { label: "📈 Untung UMKM", action: "Berapa total piutang yang belum lunas di bisnis?" }
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleTriggerQuickSuggest(chip.action)}
                  className="text-[10px] bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg py-1 px-2.5 transition active:scale-95 text-left"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Messages Log Scrollable Workspace */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4" id="chat-scroller">
            {chatMessages.map((msg) => {
              const isMine = msg.role === "user";
              return (
                <div key={msg.id} className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                  <div className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed shadow-md ${
                    isMine 
                      ? "bg-indigo-600 text-white rounded-tr-none" 
                      : "bg-slate-950 border border-slate-850 text-slate-200 rounded-tl-none"
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.parts?.[0]?.text}</p>
                    
                    {/* Small dynamic label for Gemini sources info */}
                    {!isMine && msg.source && (
                      <span className="text-[8px] tracking-wider uppercase opacity-60 text-indigo-400 block mt-1 text-right font-medium">
                        source: {msg.source === "gemini_api" ? "Google Gemini Pro" : "Offline Rule Engine"}
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-500 mt-1 px-1">{msg.timestamp}</span>
                </div>
              );
            })}
            
            {/* Loading typing indicator */}
            {isChatLoading && (
              <div className="flex items-center gap-2 text-slate-450 text-xs px-2 italic text-slate-400">
                <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce delay-100"></span>
                <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce delay-200 text-white"></span>
                <span>Dopi sedang berpikir cerdas...</span>
              </div>
            )}
          </div>
        </div>

        {/* Form bottom inputs */}
        <div className="shrink-0 mt-2">
          <div className="relative">
            <textarea
              id="chat-input"
              rows={2}
              placeholder="Tanya tips hemat, investasi, reksadana Bibit..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendChatMessage();
                }
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 pr-10 text-xs text-slate-100 placeholder-slate-500 resize-none focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
            />
            <button
              id="send-chat-btn"
              onClick={handleSendChatMessage}
              disabled={isChatLoading || !chatInput.trim()}
              className="absolute right-2.5 bottom-3 text-indigo-400 hover:text-indigo-300 disabled:opacity-40 transition"
            >
              <Send size={16} />
            </button>
          </div>
          <p className="text-[10px] text-slate-500 text-center mt-1">
            Tekan Enter untuk kirim. Jawaban instan bertenaga AI.
          </p>
        </div>

      </aside>

      {/* ==================== MODAL 1: SIMULATED OCR RECEIPT SCREENSHOT SCANNER ==================== */}
      {showOcrModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl p-6 shadow-2xl relative overflow-hidden">
            <button onClick={() => setShowOcrModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-teal-950 text-teal-400 border border-teal-800/40 flex items-center justify-center text-lg font-bold">
                📸
              </div>
              <div>
                <h3 className="text-base font-black text-white">Simulator OCR Scan Struk & screenshot M-banking</h3>
                <p className="text-xs text-slate-400">Pilih salah satu sample struk Indonesia di bawah untuk simulasi scan otomatis</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              {ocrSampleReceipts.map(sample => (
                <button
                  key={sample.id}
                  onClick={() => handleSimulateOcrChoose(sample.id)}
                  className={`p-3 rounded-xl border text-left transition ${
                    ocrSelectedSample === sample.id 
                      ? "bg-slate-810 bg-slate-800 border-teal-500 text-white" 
                      : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <span className="text-xl block mb-1">{sample.imgUrl}</span>
                  <p className="text-[11px] font-bold line-clamp-1">{sample.name}</p>
                  <p className="text-[9px] text-slate-500">Mata uang IDR</p>
                </button>
              ))}
            </div>

            {/* Simulated Scanner Line animation if loading */}
            {ocrLoading && (
              <div className="p-12 text-center bg-slate-950 rounded-2xl border border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-indigo-500 animate-scanner-beam"></div>
                <div className="w-8 h-8 rounded-full border-4 border-slate-700 border-t-teal-400 animate-spin mx-auto mb-3"></div>
                <h4 className="text-xs font-bold text-slate-200">Dopi sedang membaca strukmu secara cermat...</h4>
                <p className="text-[10px] text-slate-500 mt-1">Mengonversi data struk menjadi JSON Transaksi berkelas</p>
              </div>
            )}

            {/* OCR Parse preview outcome bottom sheet */}
            {!ocrLoading && ocrPreviewResult && (
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between pb-2 border-b border-slate-850 mb-3 text-xs">
                  <span className="font-semibold text-teal-401 text-teal-400 uppercase tracking-wider block">DETEKSI BERHASIL</span>
                  <span className="text-slate-500 text-[10px]">99.8% Tingkat Akurasi</span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs mb-3">
                  <div>
                    <span className="block text-[10px] text-slate-500">MENGHASILKAN NOMINAL</span>
                    <strong className="text-white text-base font-black text-teal-400">{formatRupiah(ocrPreviewResult.parsed.amount)}</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500">KATEGORI TERDETEKSI</span>
                    <strong className="text-slate-200 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[11px] inline-block mt-0.5">
                      {ocrPreviewResult.parsed.category}
                    </strong>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-[10px] text-slate-500">RINGKASAN CATATAN</span>
                    <strong className="text-slate-350 font-normal italic">"{ocrPreviewResult.parsed.note}"</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500">DOMPET TUJUAN</span>
                    <strong className="text-slate-250 italic">💰 {ocrPreviewResult.parsed.wallet}</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500">METODE PEMBACAAN</span>
                    <strong className="text-slate-250 font-semibold text-teal-400 uppercase text-[9px]">Google ML Kit OCR</strong>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleSaveOcrResult}
                    className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-extrabold py-2 px-3 rounded-lg text-xs transition shadow active:scale-95"
                  >
                    Post & Posting Transaksi ke {workspace}
                  </button>
                  <button
                    onClick={() => {
                      setOcrSelectedSample(null);
                      setOcrPreviewResult(null);
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 rounded-lg text-xs transition"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}

            {!ocrSelectedSample && !ocrLoading && (
              <div className="py-12 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl bg-slate-950 p-4">
                <Upload size={32} className="mx-auto mb-2 text-slate-600" />
                <p className="font-bold text-slate-450 text-slate-400">Silakan pilih/klik salah satu contoh struk Indonesia di atas untuk melihat keajaiban OCR.</p>
                <p className="text-[10px] text-slate-500 mt-1">Pada perangkat real, tombol ini membuka kamera handphone atau mengunggah gambar dari galeri.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== MODAL 2: SIMULATED VOICE RECOGNITION ==================== */}
      {showVoiceModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <button onClick={() => setShowVoiceModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-950 text-indigo-400 border border-indigo-800/40 flex items-center justify-center text-lg font-bold">
                🎤
              </div>
              <div>
                <h3 className="text-base font-black text-white">Asisten Suara Dompet Pintar</h3>
                <p className="text-xs text-slate-400">Tekan tombol bicara untuk menguji parsing suara cerdas</p>
              </div>
            </div>

            {/* Waveform Micro animators */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 mb-4 text-center">
              {isRecording ? (
                <div className="py-6">
                  <div className="flex items-center justify-center gap-1.5 mb-3 h-10">
                    <span className="w-1 h-3 bg-indigo-505 bg-indigo-500 rounded animate-voice-wave-1"></span>
                    <span className="w-1 h-7 bg-indigo-550 bg-indigo-400 rounded animate-voice-wave-2"></span>
                    <span className="w-1 h-10 bg-indigo-505 bg-indigo-300 rounded animate-voice-wave-3"></span>
                    <span className="w-1 h-4 bg-indigo-550 bg-indigo-400 rounded animate-voice-wave-4"></span>
                    <span className="w-1 h-1 bg-indigo-505 bg-indigo-500 rounded animate-voice-wave-1"></span>
                  </div>
                  <p className="text-xs text-indigo-400 font-bold tracking-wide animate-pulse">Dopi sedang menyimak suara kamu...</p>
                </div>
              ) : (
                <div className="py-5">
                  <button
                    onClick={handleStartSimulatedMicrophone}
                    className="w-14 h-14 rounded-full bg-indigo-650 hover:bg-indigo-700 bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/20 active:scale-95 transition"
                  >
                    <Mic size={24} />
                  </button>
                  <p className="text-xs text-slate-400 mt-2">Ketuk untuk mulai merekam suara</p>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-slate-850">
                <p className="text-[10px] text-slate-500 block mb-1.5 uppercase font-bold text-left">TEMPLATE PILIH CEPAT:</p>
                <div className="flex flex-col gap-1 text-left">
                  {speechSamples.map((samp, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setVoiceInputText(samp);
                        handleSimulateVoiceParse(samp);
                      }}
                      className="text-[11px] text-indigo-350 bg-slate-900 hover:bg-slate-850 p-2 rounded-lg text-slate-400 border border-slate-850 transition flex items-center justify-between"
                    >
                      <span className="truncate">"{samp}"</span>
                      <Volume2 size={12} className="shrink-0 text-slate-500 ml-1" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Results parsing preview */}
            {voiceLoading && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center animate-pulse text-xs text-slate-400">
                Menghubungi NLP Parser Model...
              </div>
            )}

            {!voiceLoading && voicePreviewResult && (
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">HASIL PARSE KALIMAT:</p>
                
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-[11px] font-mono text-indigo-400 mb-3">
                  "{voiceInputText}"
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                  <div>
                    <span className="text-[10px] text-slate-500">Nominal:</span>
                    <strong className="block text-white text-sm">{formatRupiah(voicePreviewResult.amount)}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">Type:</span>
                    <strong className="block text-white uppercase text-xs">{voicePreviewResult.type}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">Kategori:</span>
                    <strong className="block text-white text-xs">{voicePreviewResult.category}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">Sumber Dompet:</span>
                    <strong className="block text-indigo-400 text-xs">💰 {voicePreviewResult.wallet}</strong>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-500">Catatan:</span>
                    <strong className="block text-slate-350 italic font-mono text-slate-300">"{voicePreviewResult.note}"</strong>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleSaveVoiceResult}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-3 rounded-lg text-xs active:scale-95 transition"
                  >
                    Ya, Simpan Transaksi ini
                  </button>
                  <button
                    onClick={() => {
                      setVoicePreviewResult(null);
                      setVoiceInputText("");
                    }}
                    className="bg-slate-800 text-slate-400 px-3 rounded-lg text-xs transition"
                  >
                    Ulangi
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== MODAL 3: MANUAL TRANSACTION INPUT FORM ==================== */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <button onClick={() => setShowManualModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X size={20} />
            </button>

            <h3 className="text-base font-black text-white mb-4 flex items-center gap-2">
              <PlusCircle className="text-emerald-400" />
              Catat Pengeluaran/Pemasukan Baru
            </h3>

            <form onSubmit={handleSaveManual} className="space-y-4">
              
              {/* Type Switcher Selector tab */}
              <div>
                <span className="block text-xs text-slate-400 mb-1.5">Tipe Transaksi</span>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-lg border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setManualForm(prev => ({ ...prev, type: "expense" }))}
                    className={`text-xs py-2 rounded-md font-bold transition ${
                      manualForm.type === "expense" ? "bg-red-500/20 text-red-400 shadow-sm" : "text-slate-400"
                    }`}
                  >
                    Pengeluaran (Expense)
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualForm(prev => ({ ...prev, type: "income" }))}
                    className={`text-xs py-2 rounded-md font-bold transition ${
                      manualForm.type === "income" ? "bg-emerald-500/20 text-emerald-400 shadow-sm" : "text-slate-400"
                    }`}
                  >
                    Pemasukan (Income)
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Nominal Uang (Rp)</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 50.000"
                  value={manualForm.amount}
                  onChange={e => {
                    const cleanNum = e.target.value.replace(/\D/g, "");
                    setManualForm(prev => ({ ...prev, amount: cleanNum ? parseInt(cleanNum, 10).toLocaleString("id-ID") : "" }));
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 px-3 text-sm text-slate-100 focus:outline-none focus:border-emerald-600"
                />
              </div>

              {/* Category dropdown mapped to utils list */}
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Pilih Kategori Pos Keuangan</label>
                <select
                  value={manualForm.category}
                  onChange={e => setManualForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 px-3 text-xs text-slate-300 focus:outline-none focus:border-emerald-600"
                >
                  {activeCategoriesList.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Wallet Select Option */}
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Gunakan Sumber Kas/Dompet</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["Cash", "BCA", "GoPay"] as const).map(w => (
                    <button
                      type="button"
                      key={w}
                      onClick={() => setManualForm(prev => ({ ...prev, wallet: w }))}
                      className={`text-xs p-2.5 rounded-xl border text-center font-bold transition ${
                        manualForm.wallet === w 
                          ? "bg-slate-800 border-slate-600 text-white" 
                          : "bg-slate-950 border-slate-850 text-slate-450 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      💰 {w}
                    </button>
                  ))}
                </div>
              </div>

              {/* Short Note and Date */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs text-slate-400 mb-1.5">Catatan singkat</label>
                  <input
                    type="text"
                    placeholder="Contoh: Soto porsi jumbo"
                    value={manualForm.note}
                    onChange={e => setManualForm(prev => ({ ...prev, note: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs text-slate-400 mb-1.5">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={manualForm.date}
                    onChange={e => setManualForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons inside modal */}
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className={`flex-1 ${themeColor.btn} font-bold py-2.5 px-3 rounded-xl text-xs transition active:scale-95`}
                >
                  Simpan Transaksi
                </button>
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="bg-slate-800 text-slate-350 bg-slate-850 hover:bg-slate-800 text-slate-300 px-4 rounded-xl text-xs transition"
                >
                  Batal
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ==================== ADVERTISING REPLAY REWARD DIALOG ==================== */}
      {showAdModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl w-full max-w-sm p-6 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-xl"></div>
            
            <div className="w-16 h-16 rounded-2xl bg-indigo-950 text-indigo-400 border border-indigo-805 border-indigo-800 flex items-center justify-center text-3xl mx-auto mb-4 animate-bounce">
              🎬
            </div>

            <h3 className="text-lg font-black text-white mb-2">Dopi Rewarded Ads Sponsor</h3>
            <p className="text-xs text-slate-450 text-slate-400 mb-4 px-2">
              Tonton video sponsor startup fintech Indonesia Jago/Bibit selama 5 detik untuk mendapatkan <strong className="text-amber-400">+50 Dopi Points</strong> secara instan!
            </p>

            {isAdPlaying ? (
              <div className="my-6 p-4 bg-slate-950 rounded-2xl border border-slate-800">
                <div className="w-10 h-10 rounded-full border-4 border-slate-800 border-t-indigo-500 animate-spin mx-auto mb-3"></div>
                <p className="text-xs text-indigo-400 font-bold">Iklan sedang diputar: sisa {adCountdown} detik</p>
                <p className="text-[10px] text-slate-500 mt-2">"Investasi berkala Reksa Dana di Bibit - Mulai dari Rp10.000!"</p>
              </div>
            ) : (
              <div className="my-6 p-5 bg-emerald-950/40 rounded-2xl border border-emerald-800/50">
                <span className="text-3xl block mb-2">🎁</span>
                <p className="text-xs font-bold text-emerald-400 mb-0.5">Penayangan Iklan Selesai!</p>
                <p className="text-[10px] text-slate-400 mb-3">Koin XP & Kesejahteraan Dopi siap diklaim.</p>
                
                <button
                  onClick={handleClaimAdReward}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2 px-5 rounded-xl text-xs shadow-md transition active:scale-95"
                >
                  Klaim +50 Dopi XP Now!
                </button>
              </div>
            )}

            {isAdPlaying && (
              <button
                disabled
                className="w-full bg-slate-800 text-slate-500 font-bold py-2.5 rounded-xl text-xs cursor-not-allowed"
              >
                Tunggu iklan selesai...
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
