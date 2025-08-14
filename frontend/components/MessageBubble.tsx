"use client";
import React from "react";
import cn from "classnames";
import ReactMarkdown from "react-markdown";
import { Bot, User, Copy, Check, Volume2 } from "lucide-react";

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
        role === "user" ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "bg-blue-600 text-white"
      )}
    >
      <Icon className="h-5 w-5" />
    </div>
  );
}

export default function MessageBubble({ msg, onCopy, onImageClick, onSpeak }: {
  msg: ChatMsg;
  onCopy?: (text: string) => void;
  onImageClick?: (src: string) => void;
  onSpeak?: (text: string) => void;
}) {
  const [copied, setCopied] = React.useState(false);
  async function doCopy() {
    if (!onCopy) return;
    onCopy(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  const bubbleClasses = cn(
    "rounded-2xl px-3 py-2 text-[0.95rem] leading-relaxed",
    "border shadow-sm",
    msg.role === "user"
      ? "bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600"
      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
  );

  return (
    <div className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}>
      {msg.role === "assistant" && <Avatar role="assistant" />}
      <div className="max-w-[80%] space-y-2">
        <div className={bubbleClasses}>
          <div className="prose prose-slate dark:prose-invert prose-p:my-2 prose-pre:my-2 prose-strong:font-semibold">
            <ReactMarkdown>{msg.content}</ReactMarkdown>
          </div>
        </div>

        {msg.role === "assistant" && (
          <div className="flex items-center gap-2 text-slate-500">
            <button
              onClick={doCopy}
              className="p-1 hover:text-slate-700 dark:hover:text-slate-300"
              title="Copy"
              aria-label="Copy message"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
            <button
              onClick={() => onSpeak?.(msg.content)}
              className="p-1 hover:text-slate-700 dark:hover:text-slate-300"
              title="Play audio"
              aria-label="Play audio"
            >
              <Volume2 className="h-4 w-4" />
            </button>
          </div>
        )}

        {msg.imageB64 && (
          <img
            src={`data:image/png;base64,${msg.imageB64}`}
            alt="Generated image"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 cursor-zoom-in hover:opacity-95"
            onClick={() => onImageClick?.(`data:image/png;base64,${msg.imageB64}`)}
          />
        )}
      </div>
      {msg.role === "user" && <Avatar role="user" />}
    </div>
  );
}