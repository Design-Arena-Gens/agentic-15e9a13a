"use client";

import { FormEvent, useState } from "react";

type Role = "user" | "assistant";

type Message = {
  id: string;
  role: Role;
  content: string;
  meta?: {
    source: "sheet" | "openrouter";
    matchScore?: number;
    question?: string | null;
  };
};

const initialMessages: Message[] = [
  {
    id: "initial",
    role: "assistant",
    content:
      "Hi there! Ask me anything about the knowledge stored in Google Sheets. If I can’t find it there, I’ll consult OpenRouter for you.",
  },
];

const createId = () => Math.random().toString(36).slice(2);

export default function Home() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: createId(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((message) => ({
            role: message.role,
            content: message.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("The assistant is currently unavailable. Please try again.");
      }

      const data = (await response.json()) as {
        reply: string;
        source: {
          type: "sheet" | "openrouter";
          matchScore?: number;
          question?: string | null;
        };
      };

      const assistantMessage: Message = {
        id: createId(),
        role: "assistant",
        content: data.reply,
        meta: {
          source: data.source.type,
          matchScore: data.source.matchScore,
          question: data.source.question,
        },
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 bg-gradient-to-br from-slate-900 via-slate-950 to-black text-slate-100">
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold sm:text-4xl">
            Google Sheet Knowledge Chatbot
          </h1>
          <p className="text-sm text-slate-300">
            Answers come from your Google Sheet first. When the sheet doesn’t have
            what you need, the assistant checks OpenRouter.
          </p>
        </header>

        <section className="flex-1 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur">
          <div className="flex h-full flex-col gap-4 overflow-hidden">
            <div className="flex-1 space-y-4 overflow-y-auto pr-1">
              {messages.map((message) => (
                <article
                  key={message.id}
                  className={`flex w-full flex-col gap-2 rounded-xl border border-transparent px-4 py-3 ${
                    message.role === "user"
                      ? "self-end bg-emerald-500/20 text-emerald-50"
                      : "self-start bg-white/10 text-slate-100"
                  }`}
                >
                  <span className="text-xs uppercase tracking-wide text-slate-300">
                    {message.role === "user" ? "You" : "Assistant"}
                  </span>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {message.content}
                  </p>
                  {message.meta && (
                    <footer className="rounded-md bg-black/20 px-2 py-1 text-[10px] uppercase tracking-wide text-slate-300">
                      {message.meta.source === "sheet"
                        ? `Answered from Google Sheet${
                            typeof message.meta.matchScore === "number"
                              ? ` · Match ${(message.meta.matchScore * 100).toFixed(0)}%`
                              : ""
                          }`
                        : `Generated via OpenRouter${
                            message.meta.matchScore
                              ? ` · Closest match ${(message.meta.matchScore * 100).toFixed(0)}%`
                              : ""
                          }`}
                      {message.meta.source === "sheet" &&
                        message.meta.question && (
                          <span className="ml-2 text-[10px] capitalize">
                            Source: {message.meta.question}
                          </span>
                        )}
                    </footer>
                  )}
                </article>
              ))}
              {isLoading && (
                <article className="flex w-full flex-col gap-2 self-start rounded-xl bg-white/10 px-4 py-3 text-slate-200">
                  <span className="text-xs uppercase tracking-wide text-slate-300">
                    Assistant
                  </span>
                  <p className="text-sm italic text-slate-300">Thinking…</p>
                </article>
              )}
            </div>

            <form
              onSubmit={handleSubmit}
              className="sticky bottom-0 flex w-full flex-col gap-3 rounded-xl border border-white/10 bg-black/40 p-3 backdrop-blur"
            >
              <textarea
                rows={2}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask a question…"
                className="w-full resize-none rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/30"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="ml-auto inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? "Sending…" : "Send"}
              </button>
            </form>
          </div>
        </section>

        {error && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}
      </main>
    </div>
  );
}
