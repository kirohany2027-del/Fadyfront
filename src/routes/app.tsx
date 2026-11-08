import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { IdCard, Loader2, LogOut, MessagesSquare, Settings, UserPlus, Users } from "lucide-react";
import { supabase } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { FooterCredit } from "@/components/FooterCredit";

export const Route = createFileRoute("/app")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "لوحة المعلم | المعلم فادي يسري" },
      { name: "description", content: "إدارة العملاء والمقاسات والدفعات." },
      { property: "og:title", content: "لوحة المعلم | المعلم فادي يسري" },
      { property: "og:description", content: "إدارة العملاء والمقاسات والدفعات." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AppLayout,
});

function AppLayout() {
  const { session, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    if (!loading && !session) nav({ to: "/" });
  }, [loading, session, nav]);
  if (!session) return <div className="grid min-h-screen place-items-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background pb-28 md:pb-10">
      <header className="no-print bg-hero tape-edge sticky top-0 z-20 px-4 pb-5 pt-4 text-primary-foreground md:px-8">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <Link to="/app"><Brand subtitle="لوحة المعلم" /></Link>
          <div className="ms-auto flex gap-2">
            <Button asChild variant="glass" className="hidden md:inline-flex"><Link to="/app/messages"><MessagesSquare /> الرسائل</Link></Button>
            <Button asChild variant="glass" className="hidden md:inline-flex"><Link to="/app/cards"><IdCard /> كروت العملاء</Link></Button>
            <Button asChild variant="gold" className="hidden md:inline-flex"><Link to="/app/new"><UserPlus /> عميل جديد</Link></Button>
            <Button asChild variant="glass" size="icon" aria-label="الإعدادات"><Link to="/app/settings"><Settings /></Link></Button>
            <Button variant="glass" size="sm" onClick={() => supabase.auth.signOut()}><LogOut /> خروج</Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-4 pt-6 md:px-8"><Outlet /></main>
      <FooterCredit className="app-footer-credit px-4 pb-6 pt-2 md:pb-8" />
      <nav className="no-print fixed inset-x-3 bottom-3 z-20 mx-auto flex max-w-md gap-1 rounded-3xl border border-border bg-card/95 p-1.5 shadow-lift backdrop-blur md:hidden">
        <Link to="/app" activeOptions={{ exact: true }} className="flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-2 text-xs font-bold text-muted-foreground" activeProps={{ className: "bg-primary text-primary-foreground" }}>
          <Users className="size-5" /> العملاء
        </Link>
        <Link to="/app/cards" className="flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-2 text-xs font-bold text-muted-foreground" activeProps={{ className: "bg-secondary text-primary" }}>
          <IdCard className="size-5" /> الكروت
        </Link>
        <Link to="/app/messages" className="flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-2 text-xs font-bold text-muted-foreground" activeProps={{ className: "bg-secondary text-primary" }}>
          <MessagesSquare className="size-5" /> الرسائل
        </Link>
        <Link to="/app/settings" className="flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-2 text-xs font-bold text-muted-foreground" activeProps={{ className: "bg-secondary text-primary" }}>
          <Settings className="size-5" /> الإعدادات
        </Link>
        <Link to="/app/new" className="flex flex-1 flex-col items-center gap-0.5 rounded-2xl bg-gold py-2 text-xs font-bold text-accent-foreground">
          <UserPlus className="size-5" /> عميل جديد
        </Link>
      </nav>
    </div>
  );
}
