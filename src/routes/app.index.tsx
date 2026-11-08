import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AlarmClock, ChevronLeft, Loader2, Search, Scissors, Wallet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { STATUSES, customersQuery, daysUntil, dueLabel, money, remainingOf, waLink } from "@/lib/tailor";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [
    { title: "العملاء ومواعيد التسليم | المعلم فادي يسري" },
    { name: "description", content: "قائمة العملاء وحالة الطلبات والدفعات ومواعيد التسليم." },
    { property: "og:title", content: "العملاء ومواعيد التسليم | المعلم فادي يسري" },
    { property: "og:description", content: "قائمة العملاء وحالة الطلبات والدفعات ومواعيد التسليم." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Dashboard,
});

const FILTERS = [["all", "الكل"], ["due", "عليهم باقي"], ["ready", "جاهز"], ["soon", "تسليم قريب"]] as const;

function Dashboard() {
  const { data = [], isLoading } = useQuery(customersQuery());
  const [q, setQ] = useState("");
  const [f, setF] = useState<(typeof FILTERS)[number][0]>("all");

  const soon = data.filter((c) => c.status < 4 && (daysUntil(c.due_date) ?? 99) <= 2);
  const owed = data.reduce((s, c) => s + Math.max(remainingOf(c), 0), 0);
  const list = useMemo(
    () =>
      data.filter((c) => (c.name + c.code + c.phone).toLowerCase().includes(q.toLowerCase())).filter((c) =>
        f === "all" ? true : f === "due" ? remainingOf(c) > 0 : f === "ready" ? c.status === 3 : soon.includes(c),
      ),
    [data, q, f, soon],
  );

  if (isLoading) return <div className="grid place-items-center py-24"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="bg-hero col-span-2 rounded-3xl p-5 text-primary-foreground shadow-lift">
          <div className="flex items-center gap-2 text-sm opacity-75"><Wallet className="size-4" /> إجمالي الباقي عند العملاء</div>
          <div className="mt-1 text-4xl font-extrabold text-accent">{money(owed)}</div>
        </div>
        <Stat label="العملاء" value={data.length} />
        <Stat label="جاهز للتسليم" value={data.filter((c) => c.status === 3).length} />
      </div>

      {soon.length > 0 && (
        <div className="rounded-3xl border border-warning/30 bg-warning/10 p-4">
          <div className="mb-2 flex items-center gap-2 font-bold text-warning"><AlarmClock className="size-4" /> مواعيد تسليم قريبة ({soon.length})</div>
          {soon.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-2 py-1.5 text-sm">
              <Link to="/app/c/$id" params={{ id: c.id }} className="font-bold hover:underline">{c.name} <span dir="ltr" className="text-xs text-muted-foreground">{c.code}</span></Link>
              <div className="flex items-center gap-2">
                <b className="text-warning">{dueLabel(daysUntil(c.due_date)!)}</b>
                {c.phone && <a target="_blank" rel="noreferrer" href={waLink(c.phone, `أهلاً ${c.name}، موعد تسليم طلبك ${dueLabel(daysUntil(c.due_date)!)}`)} className="text-xs text-success underline">ذكّره</a>}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card-surface p-4">
        <div className="relative">
          <Search className="absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث بالاسم أو الكود أو التليفون" className="h-12 rounded-2xl ps-10" />
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map(([k, t]) => (
            <button key={k} onClick={() => setF(k)} className={cn("shrink-0 rounded-full border px-4 py-1.5 text-sm font-bold transition", f === k ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary/40")}>{t}</button>
          ))}
        </div>
        <div className="mt-2 divide-y divide-border">
          {list.map((c) => {
            const r = remainingOf(c);
            const d = daysUntil(c.due_date);
            return (
              <Link key={c.id} to="/app/c/$id" params={{ id: c.id }} className="-mx-2 flex items-center gap-3 rounded-2xl px-2 py-3.5 transition hover:bg-muted">
                <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-secondary text-lg font-extrabold text-primary">{c.name[0]}</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-bold">{c.name}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    <span dir="ltr" className="font-bold text-primary">{c.code}</span> · {c.garment || "—"} · {STATUSES[c.status]}
                    {c.status < 4 && d !== null && d <= 2 && <b className="text-warning"> · {dueLabel(d)}</b>}
                  </div>
                </div>
                <span className={cn("shrink-0 rounded-full px-3 py-1 text-xs font-extrabold", r > 0 ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success")}>{r > 0 ? money(r) : "خالص"}</span>
                <ChevronLeft className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            );
          })}
          {list.length === 0 && (
            <div className="py-12 text-center">
              <Scissors className="mx-auto mb-3 size-8 text-muted-foreground" />
              <p className="text-muted-foreground">{data.length ? "مفيش نتايج، جرّب كلمة تانية." : "لسه مفيش عملاء. ابدأ بأول عميل."}</p>
              {!data.length && <Button asChild variant="gold" className="mt-4"><Link to="/app/new">إضافة عميل</Link></Button>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card-surface p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-3xl font-extrabold">{value}</div>
    </div>
  );
}
