-- G-COOP Supabase schema
-- PostgreSQL / Supabase

create extension if not exists "pgcrypto";

create schema if not exists app;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'app_role'
  ) then
    create type app_role as enum ('super_admin', 'mol_org');
  end if;

  if not exists (
    select 1
    from pg_type
    where typname = 'organization_type'
  ) then
    create type organization_type as enum ('cooperative', 'societe');
  end if;

  if not exists (
    select 1
    from pg_type
    where typname = 'invitation_status'
  ) then
    create type invitation_status as enum ('pending', 'accepted', 'expired', 'cancelled');
  end if;

  if not exists (
    select 1
    from pg_type
    where typname = 'document_type'
  ) then
    create type document_type as enum ('bon_livraison', 'devis', 'facture');
  end if;

  if not exists (
    select 1
    from pg_type
    where typname = 'document_status'
  ) then
    create type document_status as enum ('brouillon', 'valide', 'annule');
  end if;

  if not exists (
    select 1
    from pg_type
    where typname = 'stock_movement_type'
  ) then
    create type stock_movement_type as enum ('manual', 'facture', 'bon_commande', 'adjustment');
  end if;
end
$$;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  adresse text,
  telephone text,
  email text,
  ice text,
  rc text,
  logo_url text,
  type organization_type not null,
  tva numeric(5,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organizations_tva_range check (tva >= 0 and tva <= 100)
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  role app_role not null default 'mol_org',
  nom_complet text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  org_type organization_type not null,
  token text not null unique,
  statut invitation_status not null default 'pending',
  expires_at timestamptz not null,
  invited_by uuid references public.profiles(id) on delete set null,
  accepted_by uuid references public.profiles(id) on delete set null,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint invitations_email_lower check (email = lower(email))
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  nom text not null,
  telephone text not null,
  adresse text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fournisseurs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  nom text not null,
  telephone text not null,
  adresse text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.produits (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  fournisseur_id uuid references public.fournisseurs(id) on delete set null,
  nom text not null,
  description text,
  prix_unitaire numeric(12,2) not null default 0,
  quantite_stock numeric(12,2) not null default 0,
  seuil_minimum numeric(12,2) not null default 0,
  photo_url text,
  unite text default 'u',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint produits_prix_non_negatif check (prix_unitaire >= 0),
  constraint produits_stock_non_negatif check (quantite_stock >= 0),
  constraint produits_seuil_non_negatif check (seuil_minimum >= 0)
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  type document_type not null,
  numero text not null,
  statut document_status not null default 'brouillon',
  date_document date not null default current_date,
  client_id uuid references public.clients(id) on delete set null,
  fournisseur_id uuid references public.fournisseurs(id) on delete set null,
  parent_document_id uuid references public.documents(id) on delete set null,
  notes text,
  lieu_livraison text,
  numero_commande text,
  sous_total_ht numeric(12,2) not null default 0,
  taux_tva numeric(5,2) not null default 0,
  montant_tva numeric(12,2) not null default 0,
  total_ttc numeric(12,2) not null default 0,
  pdf_path text,
  created_by uuid references public.profiles(id) on delete set null,
  validated_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, numero),
  constraint documents_totaux_non_negatifs check (
    sous_total_ht >= 0 and taux_tva >= 0 and montant_tva >= 0 and total_ttc >= 0
  )
);

create table if not exists public.document_lignes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  produit_id uuid references public.produits(id) on delete set null,
  ref text,
  designation text not null,
  quantite numeric(12,2) not null,
  prix_unitaire_ht numeric(12,2) not null,
  total_ht numeric(12,2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lignes_quantite_positive check (quantite > 0),
  constraint lignes_prix_non_negatif check (prix_unitaire_ht >= 0),
  constraint lignes_total_non_negatif check (total_ht >= 0)
);

create table if not exists public.stock_mouvements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  produit_id uuid not null references public.produits(id) on delete cascade,
  document_id uuid references public.documents(id) on delete set null,
  mouvement_type stock_movement_type not null,
  quantite numeric(12,2) not null,
  quantite_avant numeric(12,2) not null,
  quantite_apres numeric(12,2) not null,
  note text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint stock_mouvement_quantite_non_nulle check (quantite <> 0)
);

create table if not exists public.document_compteurs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  type document_type not null,
  compteur integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, type),
  constraint compteur_non_negatif check (compteur >= 0)
);

create or replace function app.current_organization_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select organization_id
  from public.profiles
  where id = auth.uid()
