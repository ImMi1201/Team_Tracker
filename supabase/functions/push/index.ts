// Gửi thông báo đẩy (Web Push) cho My Tracker.
// pg_cron gọi hàm me_push_tick() mỗi phút; khi có việc cần nhắc, hàm đó gọi function này kèm mã bí mật.
// Function lấy danh sách thông báo từ me_push_due(), gửi tới mọi thiết bị đã đăng ký,
// và xoá thiết bị không còn hợp lệ (404/410).
import webpush from "npm:web-push@3.6.7";

const SITE = "https://immi1201.github.io/Team_Tracker/";
const URL_ = Deno.env.get("SUPABASE_URL")!;
const KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function rpc(name: string, args: unknown) {
  const r = await fetch(`${URL_}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: KEY, Authorization: `Bearer ${KEY}` },
    body: JSON.stringify(args),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`${name}: ${r.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

type Msg = { title: string; body?: string; tag?: string };
type Sub = { endpoint: string; keys: { p256dh: string; auth: string } };

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  let secret = "";
  try { secret = (await req.json()).secret ?? ""; } catch { /* body rỗng */ }
  if (secret.length < 32) return new Response("Forbidden", { status: 403 });

  let due: { vapid: { publicKey: string; privateKey: string; subject: string }; subs: Sub[]; messages: Msg[] };
  try { due = await rpc("me_push_due", { p_secret: secret }); }
  catch (e) { return new Response(String(e), { status: 403 }); }

  webpush.setVapidDetails(due.vapid.subject, due.vapid.publicKey, due.vapid.privateKey);
  const gone = new Set<string>();
  const results: string[] = [];
  for (const m of due.messages) {
    const payload = JSON.stringify({ title: m.title, body: m.body ?? "", tag: m.tag ?? "", url: SITE });
    for (const s of due.subs) {
      if (gone.has(s.endpoint)) continue;
      try {
        await webpush.sendNotification(s, payload, { TTL: 6 * 3600, urgency: "high" });
        results.push(`ok ${m.tag}`);
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) gone.add(s.endpoint);
        results.push(`fail ${m.tag} ${code ?? ""} ${(e as Error).message}`.trim());
      }
    }
  }
  if (gone.size) await rpc("me_push_gone", { p_secret: secret, p_endpoints: [...gone] });

  return new Response(JSON.stringify({ messages: due.messages.length, devices: due.subs.length, removed: gone.size, results }), {
    headers: { "Content-Type": "application/json" },
  });
});
