"use client";

import { useRef, useState } from "react";

type User = { name: string; email: string; role?: string } | null;
type Json = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

type Step = {
  key: string;
  title: string;
  desc: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: (id: string) => string;
  expected: number;
  needsLogin: boolean;
  needsId?: boolean;
  noCookies?: boolean; // ส่งโดยไม่แนบ cookie = จำลองว่ายังไม่ login
  body?: () => unknown;
  check?: (body: Json) => string | null;
  after?: (body: Json, setId: (id: string) => void) => void;
};

type Result = { status: number; ms: number; ok: boolean; note: string | null; response: string };

const today = () => new Date().toISOString().slice(0, 10);

const STEPS: Step[] = [
  {
    key: "no-login", title: "ยังไม่ login ต้องถูกปฏิเสธ", method: "GET", path: () => "/api/expenses",
    desc: "ส่งโดยไม่แนบ cookie จึงเหมือนคนที่ยังไม่ได้ login", expected: 401, needsLogin: false, noCookies: true,
    check: (b) => (String(b.error ?? "").includes("401") ? null : "ไม่มีข้อความ error 401"),
  },
  {
    key: "create", title: "สร้างรายการ", method: "POST", path: () => "/api/expenses",
    desc: "สร้างรายจ่ายใหม่ แล้วจำ id ไว้ใช้ในขั้นตอนถัดไป", expected: 201, needsLogin: true,
    body: () => ({ title: "ทดสอบ API", amount: 120.5, category: "อาหาร", date: today(), note: "จากหน้า /api-test" }),
    check: (b) => (b.title === "ทดสอบ API" && b.amount === 120.5 ? null : "ข้อมูลที่ตอบกลับไม่ตรงกับที่ส่ง"),
    after: (b, setId) => { if (typeof b.id === "string") setId(b.id); },
  },
  {
    key: "invalid", title: "ส่งข้อมูลผิด ต้องได้ error ราย field", method: "POST", path: () => "/api/expenses",
    desc: "ชื่อว่าง จำนวนเงินติดลบ หมวดหมู่และวันที่ไม่ถูกต้อง", expected: 422, needsLogin: true,
    body: () => ({ title: "", amount: -1, category: "x", date: "abc" }),
    check: (b) => {
      const f = b.fields ?? {};
      const missing = ["title", "amount", "category", "date"].filter((k) => !f[k]);
      return missing.length ? `ไม่มี error ของ: ${missing.join(", ")}` : null;
    },
  },
  {
    key: "list", title: "ดึงรายการทั้งหมด", method: "GET", path: () => "/api/expenses",
    desc: "ได้ data, pagination และยอดรวม", expected: 200, needsLogin: true,
    check: (b) => (Array.isArray(b.data) && b.pagination && b.summary ? null : "รูปแบบข้อมูลไม่ครบ (data / pagination / summary)"),
  },
  {
    key: "search", title: "ค้นหา + กรองหมวดหมู่", method: "GET",
    path: () => `/api/expenses?${new URLSearchParams({ q: "ทดสอบ", category: "อาหาร", pageSize: "5" })}`,
    desc: "ค้นคำว่า “ทดสอบ” ในหมวดอาหาร แสดงหน้าละ 5 รายการ", expected: 200, needsLogin: true,
    check: (b) =>
      Array.isArray(b.data) && b.data.every((e: Json) => e.category === "อาหาร") && b.pagination?.pageSize === 5
        ? null : "ผลลัพธ์ไม่ตรงเงื่อนไขที่กรอง",
  },
  {
    key: "get", title: "ดูรายการเดียว", method: "GET", path: (id) => `/api/expenses/${id}`,
    desc: "ใช้ id จากขั้นตอนสร้างรายการ", expected: 200, needsLogin: true, needsId: true,
  },
  {
    key: "put", title: "แก้ไขรายการ", method: "PUT", path: (id) => `/api/expenses/${id}`,
    desc: "เปลี่ยนชื่อ จำนวนเงิน และหมวดหมู่", expected: 200, needsLogin: true, needsId: true,
    body: () => ({ title: "ทดสอบ API (แก้แล้ว)", amount: 200, category: "เดินทาง", date: today() }),
    check: (b) => (b.title === "ทดสอบ API (แก้แล้ว)" && b.amount === 200 && b.category === "เดินทาง" ? null : "ค่าไม่ถูกอัปเดต"),
  },
  {
    key: "delete", title: "ลบรายการ", method: "DELETE", path: (id) => `/api/expenses/${id}`,
    desc: "ลบรายการที่สร้างไว้ตอนทดสอบ", expected: 200, needsLogin: true, needsId: true,
  },
  {
    key: "gone", title: "ขอรายการที่ลบแล้ว ต้องไม่พบ", method: "GET", path: (id) => `/api/expenses/${id}`,
    desc: "ยืนยันว่าลบจริง", expected: 404, needsLogin: true, needsId: true,
  },
];

