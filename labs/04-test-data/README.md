# Lab 04 — Test Data Management

**Reference:** xUnit Test Patterns — _Fresh Fixture_, _Shared Fixture_, _Test Data Builder_, _Creation Method_; Liquibase docs
**เวลา:** ~75 นาที

## Part A — Database versioning ด้วย Liquibase (20 นาที)

schema คือโค้ด: อยู่ใน git, มี version, apply แบบเดียวกันทุก environment (dev, test, CI, production)

```bash
cd app
npm run db:up:test && npm run db:migrate:test

# 1. ดูสถานะและประวัติ
docker compose run --rm --build liquibase status --verbose
docker compose run --rm liquibase history

# 2. Liquibase จำอะไรไว้ใน database?
docker compose exec db-test psql -U election -d election_test \
  -c "SELECT id, author, filename, md5sum, contexts FROM databasechangelog ORDER BY orderexecuted"
```

**A1 — update, Tag, rollback**

**A1.1— update แล้ว rollback**

> `npm run db:down && npm run db:up:test`

1. สร้าง `db/changelog/changes/005-practice.sql` เพิ่ม column `slogan TEXT` ให้ `parties` พร้อม `--rollback`

   ```sql
   --liquibase formatted sql

   --changeset election:005-add-party-slogan
   ALTER TABLE parties ADD COLUMN slogan TEXT;
   --rollback ALTER TABLE parties DROP COLUMN slogan;
   ```

2. เพ่ิม `changelog` ไปที่ `db/changelog/db.changelog-master.yaml` หลัง `004` และก่อน `900/901`

   ```diff
     - include:
         file: changes/004-election-votes.sql
         relativeToChangelogFile: true

   + - include:
   +     file: changes/005-practice.sql
   +     relativeToChangelogFile: true

     - include:
         file: changes/900-dev-seed.sql
         relativeToChangelogFile: true
   ```

3. `docker compose run --rm --build liquibase update` → ตรวจว่า column มาแล้ว

   ```sh
   docker compose exec db-test psql -U election -d election_test \
   -c "\d parties"
   ```

4. `docker compose run --rm --build liquibase rollback-count --count=1` → column หายไหม?
5. ลบไฟล์ 005 **และ** `include` ของ 005 ใน `db.changelog-master.yaml` ทิ้ง (ถ้าเหลือ include ไว้ `update` ครั้งต่อไปจะหาไฟล์ไม่เจอ)

**A1.2— Tag แล้ว rollback**

> `npm run db:down && npm run db:up:test`

1. ลบ `changeSet: tag-day1` ออกจาก `db/changelog/db.changelog-master.yaml` — ถ้าไม่ลบ `tag` จาก CLI จะไปติดที่แถว `tag-day1`
   (แถวสุดท้าย) แล้ว rollback จะย้อนแถวนั้นทิ้งไปพร้อม tag → rollback ครั้งที่ 2 ได้ `Could not find tag` (ดู A1.3 ข้อ 7)

   ```diff
     - include:
         file: changes/004-election-votes.sql
         relativeToChangelogFile: true

   - # Marker: the Day 1 schema is complete. `update-to-tag --tag=day1` stops here,
   - # before any seed data.
   - - changeSet:
   -     id: tag-day1
   -     author: election
   -     changes:
   -       - tagDatabase:
   -           tag: day1
   -
     - include:
         file: changes/900-dev-seed.sql
         relativeToChangelogFile: true
   ```

2. `docker compose run --rm --build liquibase update` (context `test` → รันแค่ `001`–`004`)
3. `docker compose run --rm liquibase tag --tag=lab04-start` → ตรวจว่า tag ติดที่ `004-create-votes`

   ```sh
   docker compose run --rm liquibase history
   ```

4. สร้าง `db/changelog/changes/005-practice.sql` เพิ่ม column `slogan TEXT` ให้ `parties` พร้อม `--rollback`

   ```sql
   --liquibase formatted sql

   --changeset election:005-add-party-slogan
   ALTER TABLE parties ADD COLUMN slogan TEXT;
   --rollback ALTER TABLE parties DROP COLUMN slogan;
   ```

