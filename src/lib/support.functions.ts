import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const NewTicket = z.object({
  subject: z.string().min(3).max(160),
  category: z.enum(["billing", "bug", "feature", "account", "other"]).default("other"),
  body: z.string().min(5).max(4000),
});

export const createTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => NewTicket.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: ticket, error } = await supabase
      .from("support_tickets")
      .insert({ user_id: userId, subject: data.subject, category: data.category, last_reply_by: "user" })
      .select()
      .single();
    if (error || !ticket) throw new Error(error?.message || "Failed to open ticket");
    const { error: mErr } = await supabase
      .from("ticket_messages")
      .insert({ ticket_id: ticket.id, author_id: userId, author_role: "user", body: data.body });
    if (mErr) throw new Error(mErr.message);
    return { ticket };
  });

export const listMyTickets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const [{ data: ticket }, { data: messages }] = await Promise.all([
      supabase.from("support_tickets").select("*").eq("id", data.id).maybeSingle(),
      supabase.from("ticket_messages").select("*").eq("ticket_id", data.id).order("created_at"),
    ]);
    if (!ticket) throw new Error("Ticket not found");
    return { ticket, messages: messages ?? [] };
  });

const Reply = z.object({ ticket_id: z.string().uuid(), body: z.string().min(1).max(4000) });
export const replyToTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => Reply.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: ticket } = await supabase
      .from("support_tickets")
      .select("user_id")
      .eq("id", data.ticket_id)
      .maybeSingle();
    if (!ticket) throw new Error("Ticket not found");
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    const isAdmin = !!roleRow;
    const isOwner = ticket.user_id === userId;
    if (!isAdmin && !isOwner) throw new Error("Not authorized");
    const authorRole = isAdmin && !isOwner ? "admin" : isAdmin ? "admin" : "user";
    const { error } = await supabase
      .from("ticket_messages")
      .insert({ ticket_id: data.ticket_id, author_id: userId, author_role: authorRole, body: data.body });
    if (error) throw new Error(error.message);
    await supabase
      .from("support_tickets")
      .update({ last_reply_by: authorRole, status: authorRole === "admin" ? "in_progress" : "open" })
      .eq("id", data.ticket_id);
    return { ok: true };
  });
