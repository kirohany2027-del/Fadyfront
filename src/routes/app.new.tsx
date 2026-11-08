import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/api-client";
import { CustomerForm } from "@/components/CustomerForm";
import { today } from "@/lib/tailor";

export const Route = createFileRoute("/app/new")({
  head: () => ({ meta: [
    { title: "إضافة عميل جديد | المعلم فادي يسري" },
    { name: "description", content: "تسجيل بيانات عميل جديد وطلب التفصيل وموعد التسليم." },
    { property: "og:title", content: "إضافة عميل جديد | المعلم فادي يسري" },
    { property: "og:description", content: "تسجيل بيانات عميل جديد وطلب التفصيل وموعد التسليم." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: NewCustomer,
});

function NewCustomer() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const due = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
  return (
    <div className="card-surface mx-auto max-w-xl p-5 md:p-7">
      <h1 className="mb-5 text-xl font-extrabold">عميل جديد</h1>
      <CustomerForm
        withDeposit
        busy={busy}
        initial={{ name: "", phone: "", garment: "", total: 0, due_date: due, status: 0, deposit: 0 }}
        onCancel={() => nav({ to: "/app" })}
        onSubmit={async ({ deposit, ...v }) => {
          setBusy(true);
          const { data, error } = await supabase.from("customers").insert({ ...v, due_date: v.due_date || null }).select("id,code").single();
          if (!error && deposit) await supabase.from("payments").insert({ customer_id: data.id, amount: deposit, paid_on: today() });
          setBusy(false);
          if (error) { toast.error("تعذر الحفظ، حاول تاني"); return; }
          await qc.invalidateQueries({ queryKey: ["customers"] });
          toast.success(`تمت إضافة العميل ${data.code}`);
          nav({ to: "/app/c/$id", params: { id: data.id } });
        }}
      />
    </div>
  );
}