5. เพ่ิม `changelog` ไปที่ `db/changelog/db.changelog-master.yaml` หลัง `004` และก่อน `900/901`

   ```diff
     - include:
         file: changes/004-election-votes.sql
         relativeToChangelogFile: true

   + - include:
   +     file: changes/005-practice.sql
   +     relativeToChangelogFile: true

     - include:
         file: changes/900-dev-seed.sql
         relativeToChangelogFile: true
   ```

6. `docker compose run --rm --build liquibase update` → ตรวจว่า column มาแล้ว

   ```sh
   docker compose exec db-test psql -U election -d election_test \
   -c "\d parties"
   ```

7. `docker compose run --rm liquibase rollback --tag=lab04-start` → column หายไหม?
8. `update` แล้ว `rollback --tag=lab04-start` ซ้ำอีกรอบ → ยังได้ไหม? (เทียบกับ A1.3 ข้อ 7)
9. ลบไฟล์ 005 **และ** `include` ของ 005 ใน `db.changelog-master.yaml` ทิ้ง

**A1.3— update-to-tag แล้ว rollback**

> `npm run db:down && npm run db:up:test`

1. เพ่ิม `changeSet` และ `tag` ไปที่ `db/changelog/db.changelog-master.yaml` หลัง `004`

   ```diff
     - include:
         file: changes/004-election-votes.sql
         relativeToChangelogFile: true

   + - changeSet:
   +     id: tag-lab04-start
   +     author: election
   +     changes:
   +       - tagDatabase:
   +           tag: lab04-start
   ```

2. สร้าง `db/changelog/changes/005-practice.sql` เพิ่ม column `slogan TEXT` ให้ `parties` พร้อม `--rollback`

   ```sql
   --liquibase formatted sql

   --changeset election:005-add-party-slogan
   ALTER TABLE parties ADD COLUMN slogan TEXT;
   --rollback ALTER TABLE parties DROP COLUMN slogan;
   ```

3. เพ่ิม `changelog` ไปที่ `db/changelog/db.changelog-master.yaml` หลัง `changeSet` และก่อน `900/901`

   ```diff
   - changeSet:
       id: tag-lab04-start
       author: election
       changes:
         - tagDatabase:
             tag: lab04-start

   + - include:
   +     file: changes/005-practice.sql
   +     relativeToChangelogFile: true

     - include:
         file: changes/900-dev-seed.sql
         relativeToChangelogFile: true
   ```

4. `docker compose run --rm --build liquibase update-to-tag --tag=lab04-start` → ตรวจว่า tag มาแล้ว
5. `docker compose run --rm --build liquibase update` → ตรวจว่า column มาแล้ว

   ```sh
   docker compose exec db-test psql -U election -d election_test \
   -c "\d parties"
   ```

6. `docker compose run --rm --build liquibase rollback --tag=lab04-start` → column หายไหม?
7. รัน rollback ซ้ำอีกครั้ง → เกิดอะไรขึ้น?

   ```sh
   docker compose run --rm liquibase rollback --tag=lab04-start
   # Could not find tag 'lab04-start' in the database
   ```

   ดู `databasechangelog` อีกครั้ง — แถว `tag-lab04-start` หายไปด้วย เพราะ rollback ย้อน changeset ที่ **เป็น tag เอง** ด้วย
   ต้อง `update` ใหม่ก่อน (ให้ changeset tag ถูกรันอีกครั้ง) ถึงจะ rollback ได้อีก:

   ```sh
   docker compose run --rm liquibase update
   docker compose run --rm liquibase rollback --tag=lab04-start
   ```

8. **เก็บ** `tag-lab04-start` และ 005 ไว้ — ใช้ต่อใน A1.4

**A1.4— Contexts ต้องตรงกันทั้ง update และ rollback**

> `npm run db:down && npm run db:up:test`

ใช้ changelog เดิมจาก A1.3 (มี `tag-lab04-start` และ `005`) แล้วลองรันชุดนี้ — สังเกตว่าบางคำสั่งมี `--contexts=dev` บางคำสั่งไม่มี

