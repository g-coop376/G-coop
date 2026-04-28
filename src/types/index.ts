import type { Session, User } from '@supabase/supabase-js';

export type Role = 'super_admin' | 'mol_org';
export type OrganizationType = 'cooperative' | 'societe';
export type DocumentType = 'FAC' | 'DEV' | 'BDC' | 'BDL';
export type DocumentStatus = 'brouillon' | 'valide' | 'annule';
export type PendingAuthScreen = 'ResetPassword' | 'SetPassword' | null;

export interface Organization {
  id: string;
  nom: string;
  adresse: string | null;
  telephone: string | null;
  email: string | null;
  ice: string | null;
  rc: string | null;
  logo_url: string | null;
  type: OrganizationType;
  tva: number;
}

export interface Profile {
  id: string;
  organization_id: string | null;
  role: Role;
  nom_complet: string | null;
}

export interface Invitation {
  id: string;
  email: string;
  org_type: OrganizationType;
  token: string;
  statut: 'pending' | 'accepted' | 'expired' | 'cancelled';
  expires_at: string;
}

export interface Client {
  id: string;
  organization_id: string;
  nom: string;
  telephone: string;
  adresse: string | null;
  email: string | null;
}

export interface Fournisseur {
  id: string;
  organization_id: string;
  nom: string;
  telephone: string;
  adresse: string | null;
  email: string | null;
}

export interface Produit {
  id: string;
  organization_id: string;
  fournisseur_id: string | null;
  nom: string;
  description: string | null;
  prix_unitaire: number;
  quantite_stock: number;
  seuil_minimum: number;
  photo_url: string | null;
  unite: string | null;
}

export interface Document {
  id: string;
  organization_id: string;
  type: DocumentType;
  numero: string;
  statut: DocumentStatus;
  date_document: string;
  client_id: string | null;
  fournisseur_id: string | null;
  parent_document_id: string | null;
  notes: string | null;
  sous_total_ht: number;
  taux_tva: number;
  montant_tva: number;
  total_ttc: number;
  pdf_path: string | null;
}

export interface DocumentLigne {
  id: string;
  document_id: string;
  produit_id: string | null;
  description: string;
  quantite: number;
  prix_unitaire: number;
  total_ligne: number;
}

export interface StockMouvement {
  id: string;
  organization_id: string;
  produit_id: string;
  document_id: string | null;
  mouvement_type: 'manual' | 'facture' | 'bon_commande' | 'adjustment';
  quantite: number;
  quantite_avant: number;
  quantite_apres: number;
  note: string | null;
  created_at: string;
}

export interface AuthState {
  initialized: boolean;
  loading: boolean;
  processingDeepLink: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  organization: Organization | null;
  pendingAuthScreen: PendingAuthScreen;
  deepLinkError: string | null;
}

export interface DashboardMetric {
  label: string;
  value: string;
  helper?: string;
}

export interface DashboardSeriesPoint {
  month: string;
  ventes: number;
  achats: number;
}

export interface DocumentWithRelations extends Document {
  client?: Client | null;
  fournisseur?: Fournisseur | null;
  lignes?: DocumentLigne[];
}
