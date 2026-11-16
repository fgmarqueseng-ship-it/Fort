// Fort · IA pelo Google Gemini (Supabase Edge Function "fort-ai")
// A chave fica só no Supabase: Edge Functions › Secrets › GEMINI_API_KEY.
// Só responde para quem está na lista de membros do Fort.
const KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
const MODELS = ["gemini-flash-latest", "gemini-2.5-flash", "gemini-2.0-flash"];
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (o: unknown, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    if (!KEY) return json({ error: "setup", detail: "Falta o segredo GEMINI_API_KEY no Supabase." }, 500);
    // confere se quem chamou está na lista do Fort
    const url = Deno.env.get("SUPABASE_URL") ?? "";
    const apikey = req.headers.get("apikey") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const chk = await fetch(`${url}/rest/v1/rpc/fort_is_member`, {
      method: "POST",
      headers: { apikey, Authorization: req.headers.get("Authorization") ?? "", "Content-Type": "application/json" },
      body: "{}",
    });
    if (!chk.ok || (await chk.json()) !== true) return json({ error: "sem acesso" }, 403);

    const b = await req.json();
    const contents = (b.messages || []).slice(-14).map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: String(m.content || "").slice(0, 80000) }],
    }));
    if (!contents.length) contents.push({ role: "user", parts: [{ text: "" }] });
    if (b.image && b.image.data) {
      const last = contents[contents.length - 1];
      last.parts.push({ inline_data: { mime_type: b.image.type || "image/jpeg", data: b.image.data } });
    }
    const body: any = {
      contents,
      generationConfig: { temperature: b.json ? 0.1 : 0.5, maxOutputTokens: 2048, ...(b.json ? { responseMimeType: "application/json" } : {}) },
    };
    if (b.system) body.systemInstruction = { parts: [{ text: String(b.system).slice(0, 80000) }] };

    let last = "";
    for (const m of MODELS) {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok) {
        const text = (d.candidates?.[0]?.content?.parts || []).map((p: any) => p.text || "").join("");
        return json({ text, model: m });
      }
      last = d?.error?.message || String(r.status);
      if (r.status === 429) return json({ error: "limite", detail: last }, 429);
      if (r.status !== 404 && r.status !== 400) break; // só tenta o próximo modelo se este não existir
    }
    return json({ error: "gemini", detail: last }, 502);
  } catch (e) {
    return json({ error: "erro", detail: String(e) }, 500);
  }
});
