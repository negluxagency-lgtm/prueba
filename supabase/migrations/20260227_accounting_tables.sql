-- SQL Migration: Accounting Module
-- Create 'gastos' table
CREATE TABLE IF NOT EXISTS gastos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barberia_id UUID REFERENCES perfiles(id) ON DELETE CASCADE,
    concepto TEXT NOT NULL,
    monto NUMERIC(10, 2) NOT NULL,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    categoria TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create 'facturas' table
CREATE TABLE IF NOT EXISTS facturas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barberia_id UUID REFERENCES perfiles(id) ON DELETE CASCADE,
    emisor TEXT NOT NULL,
    monto NUMERIC(10, 2) NOT NULL,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    url_archivo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE facturas ENABLE ROW LEVEL SECURITY;

-- RLS Policies for 'gastos'
CREATE POLICY "Users can manage their own expenses"
ON gastos FOR ALL
USING (auth.uid() = barberia_id);

-- RLS Policies for 'facturas'
CREATE POLICY "Users can manage their own invoices"
ON facturas FOR ALL
USING (auth.uid() = barberia_id);
