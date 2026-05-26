import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Initialize express app
const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy initialization of Gemini client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    // Return null to allow fallback mode if API key is not configured yet
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Fallback parsing algorithm in case API key is missing
function fallbackParse(text: string) {
  const lowercase = text.toLowerCase();
  let amount = 0;
  let type: "expense" | "income" = "expense";
  let category = "Lainnya";
  let note = text;
  let wallet = "Cash";

  // Match numbers like 50000, 50k, 50rb, 50 ribu
  const kMatch = lowercase.match(/(\d+)\s*(rb|k|ribu)/);
  if (kMatch) {
    amount = parseInt(kMatch[1], 10) * 1000;
  } else {
    const numMatch = lowercase.match(/(\d[\d\.,]*)/);
    if (numMatch) {
      const sanitizedNum = numMatch[1].replace(/[\.,]/g, "");
      amount = parseInt(sanitizedNum, 10) || 0;
    }
  }

  // Detect Wallet
  if (lowercase.includes("bca") || lowercase.includes("bank") || lowercase.includes("m-banking")) {
    wallet = "BCA";
  } else if (lowercase.includes("gopay") || lowercase.includes("gojek") || lowercase.includes("ovo") || lowercase.includes("e-wallet")) {
    wallet = "GoPay";
  }

  // Detect Type
  if (lowercase.includes("gaji") || lowercase.includes("transfer masuk") || lowercase.includes("terima") || lowercase.includes("pemasukan") || lowercase.includes("dibayar")) {
    type = "income";
    category = "Gaji";
  }

  // Detect Category
  if (type === "expense") {
    if (lowercase.includes("makan") || lowercase.includes("boba") || lowercase.includes("kopi") || lowercase.includes("soto") || lowercase.includes("bakso") || lowercase.includes("warteg") || lowercase.includes("cemilan") || lowercase.includes("sbux")) {
      category = "Makan";
    } else if (lowercase.includes("ojek") || lowercase.includes("gocar") || lowercase.includes("gojek") || lowercase.includes("bensin") || lowercase.includes("mrt") || lowercase.includes("bus") || lowercase.includes("transport") || lowercase.includes("grab")) {
      category = "Transport";
    } else if (lowercase.includes("belanja") || lowercase.includes("tokopedia") || lowercase.includes("shopee") || lowercase.includes("baju") || lowercase.includes("indomaret") || lowercase.includes("alfamart")) {
      category = "Belanja";
    } else if (lowercase.includes("pln") || lowercase.includes("listrik") || lowercase.includes("wifi") || lowercase.includes("tagihan") || lowercase.includes("pulsa") || lowercase.includes("air")) {
      category = "Tagihan";
    } else if (lowercase.includes("nonton") || lowercase.includes("bioskop") || lowercase.includes("netflix") || lowercase.includes("game") || lowercase.includes("hiburan")) {
      category = "Hiburan";
    } else if (lowercase.includes("obat") || lowercase.includes("dokter") || lowercase.includes("sakit") || lowercase.includes("klinik") || lowercase.includes("kesehatan")) {
      category = "Kesehatan";
    } else if (lowercase.includes("buku") || lowercase.includes("kursus") || lowercase.includes("sekolah") || lowercase.includes("pendidikan")) {
      category = "Pendidikan";
    } else if (lowercase.includes("bisnis") || lowercase.includes("toko") || lowercase.includes("modal") || lowercase.includes("bahan")) {
      category = "Bisnis";
    }
  }

  // Clean note
  note = text
    .replace(/(beli|bayar|untuk|pakai|bca|gopay|cash)/gi, "")
    .replace(/\d+\s*(rb|k|ribu)/gi, "")
    .replace(/\d+/g, "")
    .trim();
  if (!note) {
    note = text;
  }
  // Capitalize first letter
  note = note.charAt(0).toUpperCase() + note.slice(1);

  return { amount, type, category, note: note.substring(0, 48), wallet };
}