```sh
docker compose run --rm --build liquibase update-to-tag --tag=lab04-start
docker compose run --rm liquibase update --contexts=dev
docker compose run --rm liquibase rollback --tag=lab04-start
docker compose run --rm liquibase history
```

1. `history` ยังมี `900-seed-dev-*` อยู่ทั้งที่ rollback "สำเร็จ" — ทำไม?
   (คำสั่งที่ไม่ใส่ `--contexts` ใช้ค่า default `LIQUIBASE_COMMAND_CONTEXTS: test` ใน `docker-compose.yml`
   rollback จะย้อนเฉพาะ changeset ที่ context ตรง และ **ข้าม** changeset `context:dev` ไปเงียบ ๆ ไม่มี error)
2. แก้: reset แล้วใส่ context เดียวกันทุกคำสั่ง

   ```sh
   npm run db:reset:test
   docker compose run --rm --build liquibase update-to-tag --tag=lab04-start
   docker compose run --rm liquibase update --contexts=dev
   docker compose run --rm liquibase rollback --tag=lab04-start --contexts=dev
   docker compose run --rm liquibase history   # เหลือแค่ 001–004
   ```

3. **เก็บ** changelog ไว้ — ใช้ต่อใน A1.5

**A1.5— Tag ที่ rollback ซ้ำได้ (tag จาก CLI)**

> `npm run db:down && npm run db:up:test`

ถ้าอยากวน `update` → `rollback` หลายรอบ ให้ tag จาก CLI แทน `tagDatabase` changeset
`tag` จะติดที่แถวสุดท้ายที่รันแล้ว (`004-create-votes`) ซึ่ง rollback ไม่ย้อน → tag อยู่รอด

1. ลบ `changeSet: tag-lab04-start` ออกจาก `db/changelog/db.changelog-master.yaml` (เหลือ include `005` ต่อจาก `004`)

   ```diff
     - include:
         file: changes/004-election-votes.sql
         relativeToChangelogFile: true

   - - changeSet:
   -     id: tag-lab04-start
   -     author: election
   -     changes:
   -       - tagDatabase:
   -           tag: lab04-start
   -
     - include:
         file: changes/005-practice.sql
         relativeToChangelogFile: true
   ```

   > ⚠️ ห้ามใช้ `update-to-tag` ในข้อนี้ — ถ้าไม่มี `tagDatabase` changeset ใน changelog มันจะ **รันทุก changeset** โดยไม่มี error

2. รันเฉพาะ schema (`001`–`004` มี 7 changesets) แล้ว tag

   ```sh
   docker compose run --rm --build liquibase update-count --count=7
   docker compose run --rm liquibase tag --tag=lab04-start
   ```

3. update → rollback → update → rollback ได้กี่รอบก็ได้

   ```sh
   docker compose run --rm liquibase update --contexts=dev
   docker compose run --rm liquibase rollback --tag=lab04-start --contexts=dev
   docker compose run --rm liquibase update --contexts=dev
   docker compose run --rm liquibase rollback --tag=lab04-start --contexts=dev
   ```

4. ตรวจผล — เหลือ 7 แถว และ `lab04-start` อยู่ที่ `004-create-votes`

   ```sh
   docker compose exec db-test psql -U election -d election_test \
   -c "SELECT orderexecuted, id, tag FROM databasechangelog ORDER BY orderexecuted"
   ```

5. ลบไฟล์ 005 **และ** `include` ของ 005 ใน `db.changelog-master.yaml` ทิ้ง (lab นี้ไม่เก็บ)

|              | `tagDatabase` changeset (A1.3)      | `tag` จาก CLI (A1.5)                                  |
| ------------ | ----------------------------------- | ----------------------------------------------------- |
| ไปจุด tag    | `update-to-tag --tag=lab04-start`   | `update-count --count=7` แล้ว `tag --tag=lab04-start` |
| rollback ซ้ำ | ไม่ได้ — ต้อง `update` ก่อนทุกครั้ง | ได้ — tag อยู่ที่ `004-create-votes`                  |
| ข้อควรระวัง  | —                                   | เพิ่ม changeset ใน 001–004 ต้องแก้ `--count`          |

**A2 — แก้ changeset ที่รันไปแล้ว**

