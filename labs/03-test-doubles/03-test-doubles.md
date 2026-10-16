# Lab 03 — Test Doubles

อ้างอิง: Gerard Meszaros, [xUnit Test Patterns — Test Double](http://xunitpatterns.com/Test%20Double.html)

## ห้าแบบ แยกตาม "ใช้ทำอะไร" (ไม่ใช่ตามเครื่องมือ)

`vi.fn()` ทำได้ทุกแบบ — ตัวกำหนดคือ *เจตนา* ของ test ไม่ใช่ตัวเครื่องมือ:

| Double | หน้าที่ | ใน test ของเรา |
|---|---|---|
| **Dummy** | เติมช่องที่ constructor บังคับ แต่เส้นทางนี้ไม่ได้ใช้ | `dummyTokens` ที่ `issue`/`verify` โยน error — ถ้า logic เผลอไปเรียกมัน จะพังดัง ๆ ไม่ผ่านเงียบ ๆ |
| **Stub** | ป้อน input ทางอ้อมที่เราควบคุม | `districtRepository(exists)` ตอบคำถามเดียว: "เขต CM-1 มีอยู่ไหม" |
| **Spy** | บันทึก output ทางอ้อมไว้ดูทีหลัง | `vi.spyOn(users, 'create')` แล้วอ่าน `saveUser.mock.calls[0][0]` ว่าได้ `passwordHash` อะไร |
| **Mock** | ตั้ง expectation ล่วงหน้าว่าต้องถูกเรียกยังไง | `mockTokens()` — `issue` ต้องถูกเรียกด้วย `{ userId, role, districtId }` ของคนนั้น หรือ *ต้องไม่* ถูกเรียกเมื่อ login พลาด |
| **Fake** | implementation จริงแต่เล็ก ไม่มี I/O | `InMemoryUserRepository`, `InMemoryPartyRepository`, `InMemoryCandidateRepository` ใน `test/support/inMemoryRepositories.ts` |

ทำไมทำได้: `AccountService` รับ repository กับ `TokenService` ผ่าน **constructor**
→ จุดเชื่อมต่อ (seam) นี้แหละที่ทำให้เสียบ double แทนของจริงได้ โดยไม่ต้องแก้ production code เลย

## สิ่งที่เขียนใหม่

- `test/support/inMemoryRepositories.ts` (ใหม่) — fake repositories ทั้ง 4 ตัว
  ข้างในใช้ helper `InMemoryTable<T>` ตัวเดียวเก็บ rows + `nextId` + `findById`/`find`/`where`/`all`/`insert`
  เพื่อไม่ให้ `create`/`findById` ถูกเขียนซ้ำ 4 รอบ (district แยกเดี่ยว เพราะใช้ string id ที่ seed มา ไม่มี auto-increment)
- `test/support/fixtures.ts` (ใหม่) — ข้อมูลเทสต์ที่ใช้ร่วมกัน: `VALID_NATIONAL_ID`, `CM1_DISTRICT`/`CM2_DISTRICT`/`DISTRICTS`,
  `USER_ME()`, `USER_TOON()`, `aParty()`, `aCandidate()`, `aPrincipal()` — ทุกตัวเป็นฟอร์แมต `aX(overrides)` เหมือนกัน
- `test/unit/accountService.test.ts` — dummy/stub/spy/mock/fake ครบ (Part A) โดยมี `makeAccounts()` รวมการต่อ service ไว้ที่เดียว
- `test/unit/electionAdminService.test.ts` — ขับด้วย fake ล้วน (Part B) ผ่าน `givenElectionAdmin({ green, blue })`
  ที่คืน `parties.green.id` มาให้ test ใช้ ไม่ต้องเดา id เอง
- `test/unit/jwtTokenService.test.ts` — เทสต์หมดอายุด้วย fake timers (Part C)
- `test/unit/toPublicUser.test.ts` — แก้ให้ดึง `USER_ME()` จาก fixtures แทนการฝัง object ยาว ๆ ในไฟล์

## Fake ต่างจาก `vi.fn()` ตรงไหน และใช้เมื่อไหร่

กฎง่าย ๆ: ถ้า stub ต้อง "เขียนสคริปต์" ตอบไปมาตามสถานะที่เปลี่ยนไป → เปลี่ยนไปใช้ fake

ตัวอย่างจริงจาก `ElectionAdminService.addCandidate`:
ต้องรู้ว่า "เบอร์ 2 ในเขต CM-1 ถูกใช้ไปหรือยัง" ซึ่งขึ้นกับ *ผู้สมัครที่เพิ่มไปก่อนหน้า*
ถ้าใช้ `vi.fn()` ต้องเขียน `findByDistrict` ให้คืนลิสต์ที่ถูกต้อง "ณ ตอนนั้น" ทุก test — ยิ่งเคสซับซ้อน ยิ่งเขียนผิดง่าย
พอมี fake เป็น array จริง ๆ test แค่เพิ่มผู้สมัครเหมือนใช้ของจริง แล้วให้ fake ตอบเอง

ราคาของ fake: มันต้อง **ไม่โกหก** — เรียงผลแบบเดียวกับ SQL (`ORDER BY number`), คืน `null` เมื่อไม่เจอ,
ตรวจ foreign key เหมือนที่ DB ทำ ไม่งั้น test เขียวแต่ของจริงพัง (วิธีกัน: *contract test* — ชุด test เดียว
รันทั้งกับ fake และ Pg implementation — ประเด็นที่ต่อใน Lab 04)

## เวลาเป็น dependency (fake timers)

`JwtTokenService` ตัดสินหมดอายุจากเวลาจริงของเครื่อง (ผ่าน `jsonwebtoken` ที่เราแก้ไม่ได้)
`vi.useFakeTimers({ now })` + `vi.setSystemTime()` เลื่อนนาฬิกาได้โดยไม่ต้องรอจริง —
test "token หมดอายุแล้วใช้ไม่ได้" จบในไม่กี่มิลลิวินาที:

```ts
vi.useFakeTimers({ now: new Date('2026-10-03T09:00:00+07:00') });
const tokens = new JwtTokenService(SECRET, 60); // อายุ 60 วินาที
const token = tokens.issue(aPrincipal());
vi.setSystemTime(new Date('2026-10-03T09:01:01+07:00')); // อีก 61 วินาที
expect(tokens.verify(token)).toBeNull();
```

`afterEach(() => vi.useRealTimers())` กันเวลาแช่แข็งรั่วไป test อื่น

fake timers vs inject `Clock`:
- **fake timers** — ไม่ต้องแก้ production code เลย เหมาะกับ library ที่อ่านเวลาเองภายใน (`jsonwebtoken`) ซึ่ง inject เข้าไปไม่ได้ / ราคาแพง
- **inject `Clock`** — เห็นชัดใน type ว่าโค้ดพึ่งเวลา และควบคุมได้เฉพาะที่ ไม่กระทบ global — เหมาะกับโค้ดของเราเอง
  ซึ่ง `createApp(deps)` มี `clock` เป็น dependency อยู่แล้ว (ดู `src/clock.ts`)

## อุบัติเหตุที่ดีระหว่างทำ

เวอร์ชันแรกของ test หมดอายุ ตั้ง `expiresInSeconds = 60` แล้วเข้าใจว่าเป็น "1 ชั่วโมง" —
test แดงทันที และ test ถูกต้อง (60 คือ 60 *วินาที*) กว่าจะรู้ตัวต้องอ่าน constructor —
นี่แหละคือ test ทำหน้าที่เป็น executable documentation จริง ๆ

## คำถามปิด lab

- **test แบบไหนเปราะ?** — mock ที่ตรวจละเอียดเกินไป เช่น assert ว่า `create` ต้องถูกเรียกด้วย object ครบทุก field
  หรือ assert ลำดับการเรียกภายใน (validation เช็คก่อน duplicate หรือหลัง) — พวกนี้พังทันทีที่ refactor
  ทั้งที่พฤติกรรมเดิม ใน test ของเราเลย assert แค่สิ่งที่เป็น *สัญญา* เช่น "national id พัง → create ต้องไม่ถูกเรียก"
- **อย่า mock สิ่งที่เราไม่ได้เป็นเจ้าของ** — `pg.Pool` เป็นของ third-party (API กว้าง, พฤติกรรมซับซ้อน)
  ถ้า mock ตรง ๆ test จะผูกกับ SQL string และรูปแบบการเรียกของ driver — เปราะและอ่านไม่รู้เรื่อง
  repository interface เป็นจุดที่ดีกว่า เพราะมัน *เล็ก, เราออกแบบเอง, และนิ่ง* — เปลี่ยน SQL ข้างใน `PgUserRepository` ได้โดย test ไม่รู้เรื่อง
