# Lab 03 — Test Doubles

**Reference:** Gerard Meszaros, [xUnit Test Patterns — Test Double](http://xunitpatterns.com/Test%20Double.html)
**เวลา:** ~60 นาที

## แนวคิด: 5 แบบ แยกตาม "ใช้ทำอะไร"

| Double | หน้าที่ | ตัวอย่างในระบบเลือกตั้ง |
|---|---|---|
| **Dummy** | ต้องส่งให้ครบ แต่ไม่ถูกใช้เลย | `TokenService` ตอนทดสอบ `register` |
| **Stub** | ป้อน *input ทางอ้อม* ที่เราควบคุมได้ | `DistrictRepository.findById` คืนเขต CM-1 |
| **Spy** | บันทึก *output ทางอ้อม* ไว้ให้ตรวจทีหลัง | ดูว่า `UserRepository.create` ได้รับ `passwordHash` อะไร |
| **Mock** | ถูกตั้ง *expectation* ว่าต้องถูกเรียกอย่างไร | `TokenService.issue` ต้องถูกเรียกด้วย principal ที่ถูกต้อง |
| **Fake** | implementation จริงแต่ง่ายกว่า (ไม่มี I/O) | `InMemoryUserRepository` |

ทำไมทำได้? เพราะ `AccountService` รับ repository และ `TokenService` ผ่าน **constructor** (เป็น interface) — นี่คือ *seam* ที่ใช้เสียบ double

```ts
import { expect, vi } from 'vitest';

// vi.fn() สร้างได้ทั้ง stub, spy และ mock — ต่างกันที่ "เราใช้มันทำอะไร"
const findById = vi.fn().mockResolvedValue({ id: 'CM-1', province: 'เชียงใหม่', number: 1 }); // stub
expect(create).toHaveBeenCalledWith(expect.objectContaining({ districtId: 'CM-1' }));          // spy / mock
```

## Part A — AccountService (25 นาที)

เปิด `app/test/unit/accountService.test.ts` แล้วเปลี่ยน `it.todo` ทุกข้อเป็น test จริง — ในแต่ละ test เขียน comment บอกว่า double แต่ละตัว **เป็นแบบไหน** และ **ทำไม**

Tips:
- Dummy ที่ดีควร *พัง* ถ้าถูกใช้: `issue: () => { throw new Error('dummy should not be used') }`
- error ที่คาดหวัง: `await expect(promise).rejects.toThrow(ValidationError)`
- ต้องการเลขบัตรที่ถูกต้องเพิ่ม? `1509900000017`, `1100000000016`, `1100000000024`

## Part B — Fake repositories (20 นาที)

1. สร้าง `app/test/support/inMemoryRepositories.ts` — implement `DistrictRepository`, `PartyRepository`, `CandidateRepository` ด้วย array/Map
2. ใช้ fakes ใน `electionAdminService.test.ts`

คำถาม: เมื่อไหร่ควรใช้ fake แทน `vi.fn()`? (ลองคิด: ถ้าต้อง stub `findByDistrict` ให้คืนค่าต่างกันหลังเพิ่มผู้สมัครแต่ละคน จะยุ่งแค่ไหน?)

⚠️ fake ต้องทำงานเหมือนของจริง — ถ้าของจริงเรียงผู้สมัครตามหมายเลข fake ก็ต้องเรียงด้วย จะมั่นใจได้อย่างไรว่า fake ไม่ "โกหก"? (คำใบ้: *contract test* ที่รันชุดเดียวกันกับทั้ง fake และ Pg implementation — ไว้คุยตอน Lab 04)

## Part C — เวลาเป็น dependency (15 นาที)

`JwtTokenService` ใช้เวลาปัจจุบันตัดสินว่า token หมดอายุหรือยัง — แต่เราไม่อยากรอจริง 1 ชั่วโมง

```ts
vi.useFakeTimers({ now: new Date('2026-10-03T09:00:00+07:00') });
// ... issue token (หมดอายุใน 60 วินาที)
vi.setSystemTime(new Date('2026-10-03T09:01:01+07:00'));
// ... verify → null
vi.useRealTimers(); // ใน afterEach
```

เทียบกับ `Clock` interface ใน `src/clock.ts` — fake timers กับ inject `Clock` ต่างกันอย่างไร? แบบไหนเหมาะกับโค้ดของเรา แบบไหนเหมาะกับ library ที่เราแก้ไม่ได้ (เช่น `jsonwebtoken`)?

## คำถามปิด lab

- test ไหนของเรา **เปราะ** ถ้าเปลี่ยน implementation โดยพฤติกรรมเดิม? (มักเป็น mock ที่ตรวจละเอียดเกินไป)
- "อย่า mock สิ่งที่เราไม่ได้เป็นเจ้าของ" — เราควร mock `pg.Pool` ตรง ๆ ไหม? ทำไม repository interface ถึงเป็นจุดที่ดีกว่า?
