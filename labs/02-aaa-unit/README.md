# Lab 02 — Arrange / Act / Assert

**Reference:** Gerard Meszaros, [xUnit Test Patterns](http://xunitpatterns.com/) — *Four-Phase Test*, *Test Smells*
**เวลา:** ~45 นาที

## แนวคิด

```ts
it('rejects an id whose checksum digit is wrong', () => {
  // Arrange — เตรียมสิ่งที่ต้องใช้
  const id = '1509900000018';

  // Act — ทำสิ่งที่กำลังทดสอบ "ครั้งเดียว"
  const valid = isValidThaiNationalId(id);

  // Assert — ตรวจผลลัพธ์ของ Act นั้น
  expect(valid).toBe(false);
});
```

กติกา:
- **1 test = 1 พฤติกรรม** — ชื่อ test อ่านแล้วรู้ว่าระบบควรทำอะไร (ไม่ใช่ชื่อ function)
- **Act ครั้งเดียว** — ถ้ามี Act หลายครั้ง แปลว่ามีหลาย test ซ่อนอยู่
- **ไม่มี logic ใน test** (`for`, `if`) — ใช้ `it.each` แทน loop
- ถ้า test นี้แดง ข้อความ error + ชื่อ test ต้องพอให้รู้ว่าอะไรพัง **โดยไม่ต้องเปิดไฟล์**

## Part A — จับ smell (10 นาที)

เปิด `app/test/unit/lab02-smelly.test.ts` แล้วระบุ smell ตาม xUnit Test Patterns ให้ได้อย่างน้อย 4 อย่าง:

| Smell | อยู่บรรทัดไหน | ปัญหาคืออะไรเมื่อ test แดง |
|---|---|---|
| Obscure Test | | |
| Eager Test (ทดสอบหลายอย่างใน test เดียว) | | |
| Assertion Roulette | | |
| Conditional Test Logic | | |
| Test ที่ไม่มี assertion | | |

ลองทำให้ `hashPassword` คืน plain text (`return password;`) แล้วรัน — error ที่ได้ช่วยหาปัญหาได้แค่ไหน? แก้คืนก่อนไปต่อ

## Part B — Refactor (25 นาที)

ลบ `lab02-smelly.test.ts` แล้วเขียนใหม่เป็นไฟล์ตามสิ่งที่ถูกทดสอบ ให้ครอบคลุมพฤติกรรม *เดิมทั้งหมด* และมี AAA ชัดเจน:

- `test/unit/thaiNationalId.test.ts` — เพิ่มเคสที่หายไปด้วย `it.each`
- `test/unit/passwords.test.ts`
  - hash ไม่ใช่ plain text
  - hash รหัสเดิม 2 ครั้งได้ผลต่างกัน (salt)
  - verify รหัสที่ถูกต้อง → `true`
  - verify รหัสผิด → `false`
  - stored hash รูปแบบผิด → `false` (ไม่ throw)
- `test/unit/config.test.ts`
  - ไม่มี env → ค่า default
  - อ่าน `PORT`, `JWT_SECRET`, `DATABASE_URL` จาก env ที่ส่งเข้าไป

สังเกตว่า `loadConfig(env)` **รับ env เป็น parameter** — ทำไมการออกแบบแบบนี้ทำให้ test ง่ายกว่าอ่าน `process.env` ตรง ๆ?

```bash
npm run test:unit
npx vitest run --project unit --reporter=tree   # ดูรายชื่อ test — อ่านแล้วเป็นเหมือน spec ไหม?
```

## Part C — Stretch

- เขียน test ให้ `toPublicUser` (ใน `src/services/accountService.ts`) ว่าไม่มี `passwordHash` หลุดออกไป
- ลองใช้ `describe` ซ้อนเพื่อจัดกลุ่มตามสถานการณ์ (`describe('when the password is wrong', ...)`)
