CREATE TABLE IF NOT EXISTS brewery (
  id TEXT PRIMARY KEY,
  name TEXT,
  brewery_type TEXT,
  address_1 TEXT,
  city TEXT,
  state_province TEXT,
  postal_code TEXT,
  country TEXT,
  longitude DOUBLE PRECISION,
  latitude DOUBLE PRECISION,
  phone TEXT,
  website_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS brewery_city_idx ON brewery(city);
CREATE INDEX IF NOT EXISTS brewery_type_idx ON brewery(brewery_type);

CREATE TABLE IF NOT EXISTS user_memory (
  id INT PRIMARY KEY DEFAULT 1,
  preferred_types TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  name_keywords TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  radius_km DOUBLE PRECISION NOT NULL DEFAULT 2.0,
  prefer_website BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO user_memory(id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS user_action (
  id BIGSERIAL PRIMARY KEY,
  action_type TEXT NOT NULL CHECK (action_type IN ('SAVE','DISMISS')),
  brewery_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(action_type, brewery_id)
);

CREATE INDEX IF NOT EXISTS user_action_type_idx ON user_action(action_type);

CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT INTO meta(key, value) VALUES ('brewery_last_refresh', 'never')
ON CONFLICT (key) DO NOTHING