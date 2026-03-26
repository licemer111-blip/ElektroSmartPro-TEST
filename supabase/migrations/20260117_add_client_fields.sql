-- Add client data fields to projects table
-- These fields will store client/investor information for PDF generation

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS client_name TEXT,
ADD COLUMN IF NOT EXISTS client_address TEXT,
ADD COLUMN IF NOT EXISTS client_nip VARCHAR(20);

-- Add comments for documentation
COMMENT ON COLUMN projects.client_name IS 'Client/Investor name (individual or company)';
COMMENT ON COLUMN projects.client_address IS 'Client address for PDF generation';
COMMENT ON COLUMN projects.client_nip IS 'Client NIP (tax identification number)';
