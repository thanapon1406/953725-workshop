--liquibase formatted sql

--changeset election:005-add-party-slogan
ALTER TABLE parties ADD COLUMN slogan TEXT;
--rollback ALTER TABLE parties DROP COLUMN slogan;
