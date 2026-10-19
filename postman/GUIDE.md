# คู่มือทดสอบ API ด้วย Postman

Postman คือโปรแกรมสำหรับยิง (ส่ง) request ไปหา API แล้วดูผลลัพธ์ผ่านหน้าจอ โดยไม่ต้องเขียนโค้ด
ไฟล์ `Expense_API.postman_collection.json` ในโฟลเดอร์นี้ คือชุด request สำเร็จรูปที่ครบทุก endpoint

## 1. เตรียมก่อนใช้

1. ติดตั้ง Postman: <https://www.postman.com/downloads/> (ใช้แบบ Desktop ไม่ต้องสมัครก็ใช้ได้ กด "Skip and go to the app")
2. รันแอปให้พร้อม ใน terminal ของโปรเจกต์:
   ```bash
   npm run db:seed    # สร้าง admin + ข้อมูลตัวอย่าง (ทำครั้งแรกครั้งเดียว)
   npm run dev        # เปิด http://localhost:3000 ค้างไว้
   ```

## 2. Import Collection

1. เปิด Postman → กดปุ่ม **Import** (มุมซ้ายบน)
2. ลากไฟล์ `postman/Expense_API.postman_collection.json` มาวาง
3. จะเห็น Collection ชื่อ **Expense Tracker API** ที่แถบซ้าย (Collections) มี 2 โฟลเดอร์:
   - `0. Login (Auth.js)` — 4 request
   - `1. Expenses (CRUD)` — 8 request

## 3. ตัวแปร (Variables)

คลิกที่ชื่อ Collection → แท็บ **Variables** จะเห็น:

| ตัวแปร | ค่าเริ่มต้น | ใช้ทำอะไร |
| --- | --- | --- |
| `baseUrl` | `http://localhost:3000` | ที่อยู่เซิร์ฟเวอร์ (ถ้าเปลี่ยนพอร์ต แก้ที่นี่) |
| `email` | `admin@example.com` | อีเมลที่ใช้ login |
| `password` | `admin1234` | รหัสผ่านที่ใช้ login |
| `csrfToken` | (ว่าง) | Postman เติมให้เองหลังขอ CSRF |
| `expenseId` | (ว่าง) | Postman เติมให้เองหลังสร้างรายการ |

ใน request จะเห็นเป็น `{{baseUrl}}` ฯลฯ — Postman จะแทนค่าให้ตอนส่ง
อยากทดสอบด้วยบัญชี USER ธรรมดา ให้แก้ `email` / `password` เป็นบัญชีที่สมัครไว้ แล้วกด **Save** (Ctrl+S)

## 4. วิธีรันแบบเร็ว (ทั้งชุดอัตโนมัติ)

1. คลิกขวาที่ Collection → **Run collection** (หรือกดปุ่ม Run)
2. กด **Run Expense Tracker API**
3. Postman จะยิงทุก request ตามลำดับ และแสดง ✅ / ❌ ของแต่ละ test
   ถ้าเขียวหมด แปลว่า API ทำงานถูกต้องทั้ง 401 / 201 / 422 / 200 / 404

## 5. วิธีรันทีละ request (เหมาะกับการพรีเซนต์)

ต้องกดตามลำดับ เพราะ request ถัดไปใช้ผลของอันก่อนหน้า

### โฟลเดอร์ 0 — Login

| ลำดับ | Request | ทำอะไร | ผลที่ควรเห็น |
| --- | --- | --- | --- |
| 0.1 | ยังไม่ login → 401 | ยิง `GET /api/expenses` โดยไม่มี cookie | Status **401** |
| 0.2 | ขอ CSRF token | `GET /api/auth/csrf` | ได้ `csrfToken` (script เก็บลงตัวแปรให้) |
| 0.3 | Login | `POST /api/auth/callback/credentials` (Body แบบ x-www-form-urlencoded) | Status **200** และ Postman เก็บ cookie ไว้ |
| 0.4 | ตรวจ session | `GET /api/auth/session` | เห็น `user.email` และ `role` |

> ทำไมต้องขอ CSRF ก่อน: Auth.js ป้องกัน CSRF จึงต้องส่ง token คู่กับ cookie ในการ login
> Postman เก็บ cookie ให้เองตลอด จึงไม่ต้องแนบ cookie ด้วยมือ (ดูได้ที่ปุ่ม **Cookies** ใต้ปุ่ม Send)

### โฟลเดอร์ 1 — CRUD

