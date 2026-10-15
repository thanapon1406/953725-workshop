# Worksheet — ระบบเลือกตั้ง VOTER (ระบบที่เรารับผิดชอบ)

> นำมาจาก `labs/00-setup/test-cases.md` — ติด Boundary ลงไป

Boundary: **U** = Unit · **I** = Integration · **C** = Component · **E** = End-to-end · **X** = ไม่ใช่ automated functional test

| # | Test case | Boundary | เหตุผล |
|---|---|---|---|
| 1 | TC-01 ลงทะเบียนด้วยเลขบัตรที่จำนวนของบัตรประชาชนเกิน 13 หลัก | **I** | ต้องผ่าน HTTP API + validation ใน service |
| 2 | TC-02 ลงทะเบียนด้วยรหัสผ่านสั้นกว่า 8 ตัวอักษร | **I** | ต้องผ่าน HTTP API + validation ใน service |
| 3 | TC-03 ลงทะเบียนด้วยเขตเลือกตั้งที่ไม่มีในระบบ | **I** | ต้องผ่าน HTTP API + check district ต่อ db |
| 4 | TC-04 ลงทะเบียนสำเร็จด้วยข้อมูลครบถ้วน | **I** | Happy path ผ่าน HTTP + DB |
| 5 | TC-05 login ด้วยเลขบัตรที่ไม่เคยเก็บ | **I** | ต้องผ่าน HTTP API + check DB |
| 6 | TC-06 login ด้วยเลขบัตร + รหัสผ่านถูกต้อง | **I** | Happy path ผ่าน HTTP + sign token |
| 7 | TC-07 เรียก API โดยไม่มี Authorization header | **I** | middleware auth ผ่าน HTTP |
| 8 | TC-08 ลงคะแนนให้ผู้สมัครหมายเลข 2 ของเขต CM-1 | **C** | test ผ่าน HTTP + ตรวจสอบ response ของ API |
| 9 | TC-09 เปลี่ยนคะแนนเป็นหมายเลข 3 | **C** | test ย้อนกลับมาดูว่า vote ถูกอัปเดตหรือไม่ |
| 10 | TC-10 ลงคะแนนให้ผู้สมัครของเขต CM-2 | **C** | test boundary ของ district ร่วมกับ API |

---

## นับจำนวน per boundary

| Boundary | จำนวน | หมายเหตุ |
|---|---|---|
| **U** | 0 | ยังไม่มี unit test ในส่วนที่เรารับผิดชอบ |
| **I** | 7 | ลงทะเบียน + login + auth |
| **C** | 3 | ลงคะแนน + เปลี่ยนคะแนน + boundary ของ district |
| **E** | 0 | ยังไม่มี e2e |
| **X** | 0 | — |

---

## วิเคราะห์รูปร่าง test suite

```
           /\
          /  \         E2E         : 0
         /    \        component   : 3
        /______\\       integration : 7
       /        \       unit        : 0
```

**คำถาม:**
1. รูปร่างเป็นอะไร? **Ice-cream cone** (มากในระดับ I/C, น้อยใน unit)
2. ควรเพิ่ม test หน้าระดับ **unit** ไหม? เช่น:
   - `isValidThaiNationalId` ต่างจากเดิมไหม? (logic checksum)
   - อะไรคือ collaborator ที่ควรใช้ test double?
3. เลือก **2 ข้อที่เป็น component (C)** แล้วเขียนใหม่ให้ทดสอบที่ระดับต่ำลงได้ไหม?

---

## Part C — Readiness Checklist

| รายการ | สถานะ |
|---|---|
| มี test ครบทุก boundary | ⬜ |
| มี test ตรวจสอบ constraint (400/401/403) | ⬜ |
| มี test happy path | ⬜ |
| มี test ด้าน security (auth) | ⬜ |