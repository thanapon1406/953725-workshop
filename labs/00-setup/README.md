# Lab 00 — Setup (ทำก่อน workshop)

**เป้าหมาย:** เครื่องพร้อม, รัน test ได้ครบทั้ง 3 ระดับ, รู้จัก repo ก่อนวันจริง

## 1. รัน doctor

ทำตาม [`setup/README.md`](../../setup/README.md) จนได้ `✅ READY` แล้วส่ง screenshot

## 2. รัน test ครบทุก boundary

```bash
cd app
npm run test:unit          # ~1 วินาที, ไม่แตะ database
npm run test:integration   # เปิด Postgres + Liquibase แล้วรัน component test
npm run test:e2e           # build app เป็น container แล้วยิง HTTP ด้วย Playwright
```

สังเกตและจดไว้ (จะใช้คุยกันใน Lab 01):

| | unit | integration | e2e |
|---|---|---|---|
| เวลาที่ใช้ (โดยประมาณ) | | | |
| ต้องมี Docker ไหม | | | |
| ถ้า test พัง บอกได้แม่นแค่ไหนว่าพังที่ไหน | | | |

## 3. ทำให้ test แดง แล้วแก้ให้เขียว

1. เปิด `app/src/domain/thaiNationalId.ts` เปลี่ยน `(13 - i)` เป็น `(12 - i)`
2. รัน `npm run test:unit` — test ไหนแดง? error message บอกอะไรเรา?
3. รัน `npm run test:integration` — แดงด้วยไหม? ทำไม?
4. แก้คืน แล้วรันอีกครั้งให้เขียว

<!-- 
เปลี่ยน `(13 - i)` เป็น `(12 - i) 
1. รัน npm run test:unit ได้แดง Fail isValidThaiNationalId › accepts an id whose last digit matches the checksum 
2. รัน `npm run test:integration` ได้แดง Fail  
    ✕ registers a voter who can then log in (41 ms)
    ● POST /auth/register (component test: app + real Postgres) › registers a voter who can then log in
-->

## 4. อ่าน repo (15 นาที)

- `app/README.md` — คำสั่ง, API, โครงสร้าง
- `app/jest.config.js` — ทำไมแยก `unit` กับ `integration` เป็น 2 projects?
- `app/src/app.ts` — `createApp(deps)` รับ dependency อะไรบ้าง? ทำไมถึงออกแบบแบบนี้?
- `app/src/routes/voteRoutes.ts` — เทียบกับ route อื่น เห็นอะไรต่างไปบ้าง? (เก็บไว้ใช้ Day 2)

## 5. เตรียม test cases ของตัวเอง

เขียน test cases ของระบบเลือกตั้งส่วนที่ตัวเองรับผิดชอบ อย่างน้อย 8 ข้อ ในรูปแบบ:

| ID | Given | When | Then |
|---|---|---|---|
| TC-01 | ผู้มีสิทธิในเขต CM-1 ที่ยังไม่เคยลงคะแนน | ลงคะแนนให้ผู้สมัครหมายเลข 2 ของเขต CM-1 | ระบบบันทึกคะแนน และแสดงว่าเลือกหมายเลข 2 แล้ว |

ส่งพร้อม screenshot ภายใน **วันพฤหัสบดีที่ 1 ตุลาคม 2026**
