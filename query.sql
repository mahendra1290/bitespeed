CREATE TABLE contacts (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    phone_number VARCHAR(100) NOT NULL,
    linked_id INT,
    link_precedence linkprecedence NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP,
    FOREIGN KEY (linked_id) REFERENCES contacts(id)
);

-- id                   Int
--   phoneNumber          String?
--   email                String?
--   linkedId             Int? // the ID of another Contact linked to this one
--   linkPrecedence       "secondary"|"primary" // "primary" if it's the first Contact in the link
--   createdAt            DateTime
--   updatedAt            DateTime
--   deletedAt            DateTime?