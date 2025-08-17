"use client";
import React from "react";
import cn from "classnames";
import ReactMarkdown from "react-markdown";
import { Bot, User, Copy, Check, Volume2, Square } from "lucide-react";

export type ChatMsg = {
  role: "user" | "assistant";
  content: string;
  imageB64?: string | null; // optional inline image
};

function Avatar({ role }: { role: "user" | "assistant" }) {
  const Icon = role === "user" ? User : Bot;
  return (
    <div
      className={cn(
        "h-9 w-9 shrink-0 rounded-full grid place-items-center shadow",
        role === "user" ? "bg-slate-900 text-white dark:bg-white dark:text-gray-900" : "bg-blue-600 text-white"
      )}
    >
      <Icon className="h-5 w-5" />
    </div>
  );
}

export default function MessageBubble({ msg, onCopy, onImageClick, onSpeak, speaking }: {
  msg: ChatMsg;
  onCopy?: (text: string) => void;
  onImageClick?: (src: string) => void;
  onSpeak?: () => void;
  speaking?: boolean;
}) {
  const [copied, setCopied] = React.useState(false);
  const raw = msg.content ?? "";
  const hasText = raw.replace(/\s+/g, "").length > 0;

  async function doCopy() {
    if (!onCopy) return;
    onCopy(raw);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  const bubbleClasses = cn(
    "group relative rounded-2xl px-3 py-2 text-[0.95rem] leading-relaxed",
    "border shadow-sm",
    msg.role === "user"
      ? "bg-slate-100 dark:bg-gray-700 border-slate-200 dark:border-gray-600"
      : "bg-white dark:bg-gray-700 border-slate-200 dark:border-gray-600"
  );

  return (
    <div
      className={cn(
        "flex gap-3",
        msg.role === "user" ? "justify-end" : "justify-start"
      )}
    >
      {msg.role === "assistant" && <Avatar role="assistant" />}

      <div className="max-w-[80%] space-y-2">
        {hasText && (
          <div className={bubbleClasses}>
            <div className="prose prose-slate dark:prose-invert prose-p:my-2 prose-pre:my-2 prose-strong:font-semibold">
              <ReactMarkdown>{raw}</ReactMarkdown>
            </div>
            {msg.role === "assistant" && (
              <div className="absolute -right-2 -top-2 hidden group-hover:flex gap-1">
                <button
                  onClick={doCopy}
                  className="rounded-full border px-2 py-1 text-xs bg-white/80 dark:bg-gray-800/70 backdrop-blur border-slate-200 dark:border-gray-600"
                  title="Copy"
                  aria-label="Copy message"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
                {onSpeak && (
                  <button
                    onClick={onSpeak}
                    className="rounded-full border px-2 py-1 text-xs bg-white/80 dark:bg-gray-800/70 backdrop-blur border-slate-200 dark:border-gray-600"
                    title="Read aloud"
                    aria-label="Read aloud"
                  >
                    {speaking ? <Square className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {msg.imageB64 && (
          <img
            src={`data:image/png;base64,${msg.imageB64}`}
            alt="Generated image"
            className="max-w-[200px] w-auto h-auto object-contain rounded-xl border border-slate-200 dark:border-gray-600 cursor-zoom-in hover:opacity-95"
            onClick={() => onImageClick?.(`data:image/png;base64,${msg.imageB64}`)}
          />
        )}
      </div>
      {msg.role === "user" && <Avatar role="user" />}
    </div>
  );
}