1. แก้ `003-parties-candidates.sql` เล็กน้อย (เช่นเปลี่ยน `policy TEXT NOT NULL` เป็น `policy TEXT`)
2. `npm run db:migrate:test` — เกิดอะไรขึ้น? ทำไม Liquibase ถึงป้องกันเรื่องนี้?
3. `git checkout -- db/` เพื่อแก้คืน → ถ้าต้องเปลี่ยน schema จริง ๆ ต้องทำอย่างไร?

**A3 — Contexts:** ทำไม dev database มีผู้ใช้ตัวอย่าง แต่ test database ไม่มี? (ดู `900-dev-seed.sql` และ `LIQUIBASE_COMMAND_CONTEXTS` ใน `docker-compose.yml`)

> `docker compose run --rm --build liquibase update --context-filter=dev`

## Part B — Test Data Builders + faker (25 นาที)

ปัญหา: component test ต้องการ user, พรรค, ผู้สมัคร — ถ้าเขียน object เต็ม ๆ ทุก test จะยาว และ **ไม่รู้ว่าค่าไหนสำคัญกับ test นั้น**

```ts
// ❌ ค่าไหนสำคัญ?
await users.create({
  nationalId: '1509900000017',
  passwordHash: '...',
  firstName: 'สมชาย',
  lastName: 'ใจดี',
  address: '...',
  districtId: 'CM-2',
});

// ✅ บอกเฉพาะสิ่งที่สำคัญ — ที่เหลือ builder เติมให้ (ด้วย faker)
const voter = await given.user(aVoter().inDistrict('CM-2'));
```

สร้าง `app/test/support/builders.ts`:

- `aVoter()`, `aCommissioner()`, `anAdmin()` → `.inDistrict(id)`, `.withNationalId(id)`, `.build()`
- `aParty()` → `.named(name)`, `.build()`
- `aCandidate()` → `.inDistrict(id)`, `.forParty(partyId)`, `.numbered(n)`, `.build()`
- ค่าที่ไม่สำคัญใช้ `fakerTH` (ชื่อไทย) และเลขบัตรต้อง **checksum ถูกต้อง** เสมอ
- export `UserBuilder` (`new UserBuilder(role)`), type `UserSpec` และ `DEFAULT_PASSWORD` ด้วย — Part D ใช้ซ้ำ

**ทำให้ faker deterministic:** ถ้า test แดงเพราะข้อมูลสุ่ม ต้องทำซ้ำได้ → `faker.seed(...)` ใน `beforeEach` (ใส่ใน `setupFilesAfterEnv` ของ jest config)

⚠️ ระวัง: `hashPassword` ช้าโดยตั้งใจ (scrypt) — builder ควรใช้ hash ที่คำนวณไว้แล้วเป็นค่า default

## Part C — Component tests + isolation (30 นาที)

สร้าง `app/test/integration/support/given.ts` — helper ที่รับ builder แล้ว insert ผ่าน repository จริง และ `authHeader(user)` ที่ออก token ด้วย `JwtTokenService` ตัวเดียวกับ app (ไม่ต้อง login ผ่าน API ทุก test)

แล้วเติม `test/integration/elections.test.ts` ให้ครบทุก `it.todo`

Isolation:

- `beforeEach` → `truncateAll(pool)` — ทุก test เริ่มจาก database ว่าง (_Fresh Fixture_)
- ลองรัน test ไฟล์เดียว, รันซ้ำ, หรือ `--randomize` → ต้องผ่านเหมือนเดิม
  ```bash
  npx jest --selectProjects integration --runInBand --randomize
  ```

**ทำไม integration ต้อง `--runInBand`?**

`--runInBand` (หรือ `-i`) = รัน test ทีละไฟล์ใน process เดียว — ปกติ Jest จะแตก worker หลายตัว (ประมาณตามจำนวน CPU) แล้วรันหลายไฟล์**พร้อมกัน**

ทุกไฟล์ integration ใช้ **database เดียวกัน** (`db-test`) และทุก test เริ่มด้วย `truncateAll(pool)` → ถ้ารันพร้อมกันจะลบข้อมูลของกันและกัน:

