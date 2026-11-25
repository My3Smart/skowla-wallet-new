import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(2000) }))
    .min(1)
    .max(20),
  context: z.string().max(6000),
});

const SYSTEM = `Anda ialah "Skowla AI", pembantu pintar sekolah untuk ibu bapa dalam aplikasi Skowla (Smart School • Smart Wallet • Smart Future).
- Jawab dalam bahasa yang digunakan pengguna (lalai: Bahasa Melayu mesra dan sopan). Panggil pengguna dengan nama ibu bapa dalam konteks.
- Ringkas: 1–4 ayat atau senarai pendek. Tiada markdown berat; boleh guna "•" untuk senarai.
- Gunakan HANYA data dalam KONTEKS untuk baki, transaksi, yuran, menu dan kehadiran. Jangan reka angka.
- Untuk tindakan (tambah nilai, hantar wang, bayar yuran, buat aduan), terangkan di mana dalam aplikasi: Home (Hantar Wang/Ubah Had), History (Top Up), School (Yuran & nota cuti), Canteen (pra-pesan), atau butang "Buat Aduan Sekolah".
- Jika soalan di luar urusan sekolah/anak, jawab ringkas dan bawa kembali kepada topik sekolah.`;

export const askSkowla = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }) => {
    const { generateResponse, GatewayError } = await import("@lovable.dev/ai-gateway");
    try {
      const res = await generateResponse({
        model: "openai/gpt-6.1-sol",
        instructions: `${SYSTEM}\n\nKONTEKS (data semasa aplikasi):\n${data.context}`,
        input: data.messages.map((m) => ({ role: m.role, content: m.content })),
      });
      const text = res.output
        .flatMap((item) => (item.type === "message" ? item.content : []))
        .map((c) => (c.type === "output_text" ? c.text : ""))
        .join("")
        .trim();
      return {
        ok: true as const,
        reply: text || "Maaf, saya tidak dapat menjawab sekarang. Sila cuba lagi.",
      };
    } catch (e) {
      if (e instanceof GatewayError) {
        console.error("Skowla AI gateway error", e.code, e.httpStatus);
        const busy = e.httpStatus === 429;
        const credits = e.httpStatus === 402;
        return {
          ok: false as const,
          reply: busy
            ? "Skowla AI sedang sibuk. Sila cuba sebentar lagi."
            : credits
              ? "Perkhidmatan AI tidak tersedia buat masa ini (kredit habis)."
              : "Maaf, Skowla AI menghadapi masalah. Sila cuba lagi.",
        };
      }
      throw e;
    }
  });
