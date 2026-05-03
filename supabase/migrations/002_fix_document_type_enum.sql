-- Migration: Update document_type enum to include bon_commande, remove devis
-- Run this if you already have a Supabase project with the old schema

-- Step 1: Add 'bon_commande' to the enum
ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'bon_commande';

-- Step 2: Convert any existing 'devis' documents to 'bon_commande'
UPDATE public.documents SET type = 'bon_commande' WHERE type = 'devis';
UPDATE public.document_compteurs SET type = 'bon_commande' WHERE type = 'devis';

-- Step 3: Add 'unite' column to document_lignes if not exists
ALTER TABLE public.document_lignes ADD COLUMN IF NOT EXISTS unite text;

-- Step 4: Remove 'devis' from enum (requires recreating the type)
-- Note: PostgreSQL does not support removing enum values directly.
-- This step is optional and only needed if you want to clean up the enum.
-- If you have no more 'devis' references, you can skip this.
