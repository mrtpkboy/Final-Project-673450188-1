# ระบบบันทึกรายจ่ายประจำวัน (Expense Tracker)

ต่อยอดจากโปรเจกต์ Auth + RBAC เดิม เพิ่มระบบ **บันทึกรายจ่ายประจำวัน** ที่มีครบ 5 ข้อ:

| # | คุณสมบัติ | ทำที่ไหน |
| --- | --- | --- |
| 1 | CRUD (แสดง / เพิ่ม / แก้ไข / ลบ) | หน้า `/expenses` + `components/ExpenseManager.tsx` |
| 2 | Validation | `app/lib/expense-schema.ts` (zod) ใช้ที่ฝั่ง API — ส่ง error ราย field กลับมาแสดงใต้ช่องกรอก |
| 3 | Authentication / Authorization | Auth.js (Email+Password, GitHub) · API ตรวจ session ทุกครั้ง · USER เห็นเฉพาะของตัวเอง, ADMIN เห็นทั้งหมด |
| 4 | Search + Filter | ค้นหาชื่อ/หมายเหตุ, กรองหมวดหมู่, กรองช่วงวันที่, แบ่งหน้า, แสดงยอดรวม |
| 5 | REST API | `GET/POST /api/expenses` · `GET/PUT/DELETE /api/expenses/:id` |

## หน้าตา (UI)

ธีม "ใบเสร็จ": ยอดรวมแสดงเป็นใบเสร็จขอบหยัก, แท่งสรุปเงินแยกตามหมวด (คลิกเพื่อกรองได้), รายการมีเส้นจุดไข่ปลาโยงไปหาจำนวนเงิน,
ฟอร์มเพิ่ม/แก้ไขเลือกหมวดด้วยปุ่มสี, มีหน้ายืนยันก่อนลบ และใช้งานบนมือถือได้ ใช้ฟอนต์ IBM Plex Sans Thai (โหลดผ่าน `next/font/google` ต้องต่ออินเทอร์เน็ตตอน build/dev ครั้งแรก)
สีและตัวอักษรตั้งค่าไว้ที่ `app/globals.css`

## REST API

ต้อง login ก่อน (ใช้ session cookie ของ Auth.js) ไม่เช่นนั้นจะได้ `401`

| Method | URL | คำอธิบาย | Status |
| --- | --- | --- | --- |
| GET | `/api/expenses?q=&category=&from=&to=&page=&pageSize=` | รายการ + search/filter + แบ่งหน้า + ยอดรวม | 200 |
| POST | `/api/expenses` | สร้างรายการ | 201 / 422 |
| GET | `/api/expenses/:id` | ดูรายการเดียว | 200 / 403 / 404 |
| PUT | `/api/expenses/:id` | แก้ไข | 200 / 422 |
| DELETE | `/api/expenses/:id` | ลบ | 200 |

ตัวอย่าง body (POST / PUT):

```json
{ "title": "ข้าวมันไก่", "amount": 60, "category": "อาหาร", "date": "2026-10-18", "note": "มื้อเที่ยง" }
```

กฎ validation: `title` 1–100 ตัวอักษร · `amount` > 0 และ ≤ 10,000,000 · `category` ต้องอยู่ในรายการที่กำหนด ·
`date` ต้องเป็นวันที่ที่ถูกต้อง · `note` ไม่เกิน 500 ตัวอักษร

### ทดสอบ API

**แบบที่ 1: หน้าเว็บ `/api-test` (ไม่ต้องติดตั้งอะไรเพิ่ม)**

1. รัน `npm run dev` แล้ว login (เช่น `admin@example.com` / `admin1234`)
2. พิมพ์ URL เข้าไปที่ <http://localhost:3000/api-test> ตรง ๆ (ไม่มีปุ่มลิงก์ไปหน้านี้ในแอป)
3. กด **ทดสอบทั้งหมด** หรือกด **ส่ง** ทีละขั้นตอน จะเห็น status ที่คาดหวัง/ที่ได้ ผ่าน/ไม่ผ่าน และ JSON ที่ส่ง/ตอบกลับ

ครอบคลุม 401 / 201 / 422 / 200 (list, search, get, put, delete) / 404

**แบบที่ 2: Postman**