// 1. API: Parse unstructured text to financial transaction JSON
app.post("/api/parse-input", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== "string") {
      res.status(400).json({ error: "Text is required" });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      // Fallback mode if API Key is not yet configured
      const parsed = fallbackParse(text);
      res.json({
        ...parsed,
        source: "fallback_rules",
        message: "Parsed utilizing offline backup parsing engine (Gemini API key is not configured/empty in Settings Secrets)."
      });
      return;
    }

    const categoriesList = ["Makan", "Transport", "Belanja", "Tagihan", "Hiburan", "Kesehatan", "Pendidikan", "Bisnis", "Gaji", "Lainnya"];
    const walletsList = ["Cash", "BCA", "GoPay"];

    const prompt = `Anda adalah AI parser keuangan khusus Indonesia milik app 'Dompet Pintarku' (Dopi). Ekstrak teks berikut ke dalam objek JSON transaksi yang valid.
    
    Teks input pengguna: "${text}"

    Kategori yang tersedia: ${JSON.stringify(categoriesList)}
    Dompet yang tersedia: ${JSON.stringify(walletsList)}

    Aturan Pengisian:
    - "amount": Nilai nominal (integer). Abaikan kata rupiah, Rp, rb, k, ribu, juta. Kalikan seperlunya (e.g. 15rb menjadi 15000, 2jt menjadi 2000000). Jika tidak terdeteksi, berikan nominal 0.
    - "type": Harus berupa salah satu string: "expense" atau "income". Gaji, pemasukan, komisi, transfer masuk adalah "income". Belanja, bayar, beli adalah "expense".
    - "category": Harus berupa salah satu dari daftar Kategori yang tersedia. Pilih kategori yg paling relevan sesuai konteks (e.g. bakso -> Makan, bensin -> Transport, wifi -> Tagihan).
    - "note": Ringkasan pendek yang bersih mengenai item/tujuan transaksi, hilangkan nominal dan nama dompet dari teks itu.
    - "wallet": Harus berupa salah satu dari daftar Dompet yang tersedia. Jika terdeteksi BCA/M-Banking, gunakan "BCA". Jika terdeteksi GoPay/Gojek/e-wallet, gunakan "GoPay". Lainnya atau default gunakan "Cash".

    Kembalikan hasil dalam skema format JSON murni.`;

    const cleanModel = "gemini-3.5-flash";
    const result = await ai.models.generateContent({
      model: cleanModel,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.INTEGER, description: "Transaction cash value amount" },
            type: { type: Type.STRING, description: "Type of transaction, strictly 'expense' or 'income'" },
            category: { type: Type.STRING, description: "Chosen categories from physical options listed" },
            note: { type: Type.STRING, description: "Concise summary note" },
            wallet: { type: Type.STRING, description: "Standard wallet source name" }
          },
          required: ["amount", "type", "category", "note", "wallet"]
        }
      }
    });

    if (result.text) {
      const parsedJSON = JSON.parse(result.text.trim());
      res.json({
        ...parsedJSON,
        source: "gemini_api",
        message: "Successfully parsed using Google Gemini AI."
      });
    } else {
      throw new Error("No text content returned from Gemini model");
    }
  } catch (err: any) {
    console.error("Gemini API Parse Input Error:", err);
    // Safe fallbacks on failure
    const parsed = fallbackParse(req.body.text || "");
    res.json({
      ...parsed,
      source: "fallback_on_error",
      message: "An error occurred with Gemini API parsing, fell back to local offline rules parsing."
    });
  }
});