const METHOD_STYLE: Record<Step["method"], string> = {
  GET: "bg-[#e1edfb] text-[#1d5fb4]",
  POST: "bg-baht-tint text-baht-dark",
  PUT: "bg-[#fff1c2] text-[#7a5b00]",
  DELETE: "bg-[#fbe4e1] text-danger",
};

export default function ApiTester({ user }: { user: User }) {
  const [results, setResults] = useState<Record<string, Result>>({});
  const [busy, setBusy] = useState<string | null>(null); // key ที่กำลังส่ง หรือ "all"
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const idRef = useRef("");
  const [currentId, setCurrentId] = useState("");

  const setId = (id: string) => { idRef.current = id; setCurrentId(id); };

  async function run(step: Step): Promise<boolean> {
    if (step.needsId && !idRef.current) {
      setResults((r) => ({
        ...r,
        [step.key]: { status: 0, ms: 0, ok: false, note: "ยังไม่มี id — ส่งขั้นตอน “สร้างรายการ” ก่อน", response: "" },
      }));
      return false;
    }
    const body = step.body?.();
    const t0 = performance.now();
    let status = 0;
    let text = "";
    let note: string | null = null;
    try {
      const res = await fetch(step.path(idRef.current), {
        method: step.method,
        headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        credentials: step.noCookies ? "omit" : "same-origin",
      });
      status = res.status;
      text = await res.text();
    } catch {
      note = "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้";
    }
    const ms = Math.round(performance.now() - t0);

    let parsed: Json = {};
    let pretty = text;
    try { parsed = JSON.parse(text); pretty = JSON.stringify(parsed, null, 2); } catch { /* ไม่ใช่ JSON */ }

    if (!note && status !== step.expected) note = `คาดหวัง ${step.expected} แต่ได้ ${status}`;
    if (!note && step.check) note = step.check(parsed);
    if (!note) step.after?.(parsed, setId);

    const ok = !note;
    setResults((r) => ({ ...r, [step.key]: { status, ms, ok, note, response: pretty } }));
    setOpen((o) => ({ ...o, [step.key]: true }));
    return ok;
  }

  async function runOne(step: Step) {
    setBusy(step.key);
    await run(step);
    setBusy(null);
  }

  async function runAll() {
    setBusy("all");
    setResults({});
    setOpen({});
    setId("");
    for (const step of STEPS) {
      if (step.needsLogin && !user) continue;
      await run(step);
    }
    setBusy(null);
  }

  function reset() { setResults({}); setOpen({}); setId(""); }

  const done = Object.keys(results).length;
  const passed = Object.values(results).filter((r) => r.ok).length;
  const allDone = done === STEPS.filter((s) => !s.needsLogin || user).length && done > 0;

  return (
    <>
      <h1 className="text-3xl font-bold">ทดสอบ REST API</h1>
      <p className="mt-1 max-w-2xl text-ink-soft">
        กดส่ง request ไปยัง API ของสมุดรายจ่ายได้จากหน้านี้เลย แล้วดูว่า status และข้อมูลที่ตอบกลับตรงกับที่ควรเป็นหรือไม่
      </p>

      <section className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border-[1.5px] border-line bg-white p-4">
        <div className="text-sm">
          {user ? (
            <>
              <p className="text-ink-soft">ส่ง request ในนาม</p>
              <p className="font-semibold">
                {user.name}
                {user.role === "ADMIN" && <span className="ml-2 rounded-full bg-mark px-2 py-0.5 text-xs font-semibold">ADMIN</span>}
              </p>
            </>
          ) : (
            <>
              <p className="font-semibold">ยังไม่ได้เข้าสู่ระบบ</p>
              <p className="text-ink-soft">ทดสอบได้แค่ข้อ 1 เข้าสู่ระบบก่อนเพื่อทดสอบข้อที่เหลือ</p>
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          {done > 0 && (
            <span className={`num text-sm font-semibold ${allDone && passed === done ? "text-baht-dark" : "text-ink-soft"}`}>
              ผ่าน {passed}/{done}
            </span>
          )}
          <button onClick={reset} disabled={busy !== null || done === 0}
            className="rounded-lg border-[1.5px] border-line bg-white px-3.5 py-2 text-sm font-medium hover:bg-ground disabled:opacity-40">
            ล้างผล
          </button>
          <button onClick={runAll} disabled={busy !== null}
            className="rounded-xl bg-baht px-5 py-2.5 font-semibold text-white hover:bg-baht-dark disabled:opacity-60">
            {busy === "all" ? "กำลังทดสอบ…" : "ทดสอบทั้งหมด"}
          </button>
        </div>
      </section>

      <ol className="mt-6 space-y-3">
        {STEPS.map((step, i) => {
          const r = results[step.key];
          const locked = step.needsLogin && !user;
          const waiting = busy !== null && busy !== step.key && busy !== "all";
          const isOpen = open[step.key];
          const body = step.body?.();
          return (
            <li key={step.key} className={`rounded-2xl border-[1.5px] bg-white ${r ? (r.ok ? "border-baht/50" : "border-danger/50") : "border-line"} ${locked ? "opacity-55" : ""}`}>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4">
                <span className="num flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ground text-sm font-semibold">{i + 1}</span>

                <div className="min-w-0 flex-1 basis-64">
                  <p className="font-semibold">{step.title}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-2 text-sm">
                    <span className={`rounded px-1.5 py-0.5 text-xs font-bold ${METHOD_STYLE[step.method]}`}>{step.method}</span>
                    <code className="break-all text-ink-soft">{step.path(currentId || ":id")}</code>
                  </p>
                  <p className="mt-1 text-sm text-ink-soft">{step.desc}</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right text-sm">
                    <p className="text-ink-soft">คาดหวัง <span className="num font-semibold text-ink">{step.expected}</span></p>
                    {r && (
                      <p className={`num font-semibold ${r.ok ? "text-baht-dark" : "text-danger"}`}>
                        ได้ {r.status || "—"} <span className="font-normal text-ink-soft">· {r.ms} ms</span>
                      </p>
                    )}
                  </div>
                  <button onClick={() => runOne(step)} disabled={busy !== null || locked || waiting}
                    className="rounded-lg border-[1.5px] border-ink/20 bg-white px-4 py-2 text-sm font-semibold hover:bg-ground disabled:opacity-40">
                    {busy === step.key ? "กำลังส่ง…" : "ส่ง"}
                  </button>
                </div>
              </div>

              {r && (
                <div className="border-t border-line px-4 py-3">
                  <p className={`text-sm font-medium ${r.ok ? "text-baht-dark" : "text-danger"}`}>
                    {r.ok ? "ผ่าน — ได้ผลตามที่คาดหวัง" : `ไม่ผ่าน — ${r.note}`}
                  </p>
                  <button onClick={() => setOpen((o) => ({ ...o, [step.key]: !isOpen }))}
                    className="mt-1 text-sm text-ink-soft underline-offset-2 hover:underline">
                    {isOpen ? "ซ่อนรายละเอียด" : "ดูรายละเอียด"}
                  </button>
                  {isOpen && (
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <div>
                        <p className="mb-1 text-xs font-semibold text-ink-soft">ข้อมูลที่ส่ง</p>
                        <pre className="max-h-64 overflow-auto rounded-lg bg-ink p-3 text-xs leading-relaxed text-white/90">
                          {body !== undefined ? JSON.stringify(body, null, 2) : "(ไม่มี body)"}
                        </pre>
                      </div>
                      <div>
                        <p className="mb-1 text-xs font-semibold text-ink-soft">ข้อมูลที่ตอบกลับ</p>
                        <pre className="max-h-64 overflow-auto rounded-lg bg-ink p-3 text-xs leading-relaxed text-white/90">
                          {r.response || "(ไม่มี)"}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </>
  );
}