```
worker 1: elections.test.ts              worker 2: register.test.ts
  truncateAll()
  insert commissioner
                                            truncateAll()   ← ลบข้อมูลของ worker 1
  POST /parties → 401 / 404 ✗
```

ผลคือ test แดง ๆ เขียว ๆ ตามจังหวะเวลา (_flaky_) ทั้งที่ code ไม่ได้ผิด — รันทีละไฟล์ทำให้แต่ละ test เห็นเฉพาะข้อมูลที่ตัวเอง insert

- unit test **ไม่ต้อง** `--runInBand` (`npm run test:unit`) — ไม่มี state ร่วมกัน จึงรันขนานได้และเร็วกว่า
- ราคาที่ต้องจ่าย: ยิ่งไฟล์เยอะยิ่งช้า → ถ้าอยากรันขนาน ต้องให้แต่ละ worker มี database/schema ของตัวเอง (เช่นตั้งชื่อตาม `JEST_WORKER_ID`) หรือใช้ Testcontainers (ดู branch `demo/testcontainers`)

## คุยกัน: Shared Fixture (anti-pattern ที่เจอบ่อยมาก)

ถ้าใช้ `900-dev-seed.sql` เป็นข้อมูลสำหรับทุก test:

- test A แก้ vote ของ "สมชาย" → test B ที่นับคะแนนพังเฉพาะตอนรันต่อจาก A
- มีคนเพิ่มผู้สมัครใน seed → test 12 ตัวที่นับจำนวนผู้สมัครพังพร้อมกัน
- อ่าน test แล้วไม่รู้ว่า "ผู้สมัครหมายเลข 2" มาจากไหน (_Mystery Guest_)

## Part D — สร้าง seed data ด้วย TypeScript + faker (20 นาที)

seed data มีไว้สำหรับ **dev / demo / e2e** (ไม่ใช่สำหรับ component test — ดูหัวข้อด้านบน)
ปัญหา: เขียน `INSERT` ใน `900-dev-seed.sql` ด้วยมือได้แค่ไม่กี่แถว — อยากได้กรรมการ (`COMMISSIONER`) 10 คน
ที่ชื่อไทยสมจริง, เลขบัตร checksum ถูก, password hash ถูกต้อง → ให้ **script สร้างไฟล์ SQL** แทน
โดยใช้ `UserBuilder` จาก Part B ตัวเดียวกับที่ test ใช้

```
TypeScript + faker  ──generate──▶  902-seed-commissioners.sql  ──liquibase update──▶  database
   (รันครั้งเดียว)                      (commit เข้า git)                 (ทุก environment ที่ context ตรง)
```

**D1 — เขียน script** `app/scripts/generate-user-seed.ts`

```ts
// SEED GENERATOR: writes a Liquibase formatted-SQL changeset of users, built with
// the same builders the tests use (faker names, valid national ids).
//
//   npx tsx scripts/generate-user-seed.ts --role COMMISSIONER --count 3 \
//     --out db/changelog/changes/902-seed-commissioners.sql
//
// Generate once and commit the file. Never regenerate a changeset that has already
// run: the password salt is random, so the SQL (and its checksum) changes every time.
import { writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { faker, fakerTH } from '@faker-js/faker';
import { hashPassword } from '../src/auth/passwords';
import { Role } from '../src/domain/types';
import { DEFAULT_PASSWORD, UserBuilder, UserSpec } from '../test/support/builders';

const ROLES: Role[] = ['VOTER', 'COMMISSIONER', 'ADMIN'];

const { values: args } = parseArgs({
  options: {
    role: { type: 'string', default: 'COMMISSIONER' },
    count: { type: 'string', default: '3' },
    district: { type: 'string', default: 'CM-1' },
    password: { type: 'string', default: DEFAULT_PASSWORD },
    seed: { type: 'string', default: '20261003' },
    context: { type: 'string', default: 'dev' },
    id: { type: 'string' },
    out: { type: 'string' },
  },
});

const role = args.role.toUpperCase() as Role;
if (!ROLES.includes(role)) throw new Error(`--role must be one of ${ROLES.join(', ')}`);

const count = Number(args.count);
if (!Number.isInteger(count) || count < 1) throw new Error('--count must be a positive integer');

// The password is recorded in the file header (like 900/901), so never generate for a real environment.
const SEED_CONTEXTS = ['dev', 'e2e'];
if (!SEED_CONTEXTS.includes(args.context)) {
  throw new Error(`--context must be one of ${SEED_CONTEXTS.join(', ')} — seed accounts have known passwords`);
}

const changesetId = args.id ?? `902-seed-${role.toLowerCase()}s`;

// Same seed → same names and national ids, so the file is reproducible and reviewable.
faker.seed(Number(args.seed));
fakerTH.seed(Number(args.seed));

// scrypt is slow on purpose — hash once and share it across all generated users.
const passwordHash = hashPassword(args.password);

const users: UserSpec[] = [];
const seen = new Set<string>();
while (users.length < count) {
  const user = { ...new UserBuilder(role).inDistrict(args.district).build(), passwordHash };
  if (seen.has(user.nationalId)) continue;
  seen.add(user.nationalId);
  users.push(user);
}

const sql = (value: string) => `'${value.replaceAll("'", "''")}'`;

