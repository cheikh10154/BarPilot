-- Seed Data for BarPilot (Matching Mockup & Demo Experience)

INSERT INTO organizations (id, name, legal_name, vat_number, country)
VALUES ('a0000000-0000-0000-0000-000000000001', 'Bar Centrale Srl', 'Bar Centrale Roma Srl', 'IT12345678901', 'IT')
ON CONFLICT (id) DO NOTHING;

INSERT INTO locations (id, organization_id, name, address, city, currency)
VALUES ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Bar Centrale', 'Via del Corso, 142', 'Roma', 'EUR')
ON CONFLICT (id) DO NOTHING;

-- Subscription with 14-day trial
INSERT INTO subscriptions (organization_id, plan, status, trial_start, trial_end)
VALUES ('a0000000-0000-0000-0000-000000000001', 'pro', 'trialing', NOW(), NOW() + INTERVAL '14 days');

-- Tables
INSERT INTO dining_tables (location_id, number, capacity, status) VALUES
('b0000000-0000-0000-0000-000000000001', 'T01', 2, 'free'),
('b0000000-0000-0000-0000-000000000001', 'T02', 2, 'occupied'),
('b0000000-0000-0000-0000-000000000001', 'T03', 4, 'free'),
('b0000000-0000-0000-0000-000000000001', 'T04', 4, 'to_pay'),
('b0000000-0000-0000-0000-000000000001', 'T05', 2, 'occupied'),
('b0000000-0000-0000-0000-000000000001', 'T06', 4, 'free'),
('b0000000-0000-0000-0000-000000000001', 'T07', 6, 'reserved'),
('b0000000-0000-0000-0000-000000000001', 'T08', 3, 'occupied'),
('b0000000-0000-0000-0000-000000000001', 'T09', 2, 'free');

-- Inventory items
INSERT INTO inventory_items (location_id, name, base_unit, quantity_available, reorder_level, unit_cost_cents) VALUES
('b0000000-0000-0000-0000-000000000001', 'Latte intero fresco', 'L', 3.0, 5.0, 110),
('b0000000-0000-0000-0000-000000000001', 'Caffè in grani Arabica', 'kg', 4.0, 2.0, 1800),
('b0000000-0000-0000-0000-000000000001', 'Bière blonde bottiglia', 'bott.', 8.0, 15.0, 150),
('b0000000-0000-0000-0000-000000000001', 'Rhum Añejo', 'L', 1.2, 0.7, 2200),
('b0000000-0000-0000-0000-000000000001', 'Limone verde fresco', 'pz', 6.0, 5.0, 30),
('b0000000-0000-0000-0000-000000000001', 'Zucchero di canna', 'kg', 2.0, 1.0, 220),
('b0000000-0000-0000-0000-000000000001', 'Acqua tonica', 'bott.', 2.0, 10.0, 85);
