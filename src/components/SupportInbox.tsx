import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listMyTickets, getTicket, createTicket, replyToTicket } from "@/lib/support.functions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Plus, X, Send } from "lucide-react";

type Ticket = { id: string; subject: string; category: string; status: string; updated_at: string; last_reply_by: string | null; user_email?: string };
type Message = { id: string; ticket_id: string; author_id: string; author_role: string; body: string; created_at: string };

interface Props {
  /** When provided, uses this list (admin view). Otherwise loads the current user's tickets. */
  tickets?: Ticket[];
  /** Admin mode shows the user email column and allows replies from admin context. */
  asAdmin?: boolean;
  /** Reload callback to refresh tickets after a change. */
  onChange?: () => void;
}

export function SupportInbox({ tickets: externalTickets, asAdmin, onChange }: Props) {
  const list = useServerFn(listMyTickets);
  const fetchTicket = useServerFn(getTicket);
  const newTicket = useServerFn(createTicket);
  const reply = useServerFn(replyToTicket);

  const [mine, setMine] = useState<Ticket[] | null>(externalTickets ?? null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [thread, setThread] = useState<{ ticket: Ticket; messages: Message[] } | null>(null);
  const [composing, setComposing] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<"billing" | "bug" | "feature" | "account" | "other">("other");
  const [body, setBody] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (externalTickets) {
      setMine(externalTickets);
    } else if (!asAdmin) {
      list().then((d) => setMine(d as Ticket[])).catch(() => setMine([]));
    }
  }, [externalTickets, asAdmin, list]);

  useEffect(() => {
    if (!openId) return;
    fetchTicket({ data: { id: openId } })
      .then((t) => setThread(t as { ticket: Ticket; messages: Message[] }))
      .catch(() => setThread(null));
  }, [openId, fetchTicket]);

  const reload = async () => {
    if (asAdmin) {
      onChange?.();
    } else {
      const d = await list();
      setMine(d as Ticket[]);
    }
    if (openId) {
      const t = await fetchTicket({ data: { id: openId } });
      setThread(t as { ticket: Ticket; messages: Message[] });
    }
  };

  const submitNew = async () => {
    if (subject.length < 3 || body.length < 5) return;
    setBusy(true);
    try {
      await newTicket({ data: { subject, category, body } });
      setSubject(""); setBody(""); setCategory("other"); setComposing(false);
      await reload();
    } finally {
      setBusy(false);
    }
  };

  const submitReply = async () => {
    if (!openId || replyBody.trim().length < 1) return;
    setBusy(true);
    try {
      await reply({ data: { ticket_id: openId, body: replyBody.trim() } });
      setReplyBody("");
      await reload();
    } finally {
      setBusy(false);
    }
  };

  if (thread) {
    const { ticket, messages } = thread;
    return (
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-data text-[10px] uppercase tracking-wider text-muted-foreground">
              {ticket.category} · {ticket.status} {asAdmin && ticket.user_email ? `· ${ticket.user_email}` : ""}
            </div>
            <h3 className="font-display text-lg font-bold">{ticket.subject}</h3>
          </div>
          <button onClick={() => { setOpenId(null); setThread(null); }} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 max-h-[400px] space-y-3 overflow-y-auto pr-2">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`rounded-lg p-3 text-sm ${
                m.author_role === "admin" ? "border border-gold/40 bg-gold/5" : "bg-secondary/40"
              }`}
            >
              <div className="font-data text-[10px] uppercase tracking-wider text-muted-foreground">
                {m.author_role} · {new Date(m.created_at).toLocaleString()}
              </div>
              <div className="mt-1 whitespace-pre-wrap">{m.body}</div>
            </div>
          ))}
        </div>
        {ticket.status !== "closed" && (
          <div className="mt-4 space-y-2">
            <Textarea value={replyBody} onChange={(e) => setReplyBody(e.target.value)} placeholder="Type your reply…" rows={3} />
            <Button onClick={submitReply} disabled={busy || replyBody.trim().length < 1} size="sm" className="gap-2">
              <Send className="h-3 w-3" /> {busy ? "Sending…" : "Send reply"}
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-wizard" />
          <h2 className="font-display text-lg font-black uppercase tracking-wide">
            {asAdmin ? "Support inbox" : "Support tickets"}
          </h2>
        </div>
        {!asAdmin && (
          <Button size="sm" variant="secondary" onClick={() => setComposing((v) => !v)} className="gap-1">
            <Plus className="h-3 w-3" /> {composing ? "Cancel" : "New ticket"}
          </Button>
        )}
      </div>

      {composing && !asAdmin && (
        <div className="mt-4 space-y-2 rounded-lg border border-border bg-background/40 p-3">
          <Input placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={160} />
          <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="billing">Billing</SelectItem>
              <SelectItem value="bug">Bug</SelectItem>
              <SelectItem value="feature">Feature request</SelectItem>
              <SelectItem value="account">Account</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <Textarea placeholder="Describe the issue. The more detail the faster we can fix it." value={body} onChange={(e) => setBody(e.target.value)} rows={4} maxLength={4000} />
          <Button onClick={submitNew} disabled={busy || subject.length < 3 || body.length < 5} size="sm">
            {busy ? "Submitting…" : "Open ticket"}
          </Button>
        </div>
      )}

      <div className="mt-4 space-y-1.5">
        {!mine || mine.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-card/40 px-3 py-4 text-center text-xs text-muted-foreground">
            {asAdmin ? "No tickets yet." : "No tickets. We reply in-app, no email back-and-forth."}
          </p>
        ) : (
          mine.map((t) => (
            <button
              key={t.id}
              onClick={() => setOpenId(t.id)}
              className="flex w-full items-center justify-between rounded-lg border border-border bg-card/40 px-3 py-2 text-left transition hover:border-primary"
            >
              <div className="min-w-0">
                <div className="truncate font-data text-sm text-foreground">{t.subject}</div>
                <div className="font-data text-[10px] text-muted-foreground">
                  {t.category} · updated {new Date(t.updated_at).toLocaleDateString()}
                  {asAdmin && t.user_email ? ` · ${t.user_email}` : ""}
                </div>
              </div>
              <span className={`rounded-md px-2 py-0.5 font-data text-[10px] font-bold uppercase tracking-wider ${
                t.status === "closed" ? "bg-secondary text-muted-foreground" :
                t.last_reply_by === "user" ? "bg-gold/20 text-gold border border-gold/40" :
                "bg-matrix/20 text-matrix border border-matrix/40"
              }`}>{t.status}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
