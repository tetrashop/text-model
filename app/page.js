"use client";
import { useState } from "react";
import ModelViewer from "./components/ModelViewer";
import { Send, Upload, Download, Box, RefreshCw, Layers } from "lucide-react";

const TEMPLATES = [
  { name: "پیچ M3", prompt: "یک پیچ M3 استاندارد با سر استوانه‌ای بساز." },
  { name: "چرخ‌دنده ساده", prompt: "یک چرخ‌دنده استوانه‌ای به شعاع ۲۰ و ارتفاع ۱۰ بساز که یک سوراخ به شعاع ۵ داشته باشد و ۸ دندانه مکعبی دور آن باشد." },
  { name: "مکعب توخالی", prompt: "یک مکعب ۴۰ در ۴۰ در ۴۰ بساز و یک مکعب ۳۰ در ۳۰ در ۳۰ را از داخل آن کم کن." },
  { name: "حکاکی متن", prompt: 'یک مکعب ۵۰ در ۵۰ در ۱۰ بساز و روی سطح بالایی آن عبارت "CAD" را حک کن.' }
];

export default function Home() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "سلام! من دستیار مدل‌سازی سه‌بعدی شما هستم. یک قطعه را توصیف کنید، نقشه آپلود کنید، یا از قطعات آماده استفاده کنید." }
  ]);
  const [input, setInput] = useState("");
  const [spec, setSpec] = useState(null);
  const [status, setStatus] = useState("idle");
  const [busy, setBusy] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);

  const handleSend = async (text = input) => {
    if (!text.trim() || busy) return;
    const userMsg = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setBusy(true);
    setStatus("loading");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, spec })
      });
      const data = await res.json();
      setSpec(data.spec || spec);
      setStatus(data.action || "idle");
      const text = data.action === "ready" ? (data.reply || "مدل آماده است.") : (data.question || data.reply || "ادامه دهید.");
      setMessages([...newMessages, { role: "assistant", content: text }]);
    } catch (e) {
      setMessages([...newMessages, { role: "assistant", content: "خطا: " + e.message }]);
      setStatus("idle");
    } finally {
      setBusy(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOcrLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/ocr", { method: "POST", body: fd });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (data.text) handleSend(data.text);
    } catch (err) {
      alert("خطا در خواندن تصویر: " + err.message);
    } finally {
      setOcrLoading(false);
    }
  };

  const handleDownload = async (format) => {
    if (!spec) return;
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spec, format })
    });
    if (!res.ok) return alert("خطا در تولید فایل");
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = (spec.name || "model") + "." + format;
    a.click();
  };

  return (
    <div className="h-screen w-full flex flex-col md:flex-row bg-dark text-slate-200 overflow-hidden font-sans" dir="rtl">
      
      {/* سایدبار (چت و تنظیمات) */}
      <div className="w-full md:w-[400px] h-1/2 md:h-full flex flex-col border-l border-slate-800 bg-panel/30 backdrop-blur-md z-10">
        <div className="p-4 border-b border-slate-800 flex items-center gap-2">
          <Box className="text-brand w-6 h-6" />
          <h1 className="text-xl font-bold text-white">Text-to-CAD</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${m.role === "user" ? "bg-brand text-white rounded-tr-sm" : "bg-slate-800 text-slate-200 rounded-tl-sm"}`}>
                {m.content}
              </div>
            </div>
          ))}
          {busy && <div className="text-brand text-sm animate-pulse flex items-center gap-2"><RefreshCw className="w-4 h-4 animate-spin"/> در حال تحلیل...</div>}
        </div>

        <div className="p-4 border-t border-slate-800 space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {TEMPLATES.map((t, i) => (
              <button key={i} onClick={() => handleSend(t.prompt)} className="whitespace-nowrap bg-slate-800 hover:bg-slate-700 text-xs px-3 py-1.5 rounded-full border border-slate-700 transition">
                {t.name}
              </button>
            ))}
          </div>
          
          <div className="relative flex items-center">
            <label className="absolute right-2 p-2 cursor-pointer text-slate-400 hover:text-brand transition">
              <Upload className="w-5 h-5" />
              <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
            </label>
            <input 
              type="text" 
              value={input} 
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="توصیف قطعه یا آپلود نقشه..." 
              className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pr-10 pl-12 text-sm focus:outline-none focus:border-brand transition"
            />
            <button onClick={() => handleSend()} disabled={busy || !input.trim()} className="absolute left-2 p-2 bg-brand hover:bg-emerald-600 text-white rounded-lg disabled:opacity-50 transition">
              <Send className="w-4 h-4" />
            </button>
          </div>
          {ocrLoading && <p className="text-xs text-brand animate-pulse text-center">در حال خواندن نقشه با هوش مصنوعی...</p>}
        </div>
      </div>

      {/* بخش اصلی (نمایش سه‌بعدی) */}
      <div className="flex-1 flex flex-col h-1/2 md:h-full relative bg-gradient-to-br from-dark to-slate-900">
        {status === "ready" && spec ? (
          <>
            <div className="absolute top-4 right-4 z-10 flex gap-2">
              <button onClick={() => handleDownload("stl")} className="flex items-center gap-2 bg-brand hover:bg-emerald-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium transition">
                <Download className="w-4 h-4" /> STL
              </button>
              <button onClick={() => handleDownload("obj")} className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium transition">
                <Layers className="w-4 h-4" /> OBJ
              </button>
            </div>
            <ModelViewer spec={spec} />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
            <Box className="w-24 h-24 mb-4 opacity-20" />
            <p className="text-lg">مدل سه‌بعدی شما اینجا نمایش داده می‌شود</p>
            <p className="text-sm mt-2 opacity-50">برای شروع، یک قطعه را توصیف کنید</p>
          </div>
        )}
      </div>
    </div>
  );
}
