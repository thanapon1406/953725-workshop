--liquibase formatted sql

--changeset election:001-create-districts
CREATE TABLE districts (
    id       TEXT PRIMARY KEY,
    province TEXT    NOT NULL,
    number   INTEGER NOT NULL,
    UNIQUE (province, number)
);
--rollback DROP TABLE districts;

-- Districts are reference data prepared by the system (not test data),
-- so this changeset has no context and runs everywhere.
--changeset election:001-seed-districts
INSERT INTO districts (id, province, number) VALUES
    ('CM-1',  'เชียงใหม่', 1),
    ('CM-2',  'เชียงใหม่', 2),
    ('CM-3',  'เชียงใหม่', 3),
    ('LPN-1', 'ลำพูน', 1),
    ('BKK-1', 'กรุงเทพมหานคร', 1),
    ('BKK-2', 'กรุงเทพมหานคร', 2);
--rollback DELETE FROM districts WHERE id IN ('CM-1','CM-2','CM-3','LPN-1','BKK-1','BKK-2');
