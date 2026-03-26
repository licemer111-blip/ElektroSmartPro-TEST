-- Invoicing System with InFakt Integration (SAFE VERSION - можно применять многократно)
-- Two-way invoicing: ElektroSmart → Users (subscription) + Users → Clients (projects)

-- Add company/billing fields to profiles (safe - только если не существуют)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='company_name') THEN
    ALTER TABLE profiles ADD COLUMN company_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='nip') THEN
    ALTER TABLE profiles ADD COLUMN nip TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='regon') THEN
    ALTER TABLE profiles ADD COLUMN regon TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='street') THEN
    ALTER TABLE profiles ADD COLUMN street TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='city') THEN
    ALTER TABLE profiles ADD COLUMN city TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='postal_code') THEN
    ALTER TABLE profiles ADD COLUMN postal_code TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='country') THEN
    ALTER TABLE profiles ADD COLUMN country TEXT DEFAULT 'PL';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='bank_account') THEN
    ALTER TABLE profiles ADD COLUMN bank_account TEXT;
  END IF;
END $$;

-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS project_invoice_items CASCADE;
DROP TABLE IF EXISTS project_invoices CASCADE;
DROP TABLE IF EXISTS subscription_invoices CASCADE;

-- Subscription invoices (ElektroSmart → Users)
CREATE TABLE subscription_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Stripe data
  stripe_invoice_id TEXT,
  stripe_payment_intent_id TEXT,
  
  -- InFakt data
  infakt_invoice_id TEXT,
  infakt_client_id TEXT,
  invoice_number TEXT, -- "FV/2026/01/001"
  
  -- Invoice details
  issue_date DATE NOT NULL,
  sale_date DATE NOT NULL,
  payment_date DATE NOT NULL, -- 14 days from issue
  
  -- Client data (snapshot at time of invoice)
  client_name TEXT NOT NULL,
  client_nip TEXT,
  client_address TEXT,
  client_city TEXT,
  client_postal_code TEXT,
  
  -- Amounts
  amount_net NUMERIC(10,2) NOT NULL, -- 159.00
  amount_vat NUMERIC(10,2) NOT NULL, -- 36.57
  amount_gross NUMERIC(10,2) NOT NULL, -- 195.57
  vat_rate INTEGER NOT NULL DEFAULT 23,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'sent', 'paid', 'overdue', 'cancelled'
  payment_status TEXT, -- from Stripe: 'paid', 'open', 'uncollectible'
  
  -- Files
  pdf_url TEXT,
  
  -- Metadata
  description TEXT, -- "Subskrypcja ElektroSmart PRO Premium - Styczeń 2026"
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project invoices (Users → Their clients)
CREATE TABLE project_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  
  -- InFakt data
  infakt_invoice_id TEXT,
  infakt_client_id TEXT,
  invoice_number TEXT,
  
  -- Invoice details
  issue_date DATE NOT NULL,
  sale_date DATE NOT NULL,
  payment_date DATE NOT NULL,
  
  -- Client data
  client_name TEXT NOT NULL,
  client_nip TEXT,
  client_address TEXT,
  client_city TEXT,
  client_postal_code TEXT,
  client_email TEXT,
  
  -- Amounts
  amount_net NUMERIC(10,2) NOT NULL,
  amount_vat NUMERIC(10,2) NOT NULL,
  amount_gross NUMERIC(10,2) NOT NULL,
  vat_rate INTEGER NOT NULL DEFAULT 23,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft',
  payment_status TEXT,
  
  -- Files
  pdf_url TEXT,
  
  -- Metadata
  description TEXT,
  notes TEXT,
  payment_method TEXT, -- 'transfer', 'cash', 'card'
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoice items for project invoices (detailed breakdown)
CREATE TABLE project_invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES project_invoices(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  quantity NUMERIC(10,2) NOT NULL,
  unit TEXT NOT NULL,
  unit_price_net NUMERIC(10,2) NOT NULL,
  vat_rate INTEGER NOT NULL,
  
  total_net NUMERIC(10,2) NOT NULL,
  total_vat NUMERIC(10,2) NOT NULL,
  total_gross NUMERIC(10,2) NOT NULL,
  
  -- Link to project item if applicable
  project_item_id UUID REFERENCES project_items(id) ON DELETE SET NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX subscription_invoices_user_id_idx ON subscription_invoices(user_id);
CREATE INDEX subscription_invoices_status_idx ON subscription_invoices(status);
CREATE INDEX subscription_invoices_created_at_idx ON subscription_invoices(created_at DESC);
CREATE INDEX subscription_invoices_stripe_idx ON subscription_invoices(stripe_invoice_id);

CREATE INDEX project_invoices_user_id_idx ON project_invoices(user_id);
CREATE INDEX project_invoices_project_id_idx ON project_invoices(project_id);
CREATE INDEX project_invoices_status_idx ON project_invoices(status);
CREATE INDEX project_invoices_created_at_idx ON project_invoices(created_at DESC);

CREATE INDEX project_invoice_items_invoice_id_idx ON project_invoice_items(invoice_id);

-- RLS Policies
ALTER TABLE subscription_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_invoice_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own subscription invoices" ON subscription_invoices;
DROP POLICY IF EXISTS "Users can view own project invoices" ON project_invoices;
DROP POLICY IF EXISTS "Users can create own project invoices" ON project_invoices;
DROP POLICY IF EXISTS "Users can update own project invoices" ON project_invoices;
DROP POLICY IF EXISTS "Users can delete own project invoices" ON project_invoices;
DROP POLICY IF EXISTS "Users can view own invoice items" ON project_invoice_items;
DROP POLICY IF EXISTS "Users can create own invoice items" ON project_invoice_items;
DROP POLICY IF EXISTS "Service role can insert subscription invoices" ON subscription_invoices;
DROP POLICY IF EXISTS "Service role can update subscription invoices" ON subscription_invoices;

-- Create policies
CREATE POLICY "Users can view own subscription invoices"
  ON subscription_invoices
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own project invoices"
  ON project_invoices
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own project invoices"
  ON project_invoices
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own project invoices"
  ON project_invoices
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own project invoices"
  ON project_invoices
  FOR DELETE
  USING (auth.uid() = user_id AND status = 'draft');

CREATE POLICY "Users can view own invoice items"
  ON project_invoice_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_invoices 
      WHERE project_invoices.id = project_invoice_items.invoice_id 
        AND project_invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own invoice items"
  ON project_invoice_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_invoices 
      WHERE project_invoices.id = project_invoice_items.invoice_id 
        AND project_invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert subscription invoices"
  ON subscription_invoices
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update subscription invoices"
  ON subscription_invoices
  FOR UPDATE
  USING (true);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_subscription_invoices_updated_at ON subscription_invoices;
DROP TRIGGER IF EXISTS update_project_invoices_updated_at ON project_invoices;

CREATE TRIGGER update_subscription_invoices_updated_at
  BEFORE UPDATE ON subscription_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_invoices_updated_at
  BEFORE UPDATE ON project_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE subscription_invoices IS 'Faktury subskrypcyjne ElektroSmart → Użytkownicy';
COMMENT ON TABLE project_invoices IS 'Faktury projektowe Użytkownicy → Ich klienci';
COMMENT ON TABLE project_invoice_items IS 'Pozycje na fakturach projektowych';
