# Election Backend — reference app

The shared codebase for the workshop labs: the ระบบเลือกตั้ง course project, rebuilt small.
Express + TypeScript + Postgres, schema versioned with Liquibase.

## Commands

| Command | What it does |
|---|---|
| `npm run doctor` | Pre-workshop check (tools, DB, migrations, one test per boundary) |
| `npm run dev` | Run the app with reload on http://localhost:3000 (needs `db:up` + `db:migrate`) |
| `npm run db:up` / `db:migrate` | Dev Postgres (port 5432) + migrations **with** dev seed data |
| `npm run db:up:test` / `db:migrate:test` | Test Postgres (port 5433, tmpfs) + migrations **without** seed data |
| `npm run db:reset:test` | Recreate the test database from scratch |
| `npm run test:unit` | Jest `unit` project — no I/O, parallel |
| `npm run test:integration` | Starts db-test, runs Liquibase, then Jest `integration` project in band |
| `npm run db:up:e2e` / `db:migrate:e2e` | Fresh e2e Postgres (port 5434, recreated every run) + migrations with bootstrap accounts |
| `npm run test:e2e` | Fresh db-e2e + Liquibase + app container, then Playwright API tests |
| `npm run typecheck` | `tsc --noEmit` over src, tests and e2e |
| `npm run db:down` | Stop and remove every container of the stack, all profiles included (`app`, `db-e2e` are in profile `e2e`); the dev DB volume is kept |

## Test boundaries in this repo

| Boundary | Where | Tool | Talks to |
|---|---|---|---|
| Unit | `test/unit/` | Jest | Nothing outside the process — collaborators are test doubles |
| Component | `test/integration/` | Jest + supertest | The app in-process + real Postgres (`db-test`) |
| End-to-end | `e2e/` | Playwright (`request`) | The app container over HTTP, as a black box |

## Database versioning (Liquibase)

- Changelogs: `db/changelog/changes/NNN-*.sql` (Liquibase *formatted SQL*), included in the order listed in `db.changelog-master.yaml`.
- Every new changelog file must be added to that list by hand — a file that is not listed never runs, and Liquibase reports no error.
- The master changelog holds a `day1` tag after the schema and before the seed files: `update-to-tag --tag=day1` applies schema only.
- Never edit a changeset that has already run anywhere — add a new file.
- `context:dev` changesets are demo data for local development only; `context:e2e` changesets bootstrap the admin/commissioner accounts of the e2e environment. Integration tests run with `--contexts=test`, so they see neither.
- Liquibase runs from our own image (`db/Dockerfile`, changelog baked in), so the same command works on laptops and on every CI.

Handy commands (run against the test DB by default):

```bash
docker compose run --rm --build liquibase status
docker compose run --rm liquibase rollback-count --count=1
docker compose run --rm liquibase history
```

```bash
# apply จนถึงหมุด day1 แล้วหยุด
docker compose run --rm liquibase update-to-tag --tag=day1

# ย้อนกลับไปที่ Day 1 schema: ย้อนทุก changeset หลังหมุด และย้อนตัวหมุด tag-day1 ด้วย
# (จะ rollback ไปที่ day1 อีกครั้ง ต้อง update-to-tag --tag=day1 ให้หมุดกลับมาก่อน)
docker compose run --rm liquibase rollback --tag=day1
```

## Architecture

```
src/
  app.ts              createApp(deps) — every dependency injected (see AppDeps)
  server.ts           wires real deps: Pool, JwtTokenService, system clock
  auth/               TokenService (JWT), password hashing, auth middleware
  domain/             Thai national id checksum, types
  services/           AccountService, ElectionAdminService — business rules
  repositories/       interface + Pg implementation per aggregate
  routes/
    accountRoutes.ts  register, login, admin role change
    electionRoutes.ts districts, parties, candidates, public results
    voteRoutes.ts     ⚠ legacy: global pool, jwt + process.env inline, new Date()
```

`voteRoutes.ts` is legacy on purpose (Day 2 PM lab). Closing a district's poll and showing
scores after closing are **not implemented** on purpose (Day 2 AM outside-in lab).

## API

| Method | Path | Who |
|---|---|---|
| GET | `/health` | anyone |
| POST | `/auth/register` | anyone |
| POST | `/auth/login` | anyone |
| PATCH | `/admin/users/:id/role` | ADMIN |
| GET | `/districts`, `/parties`, `/parties/:id` | anyone |
| POST | `/parties` | COMMISSIONER |
| POST | `/districts/:id/candidates` | COMMISSIONER |
| GET | `/districts/:id/results` | anyone (scores hidden until the poll closes) |
| GET | `/me/candidates` | logged-in voter |
| PUT | `/me/vote` | VOTER |

## CI

The repo root has three equivalent pipelines, all calling the npm scripts above:
`.github/workflows/ci.yml` (GitHub Actions), `.gitlab-ci.yml` (GitLab, docker-in-docker) and `Jenkinsfile`.
