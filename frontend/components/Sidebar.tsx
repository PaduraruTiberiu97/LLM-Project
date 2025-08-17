"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Plus, Search, BookOpen, MessageSquare, Trash2 } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import ImageLightbox from "./ImageLightbox";

function useApiBase() {
  return useMemo(
    () => process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000",
    []
  );
}

type ChatItem = { id: number; title: string };

export default function Sidebar() {
  const base = useApiBase();
  const [q, setQ] = useState("");
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [genImg, setGenImg] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch(base + "/chats");
      const data = await res.json().catch(() => []);
      setChats(Array.isArray(data) ? data : []);
    } catch {
      setChats([]);
    }
  }

  useEffect(() => {
    load().catch(() => {});
    window.addEventListener("chats-changed", load);
    return () => window.removeEventListener("chats-changed", load);
  }, [base]);

  async function newChat() {
    const res = await fetch(base + "/chats", { method: "POST" });
    const data = await res.json();
    window.location.href = "/chat/" + data.id;
  }

  const filtered = Array.isArray(chats)
    ? chats.filter((c) => !q || c.title.toLowerCase().includes(q.toLowerCase()))
    : [];

  return (
    <>
      <aside className="hidden w-60 shrink-0 md:flex md:flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="p-3">
          <button
            onClick={newChat}
            className="flex w-full items-center gap-2 rounded-md bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-3 py-2 hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> New chat
          </button>
        </div>
        <div className="px-3">
          <div className="relative mb-2">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search chats"
              className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-transparent py-2 pl-8 pr-2 text-sm outline-none"
            />
          </div>
          <Link
            href="/library"
            className="flex items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <BookOpen className="h-4 w-4" /> Library
          </Link>
        </div>
        <nav className="mt-2 flex-1 overflow-y-auto px-3 space-y-1">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="group flex items-center rounded-md px-2 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Link href={`/chat/${c.id}`} className="flex flex-1 items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="truncate">{c.title}</span>
              </Link>
              <button
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  await fetch(base + `/chats/${c.id}`, { method: "DELETE" });
                  window.dispatchEvent(new Event("chats-changed"));
                  if (window.location.pathname === `/chat/${c.id}`) {
                    window.location.href = "/";
                  }
                }}
                className="ml-2 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600"
                aria-label="Delete chat"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-slate-500 text-sm">No chats yet.</div>
          )}
        </nav>
        <div className="p-3 border-t border-slate-200 dark:border-slate-800">
          <ThemeToggle />
        </div>
      </aside>
      {genImg && <ImageLightbox src={genImg} onClose={() => setGenImg(null)} />}
    </>
  );
}
