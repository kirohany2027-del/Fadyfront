import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/lib/api-client";

export const STATUSES = ["استلام قماش", "قص", "تفصيل", "جاهز", "تم التسليم"] as const;
export const GARMENTS = ["بدلة", "جلابية", "قميص", "بنطلون", "عباية"];

export type Measurements = Record<string, string>;
export type Payment = { id: string; amount: number; paid_on: string };
export type Customer = {
  id: string;
  code: string;
  name: string;
  phone: string;
  garment: string;
  total: number;
  status: number;
  due_date: string | null;
  measurements: Measurements;
  notes: string;
  created_at: string;
  payments: Payment[];
};

export const paidOf = (c: { payments: { amount: number }[] }) =>
  c.payments.reduce((s, p) => s + Number(p.amount), 0);
export const remainingOf = (c: { total: number; payments: { amount: number }[] }) =>
  Number(c.total) - paidOf(c);
export const money = (n: number) => `${Number(n).toLocaleString("ar-EG")} ج`;
export const today = () => new Date().toISOString().slice(0, 10);

export function daysUntil(due: string | null) {
  if (!due) return null;
  const a = new Date(due + "T00:00").getTime();
  const b = new Date(new Date().toDateString()).getTime();
  return Math.round((a - b) / 864e5);
}
export function dueLabel(n: number) {
  if (n < 0) return `متأخر ${-n} يوم`;
  if (n === 0) return "النهارده";
  if (n === 1) return "بكره";
  if (n === 2) return "بعد يومين";
  return `بعد ${n} يوم`;
}
export const waLink = (phone: string, text: string) =>
  `https://wa.me/2${phone}?text=${encodeURIComponent(text)}`;

/** Link sent to a customer: opens the customer-only screen for that code (no login). */
export const trackLink = (code: string, origin: string) => `${origin}/c/${code}`;

export const OWNER_PHONE = "01206098373";

/** Text sent to a customer by SMS/WhatsApp: code, due date, tracking link and the owner's number. */
export function orderMessage(c: { name: string; code: string; due_date: string | null }, origin: string) {
  return [
    `أهلاً ${c.name}، طلبك عند المعلم فادي يسري - محل ابن الملك`,
    `كود المتابعة: ${c.code}`,
    `موعد التسليم: ${c.due_date || "هيتحدد قريب"}`,
    `افتح شاشة طلبك: ${trackLink(c.code, origin)}`,
    `للتواصل مع المعلم فادي: ${OWNER_PHONE}`,
  ].join("\n");
}

export const smsLink = (phone: string, text: string) => `sms:${phone}?body=${encodeURIComponent(text)}`;

const SELECT = "id,code,name,phone,garment,total,status,due_date,measurements,notes,created_at,payments(id,amount,paid_on)";

export const customersQuery = () =>
  queryOptions({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select(SELECT)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Customer[];
    },
  });

export const customerQuery = (id: string) =>
  queryOptions({
    queryKey: ["customers", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select(SELECT).eq("id", id).maybeSingle();
      if (error) throw error;
      const c = data as unknown as Customer | null;
      if (c) c.payments.sort((a, b) => a.paid_on.localeCompare(b.paid_on));
      return c;
    },
  });