// 2. API: Financial Chat Assistant 'Dopi' with conversational memory
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, workspace, financialSummary } = req.body;
    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: "Messages array is required" });
      return;
    }

    const ai = getGeminiClient();
    
    // Format system instruction reflecting Indonesian youngster jargon as specified
    const systemInstruction = `Nama kamu adalah 'Dopi' (singkatan dari Dompet Pintar), asisten keuangan kecerdasan buatan (AI) pribadi super-app keuangan yang asyik, gaul tapi sopan, cerdas, dan hangat ala anak muda Jakarta (gunakan kata 'kamu', 'aku', 'sih', 'kok', 'lho', 'ya', tapi jangan alay atau lebay). 
    
    Konteks Workspace Aktif saat ini: "${workspace || "Personal"}".
    Jika dalam Workspace "Keluarga Budi": Fokus pada pengelolaan budget bersama keluarga, tips hemat rumah tangga, dan target tabungan masa depan keluarga.
    Jika dalam Workspace "Toko Kopi Budi": Fokus pada pencatatan kas bisnis UMKM, piutang, modal, analisis untung rugi warung, dan operasional bisnis.
    Jika dalam Workspace "Personal": Fokus pada penghematan harian, investasi pribadi, dan kebiasaan gaya hidup keuangan personal.

    Data Rangkuman Ringkas Keuangan User saat ini:
    ${financialSummary || "Pemasukan bulan ini: Rp 0, Pengeluaran bulan ini: Rp 0, Saldo total: Rp 0."}

    Tugasmu:
    1. Jawab pertanyaan user seputar tips menabung, anggaran (budgeting), investasi, atau kesehatan keuangan mereka berdasarkan data di atas secara bijak dan ramah.
    2. Berikan kritik jika pengeluaran mereka overbudget atau tidak logis, namun berikan pujian luar biasa jika mereka berhasil merencanakan keuangan secara tertib dan hemat.
    3. Hubungkan saran keuangan dengan startup fintech Indonesia modern (seperti Bibit untuk Reksadana/PASAR UANG, Stockbit untuk saham, atau Bank Jago/BCA untuk tabungan terpisah) tanpa memaksa pelanggan tetapi memberikan saran yang praktis.
    4. Selalu batasi agar jawaban kamu ringkas, bermutu tinggi, dan langsung ke poin penting (maksimal 2-3 paragraf pendek terstruktur) agar mudah dibaca di layar chat handphone.`;

    if (!ai) {
      // Offline fallback simulations if API key isn't provided (very detailed and immersive)
      const lastUserMsg = messages[messages.length - 1]?.parts?.[0]?.text || "halo";
      const lowercaseMsg = lastUserMsg.toLowerCase();
      let reply = "Halo juga! Aku Dopi di sini. Saat ini Gemini API Key belum dikonfigurasi di menu Settings, tapi aku tetap bisa menyemangatimu lho. ";
      
      if (workspace === "Keluarga Budi") {
        reply += "Sebagai asisten Keluarga Budi, aku sarankan kita selalu mengalokasikan minimal 20% pemasukan ke pos Dana Darurat bersama. Biar kalau ada keperluan mendadak rumah tangga, keluarga tetap tenang! Ada yang bisa kubantu seputar pos belanja hari ini?";
      } else if (workspace === "Toko Kopi Budi") {
        reply += "Untuk bisnis kedai kopi kamu, ayo catat modal biji kopi dan susu dengan teliti ya. Disiplin pisahkan rekening pribadi dan kas warung Kopi Budi adalah kunci sukses UMKM naik kelas! Mau hitung laba bersih?";
      } else {
        if (lowercaseMsg.includes("hemat") || lowercaseMsg.includes("tips")) {
          reply += "Tips hemat terbaik versi aku tuh pakai metode pos 50/30/20 (Kebutuhan/Keinginan/Tabungan) di bank digital kamu. Cobain deh pisah tabungan di Kantong Jago/BCA biar gak gampang khilaf jajan!";
        } else if (lowercaseMsg.includes("investasi") || lowercaseMsg.includes("saham") || lowercaseMsg.includes("reksa")) {
          reply += "Untuk pemula, menaruh dana nganggur di Reksadana Pasar Uang lewat platform Bibit rekomended banget kok. Risikonya relatif rendah dan imbal hasilnya lumayan dibanding tabungan biasa!";
        } else {
          reply += "Ayo buat anggaran bulanan kamu dan hubungkan ke dompet digital BCA/GoPay biar pengeluaran termonitor. Ada rencana keuangan apa nih hari ini?";
        }
      }

      res.json({
        text: reply,
        source: "fallback_simulation"
      });
      return;
    }

    // Convert client messages to Gemini content format. Use gemini-3.5-flash
    const cleanModel = "gemini-3.5-flash";
    
    // We map content history correctly for gemini model contents format
    const geminiContents = messages.map((m: any) => ({
      role: m.role === "model" || m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.parts?.[0]?.text || "" }]
    }));

    const result = await ai.models.generateContent({
      model: cleanModel,
      contents: geminiContents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7
      }
    });

    res.json({
      text: result.text || "Maaf ya, aku sedang kebingungan membaca data keuanganmu. Boleh tanyakan sekali lagi?",
      source: "gemini_api"
    });

  } catch (err: any) {
    console.error("Gemini API Chat Error:", err);
    res.status(500).json({ error: "Terjadi kesalahan internal pada asisten pintar Dopi: " + err.message });
  }
});

// Start integration with Vite standard middleware
async function startServer() {
  const distPath = path.join(process.cwd(), "dist");
  const isProductionBuild = process.env.NODE_ENV === "production" || fs.existsSync(path.join(distPath, "index.html"));

  if (!isProductionBuild) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Prod static files
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Dompet Pintarku node backend server actively running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
