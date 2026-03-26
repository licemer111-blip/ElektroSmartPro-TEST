-- Invoicing System with InFakt Integration
-- Two-way invoicing: ElektroSmart → Users (subscription) + Users → Clients (projects)

-- Add company/billing fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nip TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS regon TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS street TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'PL';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bank_account TEXT;

-- Subscription invoices (ElektroSmart → Users)
CREATE TABLE IF NOT EXISTS subscription_invoices (
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
CREATE TABLE IF NOT EXISTS project_invoices (
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
CREATE TABLE IF NOT EXISTS project_invoice_items (
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
CREATE INDEX IF NOT EXISTS subscription_invoices_user_id_idx ON subscription_invoices(user_id);
CREATE INDEX IF NOT EXISTS subscription_invoices_status_idx ON subscription_invoices(status);
CREATE INDEX IF NOT EXISTS subscription_invoices_created_at_idx ON subscription_invoices(created_at DESC);
CREATE INDEX IF NOT EXISTS subscription_invoices_stripe_idx ON subscription_invoices(stripe_invoice_id);

CREATE INDEX IF NOT EXISTS project_invoices_user_id_idx ON project_invoices(user_id);
CREATE INDEX IF NOT EXISTS project_invoices_project_id_idx ON project_invoices(project_id);
CREATE INDEX IF NOT EXISTS project_invoices_status_idx ON project_invoices(status);
CREATE INDEX IF NOT EXISTS project_invoices_created_at_idx ON project_invoices(created_at DESC);

CREATE INDEX IF NOT EXISTS project_invoice_items_invoice_id_idx ON project_invoice_items(invoice_id);

-- RLS Policies
ALTER TABLE subscription_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_invoice_items ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription invoices
CREATE POLICY "Users can view own subscription invoices"
  ON subscription_invoices
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can view/create/update their own project invoices
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

-- Users can manage their invoice items
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

-- Service role can insert subscription invoices (from webhook)
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
