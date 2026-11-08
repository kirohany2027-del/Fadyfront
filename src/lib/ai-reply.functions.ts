import { request } from "@/lib/api-client";

type Input = { question: string; details: string };

/** Asks the backend (POST /api/ai/draft) to draft a reply; the owner reviews it before sending. */
export async function draftReply({ data }: { data: Input }): Promise<{ text?: string; error?: string }> {
  const r = await request<{ text: string }>("/api/ai/draft", { method: "POST", body: JSON.stringify(data) });
  if (r.error) return { error: r.error.message };
  return { text: r.data.text };
}
