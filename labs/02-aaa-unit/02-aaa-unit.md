# Lab 02 — Arrange / Act / Assert

อ้างอิง: Gerard Meszaros, [xUnit Test Patterns](http://xunitpatterns.com/) — *Four-Phase Test*, *Test Smells*

## กติกาที่ตกลงกันไว้ก่อนเขียน test ใหม่

1. **1 test = 1 พฤติกรรม** — ตั้งชื่อจาก "ระบบควรทำอะไร" ไม่ใช่ชื่อ function (`never returns the plain-text password` อ่านรู้เรื่องกว่า `hash`)
2. **Act ครั้งเดียว** — ถ้าต้องเรียกของที่ทดสอบหลายรอบ แปลว่ามีหลาย test ซ่อนอยู่ในอันเดียว
3. **ไม่มี logic ใน test** (`for`, `if`) — ตาราง input ใช้ `it.each`
4. **แดงแล้วต้องอ่านรู้เรื่อง** — ชื่อ test + error message ต้องพอบอกว่าอะไรพัง โดยไม่ต้องเปิดไฟล์

## อย่างแรกที่ทำ: ย้าย unit test จาก Jest ไป Vitest

วันนี้เปลี่ยนตัวรัน unit test จาก Jest เป็น Vitest ก่อน เพราะ setup เบากว่าและแยก project ง่าย:

- เพิ่ม `vitest` ใน `app/package.json`
- เพิ่ม `app/vitest.config.mts` ตั้ง project `unit` ให้เก็บ `test/unit/**/*.test.ts`
- แก้ script `test:unit` จาก `jest --selectProjects unit` → `vitest run --project unit`
- ส่วน `test:integration` ยังใช้ Jest เหมือนเดิม ไม่ได้แตะ

## Part A — กลิ่นที่จับได้จาก `lab02-smelly.test.ts` (ไฟล์เดิมที่ลบไปแล้ว)

| Smell | อยู่ไหน | ปัญหาเมื่อ test แดง |
|---|---|---|
| Obscure Test (Mystery Guest) | loop ที่ push เข้า `results[]` แล้ว assert ด้วย index (`results[0]`, `results[1]`, ...) | ต้องนับย้อนเองว่า index ที่ fail คือ input ไหน ผ่าน/พังเพราะอะไร |
| Eager Test | test `works` รวม 3 เรื่อง (เลขบัตร, รหัสผ่าน, config) ใน test เดียว | พังที่ assertion ไหนสักอันแล้ว *ที่เหลือไม่รันเลย* — ไม่รู้ว่ามีจุดพังตามอีกหรือเปล่า |
| Assertion Roulette | assert ต่อกัน 5–6 บรรทัดโดยไม่มีคำอธิบาย | ได้แค่ "expected false to be true" กองรวมกัน ไม่รู้ assertion ไหนผิดในเชิงความหมาย |
| Conditional Test Logic | `if (h === h2) throw new Error('same hash')` | logic แปลกปลอมใน test — error มาจาก throw ไม่ใช่ assertion, และบาง path ไม่มี assertion เลย |
| Test ที่ไม่มี assertion | test `hash` เรียก `hashPassword('x')` แล้วจบ | ผ่านเสมอ ไม่ป้องกันอะไรเลย — ให้ความมั่นใจปลอม |

## ทดลองจริง: พังเหมือนกัน แต่ error ต่างกัน

ทำให้ `hashPassword` คืน plain text (`return password;`) แล้วรัน สองรอบ — ก่อนและหลัง refactor:

**ก่อน refactor (smelly file):**

```
● stuff › works
  expect(received).not.toBe(expected)
  Expected: not "voter1234"
  at test/unit/lab02-smelly.test.ts:21:19
```

test ชื่อ `works` ไม่บอกอะไรเลย และทุก assertion หลังบรรทัด 21 (เรื่อง salt, เรื่อง verify, เรื่อง config) ไม่ได้รันเลย

**หลัง refactor:** แดง 2 อัน โดยแต่ละอันมีชื่อ = พฤติกรรมที่ถูกละเมิด:

```
● hashPassword › never returns the plain-text password
● hashPassword › gives a different hash each time for the same password (random salt)
```

อ่าน output อย่างเดียวก็รู้ว่า "ระบบเก็บรหัสผ่านเป็น plain text" — และที่สำคัญ เรื่องอื่น (verify, config, เลขบัตร) ยังรันและเขียว
จึงรู้ขอบเขตของบั๊กด้วย

## Part B — ของที่เขียนใหม่จริงๆ วันนี้

ลบ `lab02-smelly.test.ts` ทิ้ง แล้วแยกใหม่เป็นไฟล์ตามชิ้นที่ถูกทดสอบ
เดิมมี test แค่ 2 อัน (แต่ยัดหลายเรื่องรวมกัน) ตอนนี้ได้ทั้งหมด **21 tests** และรันเขียวหมด:

- `thaiNationalId.test.ts` — 10 tests, เพิ่มเคสที่หายไปด้วย `it.each` (valid เพิ่มอีก 2, malformed เพิ่ม all-letters กับ dashes)
- `passwords.test.ts` — 8 tests (ไฟล์ใหม่) hash ≠ plain text, salt ทำให้ hash รหัสเดิมซ้ำไม่เหมือนกัน, verify ผ่าน/ไม่ผ่าน,
  stored hash รูปแบบพังคืน `false` ไม่ throw
- `config.test.ts` — 2 tests (ไฟล์ใหม่) default ของ dev ตอนไม่มี env, อ่าน `PORT` / `JWT_SECRET` / `DATABASE_URL` จาก env ที่ส่งเข้ามา
- `toPublicUser.test.ts` — 1 test (ไฟล์ใหม่, เป็นส่วน stretch) เช็คว่า `passwordHash` ไม่หลุดออกไป และ field อื่นยังอยู่ครบ

```bash
npm run test:unit
npx vitest run --project unit --reporter=tree   # อ่านรายชื่อ test เรียงกัน เหมือน spec ของระบบ
```

รายชื่อ test ที่พิมพ์ออกมาอ่านเรียงกันแล้วเหมือน spec ของระบบ — นี่คือผลพลอยได้ของการตั้งชื่อจากพฤติกรรม

## สังเกตการออกแบบ: `loadConfig(env)` รับ env เป็น parameter

ถ้า `loadConfig` อ่าน `process.env` ตรง ๆ ทุก test ต้อง:
- เก็บค่าเดิม / แก้ / คืนค่าใน `beforeEach`-`afterEach` (ยุ่ง และพังง่ายถ้ารันขนาน)
- แตะ global state ร่วมกัน — test หนึ่งแก้ env แล้วเด้งไปกวน test อื่นได้

แต่ตอนนี้ env เป็นแค่ parameter — test ส่ง object เข้าไปตรง ๆ, ไม่มี shared state, Arrange จบในบรรทัดเดียว
นี่คือแนวคิดเดียวกับ dependency injection ใน `createApp(deps)`: ยิ่ง dependency มาจากภายนอก function
test ยิ่งไม่ต้องแอบแก้ที่ลับ ๆ
