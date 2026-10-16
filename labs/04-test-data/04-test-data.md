# Lab 04 — Test Data Management

อ้างอิง: xUnit Test Patterns — *Fresh Fixture*, *Shared Fixture*, *Test Data Builder*, *Creation Method* · Liquibase docs

## Part A — schema เป็นโค้ด (Liquibase)

ทุก change ต่อ schema คือไฟล์เลข version ใน `db/changelog/changes/` เรียงตามที่ `db.changelog-master.yaml` ประกาศ
และมี `--rollback` กำกับทุก changeset — ทำให้ schema มี history, apply แบบเดียวกันทุก environment (dev/test/CI/prod) และ *ย้อนกลับได้*
ของใหม่ใน lab นี้คือ `005-practice.sql` (เพิ่ม column `slogan` ให้ `parties`) ที่ถูก include ต่อจาก `004`

สิ่งที่รันจริง (ทุกข้อลงมือทำบน db-test จริง ไม่ใช่อ่านจากใบงาน):

1. **update → ตรวจ → rollback-count แล้วเจอกับดักลำดับ** — `update` (context test) รัน 9 changesets
   (`001`–`005` + `tag-day1`) และ filter ทิ้ง 5 (seed dev/e2e context ไม่ตรง) — พอ `rollback-count --count=1`
   มันกลับไปแก้ `db.changelog-master.yaml::tag-day1::election` ไม่ใช่ `005` เพราะ `tag-day1` ถูก execute
   เป็นแถว**ถัดจาก** 005 (rollback-count นับจาก `orderexecuted` ใน `databasechangelog` ไม่ใช่จากไฟล์ที่เราเพิ่งแก้)
   → column `slogan` **ยังอยู่**
2. **แก้ changeset ที่รันไปแล้ว = พังทันที** — แก้ `003` (`policy TEXT NOT NULL` → `policy TEXT`) แล้ว `update` ได้
   `ValidationFailedException: 1 changesets check sum — 003-create-parties was: 9:42c7… but is now: 9:b667…`
   Liquibase จำ md5 ของแต่ละ changeset ไว้ — ถ้าจะเปลี่ยน schema จริง ต้อง *เพิ่ม changeset ใหม่* เสมอ
3. **tag จาก CLI = rollback ซ้ำได้** — `liquibase tag --tag=review-lab04-start` ติดป้ายบนแถว**ล่าสุดที่รันแล้ว**
   แล้ววน `update --contexts=dev` → `rollback --tag=review-lab04-start --contexts=dev` ได้หลายรอบติดกัน
   เพราะแท็กอาศัยอยู่บนแถวที่ rollback ไม่ย้อน ต่างจาก `tagDatabase` changeset ที่ rollback ย้อนแถว tag เองด้วย
   → รอบหน้าต้อง `update` ก่อนถึงจะ rollback ได้อีก
4. **contexts ต้องตรงกันทั้ง update และ rollback** — `update --contexts=dev` แล้ว `rollback --tag=…`
   *โดยไม่ใส่* `--contexts` (compose default = `test`) → `INFO: 0 changesets rolled back.` แล้ว seed dev ค้างครบ
   context คือส่วนหนึ่งของ "คำสั่ง" ไม่ใช่ของคุณสมบัติของ database
5. **`docker compose run --rm liquibase …` ต้องมี `--build` เสมอ** — changelog ถูก `COPY` เข้า image ตอน build
   (`db/Dockerfile`) ลองเพิ่ม changeset แล้ว `update` โดยไม่ `--build` → `Database is up to date, no changesets to execute`
   ทั้งที่ไฟล์ถูกแก้แล้ว

ทำไม dev DB มีผู้ใช้ตัวอย่างแต่ test DB ไม่มี: `900-dev-seed.sql` มี `context:dev`, `901-e2e-seed.sql` มี `context:e2e`
ส่วน compose ตั้ง default `LIQUIBASE_COMMAND_CONTEXTS: test` → test DB ได้แค่ schema ล้วน
test ต้องสร้างข้อมูลเองใน test (ดู Part C) ไม่พึ่ง seed เพราะ seed เปลี่ยนได้ตลอด (Mystery Guest)

## Part B — Test Data Builders + faker

