import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Loader2, Send } from "lucide-react";
import { supabase } from "@/lib/api-client";
import { Brand } from "@/components/Brand";
import { BalanceHero, StatusSteps } from "@/components/AccountSummary";
import { Button } from "@/components/ui/button";
import { OWNER_PHONE, daysUntil, dueLabel, money, trackLink } from "@/lib/tailor";
import { QRCodeSVG } from "qrcode.react";
import { BrandMark } from "@/components/Brand";
import { FooterCredit } from "@/components/FooterCredit";

type Pub = { code: string; name: string; garment: string; total: number; status: number; due_date: string | null; payments: { amount: number; paid_on: string }[] };

export const Route = createFileRoute("/track/$code")({
  ssr: false,
  head: ({ params }) => ({
    meta: [
      { title: `حساب العميل ${params.code} | المعلم فادي يسري` },
      { name: "description", content: "تابع حالة طلبك والباقي عليك ومواعيد التسليم." },
      { property: "og:title", content: "حساب العميل | المعلم فادي يسري" },
      { property: "og:description", content: "تابع حالة طلبك والباقي عليك." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Track,
});

function Track() {
  const { code } = Route.useParams();
  return <CustomerScreen code={code} />;
}

/** Customer-facing order screen. `standalone` hides the way back to the login screen (link sent to the customer). */
export function CustomerScreen({ code, standalone = false }: { code: string; standalone?: boolean }) {
  const { data, isLoading } = useQuery({
    queryKey: ["track", code],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_customer_by_code", { _code: code });
      if (error) throw error;
      return data as unknown as Pub | null;
    },
  });
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-hero tape-edge px-5 pb-6 pt-5 text-primary-foreground">
        <div className="mx-auto flex max-w-xl items-center justify-between">
          <Brand subtitle="حساب العميل" />
          {!standalone && <Button asChild variant="glass" size="sm"><Link to="/"><ArrowRight /> خروج</Link></Button>}
        </div>
      </header>
      <main className="mx-auto max-w-xl space-y-4 p-4 pt-6">
        {isLoading ? (
          <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-primary" /></div>
        ) : !data ? (
          <div className="card-surface p-8 text-center">
            <p className="font-bold">الكود ده مش موجود</p>
            <p className="mt-1 text-sm text-muted-foreground">راجع الكود المكتوب على الكارت.</p>
            {!standalone && <Button asChild className="mt-5"><Link to="/">رجوع</Link></Button>}
          </div>
        ) : (
          <>
            <CustomerCard data={data} />
            <BalanceHero total={Number(data.total)} paid={data.payments.reduce((s, p) => s + Number(p.amount), 0)} due={data.due_date} />
            <div className="card-surface p-5"><h2 className="mb-4 font-bold">حالة الطلب</h2><StatusSteps status={data.status} /></div>
            <div className="card-surface p-5">
              <h2 className="mb-2 font-bold">الدفعات</h2>
              {data.payments.length ? data.payments.map((p, i) => (
                <div key={i} className="flex justify-between border-t border-border py-3 first:border-0"><span className="text-muted-foreground">{p.paid_on}</span><b>{money(p.amount)}</b></div>
              )) : <p className="text-sm text-muted-foreground">لسه مفيش دفعات.</p>}
            </div>
            <Chat code={data.code} />
          </>
        )}
        <FooterCredit className="pt-2 pb-6" />
      </main>
    </div>
  );
}

type M = { sender: "customer" | "owner"; body: string; created_at: string };

function Chat({ code }: { code: string }) {
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const { data = [] } = useQuery({
    queryKey: ["track-msgs", code],
    refetchInterval: 20000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_messages_by_code", { _code: code });
      if (error) throw error;
      return (data ?? []) as unknown as M[];
    },
  });
  async function send() {
    if (!text.trim()) return undefined;
    setBusy(true);
    const { error } = await supabase.rpc("send_customer_message", { _code: code, _body: text.trim().slice(0, 1000) });
    setBusy(false);
    if (error) { toast.error("الرسالة ما اتبعتتش، جرّب تاني"); return undefined; }
    setText("");
    toast.success("رسالتك وصلت للمعلم فادي");
    qc.invalidateQueries({ queryKey: ["track-msgs", code] });
    return undefined;
  }
  return (
    <div className="card-surface space-y-3 p-5">
      <h2 className="font-bold">راسل المعلم فادي</h2>
      {data.length > 0 && (
        <div className="max-h-72 space-y-2 overflow-y-auto rounded-2xl bg-secondary/50 p-3">
          {data.map((m, i) => (
            <div key={i} className={"max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm " + (m.sender === "customer" ? "ms-auto bg-primary text-primary-foreground" : "bg-card")}>
              {m.sender === "owner" && <div className="mb-0.5 text-[10px] font-bold text-accent">المعلم فادي</div>}
              {m.body}
            </div>
          ))}
        </div>
      )}
      <Textarea value={text} maxLength={1000} onChange={(e) => setText(e.target.value)} placeholder="اكتب سؤالك أو استفسارك عن الطلب" rows={3} />
      <Button className="w-full" onClick={send} disabled={busy || !text.trim()}>{busy ? <Loader2 className="animate-spin" /> : <Send />} إرسال</Button>
    </div>
  );
}

function CustomerCard({ data }: { data: Pub }) {
  const d = daysUntil(data.due_date);
  const near = data.status < 4 && d !== null && d <= 2;
  return (
    <div className="card-surface overflow-hidden">
      <div className="h-1.5" style={{ background: "var(--tape)", backgroundSize: "30px 5px, 100% 100%", backgroundRepeat: "repeat-x" }} />
      <div className="flex gap-3 p-4">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2 border-b border-dashed border-border pb-2">
            <BrandMark className="size-9" />
            <div className="min-w-0 leading-tight">
              <div className="truncate font-display text-sm">المعلم فادي يسري</div>
              <div dir="ltr" className="truncate text-xs font-extrabold text-primary">{data.code}</div>
            </div>
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground">الاسم</div>
            <div className="truncate text-xl font-extrabold">{data.name}</div>
          </div>
          <div className="truncate text-sm text-muted-foreground">{data.garment || "—"}</div>
          <div className={"rounded-xl px-3 py-2 " + (near ? "bg-warning/15" : "bg-secondary")}>
            <div className="text-[11px] text-muted-foreground">موعد التسليم</div>
            <div dir="ltr" className={"font-extrabold " + (near ? "text-warning" : "text-primary")}>{data.due_date || "—"}{near && <span className="ms-1 font-bold">({dueLabel(d!)})</span>}</div>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-center gap-2">
          <div className="rounded-xl border border-border bg-card p-1.5"><QRCodeSVG value={trackLink(data.code, window.location.origin)} size={92} marginSize={1} level="M" /></div>
          <div className="grid size-[92px] place-items-center rounded-xl border-2 border-dashed border-border bg-muted/40"><span className="text-[10px] font-bold text-muted-foreground/70">ختم</span></div>
        </div>
      </div>
      <a href={`tel:${OWNER_PHONE}`} className="block border-t border-dashed border-border px-4 py-2 text-center text-xs text-muted-foreground">للتواصل مع المعلم فادي: <span dir="ltr" className="font-extrabold text-success">{OWNER_PHONE}</span></a>
    </div>
  );
}
