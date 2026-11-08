import { Check } from "lucide-react";
import { STATUSES, money, daysUntil, dueLabel } from "@/lib/tailor";
import { cn } from "@/lib/utils";

export function StatusSteps({ status }: { status: number }) {
  return (
    <div className="flex items-center gap-1">
      {STATUSES.map((s, i) => (
        <div key={s} className="flex flex-1 flex-col items-center gap-1.5">
          <div className={cn("grid size-7 place-items-center rounded-full border-2 text-xs font-bold", i <= status ? "border-success bg-success text-success-foreground" : "border-border bg-card text-muted-foreground")}>
            {i <= status ? <Check className="size-3.5" /> : i + 1}
          </div>
          <span className={cn("text-center text-[11px] leading-tight", i <= status ? "font-bold text-success" : "text-muted-foreground")}>{s}</span>
        </div>
      ))}
    </div>
  );
}

export function BalanceHero({ total, paid, due }: { total: number; paid: number; due: string | null }) {
  const rem = total - paid;
  const d = daysUntil(due);
  return (
    <div className="bg-hero rounded-3xl p-6 text-center text-primary-foreground shadow-lift">
      <div className="text-sm opacity-75">{rem > 0 ? "الباقي" : "الحساب خالص"}</div>
      <div className={cn("mt-1 text-5xl font-extrabold", rem > 0 ? "text-accent" : "text-primary-foreground")}>{money(Math.max(rem, 0))}</div>
      <div className="mt-5 grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-2xl bg-primary-foreground/10 p-2.5"><div className="opacity-70">الإجمالي</div><b className="text-base">{money(total)}</b></div>
        <div className="rounded-2xl bg-primary-foreground/10 p-2.5"><div className="opacity-70">المدفوع</div><b className="text-base">{money(paid)}</b></div>
        <div className="rounded-2xl bg-primary-foreground/10 p-2.5"><div className="opacity-70">التسليم</div><b className="text-sm">{d === null ? "—" : dueLabel(d)}</b></div>
      </div>
    </div>
  );
}