ปัญหา: component test ต้องการ user / พรรค / ผู้สมัครครบทุก field ถ้าเขียน object เต็ม ๆ ทุก test จะยาว
และแย่กว่านั้นคือ *อ่านไม่ออกว่าค่าไหนสำคัญกับ test นี้*

Builder (`test/support/builders.ts`) ตอบปัญหานี้ — test พูดถึงเฉพาะสิ่งที่มันสนใจ:

```ts
const voter = await given.user(VOTER().inDistrict(CM2_DISTRICT.id));  // จุดสนใจ: เขต CM2
const party = await given.party(PARTY().named('พรรคแสงดาว'));          // จุดสนใจ: ชื่อพรรค
```

หลักการที่ใช้:

- **ค่า default ต้องใช้ได้จริง** — เลขบัตรสุ่มแต่ checksum ถูกเสมอ (`aValidNationalId()` ใน `nationalIds.ts`
  คำนวณเลขตัวท้ายให้), รหัสผ่านเป็น hash ที่ verify ผ่านจริง (hash ครั้งเดียวตอน import เพราะ scrypt ช้าโดยตั้งใจ)
- **faker ต้อง deterministic** — `seedFaker.ts` เรียก `faker.seed(...)` เป็น `setupFiles` ของ **ทั้งสอง project**
  ใน `vitest.config.mts` ถ้า test แดงเพราะข้อมูลสุ่ม ต้องรันซ้ำแล้วแดงแบบเดิมได้ ไม่งั้น debug ไม่ได้
- **builder รับ override แบบลูกโซ่** (`.inDistrict(...).withNationalId(...)`) และ `build()` คืนสำเนา —
  builder ตัวเดียวประกอบหลาย user ได้โดยไม่แชร์ state
- **ชื่อ factory เป็น UPPER_CASE ทั้งโปรเจกต์** (`VOTER()`/`COMMISSIONER()`/`ADMIN()`/`PARTY()`/`CANDIDATE()`)
  ให้ตรงกับ fixtures (`test/support/fixtures.ts`) — constant ใช้ UPPER_CASE, คลาสยังเป็น PascalCase

ชุด test `builders.test.ts` (5 tests) ผูกสัญญาของ builder ไว้: checksum ถูก, hash verify ผ่าน, override เฉพาะที่สั่ง,
candidate ที่ไม่ผูกพรรคต้อง throw, และ faker ที่ seed แล้วได้ชื่อต่างกันจริง

## Part C — Component tests + isolation (Fresh Fixture)

ใน lab นี้ integration ย้ายจาก Jest มา **Vitest** — ลบ `jest.config.js`, ถอด `jest`/`ts-jest`/`@types/jest`,
`test:integration` = `vitest run --project integration`, และ `tsconfig.types` เหลือ `["node"]`

- `test/integration/support/given.ts` = **creation method**: รับ builder แล้ว insert ผ่าน repository จริง
  (เดินทางเดียวกับ production จึงไม่ต้องเขียน SQL ใน test) + `authHeaderFor()` ออก token ด้วย
  `JwtTokenService` ตัวเดียวกับ app — ข้าม login round-trip ที่ไม่ใช่สิ่งที่ test กำลังสนใจ
- `elections.test.ts` เติม component test ครบทุก `it.todo` (7 tests) โดย `beforeEach → truncateAll(pool)`
  — ทุก test เริ่มจาก database ว่าง = **Fresh Fixture**
- พิสูจน์ isolation แล้วจริง: รัน `--project integration` ซ้ำสองรอบ และรอบที่สองใส่ `--sequence.shuffle`
  (seed 42) — ผลเหมือนเดิม (15/15 passed ทุกรอบ)

