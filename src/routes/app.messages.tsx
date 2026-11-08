import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Loader2, MessageCircle, MessageSquareText, MessagesSquare, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { STATUSES, customersQuery, money, remainingOf, smsLink, trackLink, waLink, type Customer } from "@/lib/tailor";
import { draftReply } from "@/lib/ai-reply.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/messages")({
  head: () => ({ meta: [
    { title: "رسائل العملاء | المعلم فادي يسري" },
    { name: "description", content: "رسائل العملاء والرد عليهم مع مساعد يكتب مسودة الرد." },
    { property: "og:title", content: "رسائل العملاء | المعلم فادي يسري" },
    { property: "og:description", content: "رسائل العملاء والرد عليهم مع مساعد يكتب مسودة الرد." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Messages,
});

type Msg = { id: string; customer_id: string; sender: "customer" | "owner"; body: string; read_at: string | null; created_at: string };

const msgsQuery = { queryKey: ["messages"], queryFn: async () => {
  const { data, error } = await supabase.from("messages").select("id,customer_id,sender,body,read_at,created_at").order("created_at");
  if (error) throw error;
  return data as Msg[];
} };

function orderDetails(c: Customer) {
  return [`الاسم: ${c.name}`, `التفصيل: ${c.garment || "—"}`, `الحالة: ${STATUSES[c.status]}`, `موعد التسليم: ${c.due_date || "مش متحدد"}`, `الإجمالي: ${money(c.total)}`, `الباقي: ${money(remainingOf(c))}`, c.notes ? `ملاحظات: ${c.notes}` : ""].filter(Boolean).join("\n");
}

function Messages() {
  const { data: customers = [] } = useQuery(customersQuery());
  const { data: msgs = [], isLoading } = useQuery(msgsQuery);
  const [sel, setSel] = useState<string>("");

  const threads = useMemo(() => {
    const by = new Map<string, Msg[]>();
    msgs.forEach((m) => by.set(m.customer_id, [...(by.get(m.customer_id) ?? []), m]));
    return customers
      .map((c) => ({ c, list: by.get(c.id) ?? [] }))
      .sort((a, b) => (b.list.at(-1)?.created_at ?? "").localeCompare(a.list.at(-1)?.created_at ?? ""));
  }, [customers, msgs]);
  const current = threads.find((t) => t.c.id === sel);

  if (isLoading) return <div className="grid place-items-center py-24"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-extrabold"><MessagesSquare className="size-5 text-primary" /> رسائل العملاء</h1>
        <p className="text-sm text-muted-foreground">العميل يبعتلك من صفحة متابعة طلبه، أو اكتب سؤاله بنفسك وخلي المساعد يكتبلك رد تراجعه قبل ما تبعته.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-[280px_1fr]">
        <div className={cn("card-surface max-h-[70vh] overflow-y-auto p-2", current && "hidden md:block")}>
          {threads.length ? threads.map(({ c, list }) => {
            const unread = list.filter((m) => m.sender === "customer" && !m.read_at).length;
            return (
              <button key={c.id} onClick={() => setSel(c.id)} className={cn("flex w-full items-center gap-2 rounded-xl p-3 text-start transition hover:bg-secondary", sel === c.id && "bg-secondary")}>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-bold">{c.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{list.at(-1)?.body ?? "مفيش رسائل"}</div>
                </div>
                {unread > 0 && <span className="grid size-6 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{unread}</span>}
              </button>
            );
          }) : <p className="p-6 text-center text-sm text-muted-foreground">لسه مفيش عملاء.</p>}
        </div>
        {current ? <Thread key={current.c.id} c={current.c} list={current.list} onBack={() => setSel("")} /> : (
          <div className="card-surface hidden place-items-center p-10 text-sm text-muted-foreground md:grid">اختار عميل من القائمة</div>
        )}
      </div>
    </div>
  );
}

function Thread({ c, list, onBack }: { c: Customer; list: Msg[]; onBack: () => void }) {
  const qc = useQueryClient();
  const draft = draftReply;
  const lastQ = [...list].reverse().find((m) => m.sender === "customer")?.body ?? "";
  const [question, setQuestion] = useState(lastQ);
  const [reply, setReply] = useState("");

  useEffect(() => {
    const ids = list.filter((m) => m.sender === "customer" && !m.read_at).map((m) => m.id);
    if (ids.length) supabase.from("messages").update({ read_at: new Date().toISOString() }).in("id", ids).then(() => qc.invalidateQueries({ queryKey: ["messages"] }));
  }, [list, qc]);

  const gen = useMutation({
    mutationFn: async () => {
      const r = await draft({ data: { question, details: orderDetails(c) } });
      if ("error" in r && r.error) throw new Error(r.error);
      return (r as { text: string }).text;
    },
    onSuccess: (t) => setReply(t),
    onError: (e) => toast.error((e as Error).message),
  });
  const send = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("messages").insert({ owner_id: u.user!.id, customer_id: c.id, sender: "owner", body: reply.trim() });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("الرد اتحفظ وظهر للعميل في صفحة طلبه"); qc.invalidateQueries({ queryKey: ["messages"] }); },
    onError: () => toast.error("معرفناش نحفظ الرد"),
  });
  const full = `${reply.trim()}\n\nتابع طلبك: ${trackLink(c.code, window.location.origin)}`;

  return (
    <div className="card-surface space-y-4 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0"><div className="truncate font-extrabold">{c.name}</div><div className="text-xs text-muted-foreground">{c.garment || "—"} · {STATUSES[c.status]}</div></div>
        <Button variant="outline" size="sm" className="md:hidden" onClick={onBack}>رجوع</Button>
      </div>
      <div className="max-h-72 space-y-2 overflow-y-auto rounded-2xl bg-secondary/50 p-3">
        {list.length ? list.map((m) => (
          <div key={m.id} className={cn("max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm", m.sender === "customer" ? "bg-card" : "ms-auto bg-primary text-primary-foreground")}>{m.body}</div>
        )) : <p className="py-4 text-center text-xs text-muted-foreground">مفيش رسائل لسه.</p>}
      </div>
      <div className="space-y-1.5">
        <Label>سؤال العميل</Label>
        <Textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="اكتب سؤال العميل هنا (مثلاً: البدلة هتخلص امتى؟)" rows={2} />
      </div>
      <Button variant="gold" className="w-full" disabled={!question.trim() || gen.isPending} onClick={() => gen.mutate()}>
        {gen.isPending ? <Loader2 className="animate-spin" /> : <Sparkles />} اكتبلي رد
      </Button>
      <div className="space-y-1.5">
        <Label>الرد (راجعه وعدّل فيه قبل الإرسال)</Label>
        <Textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="اكتب ردك أو خلي المساعد يكتبه" rows={5} />
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <Button disabled={!reply.trim() || send.isPending} onClick={() => send.mutate()}><Send /> رد في التطبيق</Button>
        <Button asChild variant="outline" className={cn(!reply.trim() || !c.phone ? "pointer-events-none opacity-50" : "")}>
          <a target="_blank" rel="noreferrer" href={c.phone ? waLink(c.phone, full) : "#"}><MessageCircle /> واتساب</a>
        </Button>
        <Button asChild variant="outline" className={cn(!reply.trim() || !c.phone ? "pointer-events-none opacity-50" : "")}>
          <a href={c.phone ? smsLink(c.phone, full) : "#"}><MessageSquareText /> SMS</a>
        </Button>
      </div>
    </div>
  );
}
