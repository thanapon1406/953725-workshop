# Jest ↔ Vitest cheat sheet

Lab ทุกข้อมี 2 ชุด โจทย์และเฉลยเหมือนกัน ต่างกันแค่ test runner:

| | `jest/lab/*` · `jest/solution/*` | `vitest/lab/*` · `vitest/solution/*` |
|---|---|---|
| Runner | Jest 30 + ts-jest | Vitest 5 |
| TypeScript | 6 | **7** (native, เขียนใหม่ด้วย Go) |
| Config | `app/jest.config.js` | `app/vitest.config.mts` |
| Demo | `demo/testcontainers` · `demo/playwright-browser` | `vitest/demo/testcontainers` · `vitest/demo/playwright-browser` |

ใช้เปรียบเทียบไฟล์เดียวกันของ 2 ชุดได้เลย เช่น
`git diff jest/solution/03-test-doubles vitest/solution/03-test-doubles -- app/test`

## สิ่งที่เหมือนเดิม

`describe` · `it` / `test` · `it.each` · `describe.each` · `it.todo` · `it.only` · `beforeEach` / `afterEach` / `beforeAll` / `afterAll`
และ matcher ทั้งหมดของ `expect` (`toBe`, `toEqual`, `toMatchObject`, `toThrow`, `rejects`, `toHaveBeenCalledWith`, `expect.any`, `expect.objectContaining`, …)

## สิ่งที่ต้องเปลี่ยน

