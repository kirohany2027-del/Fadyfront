import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, Loader2, Lock, Receipt, Ruler, UserRound, Users, Wallet } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import { BrandMark } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { FooterCredit } from "@/components/FooterCredit";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "المعلم فادي يسري | نظام العملاء" },
      { name: "description", content: "نظام إدارة عملاء الخياطة: مقاسات، دفعات، فواتير ومواعيد تسليم." },
      { property: "og:title", content: "المعلم فادي يسري | نظام العملاء" },
      { property: "og:description", content: "مقاسات، دفعات، فواتير ومواعيد تسليم في مكان واحد." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Gate,
});

function Gate() {
  const [tab, setTab] = useState<"owner" | "client">("owner");
  const { session } = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    if (session) nav({ to: "/app" });
  }, [session, nav]);

  return (
    <div className="min-h-screen bg-background md:grid md:place-items-center md:p-6">
      <div className="mx-auto w-full max-w-4xl overflow-hidden md:grid md:grid-cols-2 md:card-surface">
        <div className="bg-hero tape-edge relative flex flex-col justify-center px-6 pb-14 pt-14 text-center text-primary-foreground">
          <BrandMark className="mx-auto mb-4 size-36" />
          <h1 className="font-display text-4xl">المعلم فادي يسري</h1>
          <p className="mt-1 opacity-75">تفصيل وخياطة رجالي</p>
          <div className="mt-7 flex justify-center gap-2 text-xs">
            {[[Ruler, "مقاسات"], [Receipt, "فواتير"], [Bell, "تنبيهات"]].map(([I, t]) => {
              const Icon = I as typeof Ruler;
              return (
                <span key={t as string} className="flex items-center gap-1.5 rounded-full bg-primary-foreground/10 px-3 py-1.5">
                  <Icon className="size-3.5" />
                  {t as string}
                </span>
              );
            })}
          </div>
        </div>
        <div className="bg-card p-6 md:p-9">
          <div className="mb-6 grid grid-cols-2 gap-1 rounded-2xl bg-muted p-1">
            {([["owner", "دخول المعلم", UserRound], ["client", "أنا عميل", Users]] as const).map(([k, t, Icon]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-muted-foreground transition",
                  tab === k && "bg-card text-primary shadow-soft",
                )}
              >
                <Icon className="size-4" />
                {t}
              </button>
            ))}
          </div>
          {tab === "owner" ? <OwnerForm /> : <ClientForm />}
        </div>
      </div>
      <FooterCredit className="px-4 pb-8 pt-6 md:pb-2" />
    </div>
  );
}

const OWNER_EMAIL_KEY = "fady-owner-email";

function OwnerForm() {
  const [known, setKnown] = useState("");
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { setKnown(localStorage.getItem(OWNER_EMAIL_KEY) || ""); }, []);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const mail = (known || email).trim().toLowerCase();
    if (!mail) { toast.error("اكتب البريد الإلكتروني"); return; }
    setBusy(true);
    const { data, error } =
      mode === "in"
        ? await supabase.auth.signInWithPassword({ email: mail, password: pass })
        : await supabase.auth.signUp({ email: mail, password: pass, options: { emailRedirectTo: window.location.origin } });
    setBusy(false);
    if (error) {
      if (mode === "up") { toast.error(error.message); return; }
      if (known) { localStorage.removeItem(OWNER_EMAIL_KEY); setKnown(""); toast.error("كلمة السر غلط. جرّب تاني أو ادخل ببريد تاني."); }
      else toast.error("البريد أو كلمة السر غلط");
      return;
    }
    localStorage.setItem(OWNER_EMAIL_KEY, mail);
    if (mode === "up" && !data.session) toast.success("اتبعتلك رسالة تأكيد على البريد، افتحها وبعدين ادخل.");
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      {!known && (
        <div className="space-y-1.5">
          <Label>البريد الإلكتروني</Label>
          <Input dir="ltr" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-xl" />
        </div>
      )}
      <div className="space-y-1.5">
        <Label>كلمة السر</Label>
        <Input dir="ltr" type="password" required minLength={6} value={pass} onChange={(e) => setPass(e.target.value)} className="h-12 rounded-xl" autoFocus={!!known} />
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        <Lock /> {mode === "in" ? "دخول" : "إنشاء حساب المعلم"}
      </Button>
      {mode === "in" ? (
        <button type="button" onClick={() => { if (known) { localStorage.removeItem(OWNER_EMAIL_KEY); setKnown(""); } setMode("up"); }} className="w-full text-center text-sm text-muted-foreground hover:text-primary">
          {known ? "دخول ببريد تاني" : "أول مرة؟ أنشئ حساب"}
        </button>
      ) : (
        <button type="button" onClick={() => setMode("in")} className="w-full text-center text-sm text-muted-foreground hover:text-primary">عندك حساب؟ سجّل دخول</button>
      )}
    </form>
  );
}

function ClientForm() {
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [list, setList] = useState<{ code: string; name: string; garment: string; due_date: string | null }[] | null>(null);
  const nav = useNavigate();
  async function find(e: React.FormEvent) {
    e.preventDefault();
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) return toast.error("اكتب رقم الموبايل كامل");
    setBusy(true);
    const { data, error } = await supabase.rpc("get_codes_by_phone", { _phone: digits });
    setBusy(false);
    if (error) return toast.error("حصلت مشكلة، جرّب تاني");
    const rows = (data ?? []) as unknown as NonNullable<typeof list>;
    if (rows.length === 1) return nav({ to: "/track/$code", params: { code: rows[0]!.code } });
    setList(rows);
  }
  return (
    <form onSubmit={find} className="space-y-4">
      <div className="space-y-1.5">
        <Label>رقم الموبايل</Label>
        <Input dir="ltr" inputMode="tel" placeholder="01xxxxxxxxx" value={phone} onChange={(e) => { setPhone(e.target.value); setList(null); }} className="h-12 rounded-xl text-center text-lg" />
      </div>
      <Button type="submit" size="lg" variant="gold" className="w-full" disabled={busy}>
        {busy ? <Loader2 className="animate-spin" /> : <Wallet />} شوف حسابي
      </Button>
      {list && (list.length ? (
        <div className="space-y-2">
          <p className="text-center text-sm font-bold">عندك أكتر من طلب، اختار واحد:</p>
          {list.map((r) => (
            <button type="button" key={r.code} onClick={() => nav({ to: "/track/$code", params: { code: r.code } })} className="flex w-full items-center justify-between rounded-xl border border-border p-3 text-start hover:border-primary/40">
              <span className="font-bold">{r.garment || r.name}</span><span className="text-xs text-muted-foreground" dir="ltr">{r.due_date || ""}</span>
            </button>
          ))}
        </div>
      ) : <p className="text-center text-sm text-destructive">مفيش طلبات على الرقم ده</p>)}
      <p className="text-center text-xs text-muted-foreground">اكتب نفس الرقم اللي سجلته عند المعلم فادي</p>
    </form>
  );
}