$$;

create or replace function app.current_role()
returns app_role
language sql
security definer
set search_path = public
stable
as $$
  select role
  from public.profiles
  where id = auth.uid()
$$;

create or replace function app.is_super_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(app.current_role() = 'super_admin', false)
$$;

create index if not exists idx_profiles_organization_id on public.profiles (organization_id);
create index if not exists idx_invitations_email on public.invitations (email);
create index if not exists idx_invitations_status_expires on public.invitations (statut, expires_at);
create index if not exists idx_clients_org_nom on public.clients (organization_id, nom);
create index if not exists idx_fournisseurs_org_nom on public.fournisseurs (organization_id, nom);
create index if not exists idx_produits_org_nom on public.produits (organization_id, nom);
create index if not exists idx_produits_org_stock on public.produits (organization_id, quantite_stock);
create index if not exists idx_documents_org_type_date on public.documents (organization_id, type, date_document desc);
create index if not exists idx_documents_org_statut on public.documents (organization_id, statut);
create index if not exists idx_document_lignes_document_id on public.document_lignes (document_id);
create index if not exists idx_stock_mouvements_org_produit on public.stock_mouvements (organization_id, produit_id, created_at desc);
create index if not exists idx_document_compteurs_org_type on public.document_compteurs (organization_id, type);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  invited_email text;
begin
  invited_email := lower(coalesce(new.email, ''));

  insert into public.profiles (id, role, nom_complet)
  values (
    new.id,
    case when coalesce(new.raw_user_meta_data ->> 'role', '') = 'super_admin' then 'super_admin'::app_role else 'mol_org'::app_role end,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do update
  set nom_complet = excluded.nom_complet;

  update public.invitations
  set accepted_by = new.id,
      accepted_at = now(),
      statut = case
        when statut = 'pending' and expires_at > now() then 'accepted'::invitation_status
        else statut
      end
  where email = invited_email
    and statut = 'pending'
    and expires_at > now();

  return new;
end;
$$;

create or replace function public.next_document_number(p_organization_id uuid, p_type document_type)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_compteur integer;
begin
  insert into public.document_compteurs (organization_id, type, compteur)
  values (p_organization_id, p_type, 1)
  on conflict (organization_id, type)
  do update set compteur = public.document_compteurs.compteur + 1
  returning compteur into v_compteur;

  return p_type::text || '-' || lpad(v_compteur::text, 3, '0');
end;
$$;

create or replace function public.assign_document_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.numero is null or btrim(new.numero) = '' then
    new.numero := public.next_document_number(new.organization_id, new.type);
  end if;

  if new.created_by is null then
    new.created_by := auth.uid();
  end if;

  return new;
end;
$$;

create or replace function public.sync_document_ligne_organization()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
begin
  select organization_id into v_org_id
  from public.documents
  where id = new.document_id;

  if v_org_id is null then
    raise exception 'Document introuvable pour la ligne %', new.document_id;
  end if;

  new.organization_id := v_org_id;
  new.total_ht := round(new.quantite * new.prix_unitaire_ht, 2);
  return new;
end;
$$;

create or replace function public.recalculate_document_totals(p_document_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_subtotal numeric(12,2);
  v_taux_tva numeric(5,2);
begin
  select coalesce(sum(total_ht), 0)
  into v_subtotal
  from public.document_lignes
  where document_id = p_document_id;

  select taux_tva into v_taux_tva
  from public.documents
  where id = p_document_id;

  update public.documents
  set sous_total_ht = coalesce(v_subtotal, 0),
      montant_tva = round(coalesce(v_subtotal, 0) * coalesce(v_taux_tva, 0) / 100, 2),
      total_ttc = round(coalesce(v_subtotal, 0) + (coalesce(v_subtotal, 0) * coalesce(v_taux_tva, 0) / 100), 2)
  where id = p_document_id;
end;
$$;

create or replace function public.handle_document_lignes_totals()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_document_id uuid;
begin
  v_document_id := coalesce(new.document_id, old.document_id);
  perform public.recalculate_document_totals(v_document_id);
  return coalesce(new, old);
end;
$$;

create or replace function public.apply_stock_for_document(p_document_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_document public.documents%rowtype;
  v_ligne record;
  v_quantite_avant numeric(12,2);
  v_delta numeric(12,2);
  v_type stock_movement_type;
begin
  select *
  into v_document
  from public.documents
  where id = p_document_id;

  if not found then
    raise exception 'Document % introuvable', p_document_id;
  end if;

  if v_document.type not in ('facture') then
    return;
  end if;

  if exists (
    select 1
    from public.stock_mouvements
    where document_id = p_document_id
  ) then
    return;
  end if;

  for v_ligne in
    select dl.*, p.quantite_stock
    from public.document_lignes dl
    join public.produits p on p.id = dl.produit_id
    where dl.document_id = p_document_id
  loop
    v_quantite_avant := v_ligne.quantite_stock;
    v_delta := case
      when v_document.type = 'facture' then -1 * v_ligne.quantite
      else 0
    end;
    v_type := case
      when v_document.type = 'facture' then 'facture'::stock_movement_type
      else 'bon_commande'::stock_movement_type
    end;

    if v_document.type = 'facture' and (v_quantite_avant + v_delta) < 0 then
      raise exception 'Stock insuffisant pour le produit %', v_ligne.produit_id;
    end if;

    update public.produits
    set quantite_stock = quantite_stock + v_delta
    where id = v_ligne.produit_id;

    insert into public.stock_mouvements (
      organization_id,
      produit_id,
      document_id,
      mouvement_type,
      quantite,
      quantite_avant,
      quantite_apres,
      note,
      created_by
    )
    values (
      v_document.organization_id,
      v_ligne.produit_id,
      p_document_id,
      v_type,
      v_delta,
      v_quantite_avant,
      v_quantite_avant + v_delta,
      'Mouvement automatique depuis le document ' || v_document.numero,
      coalesce(v_document.created_by, auth.uid())
    );
  end loop;
end;
$$;

create or replace function public.handle_document_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.statut = 'valide' and old.statut is distinct from 'valide' then
    new.validated_at := coalesce(new.validated_at, now());
    perform public.apply_stock_for_document(new.id);
  end if;

  if new.statut = 'annule' and old.statut is distinct from 'annule' then
    new.cancelled_at := coalesce(new.cancelled_at, now());
  end if;

  return new;
end;
$$;

create or replace function public.create_organization_from_invitation(
  p_nom text,
  p_adresse text,
  p_telephone text,
  p_email text,
  p_ice text,
  p_rc text,
  p_logo_url text,
  p_tva numeric
)
returns public.organizations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles%rowtype;
  v_invitation public.invitations%rowtype;
  v_org public.organizations%rowtype;
begin
  select *
  into v_profile
  from public.profiles
  where id = auth.uid();

  if v_profile.id is null then
    raise exception 'Profil introuvable';
  end if;

  if v_profile.organization_id is not null then
    raise exception 'Organisation deja associee au profil';
  end if;

  select *
  into v_invitation
  from public.invitations
  where email = lower(coalesce((select email from auth.users where id = auth.uid()), ''))
    and statut in ('pending', 'accepted')
    and expires_at > now()
  order by created_at desc
  limit 1;

  if v_invitation.id is null then
    raise exception 'Invitation valide introuvable';
  end if;

  insert into public.organizations (
    nom, adresse, telephone, email, ice, rc, logo_url, type, tva
  )
  values (
    p_nom,
    p_adresse,
    p_telephone,
    p_email,
    p_ice,
    p_rc,
    p_logo_url,
    v_invitation.org_type,
    case when v_invitation.org_type = 'cooperative' then 0 else coalesce(p_tva, 20) end
  )
  returning * into v_org;

  update public.profiles
  set organization_id = v_org.id,
      role = 'mol_org'
  where id = auth.uid();

  update public.invitations
  set statut = 'accepted',
      accepted_by = auth.uid(),
      accepted_at = coalesce(accepted_at, now())
  where id = v_invitation.id;

  return v_org;
end;
$$;

drop trigger if exists trg_organizations_updated_at on public.organizations;
create trigger trg_organizations_updated_at
before update on public.organizations
for each row execute function public.set_updated_at();

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_invitations_updated_at on public.invitations;
create trigger trg_invitations_updated_at
before update on public.invitations
for each row execute function public.set_updated_at();

drop trigger if exists trg_clients_updated_at on public.clients;
create trigger trg_clients_updated_at
before update on public.clients
for each row execute function public.set_updated_at();

drop trigger if exists trg_fournisseurs_updated_at on public.fournisseurs;
create trigger trg_fournisseurs_updated_at
before update on public.fournisseurs
for each row execute function public.set_updated_at();

drop trigger if exists trg_produits_updated_at on public.produits;
create trigger trg_produits_updated_at
before update on public.produits
for each row execute function public.set_updated_at();

drop trigger if exists trg_documents_updated_at on public.documents;
create trigger trg_documents_updated_at
before update on public.documents
for each row execute function public.set_updated_at();

drop trigger if exists trg_document_lignes_updated_at on public.document_lignes;
create trigger trg_document_lignes_updated_at
before update on public.document_lignes
for each row execute function public.set_updated_at();

drop trigger if exists trg_document_compteurs_updated_at on public.document_compteurs;
create trigger trg_document_compteurs_updated_at
before update on public.document_compteurs
for each row execute function public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

drop trigger if exists trg_assign_document_number on public.documents;
create trigger trg_assign_document_number
before insert on public.documents
for each row execute function public.assign_document_number();

drop trigger if exists trg_sync_document_ligne_org on public.document_lignes;
create trigger trg_sync_document_ligne_org
before insert or update on public.document_lignes
for each row execute function public.sync_document_ligne_organization();

drop trigger if exists trg_document_lignes_recalculate on public.document_lignes;
create trigger trg_document_lignes_recalculate
after insert or update or delete on public.document_lignes
for each row execute function public.handle_document_lignes_totals();

drop trigger if exists trg_document_status_change on public.documents;
create trigger trg_document_status_change
before update on public.documents
for each row execute function public.handle_document_status_change();

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.invitations enable row level security;
alter table public.clients enable row level security;
alter table public.fournisseurs enable row level security;
alter table public.produits enable row level security;
alter table public.documents enable row level security;
alter table public.document_lignes enable row level security;
alter table public.stock_mouvements enable row level security;
alter table public.document_compteurs enable row level security;

drop policy if exists "organizations_select_own" on public.organizations;
create policy "organizations_select_own"
on public.organizations
for select
using (
  id = app.current_organization_id() or app.is_super_admin()
);

drop policy if exists "organizations_insert_super_admin_or_owner" on public.organizations;
create policy "organizations_insert_super_admin_or_owner"
on public.organizations
for insert
with check (
  app.is_super_admin() or auth.uid() is not null
);

drop policy if exists "organizations_update_own" on public.organizations;
create policy "organizations_update_own"
on public.organizations
for update
using (
  id = app.current_organization_id() or app.is_super_admin()
)
with check (
  id = app.current_organization_id() or app.is_super_admin()
);

drop policy if exists "profiles_select_same_org" on public.profiles;
create policy "profiles_select_same_org"
on public.profiles
for select
using (
  id = auth.uid()
  or organization_id = app.current_organization_id()
  or app.is_super_admin()
);

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
on public.profiles
for update
using (
  id = auth.uid() or app.is_super_admin()
)
with check (
  id = auth.uid() or app.is_super_admin()
);

drop policy if exists "invitations_super_admin_all" on public.invitations;
create policy "invitations_super_admin_all"
on public.invitations
for all
using (app.is_super_admin())
with check (app.is_super_admin());

drop policy if exists "invitations_select_own_email" on public.invitations;
create policy "invitations_select_own_email"
on public.invitations
for select
using (
  lower(email) = lower(coalesce((select email from auth.users where id = auth.uid()), ''))
);

drop policy if exists "clients_org_all" on public.clients;
create policy "clients_org_all"
on public.clients
for all
using (
  organization_id = app.current_organization_id() or app.is_super_admin()
)
with check (
  organization_id = app.current_organization_id() or app.is_super_admin()
);

drop policy if exists "fournisseurs_org_all" on public.fournisseurs;
create policy "fournisseurs_org_all"
on public.fournisseurs
for all
using (
  organization_id = app.current_organization_id() or app.is_super_admin()
)
with check (
  organization_id = app.current_organization_id() or app.is_super_admin()
);

drop policy if exists "produits_org_all" on public.produits;
create policy "produits_org_all"
on public.produits
for all
using (
  organization_id = app.current_organization_id() or app.is_super_admin()
)
with check (
  organization_id = app.current_organization_id() or app.is_super_admin()
);

drop policy if exists "documents_org_all" on public.documents;
create policy "documents_org_all"
on public.documents
for all
using (
  organization_id = app.current_organization_id() or app.is_super_admin()
)
with check (
  organization_id = app.current_organization_id() or app.is_super_admin()
);

drop policy if exists "document_lignes_org_all" on public.document_lignes;
create policy "document_lignes_org_all"
on public.document_lignes
for all
using (
  organization_id = app.current_organization_id() or app.is_super_admin()
)
with check (
  organization_id = app.current_organization_id() or app.is_super_admin()
);

drop policy if exists "stock_mouvements_org_select" on public.stock_mouvements;
create policy "stock_mouvements_org_select"
on public.stock_mouvements
for select
using (
  organization_id = app.current_organization_id() or app.is_super_admin()
);

drop policy if exists "stock_mouvements_org_insert" on public.stock_mouvements;
create policy "stock_mouvements_org_insert"
on public.stock_mouvements
for insert
with check (
  organization_id = app.current_organization_id() or app.is_super_admin()
);

drop policy if exists "document_compteurs_org_all" on public.document_compteurs;
create policy "document_compteurs_org_all"
on public.document_compteurs
for all
using (
  organization_id = app.current_organization_id() or app.is_super_admin()
)
with check (
  organization_id = app.current_organization_id() or app.is_super_admin()
);

insert into storage.buckets (id, name, public)
values
  ('logos', 'logos', true),
  ('produits', 'produits', true),
  ('documents', 'documents', false)
on conflict (id) do nothing;

drop policy if exists "logos_public_read" on storage.objects;
create policy "logos_public_read"
on storage.objects
for select
using (
  bucket_id = 'logos'
  and (
    app.is_super_admin()
    or (storage.foldername(name))[1] = app.current_organization_id()::text
  )
);

drop policy if exists "logos_org_upload" on storage.objects;
create policy "logos_org_upload"
on storage.objects
for insert
with check (
  bucket_id = 'logos'
  and auth.uid() is not null
  and (
    app.is_super_admin()
    or (storage.foldername(name))[1] = app.current_organization_id()::text
  )
);

drop policy if exists "logos_org_update" on storage.objects;
create policy "logos_org_update"
on storage.objects
for update
using (
  bucket_id = 'logos'
  and auth.uid() is not null
  and (
    app.is_super_admin()
    or (storage.foldername(name))[1] = app.current_organization_id()::text
  )
)
with check (
  bucket_id = 'logos'
  and auth.uid() is not null
  and (
    app.is_super_admin()
    or (storage.foldername(name))[1] = app.current_organization_id()::text
  )
);

drop policy if exists "produits_public_read" on storage.objects;
create policy "produits_public_read"
on storage.objects
for select
using (
  bucket_id = 'produits'
  and (
    app.is_super_admin()
    or (storage.foldername(name))[1] = app.current_organization_id()::text
  )
);

drop policy if exists "produits_org_upload" on storage.objects;
create policy "produits_org_upload"
on storage.objects
for insert
with check (
  bucket_id = 'produits'
  and auth.uid() is not null
  and (
    app.is_super_admin()
    or (storage.foldername(name))[1] = app.current_organization_id()::text
  )
);

drop policy if exists "produits_org_update" on storage.objects;
create policy "produits_org_update"
on storage.objects
for update
using (
  bucket_id = 'produits'
  and auth.uid() is not null
  and (
    app.is_super_admin()
    or (storage.foldername(name))[1] = app.current_organization_id()::text
  )
)
with check (
  bucket_id = 'produits'
  and auth.uid() is not null
  and (
    app.is_super_admin()
    or (storage.foldername(name))[1] = app.current_organization_id()::text
  )
);

drop policy if exists "documents_private_org_read" on storage.objects;
create policy "documents_private_org_read"
on storage.objects
for select
using (
  bucket_id = 'documents'
  and auth.uid() is not null
  and (
    app.is_super_admin()
    or (storage.foldername(name))[1] = app.current_organization_id()::text
  )
);

drop policy if exists "documents_private_org_insert" on storage.objects;
create policy "documents_private_org_insert"
on storage.objects
for insert
with check (
  bucket_id = 'documents'
  and auth.uid() is not null
  and (
    app.is_super_admin()
    or (storage.foldername(name))[1] = app.current_organization_id()::text
  )
);

drop policy if exists "documents_private_org_update" on storage.objects;
create policy "documents_private_org_update"
on storage.objects
for update
using (
  bucket_id = 'documents'
  and auth.uid() is not null
  and (
    app.is_super_admin()
    or (storage.foldername(name))[1] = app.current_organization_id()::text
  )
)
with check (
  bucket_id = 'documents'
  and auth.uid() is not null
  and (
    app.is_super_admin()
    or (storage.foldername(name))[1] = app.current_organization_id()::text
  )
);