### 1. Import เอง (ไม่มี global)

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';
```

อยากได้ global แบบ Jest: ตั้ง `test.globals: true` ใน config และ `"types": ["vitest/globals"]` ใน tsconfig (repo นี้ไม่ใช้ เพื่อให้เห็นว่าแต่ละไฟล์ใช้อะไร)

### 2. `jest.*` → `vi.*`

| Jest | Vitest |
|---|---|
| `jest.fn()` | `vi.fn()` |
| `jest.spyOn(obj, 'm')` | `vi.spyOn(obj, 'm')` |
| `jest.useFakeTimers({ now })` | `vi.useFakeTimers({ now })` |
| `jest.setSystemTime(date)` · `jest.useRealTimers()` | `vi.setSystemTime(date)` · `vi.useRealTimers()` |
| `jest.useFakeTimers({ doNotFake: [...] })` (บอกสิ่งที่ **ไม่** fake) | `vi.useFakeTimers({ toFake: ['Date'] })` (บอกสิ่งที่ **จะ** fake) |
| `jest.mock('../src/db')` | `vi.mock('../src/db')` — ถูกยกขึ้นไปบนสุดของไฟล์เหมือนกัน |
| `jest.requireActual('m')` | `await vi.importActual('m')` |
| type `jest.SpyInstance` · `jest.Mock` · `jest.Mocked<T>` | `import type { MockInstance, Mock, Mocked } from 'vitest'` |

⚠️ `mockReset()` ต่างกัน: Jest ล้าง implementation ทิ้ง (คืน `undefined`) · Vitest คืนกลับไปเป็น implementation ที่ส่งให้ `vi.fn(impl)` ตอนแรก

### 3. Config

```js
// jest.config.js
projects: [
  { displayName: 'unit', testMatch: ['<rootDir>/test/unit/**/*.test.ts'], transform: tsJest },
  { displayName: 'integration', testMatch: [...], setupFiles: ['<rootDir>/test/integration/env.ts'] },
]
```

```ts
// vitest.config.mts — ไม่ต้องมี transform: Vitest รัน .ts ได้เลย
projects: [
  { test: { name: 'unit', include: ['test/unit/**/*.test.ts'] } },
  { test: { name: 'integration', include: [...], setupFiles: ['test/integration/env.ts'], fileParallelism: false } },
]
```

| Jest | Vitest |
|---|---|
| `displayName` · `testMatch` | `name` · `include` |
| `setupFiles` + `setupFilesAfterEnv` | `setupFiles` อย่างเดียว — รันหลังโหลด framework แล้ว เรียก `beforeEach` ในนั้นได้ |
| `collectCoverageFrom` · `coverageThreshold: { './src/domain/': … }` | `coverage.include` · `coverage.thresholds: { 'src/domain/**': … }` — ตั้งที่ root เท่านั้น ไม่ใช่ใน project · ต้องติดตั้ง `@vitest/coverage-v8` |
| `globalSetup` + `globalTeardown` (ฝากของไว้ใน `globalThis`) | `globalSetup` ไฟล์เดียว: `return` ฟังก์ชัน teardown · ส่งค่าให้ test ด้วย `project.provide()` → `inject()` |

ชื่อไฟล์ `.mts` เพราะ `package.json` ของ repo นี้เป็น CommonJS — ถ้าโปรเจกต์เป็น `"type": "module"` ใช้ `vitest.config.ts` ได้

### 4. Command line

| Jest | Vitest |
|---|---|
| `jest --selectProjects unit` | `vitest run --project unit` |
| `jest --runInBand` | `fileParallelism: false` ใน config (หรือ `--no-file-parallelism`) |
| `jest --watch` | `vitest` (watch เป็นค่าเริ่มต้นใน terminal) · ใน CI จะรันครั้งเดียวเอง |
| `jest --verbose` | `vitest run --reporter=tree` |
| `jest --randomize` | `vitest run --sequence.shuffle` |
| `jest -t 'checksum'` · `jest test/unit/passwords.test.ts` | เหมือนกัน (`vitest run -t …` · `vitest run test/unit/passwords…`) |
| `jest --coverage` | `vitest run --coverage` |

## ต่างกันจริง ๆ (ไม่ใช่แค่ชื่อ)

**Vitest ไม่ตรวจ type** — ts-jest compile ด้วย TypeScript จึงแดงเมื่อ type ผิด แต่ Vitest แค่ลบ type ทิ้งแล้วรัน
repo นี้จึงรัน `tsc --noEmit` ก่อนทุก script test (`npm run test:unit` = `tsc --noEmit && vitest run --project unit`)
ด้วย TypeScript 7 ขั้นนี้ใช้เวลาไม่ถึง 1 วินาทีสำหรับทั้ง project

**ทำไมชุด Jest ยังอยู่ที่ TypeScript 6** — TypeScript 7 ไม่มี JavaScript compiler API (`require('typescript')` ไม่มี `createProgram` / `transpileModule` แล้ว)
ts-jest ใช้ API นั้น จึงใช้กับ TS 7 ไม่ได้ ส่วน Vitest ไม่ได้เรียก compiler ของ TypeScript เลย จึงใช้ได้ทันที

**ESM** — Vitest รัน test เป็น ES module เสมอ (แม้ package เป็น CommonJS) จึงใช้ package ที่เป็น ESM-only ได้โดยไม่ต้องตั้งค่า
(ใน workshop ใช้ `@faker-js/faker@9` เพราะ v10 เป็น ESM-only ซึ่ง Jest แบบ CommonJS โหลดไม่ได้)

**Resource ที่ไม่ถูกปิด** — Jest เตือน *"Jest did not exit one second after the test run has completed"* เมื่อมี pool / socket ค้าง
Vitest ทิ้ง worker process หลังจบแต่ละไฟล์ จึง **ไม่เตือนอะไรเลย** — leak ยังอยู่ แค่มองไม่เห็น (ดู ❓ ใน Lab 07)

## เริ่มใช้ Vitest ในโปรเจกต์ตัวเอง

```bash
npm i -D vitest            # + @vitest/coverage-v8 ถ้าจะวัด coverage
npm uninstall jest ts-jest @types/jest
```

template อยู่ที่ `labs/08-own-project/templates/` บน branch `vitest/lab/08-own-project`