มี Collection สำเร็จรูปที่ `postman/Expense_API.postman_collection.json` — Import เข้า Postman แล้วกด Run collection
คู่มือละเอียดพร้อมวิธีแก้ปัญหา: [`postman/GUIDE.md`](postman/GUIDE.md)

## เริ่มใช้งานแบบเร็ว

```bash
npm install
cp .env.example .env          # แล้วใส่ AUTH_SECRET (openssl rand -base64 32)
npx prisma migrate dev --name init
npm run db:seed               # สร้าง admin + ข้อมูลรายจ่ายตัวอย่าง
npm run dev                   # เปิด http://localhost:3000
```

Login: `admin@example.com` / `admin1234` หรือสมัครใหม่ที่ `/signup` (ได้ role USER)

---

# (เอกสารเดิม) Next.js Authentication + Role-Based Access (RBAC)

ตัวอย่างระบบ Login ด้วย **Email/Password** และ **GitHub** พร้อมระบบสิทธิ์ผู้ใช้ (ADMIN / STAFF / USER)
สร้างด้วย Next.js (App Router), Auth.js (next-auth v5 beta), Prisma และ Tailwind CSS

## ฟีเจอร์

- สมัครสมาชิก (Sign Up) พร้อมตรวจสอบข้อมูล และเข้ารหัสรหัสผ่านด้วย bcrypt
- Login ด้วย Email/Password (Credentials Provider)
- Login ด้วย GitHub OAuth
- Session แบบ JWT ที่เก็บ `id` และ `role`
- ป้องกันหน้า `/admin` เฉพาะ role `ADMIN`
- หน้า `/unauthorized` สำหรับผู้ที่ไม่มีสิทธิ์

## โครงสร้างโปรเจกต์

```
app/
├── api/auth/[...nextauth]/route.ts   # Auth.js route handler
├── admin/page.tsx                    # หน้าเฉพาะ ADMIN
├── api-test/page.tsx                 # หน้าทดสอบ REST API บนเว็บ
├── login/page.tsx                    # หน้า Login (Email/Password + GitHub)
├── login-github/page.tsx             # หน้า Login ด้วย GitHub อย่างเดียว (Server Action)
├── signup/
│   ├── actions.ts                    # Server Action สมัครสมาชิก
│   └── page.tsx                      # หน้า Sign Up
├── unauthorized/page.tsx             # หน้าไม่มีสิทธิ์
├── lib/prisma.ts                     # Prisma Client
├── auth.ts                           # ตั้งค่า Auth.js
├── layout.tsx
└── page.tsx                          # หน้าแรก
prisma/
├── schema.prisma                     # โมเดล User + enum Role
└── seed.ts                           # สร้างผู้ใช้ ADMIN เริ่มต้น
types/next-auth.d.ts                  # เพิ่ม type ให้ role / id
```

## ความต้องการของระบบ

- Node.js 18.18 ขึ้นไป (แนะนำ 20+)
- npm
- บัญชี GitHub (ถ้าต้องการใช้ Login ด้วย GitHub)

## วิธีติดตั้ง

### 1. ติดตั้ง dependencies

```bash
npm install
```

### 2. สร้างไฟล์ `.env`

```bash
cp .env.example .env
```

แก้ค่าในไฟล์ `.env`:

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="ใส่-secret-ของคุณ"
AUTH_GITHUB_ID="..."
AUTH_GITHUB_SECRET="..."
```

สร้าง `AUTH_SECRET` ได้ด้วยคำสั่งใดคำสั่งหนึ่ง:

```bash
npx auth secret
# หรือ
openssl rand -base64 32
```

### 3. สร้างฐานข้อมูล

```bash
npx prisma migrate dev --name auth_user
npx prisma generate
```

โปรเจกต์นี้ใช้ SQLite เพื่อให้เริ่มต้นง่าย หากต้องการใช้ PostgreSQL/MySQL ให้แก้ `provider` และ `DATABASE_URL`
ใน `prisma/schema.prisma` / `.env` แล้วรัน migrate ใหม่

### 4. สร้างผู้ใช้ ADMIN เริ่มต้น

ผู้ที่สมัครผ่านหน้า Sign Up จะได้ role `USER` เสมอ จึงต้องสร้าง ADMIN ผ่าน seed:

```bash
npm run db:seed
```

ค่าเริ่มต้น: `admin@example.com` / `admin1234` (เปลี่ยนได้ด้วย `SEED_ADMIN_EMAIL` และ `SEED_ADMIN_PASSWORD` ใน `.env`)
**ควรเปลี่ยนรหัสผ่านนี้ก่อนนำไปใช้งานจริง**

### 5. (ไม่บังคับ) ตั้งค่า GitHub OAuth App

1. ไปที่ GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**
2. กรอกข้อมูลสำหรับ development:

   | ช่อง | ค่า |
   | --- | --- |
   | Application name | Next.js RBAC Demo |
   | Homepage URL | `http://localhost:3000` |
   | Authorization callback URL | `http://localhost:3000/api/auth/callback/github` |

