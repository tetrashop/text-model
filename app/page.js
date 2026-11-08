"use client";
import { useState } from "react";

export default function Home() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "شیء موردنظر را توصیف کنید. اگر رسم یا نقشه‌ای دارید، آپلود کنید." }
  ]);
  const [input, setInput] = useState("");
  const [spec, setSpec] = useState(null);
  const [status, setStatus] = useState("idle");
  const [busy, setBusy] = useState(false);

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
        ? (data.reply || "مدل آماده است. دکمه دانلود را بزنید.")
        : (data.question || data.reply || "لطفاً ادامه دهید.");
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
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/ocr", { method: "POST", body: fd });
    const data = await res.json();
    if (data.text) setInput(v => v + "\n[از رسم استخراج شد]:\n" + data.text);
  };

  const download = async () => {
    if (!spec) return;
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spec })
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = (spec.name || "model") + ".stl";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main>
      <header>text-model · دستیار مدل سه‌بعدی</header>
      <section className="chat">
        {messages.map((m, i) => (
          <div key={i} className={"msg " + m.role}>{m.content}</div>
        ))}
        {busy && <div className="msg assistant">...</div>}
      </section>
      <section className="input">
        <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="توصیف شیء..." />
        <button onClick={send} disabled={busy}>ارسال</button>
      </section>
      <aside>
        <h3>وضعیت</h3>
        <p>action: {status}</p>
        <label style={{ display: "block", margin: ".5rem 0", cursor: "pointer" }}>
          آپلود رسم
          <input type="file" accept="image/*,.pdf" onChange={upload} style={{ display: "block", marginTop: ".25rem" }} />
        </label>
        {status === "ready" && <button onClick={download}>دانلود STL</button>}
        <h3>spec</h3>
        <pre>{spec ? JSON.stringify(spec, null, 2) : "—"}</pre>
      </aside>
    </main>
  );
}
