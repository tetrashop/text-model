"use client";
import { useState } from "react";
import ModelViewer from "./components/ModelViewer";

export default function Home() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "شیء موردنظر را توصیف کنید. اگر رسم یا نقشه‌ای دارید، آپلود کنید." }
  ]);
  const [input, setInput] = useState("");
  const [spec, setSpec] = useState(null);
  const [status, setStatus] = useState("idle");
  const [busy, setBusy] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);

  const send = async () => {
    if (!input.trim() || busy) return;
    const userMsg = { role: "user", content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, spec })
      });
      const data = await res.json();
      setSpec(data.spec || spec);
      setStatus(data.action || "idle");
      const text = data.action === "ready"
        ? (data.reply || "مدل آماده است. مدل را در پایین ببینید.")
        : (data.question || data.reply || "ادامه دهید.");
      setMessages([...newMessages, { role: "assistant", content: text }]);
    } catch (e) {
      setMessages([...newMessages, { role: "assistant", content: "خطا: " + e.message }]);
    } finally {
      setBusy(false);
    }
  };

  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOcrLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/ocr", { method: "POST", body: fd });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (data.text) setInput(v => v + "\n[از رسم استخراج شد]:\n" + data.text);
    } catch (err) {
      alert("خطا در خواندن تصویر: " + (err.message || "مشکل در پردازش"));
    } finally {
      setOcrLoading(false);
    }
  };

  const download = async (format) => {
    if (!spec) return;
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spec, format })
    });
    if (!res.ok) return alert("خطا در تولید فایل");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = (spec.name || "model") + "." + format;
    a.click();
  };

  // آپدیت ابعاد از طریق پنل ویرایش زنده
  const updateAction = (index, key, value) => {
    const newSpec = JSON.parse(JSON.stringify(spec));
    newSpec.actions[index][key] = parseFloat(value) || 0;
    setSpec(newSpec);
  };

  return (
    <main>
      <header>text-model · دستیار مدل سه‌بعدی</header>
      <section className="chat">
        {messages.map((m, i) => (
          <div key={i} className={"msg " + m.role}>{m.content}</div>
        ))}
        {busy && <div className="msg assistant">در حال پردازش...</div>}
      </section>
      <section className="input">
        <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="توصیف شیء..." />
        <button onClick={send} disabled={busy}>ارسال</button>
      </section>
      <aside>
        <h3>وضعیت</h3>
        <p>action: {status}</p>
        <label style={{ display: "block", margin: ".5rem 0", cursor: "pointer" }}>
          {ocrLoading ? "در حال خواندن..." : "آپلود رسم"}
          <input type="file" accept="image/*" onChange={upload} style={{ display: "block", marginTop: ".25rem" }} />
        </label>
        
        {status === "ready" && (
          <div>
            <div style={{ display: "flex", gap: ".5rem", marginBottom: "1rem" }}>
              <button onClick={() => download("stl")} style={{ flex: 1 }}>دانلود STL</button>
              <button onClick={() => download("obj")} style={{ flex: 1, background: "#fa3" }}>دانلود OBJ</button>
            </div>
            
            <h3>پیش‌نمایش</h3>
            <ModelViewer spec={spec} />

            <h3 style={{ marginTop: "1rem" }}>ویرایش ابعاد</h3>
            {spec?.actions?.map((act, i) => (
              <div key={i} style={{ background: "#222", padding: ".5rem", marginBottom: ".5rem", borderRadius: "4px" }}>
                <div style={{ color: "#3a6", marginBottom: ".25rem" }}>{i+1}. {act.type} ({act.operation})</div>
                <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
                  {["w", "h", "d", "r", "x", "y", "z"].map(key => {
                    if (act[key] !== undefined) {
                      return (
                        <label key={key} style={{ display: "flex", alignItems: "center", gap: ".2rem" }}>
                          {key}:
                          <input type="number" value={act[key]} onChange={(e) => updateAction(i, key, e.target.value)} style={{ width: "50px", background: "#111", color: "#fff", border: "1px solid #444" }} />
                        </label>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
        <h3>spec</h3>
        <pre>{spec ? JSON.stringify(spec, null, 2) : "—"}</pre>
      </aside>
    </main>
  );
}