const rows = users.map(
  (u) =>
    `    (${[u.nationalId, u.passwordHash, u.firstName, u.lastName, u.address, u.districtId, u.role]
      .map(sql)
      .join(', ')})`,
);
const nationalIds = users.map((u) => sql(u.nationalId)).join(',');

const output = `--liquibase formatted sql

-- Generated by scripts/generate-user-seed.ts — do not edit by hand.
--   --role ${role} --count ${count} --district ${args.district} --seed ${args.seed} --context ${args.context}
--
-- Accounts (national id / password ${args.password}):
${users.map((u) => `--   ${u.nationalId}  ${u.firstName} ${u.lastName}`).join('\n')}

--changeset election:${changesetId} context:${args.context}
INSERT INTO users (national_id, password_hash, first_name, last_name, address, district_id, role) VALUES
${rows.join(',\n')};
--rollback DELETE FROM users WHERE national_id IN (${nationalIds});
`;

if (args.out) {
  writeFileSync(args.out, output);
  console.error(`wrote ${users.length} ${role} user(s) to ${args.out}`);
} else {
  process.stdout.write(output);
}
```

จุดที่ต้องสังเกต:

- ใช้ `UserBuilder` จาก Part B → ชื่อไทยจาก `fakerTH` และเลขบัตร checksum ถูกต้อง โดยไม่ต้องเขียน logic ซ้ำ
- `faker.seed(...)` → รันกี่ครั้งก็ได้ชื่อ/เลขบัตรชุดเดิม (เหมือน `seedFaker.ts` ใน test)
- `hashPassword` ครั้งเดียวแล้วใช้ร่วมกัน (scrypt ช้าโดยตั้งใจ)
- escape `'` → `''` กันชื่อ/ที่อยู่ที่มี quote ทำ SQL พัง
- ทุก changeset มี `--rollback` ที่ลบเฉพาะแถวที่ตัวเองสร้าง

**D1.1 — อีกแบบ: inline `fakerTH` ไม่ผ่าน `UserBuilder`** `app/scripts/generate-user-seed-inline.ts`

script ไม่ import อะไรจาก `test/support/` เลย — สร้างทุก field เองใน loop
ส่วนอื่น (parse option, ตรวจ context, `hashPassword`, เขียนไฟล์) เหมือน D1 ทุกอย่าง ต่างกันแค่ 3 จุด:

1. import — ไม่มี `UserBuilder`, `UserSpec`, `DEFAULT_PASSWORD` แล้ว (default password ใส่เป็น `'password123'` ตรง ๆ)

   ```ts
   import { faker, fakerTH } from '@faker-js/faker';
   import { hashPassword } from '../src/auth/passwords';
   import { Role } from '../src/domain/types';
   ```

