--liquibase formatted sql

--changeset election:004-create-election
-- Single-row table: when the election opens for voting.
CREATE TABLE election (
    id       INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    opens_at TIMESTAMPTZ NOT NULL
);
--rollback DROP TABLE election;

--changeset election:004-create-votes
-- One row per voter; changing a vote updates the row.
CREATE TABLE votes (
    voter_id     INTEGER PRIMARY KEY REFERENCES users (id),
    candidate_id INTEGER     NOT NULL REFERENCES candidates (id),
    updated_at   TIMESTAMPTZ NOT NULL
);
--rollback DROP TABLE votes;
