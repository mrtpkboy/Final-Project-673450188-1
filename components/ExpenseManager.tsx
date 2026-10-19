"use client";

import { useCallback, useEffect, useState } from "react";
import { CATEGORY_COLORS, colorOf } from "@/app/lib/categories";

const CATEGORIES = Object.keys(CATEGORY_COLORS);

type Expense = {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  note: string | null;
  user?: { name: string | null; email: string };
};
type CatSum = { category: string; amount: number };
type FieldErrors = Record<string, string[] | undefined>;

const todayStr = () => new Date().toISOString().slice(0, 10);
const baht = (n: number) =>
  n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const emptyForm = () => ({ title: "", amount: "", category: CATEGORIES[0], date: todayStr(), note: "" });

export default function ExpenseManager({ isAdmin }: { isAdmin: boolean }) {
  // --- รายการ + ตัวกรอง ---
  const [items, setItems] = useState<Expense[]>([]);
  const [total, setTotal] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [byCategory, setByCategory] = useState<CatSum[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);

  // --- ฟอร์ม (เพิ่ม/แก้ไข) ---
  const [editing, setEditing] = useState<Expense | "new" | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  // --- ยืนยันลบ ---
  const [deleting, setDeleting] = useState<Expense | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: "8" });
    if (q.trim()) params.set("q", q.trim());
    if (category) params.set("category", category);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const res = await fetch(`/api/expenses?${params}`);
    if (res.ok) {
      const j = await res.json();
      setItems(j.data);
      setTotal(j.pagination.total);
      setTotalPages(j.pagination.totalPages);
      setTotalAmount(j.summary.totalAmount);
      setByCategory(j.summary.byCategory);
    }
    setLoading(false);
  }, [page, q, category, from, to]);

  // debounce การค้นหา
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  function openForm(e: Expense | "new") {
    setErrors({});
    setFormError("");
    setForm(
      e === "new"
        ? emptyForm()
        : { title: e.title, amount: String(e.amount), category: e.category, date: e.date.slice(0, 10), note: e.note ?? "" },
    );
    setEditing(e);
  }

  async function save(ev: React.FormEvent) {
    ev.preventDefault();
    setSaving(true);
    setErrors({});
    setFormError("");
    const isNew = editing === "new";
    const res = await fetch(isNew ? "/api/expenses" : `/api/expenses/${(editing as Expense).id}`, {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      setEditing(null);
      await load();
      return;
    }
    const j = await res.json().catch(() => ({}));
    if (j.fields) setErrors(j.fields);
    else setFormError(j.error ?? "เกิดข้อผิดพลาด ลองใหม่อีกครั้ง");
  }

  async function confirmDelete() {
    if (!deleting) return;
    const res = await fetch(`/api/expenses/${deleting.id}`, { method: "DELETE" });
    setDeleting(null);
    if (!res.ok) return alert("ลบไม่สำเร็จ ลองใหม่อีกครั้ง");
    // ถ้าลบรายการสุดท้ายของหน้า ให้ถอยกลับหน้าก่อนหน้า
    if (items.length === 1 && page > 1) setPage(page - 1);
    else await load();
  }

  const filtered = Boolean(q || category || from || to);
  const maxCat = Math.max(1, ...byCategory.map((c) => c.amount));
  const fieldErr = (k: string) =>
    errors[k]?.[0] && <p role="alert" className="mt-1 text-sm text-danger">{errors[k]![0]}</p>;

  return (
    <div>
      {/* ยอดรวม (ใบเสร็จ) + สรุปตามหมวด */}
      <section className="mb-10 grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="receipt h-fit p-6 shadow-md">
          <p className="text-sm text-ink-soft">
            {filtered ? "ยอดรวมตามตัวกรอง" : "ยอดรวมทั้งหมด"} · {total} รายการ
          </p>
          <p className="num mt-1 inline-block bg-mark px-2 text-4xl font-bold sm:text-5xl">{baht(totalAmount)} ฿</p>
          <button
            onClick={() => openForm("new")}
            className="mt-6 w-full rounded-xl bg-baht px-4 py-3 font-semibold text-white hover:bg-baht-dark"
          >
            + เพิ่มรายจ่าย
          </button>
        </div>

        <div className="rounded-2xl bg-white/70 p-6">
          <h2 className="mb-4 font-semibold">เงินไปอยู่ที่ไหน</h2>
          {byCategory.length === 0 ? (
            <p className="text-sm text-ink-soft">ยังไม่มีข้อมูลให้สรุป</p>
          ) : (
            <ul className="space-y-3">
              {byCategory.map((c) => (
                <li key={c.category}>
                  <button
                    onClick={() => { setCategory(category === c.category ? "" : c.category); setPage(1); }}
                    className="block w-full text-left"
                    aria-pressed={category === c.category}
                    title="คลิกเพื่อกรองตามหมวดหมู่นี้"
                  >
                    <div className="mb-1 flex justify-between text-sm">
                      <span className={category === c.category ? "font-semibold" : ""}>{c.category}</span>
                      <span className="num text-ink-soft">{baht(c.amount)}</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-line/60">
                      <div className="h-full rounded-full" style={{ width: `${(c.amount / maxCat) * 100}%`, background: colorOf(c.category) }} />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Search + Filter */}
      <section className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
        <input className="field" placeholder="ค้นหาชื่อรายการหรือหมายเหตุ" aria-label="ค้นหา" value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        <select className="field" aria-label="หมวดหมู่" value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
          <option value="">ทุกหมวดหมู่</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <input type="date" className="field" aria-label="ตั้งแต่วันที่" value={from}
          onChange={(e) => { setFrom(e.target.value); setPage(1); }} />
        <input type="date" className="field" aria-label="ถึงวันที่" value={to}
          onChange={(e) => { setTo(e.target.value); setPage(1); }} />
      </section>
      {filtered && (
        <button className="mb-4 text-sm font-medium text-baht-dark hover:underline"
          onClick={() => { setQ(""); setCategory(""); setFrom(""); setTo(""); setPage(1); }}>
          ล้างตัวกรอง
        </button>
      )}

      {/* รายการ */}
      <section className="rounded-2xl bg-white shadow-sm">
        {items.length === 0 && !loading ? (
          <div className="px-6 py-14 text-center">
            <p className="font-semibold">{filtered ? "ไม่พบรายการที่ตรงกับตัวกรอง" : "ยังไม่มีรายจ่าย"}</p>
            <p className="mt-1 text-sm text-ink-soft">
              {filtered ? "ลองเปลี่ยนคำค้นหาหรือล้างตัวกรอง" : "กด “เพิ่มรายจ่าย” เพื่อจดรายการแรก"}
            </p>
          </div>
        ) : (
          <ul className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
            {items.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line/70 px-5 py-4 last:border-0">
                <span className="w-1.5 self-stretch rounded-full" style={{ background: colorOf(e.category) }} aria-hidden />

                <div className="min-w-0 flex-1 basis-56">
                  <div className="flex items-end">
                    <span className="truncate font-medium">{e.title}</span>
                    <span className="leader hidden sm:block" />
                    <span className="num ml-auto font-semibold sm:ml-0">{baht(e.amount)}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-ink-soft">
                    {new Date(e.date).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })}
                    {" · "}{e.category}
                    {e.note && <> · {e.note}</>}
                    {isAdmin && e.user && <> · โดย {e.user.name ?? e.user.email}</>}
                  </p>
                </div>

                <div className="flex gap-1 text-sm">
                  <button onClick={() => openForm(e)} className="rounded-lg px-3 py-1.5 font-medium text-baht-dark hover:bg-baht-tint">แก้ไข</button>
                  <button onClick={() => setDeleting(e)} className="rounded-lg px-3 py-1.5 font-medium text-danger hover:bg-red-50">ลบ</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-5 flex items-center justify-center gap-4 text-sm">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}
            className="rounded-lg border-[1.5px] border-line bg-white px-4 py-2 font-medium disabled:opacity-40">ก่อนหน้า</button>
          <span className="num text-ink-soft">หน้า {page} จาก {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}
            className="rounded-lg border-[1.5px] border-line bg-white px-4 py-2 font-medium disabled:opacity-40">ถัดไป</button>
        </div>
      )}

      {/* ฟอร์มเพิ่ม/แก้ไข */}
      {editing && (
        <div className="fixed inset-0 z-10 flex items-end justify-center bg-ink/50 sm:items-center sm:px-4" onClick={() => setEditing(null)}>
          <form
            onSubmit={save}
            noValidate
            onClick={(e) => e.stopPropagation()}
            className="modal-in max-h-[92vh] w-full max-w-md space-y-4 overflow-y-auto rounded-t-2xl bg-white p-6 shadow-2xl sm:rounded-2xl"
          >
            <h2 className="text-xl font-bold">{editing === "new" ? "เพิ่มรายจ่าย" : "แก้ไขรายจ่าย"}</h2>

            <div>
              <label htmlFor="f-title" className="mb-1 block text-sm font-medium">ชื่อรายการ</label>
              <input id="f-title" className="field" value={form.title} autoFocus
                onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="เช่น ข้าวมันไก่" />
              {fieldErr("title")}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="f-amount" className="mb-1 block text-sm font-medium">จำนวนเงิน (บาท)</label>
                <input id="f-amount" className="field num" inputMode="decimal" value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" />
                {fieldErr("amount")}
              </div>
              <div>
                <label htmlFor="f-date" className="mb-1 block text-sm font-medium">วันที่</label>
                <input id="f-date" type="date" className="field" value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })} />
                {fieldErr("date")}
              </div>
            </div>

            <div>
              <span className="mb-1 block text-sm font-medium">หมวดหมู่</span>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => {
                  const on = form.category === c;
                  return (
                    <button key={c} type="button" aria-pressed={on} onClick={() => setForm({ ...form, category: c })}
                      className="rounded-full border-[1.5px] px-3.5 py-1.5 text-sm font-medium"
                      style={on ? { background: colorOf(c), borderColor: colorOf(c), color: "#fff" } : { borderColor: "var(--color-line)" }}>
                      {c}
                    </button>
                  );
                })}
              </div>
              {fieldErr("category")}
            </div>

            <div>
              <label htmlFor="f-note" className="mb-1 block text-sm font-medium">หมายเหตุ (ไม่บังคับ)</label>
              <textarea id="f-note" className="field" rows={2} value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })} />
              {fieldErr("note")}
            </div>

            {formError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-danger">{formError}</p>}

            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={() => setEditing(null)} className="rounded-xl px-4 py-2.5 font-medium hover:bg-ground">ยกเลิก</button>
              <button disabled={saving} className="rounded-xl bg-baht px-6 py-2.5 font-semibold text-white hover:bg-baht-dark disabled:opacity-50">
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ยืนยันลบ */}
      {deleting && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-ink/50 px-4" onClick={() => setDeleting(null)}>
          <div onClick={(e) => e.stopPropagation()} role="alertdialog" aria-label="ยืนยันการลบ"
            className="modal-in w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold">ลบรายการนี้?</h2>
            <p className="mt-2 text-ink-soft">
              “{deleting.title}” {baht(deleting.amount)} ฿ จะถูกลบถาวรและกู้คืนไม่ได้
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setDeleting(null)} className="rounded-xl px-4 py-2.5 font-medium hover:bg-ground">ยกเลิก</button>
              <button onClick={confirmDelete} className="rounded-xl bg-danger px-5 py-2.5 font-semibold text-white hover:opacity-90">ลบรายการ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
