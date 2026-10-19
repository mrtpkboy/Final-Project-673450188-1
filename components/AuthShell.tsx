import Link from "next/link";

// กรอบหน้า Login / Sign up: ซ้าย = แบรนด์, ขวา = ฟอร์ม
export default function AuthShell({
  title, subtitle, children, footer,
}: { title: string; subtitle: string; children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <section className="hidden flex-col justify-between bg-ink p-12 text-white lg:flex">
        <Link href="/" className="text-xl font-bold tracking-tight">สมุดรายจ่าย</Link>
        <div className="receipt max-w-sm rotate-[-2deg] p-6 text-ink shadow-2xl">
          <p className="text-sm text-ink-soft">วันนี้ใช้ไปแล้ว</p>
          <p className="num text-5xl font-bold">285<span className="text-2xl">.00 ฿</span></p>
          <div className="mt-5 space-y-2 text-sm">
            {[["ข้าวมันไก่", "60.00"], ["กาแฟ", "75.00"], ["ค่า BTS", "44.00"], ["ชานมไข่มุก", "106.00"]].map(([n, a]) => (
              <div key={n} className="flex items-end"><span>{n}</span><span className="leader" /><span className="num">{a}</span></div>
            ))}
          </div>
        </div>
        <p className="max-w-sm text-white/70">จดทุกบาททุกวัน แล้วดูว่าเงินไปอยู่ตรงไหนมากที่สุด</p>
      </section>

      <section className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="mb-8 mt-1 text-ink-soft">{subtitle}</p>
          {children}
          <div className="mt-8 text-sm text-ink-soft">{footer}</div>
        </div>
      </section>
    </main>
  );
}
