/**
 * Client for the Express + MongoDB backend (folder: backend/).
 * It keeps the same small API the pages already use (supabase-like):
 *   supabase.from("customers").select().eq("id", id).maybeSingle()
 *   supabase.rpc("get_customer_by_code", { _code })
 *   supabase.auth.signInWithPassword({ email, password })
 *
 * Backend URL comes from VITE_API_URL (frontend/.env). Default: http://localhost:4000
 */
export const API_URL: string = (import.meta.env["VITE_API_URL"] as string | undefined) || "http://localhost:4000";

type User = { id: string; email: string };
export type Session = { access_token: string; user: User };
type Result<T = any> = { data: T; error: { message: string } | null };

const KEY = "fady-session";
const listeners = new Set<(event: string, s: Session | null) => void>();

function readSession(): Session | null {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch { return null; }
}
function writeSession(s: Session | null, event: string) {
  if (s) localStorage.setItem(KEY, JSON.stringify(s)); else localStorage.removeItem(KEY);
  listeners.forEach((l) => l(event, s));
}

export async function request<T = any>(path: string, init: RequestInit = {}): Promise<Result<T>> {
  try {
    const s = readSession();
    const headers = new Headers(init.headers);
    headers.set("Content-Type", "application/json");
    if (s) headers.set("Authorization", `Bearer ${s.access_token}`);
    const res = await fetch(`${API_URL}${path}`, { ...init, headers });
    const body = await res.json().catch(() => ({}));
    if (res.status === 401 && s) writeSession(null, "SIGNED_OUT");
    if (!res.ok) return { data: null as T, error: { message: body.error || `HTTP ${res.status}` } };
    return { data: body.data as T, error: null };
  } catch (e) {
    return { data: null as T, error: { message: (e as Error).message } };
  }
}

type Op = "select" | "insert" | "update" | "delete";

class Query implements PromiseLike<Result> {
  private op: Op = "select";
  private body: unknown;
  private filters: [string, string, string][] = [];
  private orderBy?: string;
  private asc = true;
  private mode: "many" | "single" | "maybe" = "many";
  private returning = false;
  constructor(private table: string) {}

  select(_cols?: string) { if (this.op !== "select") this.returning = true; return this; }
  insert(row: unknown) { this.op = "insert"; this.body = row; return this; }
  update(patch: unknown) { this.op = "update"; this.body = patch; return this; }
  delete() { this.op = "delete"; return this; }
  eq(col: string, v: unknown) { this.filters.push(["eq", col, String(v)]); return this; }
  in(col: string, vs: unknown[]) { this.filters.push(["in", col, vs.map(String).join(",")]); return this; }
  order(col: string, o?: { ascending?: boolean }) { this.orderBy = col; this.asc = o?.ascending ?? true; return this; }
  single() { this.mode = "single"; return this; }
  maybeSingle() { this.mode = "maybe"; return this; }

  private async run(): Promise<Result> {
    const q = new URLSearchParams();
    this.filters.forEach(([op, c, v]) => q.append(`${op}.${c}`, v));
    if (this.orderBy) q.set("order", `${this.orderBy}.${this.asc ? "asc" : "desc"}`);
    const path = `/api/db/${this.table}?${q}`;
    const method = { select: "GET", insert: "POST", update: "PATCH", delete: "DELETE" }[this.op];
    const r = await request<any>(path, { method, body: this.body === undefined ? null : JSON.stringify(this.body) });
    if (r.error) return r;
    let data = r.data;
    if (this.mode !== "many") {
      const row = Array.isArray(data) ? data[0] ?? null : data;
      if (this.mode === "single" && !row) return { data: null, error: { message: "not found" } };
      data = row;
    } else if (this.op !== "select" && !this.returning) data = null;
    return { data, error: null };
  }
  then<A = Result, B = never>(ok?: ((v: Result) => A | PromiseLike<A>) | null, bad?: ((e: unknown) => B | PromiseLike<B>) | null) {
    return this.run().then(ok, bad);
  }
}

export const supabase = {
  from: (table: string) => new Query(table),
  rpc: (name: string, args: Record<string, unknown>) => request(`/api/rpc/${name}`, { method: "POST", body: JSON.stringify(args) }),
  auth: {
    async signInWithPassword(c: { email: string; password: string }) {
      const r = await request<Session>("/api/auth/signin", { method: "POST", body: JSON.stringify(c) });
      if (!r.error) writeSession(r.data, "SIGNED_IN");
      return { data: { session: r.data, user: r.data?.user ?? null }, error: r.error };
    },
    async signUp(c: { email: string; password: string; options?: unknown }) {
      const r = await request<Session>("/api/auth/signup", { method: "POST", body: JSON.stringify({ email: c.email, password: c.password }) });
      if (!r.error) writeSession(r.data, "SIGNED_IN");
      return { data: { session: r.data, user: r.data?.user ?? null }, error: r.error };
    },
    async updateUser(c: { password: string }) {
      const r = await request("/api/auth/password", { method: "POST", body: JSON.stringify(c) });
      return { data: r.data, error: r.error };
    },
    async signOut() { writeSession(null, "SIGNED_OUT"); return { error: null }; },
    async getSession() { return { data: { session: readSession() }, error: null }; },
    async getUser() { return { data: { user: readSession()?.user ?? null }, error: null }; },
    onAuthStateChange(cb: (event: string, s: Session | null) => void) {
      listeners.add(cb);
      return { data: { subscription: { unsubscribe: () => { listeners.delete(cb); } } } };
    },
  },
};

export const api = supabase;
