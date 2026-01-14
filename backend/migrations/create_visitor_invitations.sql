-- Create visitor_invitations table
CREATE TABLE IF NOT EXISTS visitor_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  host_unit VARCHAR(50) NOT NULL,
  plate_number VARCHAR(20),
  qr_code TEXT UNIQUE NOT NULL,
  valid_until TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_visitor_qr_code ON visitor_invitations(qr_code);
CREATE INDEX IF NOT EXISTS idx_visitor_status ON visitor_invitations(status);
CREATE INDEX IF NOT EXISTS idx_visitor_valid_until ON visitor_invitations(valid_until);

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_visitor_invitations_updated_at 
  BEFORE UPDATE ON visitor_invitations 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment to table
COMMENT ON TABLE visitor_invitations IS 'Stores visitor invitation data with QR codes for temporary access';
