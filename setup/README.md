# เตรียมเครื่องก่อน Workshop (Setup Guide)

Workshop: **Software Testing in Real Industry** — hands-on automated testing workshop & readiness checklist · 3–4 ตุลาคม 2026

> ⏰ **ส่งภายใน วันพฤหัสบดีที่ 1 ตุลาคม 2026**
> 1. Screenshot ผลของ `npm run doctor` ที่ขึ้น ✅ READY
> 2. Test cases ที่ออกแบบไว้สำหรับระบบเลือกตั้งของตัวเอง (ตาม template Given / When / Then)

ใช้เวลาประมาณ 30–45 นาที (ส่วนใหญ่คือการดาวน์โหลด Docker images ครั้งแรก ~1.5 GB) — **กรุณาทำที่บ้าน/หอ ไม่ใช่เช้าวัน workshop** เพราะ Wi-Fi ในห้องจะรับ 12 เครื่องโหลดพร้อมกันไม่ไหว

---

## 1. ติดตั้งเครื่องมือ

| เครื่องมือ | เวอร์ชัน | ดาวน์โหลด |
|---|---|---|
| **Node.js** | 24 LTS | https://nodejs.org |
| **Git** | ล่าสุด | https://git-scm.com |
| **Docker** | Docker Desktop, OrbStack (macOS) หรือ Colima | https://www.docker.com/products/docker-desktop |
| **VS Code** | ล่าสุด | https://code.visualstudio.com |

VS Code extensions ที่แนะนำ:
- **Jest** (`Orta.vscode-jest`) — รัน/ดีบัก test ทีละตัวจาก editor
- **Playwright Test for VS Code** (`ms-playwright.playwright`)

### หมายเหตุตามระบบปฏิบัติการ

- **Windows**: ติดตั้ง Docker Desktop แบบ **WSL 2 backend** แนะนำให้ clone และรันทุกอย่าง *ภายใน WSL (Ubuntu)* จะเร็วและเจอปัญหาน้อยกว่า PowerShell
- **macOS (Apple Silicon / Intel)**: ใช้ได้ทั้ง Docker Desktop และ OrbStack
- **Linux**: ติดตั้ง Docker Engine + `docker-compose-plugin` และเพิ่ม user เข้า group `docker`

ตรวจสอบว่าติดตั้งครบ:

```bash
node -v             # v24.x.x
git --version
docker compose version   # ต้องเป็น v2 ขึ้นไป (คำสั่ง "docker compose" ไม่มีขีด)
```

---

## 2. Clone repo และรัน doctor

```bash
git clone https://github.com/boyone/camt-software-testing.git testing-workshop
cd testing-workshop/app
npm ci
npm run doctor
```

`npm run doctor` จะตรวจเครื่องมือ → เปิด Postgres สำหรับ test → รัน Liquibase migrations → รัน unit test และ integration test อย่างละ 1 ตัว

ผลที่ต้องการ:

```
Checks   : 9/9 passed
✅ READY for the workshop — take a screenshot of this!
```

📸 **Screenshot หน้านี้ส่งให้ผู้ประสานงาน**

---

## 3. (ไม่บังคับ) ลองรันระบบ

```bash
npm run db:up        # Postgres สำหรับ dev (port 5432)
npm run db:migrate   # สร้าง schema + ข้อมูลตัวอย่าง
npm run dev          # http://localhost:3000/health
```

บัญชีตัวอย่าง (เลขบัตรประชาชน / รหัสผ่าน):
- admin: `1100000000016` / `admin1234`
- กกต.: `1100000000024` / `commission1234`
- ผู้มีสิทธิเลือกตั้ง: `1509900000017` / `voter1234`

---

## แก้ปัญหาที่พบบ่อย

| อาการ | วิธีแก้ |
|---|---|
| `Docker daemon running ... FAILED` | เปิด Docker Desktop (หรือ `colima start`) รอจนขึ้น running แล้วรันใหม่ |
| `port is already allocated` / `5433` หรือ `5432` ถูกใช้ | มี Postgres ตัวอื่นรันอยู่ (เช่นจากวิชา backend) — หยุดตัวนั้นก่อน: `docker ps` แล้ว `docker stop <id>` หรือปิด Postgres ที่ติดตั้งในเครื่อง |
| `Liquibase migrations ... FAILED` ครั้งแรก | ปกติคือโหลด image ไม่สำเร็จ — ตรวจอินเทอร์เน็ต แล้วรัน `npm run doctor` ใหม่ |
| `npm ci` error บน Windows PowerShell | ใช้ WSL แทน หรือเปิด terminal ใหม่หลังติดตั้ง Node |
| Disk เต็ม | ต้องมีที่ว่างประมาณ 3 GB สำหรับ Docker images |

ยังติดอยู่? ส่ง screenshot ผลของ `npm run doctor` ทั้งหน้าจอมาในกลุ่ม — **อย่ารอถึงวัน workshop**
