-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'security', 'resident')),
  unit_number VARCHAR(50),
  phone VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at_trigger
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_users_updated_at();

-- Insert default admin user (password: admin123)
-- Hashed with bcrypt, cost factor 10
INSERT INTO users (full_name, email, password, role) 
VALUES (
  'Administrator',
  'admin@onegate.com',
  '$2b$10$rQJ5qKvV8xVZxVZxVZxVZuKJ5qKvV8xVZxVZxVZxVZxVZxVZxVZxV',
  'admin'
) ON CONFLICT (email) DO NOTHING;

-- Add comment to table
COMMENT ON TABLE users IS 'Stores user authentication and profile data';
