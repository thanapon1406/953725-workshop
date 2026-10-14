--liquibase formatted sql

--changeset election:002-create-users
CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    national_id   CHAR(13) NOT NULL UNIQUE,
    password_hash TEXT     NOT NULL,
    first_name    TEXT     NOT NULL,
    last_name     TEXT     NOT NULL,
    address       TEXT     NOT NULL,
    district_id   TEXT     NOT NULL REFERENCES districts (id),
    role          TEXT     NOT NULL DEFAULT 'VOTER'
                  CHECK (role IN ('VOTER', 'COMMISSIONER', 'ADMIN'))
);
--rollback DROP TABLE users;
