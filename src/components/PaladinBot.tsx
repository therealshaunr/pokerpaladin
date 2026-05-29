import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Button } from "@/components/ui/button";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function PaladinBot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/bot" }),
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open, status]);

  const busy = status === "submitted" || status === "streaming";

  const submit = () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    sendMessage({ text });
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full wizard-gradient text-white shadow-[0_0_30px_oklch(0.55_0.22_295/0.5)] hover:scale-105 transition"
          aria-label="Open Paladin Bot"
        >
          <Sparkles className="h-6 w-6" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-5 right-5 z-50 flex h-[560px] w-[360px] max-w-[calc(100vw-2rem)] flex-col rounded-2xl border-2 border-wizard/40 bg-card shadow-[0_0_60px_oklch(0.55_0.22_295/0.35)]">
          <header className="flex items-center justify-between border-b border-border p-3">
            <div className="flex items-center gap-2">
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg wizard-gradient text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <div className="font-display text-sm font-black uppercase tracking-wide">Paladin Bot</div>
                <div className="font-data text-[10px] text-muted-foreground">Ask anything · plans, install, rules</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </header>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-3 text-sm">
            {messages.length === 0 && (
              <div className="rounded-lg border border-dashed border-border bg-secondary/30 p-4 text-center text-xs text-muted-foreground">
                <MessageCircle className="mx-auto mb-2 h-5 w-5 text-gold" />
                Try: <span className="text-foreground">"Difference between Standard and Pro?"</span> ·{" "}
                <span className="text-foreground">"How do I install Pocket on iPhone?"</span>
              </div>
            )}
            {messages.map((m: UIMessage) => {
              const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
              return (
                <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 leading-relaxed",
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground"
                    )}
                  >
                    {text}
                  </div>
                </div>
              );
            })}
            {busy && (
              <div className="flex justify-start">
                <div className="text-xs italic text-wizard animate-pulse">Paladin is thinking…</div>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); submit(); }}
            className="flex items-end gap-2 border-t border-border p-2"
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
              }}
              rows={1}
              placeholder="Ask the Paladin…"
              className="flex-1 resize-none rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-wizard"
            />
            <Button type="submit" size="icon" disabled={busy || !input.trim()} className="shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
