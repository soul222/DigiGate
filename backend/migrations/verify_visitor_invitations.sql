-- Drop existing table if needed (CAUTION: This will delete all data!)
-- DROP TABLE IF EXISTS visitor_invitations CASCADE;

-- Create visitor_invitations table with correct structure
CREATE TABLE IF NOT EXISTS visitor_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  host_unit VARCHAR(50) NOT NULL,
  plate_number VARCHAR(50),
  qr_code TEXT UNIQUE NOT NULL,
  valid_until TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'used')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_visitor_qr_code ON visitor_invitations(qr_code);
CREATE INDEX IF NOT EXISTS idx_visitor_status ON visitor_invitations(status);
CREATE INDEX IF NOT EXISTS idx_visitor_valid_until ON visitor_invitations(valid_until);

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_visitor_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_visitor_invitations_updated_at_trigger ON visitor_invitations;
CREATE TRIGGER update_visitor_invitations_updated_at_trigger
  BEFORE UPDATE ON visitor_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_visitor_invitations_updated_at();

-- Verify table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'visitor_invitations'
ORDER BY ordinal_position;
