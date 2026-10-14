--liquibase formatted sql

--changeset election:003-create-parties
CREATE TABLE parties (
    id       SERIAL PRIMARY KEY,
    name     TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    policy   TEXT NOT NULL
);
--rollback DROP TABLE parties;

--changeset election:003-create-candidates
CREATE TABLE candidates (
    id          SERIAL PRIMARY KEY,
    district_id TEXT    NOT NULL REFERENCES districts (id),
    party_id    INTEGER NOT NULL REFERENCES parties (id),
    number      INTEGER NOT NULL CHECK (number > 0),
    first_name  TEXT    NOT NULL,
    last_name   TEXT    NOT NULL,
    photo_url   TEXT,
    UNIQUE (district_id, number),
    UNIQUE (district_id, party_id)
);
--rollback DROP TABLE candidates;
