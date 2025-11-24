-- Demo seed: create a small demo table and insert one row
CREATE TABLE IF NOT EXISTS demo_seed_table (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO demo_seed_table (name) VALUES ('demo') ON CONFLICT DO NOTHING;