2. loop สร้าง user — เขียน checksum เลขบัตรและเรียก `fakerTH` เอง

   ```ts
   interface SeedUser {
     nationalId: string;
     firstName: string;
     lastName: string;
     address: string;
   }

   const users: SeedUser[] = [];
   const seen = new Set<string>();
   while (users.length < count) {
     // Thai national id: 12 random digits + checksum digit (weights 13..2, mod 11).
     const base = faker.string.numeric({ length: 12, allowLeadingZeros: false });
     const sum = [...base].reduce((acc, digit, i) => acc + Number(digit) * (13 - i), 0);
     const nationalId = base + ((11 - (sum % 11)) % 10);

     const user: SeedUser = {
       nationalId,
       firstName: fakerTH.person.firstName(),
       lastName: fakerTH.person.lastName(),
       address: fakerTH.location.streetAddress(),
     };

     if (seen.has(user.nationalId)) continue;
     seen.add(user.nationalId);
     users.push(user);
   }
   ```

3. แถว `INSERT` — `passwordHash`, district และ role เหมือนกันทุกคน จึงใส่ตรง ๆ ไม่ต้องเก็บใน `SeedUser`

   ```ts
   const rows = users.map(
     (u) =>
       `    (${[u.nationalId, passwordHash, u.firstName, u.lastName, u.address, args.district, role]
         .map(sql)
         .join(', ')})`,
   );
   ```

ลองเทียบผลทั้งสองแบบด้วย seed เดียวกัน → ได้ชื่อและเลขบัตรชุดเดียวกัน (ต่างกันแค่ hash เพราะ salt สุ่ม)

```bash
npx tsx scripts/generate-user-seed.ts --seed 1 --count 5 | grep '^--   '
npx tsx scripts/generate-user-seed-inline.ts --seed 1 --count 5 | grep '^--   '
```

⚠️ ลำดับการเรียก faker สำคัญ: เลขบัตร (`faker`) → ชื่อ → นามสกุล → ที่อยู่ (`fakerTH`) ต้องตรงกับใน `UserBuilder`
ถ้าสลับลำดับ seed เดิมจะได้ข้อมูลคนละชุดกับแบบ D1

**D2 — ลองรันดูผลก่อน** (ไม่ใส่ `--out` → พิมพ์ออกหน้าจอ)

⚠️ ต้องทำ Part B ก่อน — script import `UserBuilder`, `UserSpec`, `DEFAULT_PASSWORD` จาก `test/support/builders.ts`
ถ้ายังไม่มีจะเจอ `Error: Cannot find module '../test/support/builders'`
ถ้า Part B ยังไม่เสร็จ ดึงจาก solution มาใช้ก่อนได้:

```bash
git checkout jest/solution/04-test-data -- app/test/support/builders.ts app/test/support/nationalIds.ts
```

```bash
cd app
npx tsx scripts/generate-user-seed.ts --role COMMISSIONER --count 3
```

ตัวอย่างผล (password hash ตัดให้สั้น):

```sql
--liquibase formatted sql

-- Generated by scripts/generate-user-seed.ts — do not edit by hand.
--   --role COMMISSIONER --count 3 --district CM-1 --seed 20261003 --context dev
--
-- Accounts (national id / password password123):
--   7888165997564  สิปปกร แขนอก
--   8162104362606  สุชานาฎ เกิดนอก
--   8167438575289  พัชรนันท์ เกิดค้างพลู

--changeset election:902-seed-commissioners context:dev
INSERT INTO users (national_id, password_hash, first_name, last_name, address, district_id, role) VALUES
    ('7888165997564', 'scrypt$67f7…$ab18…', 'สิปปกร', 'แขนอก', '2659 อาจณรงค์', 'CM-1', 'COMMISSIONER'),
    ('8162104362606', 'scrypt$67f7…$ab18…', 'สุชานาฎ', 'เกิดนอก', '2621 ข้าวหลาม', 'CM-1', 'COMMISSIONER'),
    ('8167438575289', 'scrypt$67f7…$ab18…', 'พัชรนันท์', 'เกิดค้างพลู', '6 กรุงธนบุรี', 'CM-1', 'COMMISSIONER');
--rollback DELETE FROM users WHERE national_id IN ('7888165997564','8162104362606','8167438575289');
```

