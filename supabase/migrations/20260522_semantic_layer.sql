-- ============================================================
-- Semantic Wealth Layer: Tags + Reconciliation
-- ============================================================

-- 1. Transaction semantic tags (many-to-many mapping)
-- Allows flexible tagging without modifying inbound_transactions array
CREATE TABLE IF NOT EXISTS transaction_semantic_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES inbound_transactions(id) ON DELETE CASCADE,
  tag text NOT NULL,
  confidence numeric(3, 2) DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1),
  source text DEFAULT 'manual' CHECK (source IN ('manual', 'auto-vendor', 'auto-category', 'auto-ml')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS transaction_semantic_tags_tx_id
  ON transaction_semantic_tags (transaction_id);
CREATE INDEX IF NOT EXISTS transaction_semantic_tags_tag
  ON transaction_semantic_tags (tag);

ALTER TABLE transaction_semantic_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read semantic tags" ON transaction_semantic_tags FOR SELECT TO public USING (true);
CREATE POLICY "insert semantic tags" ON transaction_semantic_tags FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "delete semantic tags" ON transaction_semantic_tags FOR DELETE TO public USING (true);

-- 2. Semantic tag definitions (master list of allowed tags)
CREATE TABLE IF NOT EXISTS semantic_tag_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tag text UNIQUE NOT NULL,
  description text,
  category text NOT NULL CHECK (category IN (
    'income', 'expense', 'transfer', 'structural', 'tax', 'lifestyle'
  )),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE semantic_tag_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read tag definitions" ON semantic_tag_definitions FOR SELECT TO public USING (true);
CREATE POLICY "insert tag definitions" ON semantic_tag_definitions FOR INSERT TO public WITH CHECK (true);

-- Seed some common tags - insert only if not exists
INSERT INTO semantic_tag_definitions (tag, description, category) VALUES
  ('pension-contribution', 'Employee or employer pension contribution', 'structural'),
  ('pension-withdrawal', 'Pension pot withdrawal', 'structural'),
  ('property-mortgage', 'Mortgage payment or property-related expense', 'structural'),
  ('property-maintenance', 'Home maintenance, repairs, improvements', 'structural'),
  ('investment-dividend', 'Investment dividend or capital gain', 'income'),
  ('investment-fee', 'Investment fee or brokerage charge', 'expense'),
  ('therapy-expense', 'Mental health or wellbeing expense', 'lifestyle'),
  ('education-expense', 'Course, training, or education cost', 'lifestyle'),
  ('healthcare-prescription', 'Prescription or medical expense', 'expense'),
  ('tax-deductible', 'Potentially tax-deductible expense', 'tax'),
  ('business-expense', 'Business or self-employment expense', 'tax'),
  ('transfer', 'Money transfer between accounts', 'transfer'),
  ('duplicate-import', 'Row appears to be duplicate from another source', 'transfer')
ON CONFLICT (tag) DO NOTHING;

-- 3. Auto-tagging rules (vendor + category → semantic tag)
CREATE TABLE IF NOT EXISTS auto_tagging_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_pattern text NOT NULL,
  category text,
  semantic_tag text NOT NULL REFERENCES semantic_tag_definitions(tag) ON DELETE RESTRICT,
  confidence numeric(3, 2) DEFAULT 0.8 CHECK (confidence >= 0 AND confidence <= 1),
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS auto_tagging_rules_vendor
  ON auto_tagging_rules (vendor_pattern);
CREATE INDEX IF NOT EXISTS auto_tagging_rules_category
  ON auto_tagging_rules (category);

ALTER TABLE auto_tagging_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read auto-tagging rules" ON auto_tagging_rules FOR SELECT TO public USING (true);
CREATE POLICY "insert auto-tagging rules" ON auto_tagging_rules FOR INSERT TO public WITH CHECK (true);

-- Seed some common rules
DELETE FROM auto_tagging_rules WHERE vendor_pattern IN ('Irish Life', 'Zurich', 'Therapist%', 'Dr %', 'AIB%', 'Revolut%', 'Stripe%');
INSERT INTO auto_tagging_rules (vendor_pattern, category, semantic_tag, confidence) VALUES
  ('Irish Life', 'Subscriptions', 'pension-contribution', 0.9),
  ('Zurich', 'Insurance', 'pension-contribution', 0.8),
  ('Therapist%', NULL, 'therapy-expense', 0.95),
  ('Dr %', 'Healthcare', 'healthcare-prescription', 0.85),
  ('AIB%', 'Housing', 'property-mortgage', 0.9),
  ('Revolut%', 'Transfers', 'transfer', 0.7),
  ('Stripe%', 'Shopping', 'business-expense', 0.75);

-- 4. Import reconciliation (track duplicate detection + conflicts)
CREATE TABLE IF NOT EXISTS import_reconciliation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_batch_id text NOT NULL,
  transaction_id uuid NOT NULL REFERENCES inbound_transactions(id) ON DELETE CASCADE,
  source_file_id text,
  duplicate_of_id uuid REFERENCES inbound_transactions(id),
  conflict_reason text,
  is_resolved boolean DEFAULT false,
  resolution_notes text,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS import_reconciliation_batch
  ON import_reconciliation (import_batch_id);
CREATE INDEX IF NOT EXISTS import_reconciliation_tx_id
  ON import_reconciliation (transaction_id);
CREATE INDEX IF NOT EXISTS import_reconciliation_is_resolved
  ON import_reconciliation (is_resolved);

ALTER TABLE import_reconciliation ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read reconciliation" ON import_reconciliation FOR SELECT TO public USING (true);
CREATE POLICY "insert reconciliation" ON import_reconciliation FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "update reconciliation" ON import_reconciliation FOR UPDATE TO public USING (true);
