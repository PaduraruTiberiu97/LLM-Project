"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import MessageBubble, { ChatMsg } from "./MessageBubble";
import TypingDots from "./TypingDots";
import Spinner from "./Spinner";
import ImageLightbox from "./ImageLightbox";
import { Send, ImagePlus } from "lucide-react";
import Recorder from "./Recorder";
import { getUserId } from "@/lib/user";

function useApiBase() {
  return useMemo(
    () => process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000",
    []
  );
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
  seedMessages?: {
    role: "user" | "assistant";
    content: string;
    imageB64?: string;
    image_b64?: string;
  }[];
}) {
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<ChatMsg[]>(
    seedMessages
      ?.map((m) => ({
        role: m.role,
        content: m.content || "",
        imageB64: m.imageB64 || m.image_b64,
      }))
      .filter((m) => m.content.trim() !== "" || m.imageB64)
      || []
  );
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<"thinking" | "generating" | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  const speakingIdxRef = useRef<number | null>(null);
  const [recording, setRecording] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const base = useApiBase();
  const userId = useMemo(() => getUserId(), []);
  const router = useRouter();

  useEffect(() => {
    if (seedMessages) {
      setMsgs(
        seedMessages
          .map((m) => ({
            role: m.role,
            content: m.content || "",
            imageB64: m.imageB64 || (m as any).image_b64,
          }))
          .filter((m) => m.content.trim() !== "" || m.imageB64)
      );
    }
  }, [seedMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "auto" });
  }, [msgs, chatId]);

  useEffect(() => {
    speakingIdxRef.current = speakingIdx;
  }, [speakingIdx]);

  async function speak(text: string, idx: number) {
    const audio = audioRef.current;
    // If this message is already playing, stop it
    if (speakingIdx === idx && audio) {
      audio.pause();
      audio.currentTime = 0;
      setSpeakingIdx(null);
      return;
    }

    // Stop any existing playback
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }

    setSpeakingIdx(idx);
    try {
      const tts = await fetch(
        base + "/tts?text=" + encodeURIComponent(stripMarkdown(text))
      );
      if (tts.ok) {
        const blob = await tts.blob();
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setTimeout(() => {
          const a = audioRef.current;
          if (a && speakingIdxRef.current === idx) {
            a.play();
            a.onended = () => setSpeakingIdx(null);
          }
        }, 100);
      } else {
        setSpeakingIdx(null);
      }
    } catch {
      setSpeakingIdx(null);
    }
  }

  async function send(text?: string) {
    const message = (text ?? input).trim();
    if (!message || sending) return;
    setSending(true);
    setStatus("thinking");
    setInput("");
    setMsgs((m) => [...m, { role: "user", content: message }]);

    try {
      const res = await fetch(base + `/chat?user_id=${userId}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message, chat_id: chatId }),
      });
      const data = await res.json();

      // If we didn't have a chat yet, jump to the newly created chat route
      if (!chatId && data?.chat_id) {
        window.dispatchEvent(new Event("chats-changed"));
        router.push("/chat/" + data.chat_id);
        return;
      }

      const reply = data?.reply ?? "(no reply)";
      setMsgs((m) => [...m, { role: "assistant", content: reply }]);
      window.dispatchEvent(new Event("chats-changed"));
    } catch (e) {
      setMsgs((m) => [...m, { role: "assistant", content: "Sorry, something went wrong." }]);
    } finally {
      setStatus(null);
      setSending(false);
    }
  }

  async function generateImage() {
    if (sending) return;
    const lastAssistant = [...msgs].reverse().find((m) => m.role === "assistant");
    if (!lastAssistant) {
      setMsgs((m) => [
        ...m,
        { role: "assistant", content: "No context for image generation." },
      ]);
      return;
    }
    setSending(true);
    setStatus("generating");
    try {
      const res = await fetch(
        `${base}/image?prompt=${encodeURIComponent(lastAssistant.content)}&chat_id=${chatId ?? ""}&user_id=${userId}`
      );
      const data = await res.json();
      if (!chatId && data?.chat_id) {
        window.dispatchEvent(new Event("chats-changed"));
        router.push("/chat/" + data.chat_id);
        return;
      }
      if (data?.image_b64) {
        setMsgs((m) => [
          ...m,
          { role: "assistant", content: "", imageB64: data.image_b64 },
        ]);
        window.dispatchEvent(new Event("chats-changed"));
      } else {
        setMsgs((m) => [
          ...m,
          { role: "assistant", content: "Failed to generate image." },
        ]);
      }
    } catch {
      setMsgs((m) => [
        ...m,
        { role: "assistant", content: "Failed to generate image." },
      ]);
    } finally {
      setStatus(null);
      setSending(false);
    }
  }

  useEffect(() => {
    // Preload book list silently; helpful for first load warmup
    fetch(base + "/books").catch(() => {});
  }, [base]);

  return (
    <div className="flex h-full flex-col">
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto px-4"
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
      >
        {msgs.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
            <h1 className="text-2xl font-semibold">What can I help you with?</h1>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {msgs.map((m, i) => (
              <MessageBubble
                key={i}
                msg={m}
                onCopy={(t) => navigator.clipboard.writeText(t)}
                onImageClick={(src) => setLightbox(src)}
                onSpeak={m.role === "assistant" ? () => speak(m.content, i) : undefined}
                speaking={speakingIdx === i}
              />
            ))}
            {status && (
              <div className="flex items-center gap-2 text-gray-500" role="status">
                <TypingDots />
                <span className="text-sm">
                  {status === "generating" ? "Generating image…" : "Assistant is thinking…"}
                </span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="p-4"
      >
        <div className="relative">
          <input
            className="w-full rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-3 pr-28 pl-4 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
            placeholder={recording ? "" : "Ask anything"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-label="Message input"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <button
              type="button"
              onClick={generateImage}
              className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              aria-label="Generate image"
            >
              <ImagePlus className="h-5 w-5" aria-hidden="true" />
            </button>
            <Recorder
              onText={(t) => setInput(t)}
              onRecordingChange={setRecording}
            />
            <button
              type="submit"
              disabled={sending}
              className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              aria-label="Send message"
            >
              {sending ? (
                <Spinner className="h-5 w-5" />
              ) : (
                <Send className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </form>
      <audio ref={audioRef} src={audioUrl ?? undefined} className="hidden" />
      {lightbox && <ImageLightbox src={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  );
}
