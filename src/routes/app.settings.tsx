import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/app/settings")({
  head: () => ({
    meta: [
      { title: "كلمة المرور | المعلم فادي يسري" },
      { name: "description", content: "تغيير كلمة مرور حساب المعلم." },
      { property: "og:title", content: "كلمة المرور | المعلم فادي يسري" },
      { property: "og:description", content: "تغيير كلمة مرور حساب المعلم." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { session, loading } = useAuth();
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [busy, setBusy] = useState(false);

  if (loading) return <div className="grid place-items-center py-24"><Loader2 className="animate-spin text-primary" /></div>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = session?.user.email;
    if (!email) { toast.error("سجّل دخول الأول"); return; }
    if (next.length < 6) { toast.error("كلمة السر الجديدة لازم تكون 6 حروف على الأقل"); return; }
    if (next !== again) { toast.error("كلمة السر الجديدة مش مكتوبة نفس الأولى"); return; }
    setBusy(true);
    const check = await supabase.auth.signInWithPassword({ email, password: cur });
    if (check.error) { setBusy(false); toast.error("كلمة السر الحالية غلط"); return; }
    const { error } = await supabase.auth.updateUser({ password: next });
    setBusy(false);
    if (error) { toast.error("تعذر تغيير كلمة السر"); return; }
    setCur(""); setNext(""); setAgain("");
    toast.success("تم تغيير كلمة السر");
  };

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="card-surface p-5 sm:p-7">
        <div className="mb-5 flex items-center gap-3 border-b border-dashed border-border pb-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-secondary text-primary"><KeyRound className="size-5" /></span>
          <div className="min-w-0">
            <h1 className="font-display text-lg">كلمة المرور</h1>
            <p className="truncate text-xs text-muted-foreground">الحساب: <span dir="ltr">{session?.user.email || "—"}</span></p>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cur-pass">كلمة السر الحالية</Label>
            <Input id="cur-pass" dir="ltr" type="password" required autoComplete="current-password" value={cur} onChange={(e) => setCur(e.target.value)} className="h-12 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-pass">كلمة السر الجديدة</Label>
            <Input id="new-pass" dir="ltr" type="password" required minLength={6} autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} className="h-12 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="again-pass">تكرار كلمة السر الجديدة</Label>
            <Input id="again-pass" dir="ltr" type="password" required minLength={6} autoComplete="new-password" value={again} onChange={(e) => setAgain(e.target.value)} className="h-12 rounded-xl" />
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            <ShieldCheck /> {busy ? "جارٍ الحفظ..." : "حفظ كلمة السر"}
          </Button>
        </form>
        <p className="mt-4 text-center text-xs text-muted-foreground">لو الموبايل أو المتصفح اتغيروا، هتحتاج تكتب البريد مرة واحدة مع كلمة السر.</p>
      </div>
    </div>
  );
}
