--liquibase formatted sql

-- Bootstrap data for the end-to-end environment ONLY (context:e2e).
-- A real deployment also needs a first admin/commissioner that nobody can
-- register through the API; e2e tests log in with these.
--
--   admin        1100000000016 / admin1234
--   commissioner 1100000000024 / commission1234

--changeset election:901-seed-e2e-accounts context:e2e
INSERT INTO users (national_id, password_hash, first_name, last_name, address, district_id, role) VALUES
    ('1100000000016', 'scrypt$2503403b22ecb04d7a2536b9d0a70eb8$49febd6d5c2c60f7409169d8deb5bcae33abb64ba19cc5df8dc6d6137102958a60e830128624a5bbb84dfcc910eda3b90d1c52872e6ad9966626fb29acef6839', 'ผู้ดูแล', 'ระบบ', 'CAMT', 'CM-1', 'ADMIN'),
    ('1100000000024', 'scrypt$429aefe19452dff3edc67d9e2aa3c810$a22a951fdf316d894975a1e1ddf3c0cb9f763fa37e6ee5ecb971b939d8c7519cfc33ff285eeb376aea18385df29294c3b3fd858872fca8692875a77d92766e6d', 'กรรมการ', 'เลือกตั้ง', 'CAMT', 'CM-1', 'COMMISSIONER');
--rollback DELETE FROM users WHERE national_id IN ('1100000000016','1100000000024');

--changeset election:901-seed-e2e-election context:e2e
INSERT INTO election (id, opens_at) VALUES (1, now() - interval '1 hour');
--rollback DELETE FROM election;