ลองเปลี่ยน option: `--count 10`, `--district BKK-1`, `--password commission1234`, `--seed 1`, `--role VOTER`

**D3 — สร้างไฟล์จริง แล้วใส่ใน changelog**

1. สร้างไฟล์

   ```bash
   npx tsx scripts/generate-user-seed.ts --role COMMISSIONER --count 5 --password commission1234 \
     --out db/changelog/changes/902-seed-commissioners.sql
   ```

2. เพิ่ม `include` ต่อจาก `900-dev-seed.sql` ใน `db/changelog/db.changelog-master.yaml`

   ```diff
     - include:
         file: changes/900-dev-seed.sql
         relativeToChangelogFile: true
   + - include:
   +     file: changes/902-seed-commissioners.sql
   +     relativeToChangelogFile: true
     - include:
         file: changes/901-e2e-seed.sql
         relativeToChangelogFile: true
   ```

3. apply เข้า dev database แล้วตรวจ

   ```bash
   npm run db:up && npm run db:migrate
   docker compose exec db psql -U election -d election_dev \
     -c "SELECT national_id, first_name, last_name, district_id FROM users WHERE role = 'COMMISSIONER'"
   ```

4. login ด้วยเลขบัตรจาก comment หัวไฟล์ + `commission1234` (`npm run dev` แล้ว `POST /auth/login`) → ได้ token ไหม?

   ```bash
   curl -s -X POST localhost:3000/auth/login -H 'content-type: application/json' \
     -d '{"nationalId":"<เลขบัตรจากไฟล์>","password":"commission1234"}'
   ```

5. rollback ได้ไหม? `docker compose run --rm -e LIQUIBASE_COMMAND_URL=jdbc:postgresql://db:5432/election_dev -e LIQUIBASE_COMMAND_CONTEXTS=dev liquibase rollback-count --count=1`

**D4 — คุยกัน**

1. รัน D3 ข้อ 1 ซ้ำ (เขียนทับไฟล์เดิม) แล้ว `npm run db:migrate` → เกิดอะไรขึ้น? ทำไม?
   (salt ของ password สุ่มทุกครั้ง → SQL เปลี่ยน → checksum ไม่ตรงกับที่รันไปแล้ว เหมือน A2)
   → ถ้าอยากได้กรรมการเพิ่ม ต้องสร้าง **changeset ใหม่** เช่น `--id 903-seed-more-commissioners --seed 2 --out .../903-...sql`
2. ทำไมใส่ `context:dev` ไม่ใส่ไว้ทุก context? ถ้าอยากได้ใน e2e ต้องทำอย่างไร? (`--context e2e`)
3. ทำไม **ไม่** ให้ Liquibase เรียก script นี้ตอน `update` เลย แต่ generate แล้ว commit ไฟล์ SQL แทน?
   (review ได้ใน PR, ทุก environment ได้ข้อมูลชุดเดียวกัน, ไม่ต้องมี Node ใน image ของ Liquibase)
4. ทุก user ในไฟล์ใช้ password hash (และ salt) เดียวกัน — ยอมรับได้สำหรับ dev seed แต่ทำไมห้ามทำแบบนี้กับข้อมูลจริง?
5. D1 (ใช้ `UserBuilder`) กับ D1.1 (inline `fakerTH`) — เลือกแบบไหน?
   (D1: กฎ "user ที่ valid" อยู่ที่เดียว ถ้าเพิ่ม column ใหม่ใน `users` แก้ builder ที่เดียว ทั้ง test และ seed ได้ด้วย
   แต่ script ผูกกับโค้ดใน `test/` / D1.1: อ่านจบในไฟล์เดียว ไม่พึ่ง test code
   แต่ checksum เลขบัตรซ้ำกับ `nationalIds.ts` — ถ้าแก้ที่หนึ่งแล้วลืมอีกที่ ข้อมูลจะไม่ตรงกัน)

## Stretch — Contract test สำหรับ fake

จาก Lab 03: จะมั่นใจได้อย่างไรว่า `InMemoryPartyRepository` ทำงานเหมือน `PgPartyRepository`?
เขียน test ชุดเดียวแล้วรันกับทั้งสองตัวด้วย `describe.each`
