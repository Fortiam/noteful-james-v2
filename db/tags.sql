DROP TABLE IF EXISTS notes_tags;
DROP TABLE IF EXISTS tags;

CREATE TABLE tags (
    id serial PRIMARY KEY,
    name text NOT NULL UNIQUE
);

ALTER SEQUENCE tags_id_seq RESTART WITH 100;

CREATE TABLE notes_tags (
    note_id INTEGER NOT NULL REFERENCES notes ON DELETE CASCADE,
    tag_id INTEGER UNIQUE NOT NULL REFERENCES tags ON DELETE CASCADE
);

INSERT INTO tags(name)
VALUES ('tag ichi-ban'),
('tag DOS'),
('tag three'),
('tag four'),
('tag fiver'),
('tag six');

INSERT INTO notes_tags(note_id, tag_id)
VALUES (1000, 100),
(1000, 101),
(1001, 102),
(1002, 103),
(1004, 104),
(1005, 105);

-- CREATE VIEW titleTags AS
-- SELECT title, tags.name AS "Tag Name", folders.name AS "Folders Name" FROM notes
-- INNER JOIN notes_tags ON notes.id = notes_tags.note_id
-- INNER JOIN tags ON notes_tags.tag_id = tags.id
-- INNER JOIN folders ON notes.folder_id = folders.id;