**ทำไม integration ต้องรันทีละไฟล์** — ตั้ง `fileParallelism: false` ใน Vitest (เทียบเท่า Jest's `--runInBand`)
เพราะทุกไฟล์แชร์ database เดียว ถ้า worker หลายตัวรันพร้อมกัน `truncateAll` ของไฟล์หนึ่งจะลบข้อมูลกลางท่าของอีกไฟล์
→ แดง ๆ เขียว ๆ ตามจังหวะเวลา (flaky) ทั้งที่โค้ดไม่ผิด — unit test ไม่ต้อง เพราะไม่มี shared state
ราคาที่จ่ายคือรันทีละไฟล์ (ช้าขึ้นตามจำนวนไฟล์); ถ้าอยากขนานจริงต้องให้แต่ละ worker มี schema/db ของตัวเอง (หรือ Testcontainers)

ระหว่างเขียน component test เจอข้อผิดพลาดที่ดี: ใส่ผู้สมัคร 2 คนของ *พรรคเดียวกัน* ในเขตเดียวกัน
แล้ว DB โยน `duplicate key ... candidates_district_id_party_id_key` — กฎ "พรรคหนึ่งมีผู้สมัครเดียวต่อเขต"
ถูกบังคับด้วย unique constraint ใน database ด้วย ไม่ใช่แค่ใน service — fixture ของ test ต้องเคารพกฎจริงของ schema

**Shared Fixture คือ anti-pattern ที่เจอบ่อย:** ถ้าใช้ seed เป็นข้อมูลของ test — test A แก้ข้อมูล → test B พัง
เฉพาะตอนรันต่อจาก A, ใครเพิ่มแถวใน seed → test นับจำนวนพังเป็นชุด, และอ่าน test ไม่รู้ว่า "ผู้สมัครหมายเลข 2"
มาจากไหน (Mystery Guest) — fresh fixture แพงกว่านิดเดียวแต่ขายความน่าเชื่อถือ

## Part D — Seed data จาก TypeScript + faker

seed มีไว้สำหรับ dev/demo/e2e (ไม่ใช่ component test) — อยากได้กรรมการหลายคนที่ชื่อไทยสมจริง
เลขบัตร checksum ถูก hash ถูกต้อง → ให้ script เขียนไฟล์ SQL แทนมือ

```
TypeScript + builders ──generate──▶ 902-seed-commissioners.sql ──liquibase update──▶ database
     (รันครั้งเดียว)                     (commit เข้า git)             (เฉพาะ environment ที่ context ตรง)
```

`app/scripts/generate-user-seed.ts` (รันด้วย `npx tsx`):

- ใช้ `UserBuilder` ตัวเดียวกับ test → seed กับ test แชร์กฎเดียวกัน (checksum, hash, รูปร่าง user)
- รับ option ครบ (`--role`/`--count`/`--district`/`--password`/`--seed`/`--context`/`--id`/`--out`),
  escape `'` → `''` กันชื่อ/ที่อยู่ที่มี quote ทำ SQL พัง
- `faker.seed(...)` ใน script → ชื่อ/เลขบัตร generate ซ้ำได้พอดี (พิสูจน์แล้ว: รันด้วย `--seed 1` สองครั้งได้ชื่อ/เลขบัตรชุดเดิม)
- **แต่ salt ไม่ซ้ำ** — hash ของรหัสผ่านต่างกันทุกครั้งที่ generate (scrypt สุ่ม salt โดยออกแบบ)
  นี่คือเหตุผลที่ไฟล์ที่ generate ต้อง commit ครั้งเดียวและ *ห้าม regenerate ทับ changeset ที่รันไปแล้ว*
  (checksum จะเปลี่ยน แล้ว Liquibase ปัดตามที่เห็นใน Part A ข้อ 2)
- script ปฏิเสธ context อื่นที่ไม่ใช่ dev/e2e — seed มีรหัสผ่านที่รู้ ห้ามโผล่ใน production

`902-seed-commissioners.sql` (commit เข้า git, include ต่อจาก `900`/`901`): กรรมการ 5 คน, `--seed 20261003`,
`context:dev`, มี `--rollback DELETE … WHERE national_id IN (…)` ที่ลบเฉพาะแถวที่ตัวเองสร้าง
ตรวจแล้วจริง: `update --contexts=dev` ใส่ได้, `rollback-count --count=1 --contexts=dev` ถอนได้

ปล. ระหว่างทดลองเจอความพังที่ดี: ใช้ db-test ที่มี *ของเหลือจาก test รอบก่อน* แล้วสั่ง update ใส่ seed
ที่ hardcode เลขบัตรซ้ำ → `duplicate key` migration พังกลางทาง — อีกเหตุผลหนึ่งว่าทำไม environment ทดสอบ
ควรเริ่มใหม่ทุกครั้ง และ seed ไม่ควรถูกพึ่งพาเป็นข้อมูลของ test
