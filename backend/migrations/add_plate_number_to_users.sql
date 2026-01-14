-- Add plate_number column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS plate_number VARCHAR(50);

-- Create index for faster plate number lookup
CREATE INDEX IF NOT EXISTS idx_users_plate_number ON users(plate_number);

-- Verify column added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;