| ลำดับ | Method | URL | ผลที่ควรเห็น |
| --- | --- | --- | --- |
| 1.1 | POST | `/api/expenses` | **201** + ได้ `id` (เก็บลง `expenseId`) |
| 1.2 | POST (ข้อมูลผิด) | `/api/expenses` | **422** + `fields` บอก error ราย field |
| 1.3 | GET | `/api/expenses` | **200** + `data`, `pagination`, `summary` |
| 1.4 | GET + ค้นหา/กรอง | `/api/expenses?q=...&category=...` | **200** เฉพาะรายการที่ตรงเงื่อนไข |
| 1.5 | GET | `/api/expenses/{{expenseId}}` | **200** รายการเดียว |
| 1.6 | PUT | `/api/expenses/{{expenseId}}` | **200** ค่าถูกแก้ |
| 1.7 | DELETE | `/api/expenses/{{expenseId}}` | **200** "ลบข้อมูลเรียบร้อย" |
| 1.8 | GET (หลังลบ) | `/api/expenses/{{expenseId}}` | **404** |

## 6. ส่วนประกอบของหน้าจอ Postman ที่ควรรู้

เมื่อเปิด request หนึ่ง ๆ จะเห็น:

- **ช่องบนสุด**: เลือก method (GET/POST/PUT/DELETE) + ช่อง URL + ปุ่ม **Send**
- **Params**: ค่าหลังเครื่องหมาย `?` ใน URL เช่น `q`, `category` (ติ๊กถูกเพื่อเปิด/ปิดแต่ละตัว)
- **Headers**: เช่น `Content-Type: application/json`
- **Body**: ข้อมูลที่ส่งไป — แบบ `raw` + `JSON` สำหรับ API รายจ่าย, แบบ `x-www-form-urlencoded` สำหรับ login
- **Scripts**: โค้ด JavaScript เล็ก ๆ ที่รันก่อนส่ง (Pre-request) หรือหลังได้ผล (Post-response / Tests)
- **ส่วนล่าง (Response)**: ดู **Status** (200/201/401/422/404), **Time**, **Size** และแท็บ Body (Pretty) ที่จัดรูป JSON ให้อ่านง่าย
  แท็บ **Test Results** จะแสดงผล ✅/❌ ของ test ที่เขียนไว้

## 7. ลองสร้าง request เองตั้งแต่ศูนย์ (เพื่อให้เข้าใจ)

หลัง login แล้ว (ทำ 0.2 → 0.3 แล้ว):

1. กด **+** เปิดแท็บใหม่
2. เลือก **POST** แล้วใส่ URL `http://localhost:3000/api/expenses`
3. แท็บ **Body** → เลือก **raw** → เปลี่ยนเมนูขวาเป็น **JSON** แล้วพิมพ์:
   ```json
   { "title": "กาแฟ", "amount": 65, "category": "อาหาร", "date": "2026-10-19" }
   ```
4. กด **Send** → ควรได้ `201 Created`
5. ลองส่ง `"amount": -5` → จะได้ `422` พร้อมข้อความ "จำนวนเงินต้องมากกว่า 0"

## 8. แก้ปัญหาที่พบบ่อย

| อาการ | สาเหตุ / วิธีแก้ |
| --- | --- |
| `Could not get any response` / ECONNREFUSED | ยังไม่ได้รัน `npm run dev` หรือ `baseUrl` ผิดพอร์ต |
| ทุก request ได้ **401** หลัง login | login ไม่สำเร็จ — เช็ก `email`/`password` ใน Variables, ลองรัน 0.2 → 0.3 → 0.4 ใหม่ และดู 0.4 ว่าได้ `user` หรือ `{}` |
| 0.3 ได้ 200 แต่ session ว่าง | CSRF หมดอายุ/ไม่ตรง — รัน 0.2 ใหม่แล้ว 0.3 อีกครั้ง |
| 1.5–1.8 ได้ **404** ทั้งที่ยังไม่ลบ | `expenseId` ว่าง — รัน 1.1 ก่อน |
| ได้ **403** | พยายามเข้าถึงรายการของคนอื่นด้วยบัญชี USER (เฉพาะ ADMIN ที่เห็นของทุกคน) |
| ได้ **400** "ต้องส่งข้อมูลเป็น JSON" | Body ไม่ใช่ JSON ที่ถูกต้อง — เช็กว่าเลือก raw + JSON และไม่มี comma เกิน |
| 0.1 ไม่ได้ 401 | Postman เวอร์ชันเก่าอาจล้าง cookie ไม่ได้ — ลบ cookie เองที่ปุ่ม **Cookies** → ลบ `localhost` แล้วส่งใหม่ |