3. กด Register application แล้วสร้าง **Client secret**
4. นำ Client ID และ Client secret ไปใส่ใน `.env` เป็น `AUTH_GITHUB_ID` และ `AUTH_GITHUB_SECRET`

เมื่อขึ้น production ให้สร้าง OAuth App ใหม่ (หรือเพิ่ม URL) โดยใช้โดเมนจริงแทน `localhost:3000`

### 6. รันโปรเจกต์

```bash
npm run dev
```

เปิด <http://localhost:3000>

## วิธีใช้งาน

| หน้า | URL | คำอธิบาย |
| --- | --- | --- |
| หน้าแรก | `/` | แสดงสถานะการ Login, ปุ่ม Logout |
| สมัครสมาชิก | `/signup` | สร้างบัญชีใหม่ (role = `USER`) |
| เข้าสู่ระบบ | `/login` | Email/Password หรือ GitHub |
| เข้าสู่ระบบด้วย GitHub | `/login-github` | ปุ่ม GitHub อย่างเดียว |
| Admin | `/admin` | เฉพาะ `ADMIN` |
| ไม่มีสิทธิ์ | `/unauthorized` | แสดงเมื่อ role ไม่พอ |

### ลองทดสอบ

1. เข้า `/signup` สมัครบัญชีใหม่ → ระบบพาไป `/login`
2. Login ด้วยบัญชีที่เพิ่งสมัคร → ถูกพาไป `/admin` แล้ว redirect ไป `/unauthorized` เพราะเป็น `USER`
3. Login ด้วยบัญชี ADMIN จาก seed → เข้า `/admin` ได้
4. ผู้ที่ Login ด้วย GitHub จะได้ role `USER` เป็นค่าเริ่มต้น

### การป้องกันหน้าด้วย role

ใน Server Component:

```tsx
import { auth } from "@/app/auth";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await auth();

  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/unauthorized");

  return <div>เฉพาะ ADMIN</div>;
}
```

ใน Client Component ใช้ `signIn` / `signOut` จาก `next-auth/react` ได้ตามปกติ

### เปลี่ยน role ของผู้ใช้

```bash
npx prisma studio
```

เปิดตาราง `User` แล้วแก้ช่อง `role` เป็น `ADMIN`, `STAFF` หรือ `USER` (ผู้ใช้ต้อง Login ใหม่เพื่อให้ role ใน session อัปเดต)

## คำสั่งที่ใช้บ่อย

| คำสั่ง | ความหมาย |
| --- | --- |
| `npm run dev` | รันโหมดพัฒนา |
| `npm run build` / `npm start` | Build / รันโหมด production |
| `npm run db:migrate` | รัน Prisma migrate |
| `npm run db:seed` | สร้างผู้ใช้ ADMIN เริ่มต้น |
| `npm run db:studio` | เปิด Prisma Studio ดู/แก้ข้อมูล |

## ข้อควรรู้

- ผู้ใช้ที่ Login ด้วย GitHub จะถูก upsert ลงตาราง User (role `USER`) แล้ว แก้ role ได้ผ่าน Prisma Studio
- Sign Up กำหนด role เป็น `USER` เสมอ เพื่อไม่ให้ใครสมัครเป็น ADMIN ได้เอง
- ก่อนขึ้น production: ตั้ง `AUTH_SECRET` ใหม่, เปลี่ยนรหัสผ่าน ADMIN, ใช้ฐานข้อมูลจริง (เช่น PostgreSQL),
  และใช้ HTTPS
- ห้าม commit ไฟล์ `.env` ขึ้น Git
