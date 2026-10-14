--liquibase formatted sql

-- Demo data for local development ONLY (context:dev).
-- Tests never rely on this: they build their own data with builders.
--
-- Accounts (national id / password):
--   admin        1100000000016 / admin1234
--   commissioner 1100000000024 / commission1234
--   voter        1509900000017 / voter1234

--changeset election:900-seed-dev-users context:dev
INSERT INTO users (national_id, password_hash, first_name, last_name, address, district_id, role) VALUES
    ('1100000000016', 'scrypt$2503403b22ecb04d7a2536b9d0a70eb8$49febd6d5c2c60f7409169d8deb5bcae33abb64ba19cc5df8dc6d6137102958a60e830128624a5bbb84dfcc910eda3b90d1c52872e6ad9966626fb29acef6839', 'ผู้ดูแล', 'ระบบ', 'CAMT', 'CM-1', 'ADMIN'),
    ('1100000000024', 'scrypt$429aefe19452dff3edc67d9e2aa3c810$a22a951fdf316d894975a1e1ddf3c0cb9f763fa37e6ee5ecb971b939d8c7519cfc33ff285eeb376aea18385df29294c3b3fd858872fca8692875a77d92766e6d', 'กรรมการ', 'เลือกตั้ง', 'CAMT', 'CM-1', 'COMMISSIONER'),
    ('1509900000017', 'scrypt$ec0f3babc8057eafac0796cd131565da$ca57db8eca1bebfe4ac4708bfbd5f67246f04d197b91424cc195611693ca843c1c391b5ab2653509932e5b36654838d9753cbc9d21144687367fffe0e9dcbb71', 'สมชาย', 'ใจดี', '239 ถ.ห้วยแก้ว', 'CM-1', 'VOTER');
--rollback DELETE FROM users WHERE national_id IN ('1100000000016','1100000000024','1509900000017');

--changeset election:900-seed-dev-parties context:dev
INSERT INTO parties (name, policy) VALUES
    ('พรรคดอยสุเทพ', 'รถแดงไฟฟ้าทุกเส้นทาง'),
    ('พรรคแม่ปิง', 'แก้ฝุ่น PM2.5 ภายใน 1 ปี');
INSERT INTO candidates (district_id, party_id, number, first_name, last_name)
SELECT 'CM-1', id, CASE name WHEN 'พรรคดอยสุเทพ' THEN 1 ELSE 2 END, 'ผู้สมัคร', name
FROM parties;
--rollback DELETE FROM candidates; DELETE FROM parties;

--changeset election:900-seed-dev-election context:dev
INSERT INTO election (id, opens_at) VALUES (1, now());
--rollback DELETE FROM election;
