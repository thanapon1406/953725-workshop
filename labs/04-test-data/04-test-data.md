# Lab 04 — Test Data Management

อ้างอิง: xUnit Test Patterns — *Fresh Fixture*, *Shared Fixture*, *Test Data Builder*, *Creation Method* · Liquibase docs

## Part A — schema เป็นโค้ด (Liquibase)

ทุก change ต่อ schema คือไฟล์เลข version ใน `db/changelog/changes/` เรียงตามที่ `db.changelog-master.yaml` ประกาศ
และมี `--rollback` กำกับทุก changeset — ทำให้ schema มี history, apply แบบเดียวกันทุก environment (dev/test/CI/prod) และ *ย้อนกลับได้*
ตัวอย่างใน lab นี้คือ `005-practice.sql` ที่เพิ่ม column `slogan` ให้ `parties` พร้อม `--rollback` แล้วถูก include ต่อจาก `004` ก่อน seed

สิ่งที่รันจริง (ทุกข้อลงมือทำบน db-test):

1. **update → ตรวจ → rollback-count แล้วเจอกับดักลำดับ**
   `npm run db:migrate:test` รัน 9 changesets (`001`–`005` + `tag-day1`) และ filter ทิ้ง 5
   (seed dev/e2e context ไม่ตรง) — พอ `rollback-count --count=1` มันกลับไปแก้
   `db.changelog-master.yaml::tag-day1::election` ไม่ใช่ `005` เพราะ `tag-day1` ถูก execute เป็นแถว**ถัดจาก** 005
   rollback-count นับจากลำดับการ execute ใน `databasechangelog` ไม่ใช่จากไฟล์ที่เราเพิ่งแก้ → column `slogan` **ยังอยู่**

2. **แก้ changeset ที่รันไปแล้ว = พังเลยครับอาจารย์ตุ้ย TT**
   แก้ `003-parties-candidates.sql` เล็กน้อย (`policy TEXT NOT NULL` → `policy TEXT`) แล้ว `update` ได้
   `ValidationFailedException: 1 changesets check sum — changes/003-parties-candidates.sql::003-create-parties::election
   was: 9:42c7da7dd3f92fe5865b78be6e7efdca but is now: 9:b6679337958c0139fe0a29a7957fd167`
   Liquibase จำ md5 ของแต่ละ changeset ไว้ — ถ้าจะเปลี่ยน schema จริง ต้อง *เพิ่ม changeset ใหม่* ทีหลังเสมอ
   (แก้คืนด้วย `git checkout -- db/`)

3. **tag จาก CLI = rollback ซ้ำได้** — ลบ `changeSet: tag-day1` ออกก่อน แล้ว `update` (ได้ `001`–`005` = 8 changesets)
   `liquibase tag --tag=review-lab04-start` ติดป้ายบนแถว**ล่าสุดที่รันแล้ว** (`005-add-party-slogan`)
   แล้ววน `update --contexts=dev` (เติม seed dev 3 changesets) → `rollback --tag=review-lab04-start --contexts=dev`
   (ย้อนทิ้ง 3 seed) ได้ **หลายรอบติดกัน** เพราะแท็กอาศัยอยู่บนแถว `005` ที่ rollback ไม่ย้อน
   ต่างจาก `tagDatabase` changeset (แบบ A1.3) ที่ rollback ย้อนแถว tag เองทิ้งด้วย → รอบหน้าจะได้
   `Could not find tag` จนกว่าจะ `update` ใหม่

4. **contexts ต้องตรงกันทั้ง update และ rollback**
   `update --contexts=dev` แล้ว `rollback --tag=review-lab04-start` **โดยไม่ใส่** `--contexts`
   (compose ตั้ง default เป็น `test`) → `INFO: 0 changesets rolled back.` แล้ว history ยังมี `900-seed-dev-*` ครบ
   มันข้าม changeset ที่ context `dev` ไปเงียบ ๆ ไม่มี error และ rollback "สำเร็จ"
   บทเรียน: context คือส่วนหนึ่งของคำสั่ง ไม่ใช่ของคุณสมบัติของ database

5. **`docker compose run --rm liquibase ...` ต้องมี `--build` เสมอ**
   changelog ถูก `COPY changelog /liquibase/changelog` เข้า image ตอน build (ดู `db/Dockerfile`)
   ลองเพิ่ม changeset `005-add-party-founded` ลง `005-practice.sql` แล้ว `update` โดยไม่ `--build`
   → `Database is up to date, no changesets to execute` (`Run: 0`, `Previously run: 11`) ทั้งที่ไฟล์ถูกแก้แล้ว
   พอใส่ `--build` → `Running Changeset: changes/005-practice.sql::005-add-party-founded::election`
   ถ้าลืม `--build` ทุกอย่างจะ "ผ่านหมด" เพราะ container ใช้ changelog เก่า

6. **ทำไม dev DB มีผู้ใช้ตัวอย่าง แต่ test DB ไม่มี**
   `900-dev-seed.sql` มี `context:dev`, `901-e2e-seed.sql` มี `context:e2e`
   ส่วน compose ตั้ง default `LIQUIBASE_COMMAND_CONTEXTS: test` → test DB ได้แค่ schema ล้วน
   test ต้องสร้างข้อมูลเองใน test (Part C) ไม่พึ่ง seed เพราะ seed เปลี่ยนได้ตลอด (Mystery Guest)

> หมายเหตุท้าย lab: ไฟล์ `db/` ถูก `git checkout` คืนหลังทดลองข้อ 2/5 และ db-test ถูก reset + migrate ใหม่ให้สะอาด
> ส่วน `005-practice.sql` และ `include` ยังคงอยู่ใน branch นี้
