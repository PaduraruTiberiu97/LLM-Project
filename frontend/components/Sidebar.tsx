"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Plus, Search, BookOpen, MessageSquare, Trash2 } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { getUserId } from "@/lib/user";

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
  const pathname = usePathname();
  const userId = useMemo(() => getUserId(), []);
  const router = useRouter();

  async function load() {
    try {
      const res = await fetch(base + `/chats?user_id=${userId}`);
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
  }, [base, userId]);

  async function newChat() {
    const res = await fetch(base + `/chats?user_id=${userId}`, { method: "POST" });
    const data = await res.json();
    window.dispatchEvent(new Event("chats-changed"));
    router.push("/chat/" + data.id);
  }

  const filtered = Array.isArray(chats)
    ? chats.filter((c) => !q || c.title.toLowerCase().includes(q.toLowerCase()))
    : [];

  return (
    <aside
      className="hidden w-60 shrink-0 md:flex md:flex-col h-screen border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden"
      aria-label="Chat sidebar"
      role="navigation"
    >
      <div className="p-3">
        <button
          onClick={newChat}
          className="flex w-full items-center gap-2 rounded-md bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-3 py-2 hover:opacity-90"
        >
          <Plus className="h-4 w-4" aria-hidden="true" /> New chat
        </button>
      </div>
      <div className="px-3">
        <div className="relative mb-2">
          <Search
            className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500"
            aria-hidden="true"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search chats"
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-transparent py-2 pl-8 pr-2 text-sm outline-none"
            aria-label="Search chats"
          />
        </div>
        <Link
          href="/library"
          className="flex items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-current={pathname === "/library" ? "page" : undefined}
        >
          <BookOpen className="h-4 w-4" aria-hidden="true" /> Library
        </Link>
      </div>
      <nav className="mt-2 flex-1 px-3 space-y-1 overflow-y-auto" aria-label="Chat history">
        {filtered.map((c) => (
          <div
            key={c.id}
            className="group flex items-center rounded-md px-2 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Link
              href={`/chat/${c.id}`}
              className="flex flex-1 min-w-0 items-center gap-2"
              aria-current={pathname === `/chat/${c.id}` ? "page" : undefined}
            >
              <MessageSquare className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{c.title}</span>
            </Link>
            <button
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                await fetch(base + `/chats/${c.id}?user_id=${userId}`, { method: "DELETE" });
                window.dispatchEvent(new Event("chats-changed"));
                if (pathname === `/chat/${c.id}`) {
                  router.push("/");
                }
              }}
              className="ml-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600"
              aria-label="Delete chat"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-gray-500 text-sm">No chats yet.</div>
        )}
      </nav>
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 shrink-0">
        <ThemeToggle />
      </div>
    </aside>
  );
}
