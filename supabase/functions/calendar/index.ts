// Link lịch riêng tư (ICS) cho My Tracker: Google Calendar / Apple Calendar / Outlook đăng ký link này
// để hiện task có deadline kèm nhắc nhở. Gọi: /functions/v1/calendar?key=<mã lịch>
// Mã lịch lấy trong trang web (nút "Calendar reminders"); đổi mã thì link cũ ngừng hoạt động.

const SITE = "https://immi1201.github.io/Team_Tracker/";
const STATUS: Record<string, string> = { todo: "Not started", progress: "In progress", pending: "Pending", done: "Done" };

type Task = { id: number; title: string; notes: string; topic: string; status: string; priority: string; start: string | null; due: string; updatedAt: string };

function esc(s: string) {
  return String(s ?? "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}
// Gập dòng dài hơn 75 byte (RFC 5545), không cắt giữa ký tự UTF-8.
function fold(line: string) {
  const enc = new TextEncoder();
  const out: string[] = [];
  let cur = "", size = 0, limit = 75;
  for (const ch of line) {
    const n = enc.encode(ch).length;
    if (size + n > limit) { out.push(cur); cur = " "; size = 1; limit = 75; }
    cur += ch; size += n;
  }
  out.push(cur);
  return out.join("\r\n");
}
const ymd = (iso: string) => iso.replaceAll("-", "");
function nextDay(iso: string) {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}
const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");

function alarm(trigger: string, text: string) {
  return ["BEGIN:VALARM", "ACTION:DISPLAY", `TRIGGER${trigger}`, `DESCRIPTION:${esc(text)}`, "END:VALARM"];
}

function event(uid: string, date: string, summary: string, t: Task, alarms: string[][], now: string) {
  const desc = [
    `Status: ${STATUS[t.status] ?? t.status}`,
    t.topic ? `Topic: ${t.topic}` : "",
    t.priority !== "normal" ? `Priority: ${t.priority}` : "",
    `Deadline: ${t.due.split("-").reverse().join("/")}`,
    t.notes ? `\n${t.notes}` : "",
    `\nOpen tracker: ${SITE}`,
  ].filter(Boolean).join("\n");
  return [
    "BEGIN:VEVENT",
    `UID:${uid}@my-tracker`,
    `DTSTAMP:${now}`,
    `LAST-MODIFIED:${stamp(new Date(t.updatedAt))}`,
    `DTSTART;VALUE=DATE:${ymd(date)}`,
    `DTEND;VALUE=DATE:${ymd(nextDay(date))}`,
    `SUMMARY:${esc(summary)}`,
    `DESCRIPTION:${esc(desc)}`,
    `URL:${SITE}`,
    "TRANSP:TRANSPARENT",
    ...alarms.flat(),
    "END:VEVENT",
  ];
}

Deno.serve(async (req) => {
  const key = new URL(req.url).searchParams.get("key") ?? "";
  if (key.length < 32) return new Response("Missing or invalid calendar key.", { status: 403 });

  const r = await fetch(`${Deno.env.get("SUPABASE_URL")}/rest/v1/rpc/me_calendar_feed`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: (Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"))! },
    body: JSON.stringify({ p_key: key }),
  });
  if (!r.ok) return new Response("Invalid calendar link.", { status: 403 });
  const { today, tasks } = await r.json() as { today: string; tasks: Task[] };

  const now = stamp(new Date());
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//My Tracker//Tasks//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "X-WR-CALNAME:My Tracker", "X-WR-TIMEZONE:Asia/Ho_Chi_Minh",
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H", "X-PUBLISHED-TTL:PT1H",
  ];
  for (const t of tasks) {
    const flag = t.priority === "high" ? "❗ " : "";
    // Sự kiện cả ngày vào ngày deadline: nhắc 9:00 hôm trước và 8:00 sáng hôm đó.
    lines.push(...event(`task-${t.id}`, t.due, `${flag}📌 ${t.title}`, t, [
      alarm(":-PT15H", `Tomorrow: ${t.title}`),
      alarm(":PT8H", `Due today: ${t.title}`),
    ], now));
    // Quá hạn mà chưa xong: thêm một sự kiện vào hôm nay để nhắc làm tiếp.
    if (t.due < today) {
      lines.push(...event(`overdue-${t.id}`, today, `⚠ Overdue: ${t.title}`, t, [alarm(":PT9H", `Overdue: ${t.title}`)], now));
    }
  }
  lines.push("END:VCALENDAR");

  return new Response(lines.map(fold).join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="my-tracker.ics"',
      "Cache-Control": "no-store",
    },
  });
});
