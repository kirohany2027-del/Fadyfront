import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { SendSms } from "@/components/SendSms";
import { accountImageFile, downloadAccountImage, shareAccountImage } from "@/lib/account-image";
import { QRCodeSVG } from "qrcode.react";
import { Download, IdCard, Loader2, MessageCircle, Printer, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/Brand";
import { OWNER_PHONE, STATUSES, customersQuery, daysUntil, dueLabel, orderMessage, trackLink, waLink, type Customer } from "@/lib/tailor";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/cards")({
  head: () => ({ meta: [
    { title: "كروت العملاء | المعلم فادي يسري" },
    { name: "description", content: "كروت فيها اسم العميل وكود المتابعة وموعد التسليم ومكان الختم، جاهزة للطباعة." },
    { property: "og:title", content: "كروت العملاء | المعلم فادي يسري" },
    { property: "og:description", content: "كروت فيها اسم العميل وكود المتابعة وموعد التسليم ومكان الختم، جاهزة للطباعة." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: CustomerCards,
});

const FILTERS = [["all", "الكل"], ["open", "لسه مش متسلّم"], ["soon", "تسليم قريب"]] as const;
export type CardFilter = (typeof FILTERS)[number][0];

/** Which customers a cards filter keeps: "open" = not handed over yet, "soon" = due within two days. */
export function matchesCardFilter(c: Pick<Customer, "status" | "due_date">, f: CardFilter) {
  if (f === "all") return true;
  if (f === "open") return c.status < 4;
  return (daysUntil(c.due_date) ?? 99) <= 2;
}

function CustomerCards() {
  const { data = [], isLoading } = useQuery(customersQuery());
  const [q, setQ] = useState("");
  const [f, setF] = useState<(typeof FILTERS)[number][0]>("all");

  const list = useMemo(
    () =>
      data
        .filter((c) => (c.name + c.code + c.phone).toLowerCase().includes(q.toLowerCase()))
        .filter((c) => matchesCardFilter(c, f)),
    [data, q, f],
  );

  if (isLoading) return <div className="grid place-items-center py-24"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="no-print flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="flex items-center gap-2 text-xl font-extrabold"><IdCard className="size-5 text-primary" /> كروت العملاء</h1>
          <p className="text-sm text-muted-foreground">كل كارت فيها الاسم، كود المتابعة، موعد التسليم، ومكان الختم.</p>
        </div>
        <Button variant="gold" size="lg" onClick={() => window.print()} disabled={!list.length}><Printer /> طباعة الكروت</Button>
      </div>

      <div className="no-print card-surface p-4">
        <div className="relative">
          <Search className="absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث بالاسم أو الكود أو التليفون" className="h-12 rounded-2xl ps-10" />
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map(([k, t]) => (
            <button key={k} onClick={() => setF(k)} className={cn("shrink-0 rounded-full border px-4 py-1.5 text-sm font-bold transition", f === k ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary/40")}>{t}</button>
          ))}
        </div>
      </div>

      {list.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => <Card key={c.id} c={c} />)}
        </div>
      ) : (
        <div className="card-surface py-12 text-center">
          <IdCard className="mx-auto mb-3 size-8 text-muted-foreground" />
          <p className="text-muted-foreground">{data.length ? "مفيش نتايج، جرّب كلمة تانية." : "لسه مفيش عملاء. ابدأ بأول عميل."}</p>
          {!data.length && <Button asChild variant="gold" className="mt-4"><Link to="/app/new">إضافة عميل</Link></Button>}
        </div>
      )}
    </div>
  );
}

function Card({ c }: { c: Customer }) {
  const link = trackLink(c.code, window.location.origin);
  const d = daysUntil(c.due_date);
  const near = c.status < 4 && d !== null && d <= 2;
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  async function makeFile() {
    const { toBlob } = await import("html-to-image");
    const blob = await toBlob(ref.current!, { pixelRatio: 3, backgroundColor: "#ffffff" });
    if (!blob) throw new Error("no image");
    return accountImageFile(blob, `card-${c.code}`);
  }
  async function download() {
    setBusy(true);
    try { downloadAccountImage(await makeFile()); toast.success("الكارت اتحمّل"); }
    catch { toast.error("معرفناش نعمل صورة الكارت"); }
    finally { setBusy(false); }
  }
  async function sendWa() {
    setBusy(true);
    try {
      const file = await makeFile();
      if (!(await shareAccountImage(file))) {
        downloadAccountImage(file);
        if (c.phone) window.open(waLink(c.phone, orderMessage(c, window.location.origin)), "_blank");
        toast.info("الكارت اتحمّل، ابعته في المحادثة اللي اتفتحت");
      }
    } catch (e) { if ((e as Error)?.name !== "AbortError") toast.error("معرفناش نبعت الكارت"); }
    finally { setBusy(false); }
  }
  return (
    <div className="break-inside-avoid space-y-2">
    <div ref={ref} className="card-surface overflow-hidden">
      <div className="h-1.5" style={{ background: "var(--tape)", backgroundSize: "30px 5px, 100% 100%", backgroundRepeat: "repeat-x" }} />
      <div className="flex gap-3 p-3.5">
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center gap-2 border-b border-dashed border-border pb-2">
            <BrandMark className="size-8" />
            <div className="min-w-0 leading-tight">
              <div className="truncate font-display text-sm">المعلم فادي يسري</div>
              <div dir="ltr" className="truncate text-[11px] font-extrabold text-primary">{c.code}</div>
            </div>
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground">الاسم</div>
            <Link to="/app/c/$id" params={{ id: c.id }} className="block truncate text-lg font-extrabold hover:underline">{c.name}</Link>
          </div>
          <div className="truncate text-xs text-muted-foreground">{c.garment || "—"} · {STATUSES[c.status]}</div>
          <div className={cn("rounded-xl px-2.5 py-1.5", near ? "bg-warning/15" : "bg-secondary")}>
            <div className="text-[10px] text-muted-foreground">موعد التسليم</div>
            <div dir="ltr" className={cn("text-sm font-extrabold", near ? "text-warning" : "text-primary")}>{c.due_date || "—"}{near && <span className="ms-1 font-bold">({dueLabel(d!)})</span>}</div>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-center gap-2">
          <div className="rounded-xl border border-border bg-card p-1.5">
            <QRCodeSVG value={link} size={86} marginSize={1} level="M" title={`كود متابعة ${c.name}`} />
          </div>
          <div className="grid size-[86px] place-items-center rounded-xl border-2 border-dashed border-border bg-muted/40">
            <span className="text-[10px] font-bold text-muted-foreground/70">ختم</span>
          </div>
        </div>
      </div>
      <div className="border-t border-dashed border-border px-3.5 py-1.5 text-center text-[11px] text-muted-foreground">للتواصل مع المعلم فادي: <span dir="ltr" className="font-extrabold text-success">{OWNER_PHONE}</span></div>
    </div>
    <div className="no-print grid grid-cols-3 gap-1.5">
      <Button size="sm" variant="outline" onClick={download} disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : <Download />} تحميل</Button>
      <Button size="sm" className="bg-success text-success-foreground hover:bg-success/90" onClick={sendWa} disabled={busy || !c.phone}><MessageCircle /> واتساب</Button>
      <SendSms c={c} size="sm" />
    </div>
    </div>
  );
}
