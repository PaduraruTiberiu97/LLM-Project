"use client";
import { useEffect, useMemo, useState } from "react";
import MessageBubble, { ChatMsg } from "./MessageBubble";
import TypingDots from "./TypingDots";
import Spinner from "./Spinner";
import ImageLightbox from "./ImageLightbox";
import { ImageIcon, ArrowUp } from "lucide-react";
import Recorder from "./Recorder";

function useApiBase() {
  return useMemo(() => process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000", []);
}

function stripMarkdown(s: string) {
  // minimal cleanup for TTS
  return s
    .replace(/[*!_`>#~\[\]]/g, "") // remove simple markdown tokens
    .replace(/\s+/g, " ")
    .trim();
}

export default function ChatWindow({
  chatId,
  seedMessages,
}: {
  chatId?: number;
  seedMessages?: { role: "user" | "assistant"; content: string }[];
}) {
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<ChatMsg[]>(
    seedMessages?.map((m) => ({ role: m.role, content: m.content })) || []
  );
  const [sending, setSending] = useState(false);
  const [assistantTyping, setAssistantTyping] = useState(false);
  const [imgLoading, setImgLoading] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const base = useApiBase();

  useEffect(() => {
    if (seedMessages) {
      setMsgs(seedMessages.map((m) => ({ role: m.role, content: m.content })));
    }
  }, [seedMessages]);

  async function send(text?: string) {
    const message = (text ?? input).trim();
    if (!message || sending) return;
    setSending(true);
    setAssistantTyping(true);
    setInput("");
    setMsgs((m) => [...m, { role: "user", content: message }]);

    try {
      const res = await fetch(base + "/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message, chat_id: chatId }),
      });
      const data = await res.json();

      // If we didn't have a chat yet, jump to the newly created chat route
      if (!chatId && data?.chat_id) {
        window.location.href = "/chat/" + data.chat_id;
        return;
      }

      const reply = data?.reply ?? "(no reply)";
      setMsgs((m) => [...m, { role: "assistant", content: reply }]);
      window.dispatchEvent(new Event("chat-updated"));
    } catch (e) {
      setMsgs((m) => [...m, { role: "assistant", content: "Sorry, something went wrong." }]);
    } finally {
      setAssistantTyping(false);
      setSending(false);
    }
  }

  async function genCover() {
    if (imgLoading) return;
    setImgLoading(true);
    try {
      const last = [...msgs].reverse().find((m) => m.role === "assistant");
      const prompt = last
        ? `Create a tasteful book cover illustration for this recommendation: ${last.content}`
        : "Create a tasteful, minimalist book cover with abstract shapes and soft gradients.";

      const res = await fetch(
        base +
          "/image?prompt=" +
          encodeURIComponent(prompt) +
          (chatId ? `&chat_id=${chatId}` : "")
      );
      const data = await res.json();
      const b64 = data?.image_b64 ?? null;
      if (b64) {
        // Push image inside the chat as an assistant message
        setMsgs((m) => [...m, { role: "assistant", content: "Generated cover:", imageB64: b64 }]);
      }
    } catch (e) {
      setMsgs((m) => [...m, { role: "assistant", content: "Couldn't generate image this time." }]);
    } finally {
      setImgLoading(false);
    }
  }

  async function speak(text: string) {
    const res = await fetch(
      base + "/tts?text=" + encodeURIComponent(stripMarkdown(text))
    );
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.play();
    }
  }

  useEffect(() => {
    // Preload book list silently; helpful for first load warmup
    fetch(base + "/books").catch(() => {});
  }, [base]);

  return (
    <div className="mx-auto flex h-screen max-w-3xl flex-col p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Smart Librarian</h1>
        <button
          onClick={genCover}
          disabled={imgLoading}
          className="inline-flex items-center gap-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 hover:shadow disabled:opacity-60"
        >
          <ImageIcon className="h-4 w-4" /> {imgLoading ? "Generating..." : "Generate cover"}
        </button>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-3 bg-white dark:bg-slate-800">
        {msgs.map((m, i) => (
          <MessageBubble
            key={i}
            msg={m}
            onCopy={(t) => navigator.clipboard.writeText(t)}
            onSpeak={speak}
            onImageClick={(src) => setLightbox(src)}
          />
        ))}
        {assistantTyping && (
          <div className="flex items-center gap-2 text-slate-500">
            <TypingDots />
            <span className="text-sm">Assistant is thinking…</span>
          </div>
        )}
        {msgs.length === 0 && !assistantTyping && (
          <div className="flex h-full items-center justify-center text-center text-slate-500">
            Ask a question to start the conversation.
          </div>
        )}
      </div>

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="mt-4 flex items-center gap-2"
      >
        <input
          className="flex-1 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-3 shadow-sm focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-700"
          placeholder="Vreau o carte despre prietenie și magie… / I want a novel about friendship and magic"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <Recorder onText={(t) => setInput(t)} />
        <button
          disabled={sending}
          className="inline-flex items-center justify-center rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 p-3 hover:opacity-95 disabled:opacity-60"
        >
          {sending ? <Spinner className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
        </button>
      </form>

      {lightbox && <ImageLightbox src={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  );
}
