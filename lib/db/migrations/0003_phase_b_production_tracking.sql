-- Phase B: Production Tracking and Purchase Order Receiving
-- This migration adds tables for tracking production batches and purchase order receiving
-- to ensure all inventory movements flow through the ledger system.

-- Purchase Order Receiving Table
-- Tracks individual received items within a purchase order with ledger integration
CREATE TABLE IF NOT EXISTS purchase_order_receiving (
  id SERIAL PRIMARY KEY,
  purchase_order_item_id INTEGER NOT NULL REFERENCES purchase_order_items(id) ON DELETE CASCADE,
  received_quantity NUMERIC(10,3) NOT NULL,
  received_unit_cost NUMERIC(10,4),
  received_at TIMESTAMP DEFAULT NOW() NOT NULL,
  received_by TEXT,
  notes TEXT,
  expiry_date TIMESTAMP
);

-- Production Batches Table
-- Tracks production batch operations for recipes and prep tasks
CREATE TABLE IF NOT EXISTS production_batches (
  id SERIAL PRIMARY KEY,
  venue_id INTEGER NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  recipe_id INTEGER REFERENCES recipes(id) ON DELETE SET NULL,
  prep_task_id INTEGER REFERENCES prep_tasks(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'in_progress',
  planned_portions NUMERIC(10,3),
  actual_portions NUMERIC(10,3),
  yield_variance NUMERIC(10,3),
  started_at TIMESTAMP DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMP,
  created_by TEXT,
  completed_by TEXT,
  notes TEXT
);

-- Production Batch Inputs Table
-- Tracks ingredients consumed during production (PRODUCTION_INPUT transactions)
CREATE TABLE IF NOT EXISTS production_batch_inputs (
  id SERIAL PRIMARY KEY,
  batch_id INTEGER NOT NULL REFERENCES production_batches(id) ON DELETE CASCADE,
  inventory_item_id INTEGER NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  planned_quantity NUMERIC(10,3) NOT NULL,
  actual_quantity NUMERIC(10,3),
  unit_cost NUMERIC(10,4),
  consumed_at TIMESTAMP
);

-- Production Batch Outputs Table
-- Tracks items produced during production (PRODUCTION_OUTPUT transactions)
CREATE TABLE IF NOT EXISTS production_batch_outputs (
  id SERIAL PRIMARY KEY,
  batch_id INTEGER NOT NULL REFERENCES production_batches(id) ON DELETE CASCADE,
  inventory_item_id INTEGER NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  quantity_produced NUMERIC(10,3) NOT NULL,
  unit_cost NUMERIC(10,4),
  layer_id INTEGER,
  produced_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_purchase_order_receiving_item_id ON purchase_order_receiving(purchase_order_item_id);
CREATE INDEX IF NOT EXISTS idx_production_batches_venue_id ON production_batches(venue_id);
CREATE INDEX IF NOT EXISTS idx_production_batches_recipe_id ON production_batches(recipe_id);
CREATE INDEX IF NOT EXISTS idx_production_batches_prep_task_id ON production_batches(prep_task_id);
CREATE INDEX IF NOT EXISTS idx_production_batch_inputs_batch_id ON production_batch_inputs(batch_id);
CREATE INDEX IF NOT EXISTS idx_production_batch_inputs_inventory_item_id ON production_batch_inputs(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_production_batch_outputs_batch_id ON production_batch_outputs(batch_id);
CREATE INDEX IF NOT EXISTS idx_production_batch_outputs_inventory_item_id ON production_batch_outputs(inventory_item_id);
