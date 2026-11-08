import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GARMENTS, STATUSES } from "@/lib/tailor";
import { cn } from "@/lib/utils";

export type CustomerValues = { name: string; phone: string; garment: string; total: number; due_date: string; status: number; deposit?: number };

export function CustomerForm({ initial, withDeposit, onSubmit, onCancel, busy }: {
  initial: CustomerValues; withDeposit?: boolean; busy?: boolean;
  onSubmit: (v: CustomerValues) => void; onCancel: () => void;
}) {
  const [v, setV] = useState(initial);
  const set = <K extends keyof CustomerValues>(k: K, val: CustomerValues[K]) => setV((s) => ({ ...s, [k]: val }));
  const field = "h-12 rounded-xl";
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (v.name.trim()) onSubmit({ ...v, name: v.name.trim() }); }} className="space-y-4">
      <div className="space-y-1.5"><Label>اسم العميل *</Label><Input required value={v.name} onChange={(e) => set("name", e.target.value)} className={field} /></div>
      <div className="space-y-1.5"><Label>رقم التليفون</Label><Input dir="ltr" type="tel" inputMode="tel" value={v.phone} onChange={(e) => set("phone", e.target.value)} className={cn(field, "text-end")} /></div>
      <div className="space-y-1.5">
        <Label>التفصيل</Label>
        <div className="flex flex-wrap gap-2">
          {GARMENTS.map((g) => (
            <button type="button" key={g} onClick={() => set("garment", g)} className={cn("rounded-full border px-4 py-1.5 text-sm font-bold transition", v.garment === g ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground")}>{g}</button>
          ))}
        </div>
        <Input value={v.garment} onChange={(e) => set("garment", e.target.value)} placeholder="أو اكتب نوع تاني" className={field} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5"><Label>إجمالي السعر</Label><Input type="number" inputMode="numeric" value={v.total || ""} onChange={(e) => set("total", +e.target.value)} className={field} /></div>
        {withDeposit ? (
          <div className="space-y-1.5"><Label>المقدم المدفوع</Label><Input type="number" inputMode="numeric" value={v.deposit || ""} onChange={(e) => set("deposit", +e.target.value)} className={field} /></div>
        ) : (
          <div className="space-y-1.5"><Label>حالة الطلب</Label>
            <select value={v.status} onChange={(e) => set("status", +e.target.value)} className="h-12 w-full rounded-xl border border-input bg-background px-3">
              {STATUSES.map((s, i) => <option key={s} value={i}>{s}</option>)}
            </select>
          </div>
        )}
      </div>
      <div className="space-y-1.5"><Label>موعد التسليم</Label><Input type="date" value={v.due_date} onChange={(e) => set("due_date", e.target.value)} className={field} /></div>
      <div className="flex gap-2 pt-2">
        <Button type="submit" variant="success" size="lg" className="flex-1" disabled={busy}><Check /> حفظ</Button>
        <Button type="button" variant="outline" size="lg" onClick={onCancel}>إلغاء</Button>
      </div>
    </form>
  );
}
