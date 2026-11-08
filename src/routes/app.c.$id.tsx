import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ArrowRight, Check, Loader2, Pencil, Printer, Receipt, Ruler, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { BalanceHero, StatusSteps } from "@/components/AccountSummary";
import { CustomerForm } from "@/components/CustomerForm";
import { BrandMark } from "@/components/Brand";
import { AccountImageShare } from "@/components/AccountImageShare";
import { SendSms } from "@/components/SendSms";
import { OWNER_PHONE, orderMessage, waLink as waLinkFn } from "@/lib/tailor";
import { Smartphone } from "lucide-react";
import { FooterCredit } from "@/components/FooterCredit";
import { STATUSES, customerQuery, money, paidOf, remainingOf, today, type Customer } from "@/lib/tailor";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/c/$id")({
  head: () => ({ meta: [
    { title: "كارت المقاسات والحساب | المعلم فادي يسري" },
    { name: "description", content: "مقاسات العميل وبيانات التفصيل والدفعات والفاتورة." },
    { property: "og:title", content: "كارت المقاسات والحساب | المعلم فادي يسري" },
    { property: "og:description", content: "مقاسات العميل وبيانات التفصيل والدفعات والفاتورة." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: CustomerPage,
});

const TABS = [["card", "المقاسات", Ruler], ["acct", "الحساب", Wallet], ["inv", "الفاتورة", Receipt]] as const;

function CustomerPage() {
  const { id } = Route.useParams();
  const { data: c, isLoading } = useQuery(customerQuery(id));
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("card");
  const [edit, setEdit] = useState(false);
  const qc = useQueryClient();
  const nav = useNavigate();

  if (isLoading) return <div className="grid place-items-center py-24"><Loader2 className="animate-spin text-primary" /></div>;
  if (!c) return <div className="card-surface p-8 text-center">العميل ده مش موجود. <Link to="/app" className="text-primary underline">رجوع</Link></div>;

  const refresh = () => qc.invalidateQueries({ queryKey: ["customers"] });
  const update = async (patch: Partial<Omit<Customer, "payments">>) => {
    const { error } = await supabase.from("customers").update(patch).eq("id", c.id);
    if (error) toast.error("تعذر الحفظ");
    await refresh();
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="no-print flex items-center gap-3">
        <Button asChild variant="outline" size="icon"><Link to="/app"><ArrowRight /></Link></Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-extrabold">{c.name}</h1>
          <div className="text-sm text-muted-foreground"><span dir="ltr" className="font-bold text-primary">{c.code}</span> · {c.garment || "—"} · {STATUSES[c.status]}</div>
        </div>
        <Button variant="outline" size="icon" onClick={() => setEdit(true)} aria-label="تعديل"><Pencil /></Button>
        <AlertDialog>
          <AlertDialogTrigger asChild><Button variant="outline" size="icon" className="text-destructive" aria-label="حذف"><Trash2 /></Button></AlertDialogTrigger>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader><AlertDialogTitle>حذف العميل {c.name}؟</AlertDialogTitle><AlertDialogDescription>هيتمسح كارت المقاسات وكل الدفعات نهائياً.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={async () => {
                await supabase.from("customers").delete().eq("id", c.id);
                await refresh(); toast.success("تم حذف العميل"); nav({ to: "/app" });
              }}>حذف</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="no-print grid grid-cols-3 gap-1 rounded-2xl bg-muted p-1">
        {TABS.map(([k, t, Icon]) => (
          <button key={k} onClick={() => setTab(k)} className={cn("flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold text-muted-foreground transition", tab === k && "bg-card text-primary shadow-soft")}>
            <Icon className="size-4" /><span className="truncate">{t}</span>
          </button>
        ))}
      </div>

      {tab === "card" && <MeasureCard c={c} update={update} />}
      {tab === "acct" && <Account c={c} update={update} refresh={refresh} />}
      {tab === "inv" && <Invoice c={c} />}

      <Dialog open={edit} onOpenChange={setEdit}>
        <DialogContent dir="rtl" className="max-h-[90vh] overflow-y-auto rounded-3xl">
          <DialogHeader><DialogTitle>تعديل بيانات العميل</DialogTitle></DialogHeader>
          <CustomerForm
            initial={{ name: c.name, phone: c.phone, garment: c.garment, total: Number(c.total), due_date: c.due_date ?? "", status: c.status }}
            onCancel={() => setEdit(false)}
            onSubmit={async (v) => { await update({ ...v, due_date: v.due_date || null }); setEdit(false); toast.success("تم حفظ التعديل"); }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

const ROWS: { label: string; tone: "red" | "blue"; keys: [string, string][] }[] = [
  { label: "الطول", tone: "red", keys: [["len", "الطول"]] },
  { label: "الكتف", tone: "blue", keys: [["sh", "الكتف"]] },
  { label: "الكم", tone: "red", keys: [["sr", "يمين"], ["sl", "شمال"]] },
  { label: "البدن", tone: "blue", keys: [["br", "يمين"], ["bl", "شمال"]] },
  { label: "القب", tone: "red", keys: [["nk", "القب"]] },
];

const TONE_BOX: Record<"red" | "blue" | "green", string> = {
  red: "border-measure-red/60 bg-measure-red/5 hover:border-measure-red focus-visible:border-measure-red focus-visible:ring-measure-red/25",
  blue: "border-measure-blue/60 bg-measure-blue/5 hover:border-measure-blue focus-visible:border-measure-blue focus-visible:ring-measure-blue/25",
  green: "border-success/60 bg-success/5 hover:border-success focus-visible:border-success focus-visible:ring-success/25",
};
const TONE_TEXT: Record<"red" | "blue" | "green", string> = {
  red: "text-measure-red",
  blue: "text-measure-blue",
  green: "text-success",
};

const SHAPES: { key: string; label: string; tone: "red" | "blue" | "green"; icon: ReactNode }[] = [
  { key: "d4", label: "القب", tone: "red", icon: <svg viewBox="0 0 44 70" className="h-5 w-auto" fill="none" stroke="currentColor" strokeWidth="5"><path d="M3 6v22l14 6v32M41 6v22L27 34v32" /></svg> },
  { key: "d3", label: "دايرة", tone: "red", icon: <svg viewBox="0 0 80 70" className="h-5 w-auto" fill="none" stroke="currentColor" strokeWidth="5"><ellipse cx="40" cy="35" rx="34" ry="29" /></svg> },
  { key: "d2", label: "سهم", tone: "green", icon: <svg viewBox="0 0 30 70" className="h-5 w-auto" fill="none" stroke="currentColor" strokeWidth="6"><path d="M15 4v50M4 46l11 18 11-18" /></svg> },
  { key: "d1", label: "بدن", tone: "blue", icon: <svg viewBox="0 0 64 56" className="h-5 w-auto" fill="none" stroke="currentColor" strokeWidth="8"><path d="M2 12h48v28M38 38l12 16 12-16" /></svg> },
];

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="text-sm font-extrabold">{children}</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

function InfoRow({ children, dotted = true }: { children: ReactNode; dotted?: boolean }) {
  return <div className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-0.5 py-1.5", dotted && "border-b border-dotted border-border/70")}>{children}</div>;
}

function MeasureCard({ c, update }: { c: Customer; update: (p: Partial<Omit<Customer, "payments">>) => Promise<void> }) {
  const [m, setM] = useState(c.measurements ?? {});
  const [notes, setNotes] = useState(c.notes);
  const dirty = JSON.stringify(m) !== JSON.stringify(c.measurements ?? {}) || notes !== c.notes;
  const left = Math.max(remainingOf(c), 0);
  return (
    <div className="card-surface overflow-hidden">
      <div className="h-3" style={{ background: "var(--tape)", backgroundSize: "30px 6px, 100% 100%", backgroundRepeat: "repeat-x" }} />
      <div className="p-4 sm:p-6 md:p-7">
        <div className="mb-4 flex items-center gap-3 border-b border-dashed border-border pb-4">
          <BrandMark />
          <div className="flex-1"><div className="font-display text-lg">المعلم فادي يسري</div><div className="text-xs text-muted-foreground">بطاقة مقاسات العميل</div></div>
          <span dir="ltr" className="rounded-xl bg-secondary px-3 py-1.5 font-extrabold text-primary">{c.code}</span>
        </div>

        <div className="mb-5 text-sm">
          <InfoRow><span className="shrink-0 text-muted-foreground">الاسم :</span><b className="min-w-0 break-words font-extrabold text-success">{c.name}</b></InfoRow>
          <InfoRow><span className="shrink-0 text-muted-foreground">التفصيل :</span><b className="min-w-0 break-words font-extrabold text-measure-red">{c.garment || "—"}</b></InfoRow>
          <InfoRow>
            <span className="text-muted-foreground">واصل :</span><b className="text-success">{money(paidOf(c))}</b>
            <span className="ms-auto text-muted-foreground">باقي :</span><b className={left > 0 ? "text-destructive" : "text-success"}>{money(left)}</b>
          </InfoRow>
          <InfoRow><span className="shrink-0 text-muted-foreground">التليفون :</span><b dir="ltr" className="min-w-0 break-words">{c.phone || "—"}</b></InfoRow>
          <InfoRow dotted={false}><span className="shrink-0 text-muted-foreground">موعد التسليم :</span><b dir="ltr" className="min-w-0">{c.due_date || "—"}</b></InfoRow>
        </div>

        <SectionTitle>المقاسات</SectionTitle>
        <div className="space-y-2.5 md:space-y-3">
          {ROWS.map((r) => (
            <div key={r.label} className="grid grid-cols-[4rem_minmax(0,1fr)] items-center gap-2 sm:grid-cols-[5rem_minmax(0,1fr)] sm:gap-3">
              <Label htmlFor={`measurement-${r.keys[0]?.[0] ?? ""}`} className={cn("flex items-center gap-1 text-sm font-extrabold sm:text-base", TONE_TEXT[r.tone])}>
                <span className="truncate">{r.label}</span><span aria-hidden className="text-[9px] opacity-50">♣</span>
              </Label>
              <div className={cn("grid min-w-0 gap-2 sm:gap-3", r.keys.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
                {r.keys.map(([k, ph]) => (
                  <Input key={k} id={`measurement-${k}`} aria-label={r.keys.length > 1 ? `${r.label} ${ph}` : r.label} dir="ltr" inputMode="decimal" autoComplete="off" placeholder={r.keys.length > 1 ? ph : "—"} value={m[k] ?? ""} onChange={(e) => setM({ ...m, [k]: e.target.value })}
                    className={cn("h-11 min-w-0 rounded-[10px] border-2 px-1 text-center text-lg font-extrabold tabular-nums text-foreground shadow-none transition-colors sm:h-14 sm:text-xl placeholder:text-xs placeholder:font-medium placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-offset-0", TONE_BOX[r.tone])} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5">
          <SectionTitle>ملاحظات الأشكال</SectionTitle>
          <div className="grid grid-cols-4 gap-2">
            {SHAPES.map((s) => (
              <label key={s.key} className={cn("flex flex-col items-center gap-0.5 rounded-[10px] border-2 px-1 py-1.5 transition-colors", TONE_BOX[s.tone])}>
                <span className={TONE_TEXT[s.tone]}>{s.icon}</span>
                <span className="text-[10px] font-bold text-muted-foreground">{s.label}</span>
                <Input dir="ltr" inputMode="decimal" autoComplete="off" aria-label={s.label} value={m[s.key] ?? ""} onChange={(e) => setM({ ...m, [s.key]: e.target.value })}
                  className="h-7 w-full min-w-0 border-0 bg-transparent p-0 text-center text-sm font-extrabold tabular-nums shadow-none focus-visible:ring-0" />
              </label>
            ))}
          </div>
        </div>

        <div className="mt-5 space-y-1.5">
          <Label>ملاحظات التفصيل</Label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="شكل الياقة، الجيوب، الزراير..." className="w-full rounded-xl border border-input bg-background p-3 text-sm" />
        </div>
        <div className="no-print mt-5 flex gap-2">
          <Button variant="success" size="lg" className="flex-1" disabled={!dirty} onClick={async () => { await update({ measurements: m, notes }); toast.success("تم حفظ المقاسات"); }}><Check /> حفظ المقاسات</Button>
          <Button variant="outline" size="lg" onClick={() => window.print()}><Printer /> طباعة</Button>
        </div>
      </div>
    </div>
  );
}

function Account({ c, update, refresh }: { c: Customer; update: (p: Partial<Omit<Customer, "payments">>) => Promise<void>; refresh: () => Promise<void> }) {
  const [amount, setAmount] = useState("");
  const link = `${window.location.origin}/track/${c.code}`;
  return (
    <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
      <div className="space-y-4">
        <BalanceHero total={Number(c.total)} paid={paidOf(c)} due={c.due_date} />
        <div className="card-surface p-5">
          <h2 className="mb-4 font-bold">حالة الطلب</h2>
          <StatusSteps status={c.status} />
          <div className="mt-4 grid grid-cols-5 gap-1">
            {STATUSES.map((s, i) => (
              <button key={s} onClick={() => update({ status: i })} className={cn("rounded-lg py-1.5 text-[11px] font-bold", i === c.status ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{s}</button>
            ))}
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <div className="card-surface p-5">
          <h2 className="mb-3 font-bold">سجّل دفعة</h2>
          <form className="flex gap-2" onSubmit={async (e) => {
            e.preventDefault(); const a = +amount; if (!a) return;
            const { error } = await supabase.from("payments").insert({ customer_id: c.id, amount: a, paid_on: today() });
            if (error) { toast.error("تعذر الحفظ"); return; }
            setAmount(""); await refresh(); toast.success("تم حفظ الدفعة");
          }}>
            <Input type="number" inputMode="numeric" placeholder="المبلغ" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-12 rounded-xl" />
            <Button type="submit" variant="success" size="lg"><Check /> سجّل</Button>
          </form>
          <div className="mt-4">
            {c.payments.length ? c.payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between border-t border-border py-3">
                <span className="text-sm text-muted-foreground">{p.paid_on}</span>
                <div className="flex items-center gap-2">
                  <b>{money(p.amount)}</b>
                  <button aria-label="حذف الدفعة" className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={async () => { await supabase.from("payments").delete().eq("id", p.id); await refresh(); toast("تم حذف الدفعة"); }}><Trash2 className="size-4" /></button>
                </div>
              </div>
            )) : <p className="text-sm text-muted-foreground">لسه مفيش دفعات.</p>}
          </div>
        </div>
        <div className="card-surface flex items-center gap-4 p-5">
          <div className="rounded-2xl border border-border bg-card p-2"><QRCodeSVG value={link} size={96} /></div>
          <div className="flex-1 space-y-2">
            <p className="text-sm text-muted-foreground">العميل يقدر يتابع حسابه بالكود ده</p>
            <AccountImageShare c={c} className="h-auto min-h-12 w-full whitespace-normal" />
            {c.phone && <Button asChild variant="outline" className="w-full"><a target="_blank" rel="noreferrer" href={waLinkFn(c.phone, orderMessage(c, window.location.origin))}><Smartphone /> إرسال شاشة العميل</a></Button>}
            <SendSms c={c} className="w-full" />
            <a href={`tel:${OWNER_PHONE}`} dir="rtl" className="block text-xs text-muted-foreground">للتواصل مع المعلم فادي: <span dir="ltr" className="font-bold text-success">{OWNER_PHONE}</span></a>
          </div>
        </div>
      </div>
    </div>
  );
}

function Invoice({ c }: { c: Customer }) {
  const r = remainingOf(c);
  const no = `INV-${c.code}-${today().replace(/-/g, "").slice(2)}`;
  useEffect(() => {
    document.body.classList.add("hide-app-footer");
    return () => document.body.classList.remove("hide-app-footer");
  }, []);
  return (
    <div className="space-y-4">
      <div className="card-surface p-6 md:p-8">
        <div className="flex items-start justify-between border-b border-border pb-5">
          <div className="flex items-center gap-3"><BrandMark /><div><div className="font-display text-xl">المعلم فادي يسري</div><div className="text-xs text-muted-foreground">تفصيل وخياطة</div></div></div>
          <div className="min-w-0 max-w-[45%] text-end"><div className="text-2xl font-extrabold text-primary">فاتورة</div><div dir="ltr" className="break-all text-xs text-muted-foreground">{no}</div></div>
        </div>
        <div className="grid grid-cols-2 gap-3 py-5 text-sm">
          <div><span className="text-muted-foreground">العميل: </span><b>{c.name}</b></div>
          <div><span className="text-muted-foreground">التاريخ: </span><b>{today()}</b></div>
          <div><span className="text-muted-foreground">الكود: </span><b dir="ltr" className="text-primary">{c.code}</b></div>
          <div><span className="text-muted-foreground">التليفون: </span><b dir="ltr">{c.phone || "—"}</b></div>
        </div>
        <table className="w-full overflow-hidden rounded-xl text-sm">
          <thead className="bg-secondary text-secondary-foreground"><tr><th className="p-2.5 text-start">البيان</th><th className="p-2.5 text-start">التسليم</th><th className="p-2.5 text-start">الحالة</th><th className="p-2.5 text-start">السعر</th></tr></thead>
          <tbody><tr className="border-b border-border"><td className="p-2.5">{c.garment || "—"}</td><td className="p-2.5">{c.due_date || "—"}</td><td className="p-2.5">{STATUSES[c.status]}</td><td className="p-2.5 font-bold">{money(c.total)}</td></tr></tbody>
        </table>
        <div className="mt-5 space-y-1 text-sm">
          {c.payments.map((p) => <div key={p.id} className="flex justify-between text-muted-foreground"><span>دفعة {p.paid_on}</span><span>{money(p.amount)}</span></div>)}
        </div>
        <div className="mt-5 space-y-2 rounded-2xl bg-muted p-4">
          <div className="flex justify-between"><span>الإجمالي</span><b>{money(c.total)}</b></div>
          <div className="flex justify-between"><span>المدفوع</span><b>{money(paidOf(c))}</b></div>
          <div className="flex justify-between border-t border-border pt-2 text-lg"><span>{r > 0 ? "المتبقي" : "الحساب خالص"}</span><b className={r > 0 ? "text-destructive" : "text-success"}>{money(Math.max(r, 0))}</b></div>
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">شكراً لتعاملكم معنا</p>
        <FooterCredit printable className="mt-5 border-t border-dashed border-border pt-5" />
      </div>
      <div className="no-print flex flex-wrap gap-2">
        <Button size="lg" className="flex-1" onClick={() => window.print()}><Printer /> طباعة / PDF</Button>
        <AccountImageShare c={c} className="flex-1" />
      </div>
    </div>
  );
}
