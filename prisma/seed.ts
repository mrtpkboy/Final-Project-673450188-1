import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.SEED_ADMIN_EMAIL ?? "admin@example.com").toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? "admin1234";

  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name: "Administrator",
      email,
      passwordHash: await bcrypt.hash(password, 12),
      role: "ADMIN",
    },
  });

  console.log(`Seeded admin user: ${email}`);

  // ข้อมูลตัวอย่างสำหรับพรีเซนต์ (ใส่เฉพาะตอนยังไม่มีข้อมูล)
  if ((await prisma.expense.count()) === 0) {
    const day = (n: number) => new Date(Date.now() - n * 86_400_000);
    const samples = [
      ["ข้าวมันไก่", 60, "อาหาร", 0, "มื้อเที่ยง"],
      ["กาแฟ", 75, "อาหาร", 0, null],
      ["ค่า BTS", 44, "เดินทาง", 1, "ไปมหาวิทยาลัย"],
      ["ค่าแท็กซี่", 180, "เดินทาง", 2, null],
      ["ค่าหอพัก", 3500, "ที่พัก", 3, "ประจำเดือน"],
      ["เสื้อยืด", 350, "ช้อปปิ้ง", 4, null],
      ["ยาแก้หวัด", 90, "สุขภาพ", 5, "ร้านขายยา"],
      ["ดูหนัง", 220, "บันเทิง", 6, null],
      ["หนังสือเรียน", 450, "อื่นๆ", 7, null],
      ["ก๋วยเตี๋ยว", 55, "อาหาร", 8, null],
      ["ค่าน้ำมัน", 500, "เดินทาง", 9, null],
      ["ชานมไข่มุก", 65, "อาหาร", 10, null],
    ] as const;
    await prisma.expense.createMany({
      data: samples.map(([title, amount, category, d, note]) => ({
        title, amount, category, note, date: day(d), userId: admin.id,
      })),
    });
    console.log(`Seeded ${samples.length} sample expenses`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
