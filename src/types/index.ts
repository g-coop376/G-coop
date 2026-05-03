import type { Session, User } from '@supabase/supabase-js';
import { useTranslation } from 'react-i18next';

export type Role = 'super_admin' | 'mol_org';
export type OrganizationType = 'cooperative' | 'societe';
export type DocumentType = 'bon_livraison' | 'bon_commande' | 'facture';
export type DocumentStatus = 'brouillon' | 'valide' | 'annule';

export const DOC_TYPE_CONFIG: Record<DocumentType, { label: string; icon: string; color: string; prefix: string }> = {
  bon_livraison: { label: 'Bon de livraison', icon: 'truck-delivery-outline', color: '#1E40AF', prefix: 'BL' },
  bon_commande: { label: 'Bon de commande', icon: 'clipboard-list-outline', color: '#2563EB', prefix: 'BC' },
  facture: { label: 'Facture', icon: 'receipt', color: '#1E40AF', prefix: 'FAC' },
};

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
  lieu_livraison: string | null;
  numero_commande: string | null;
  sous_total_ht: number;
  taux_tva: number;
  montant_tva: number;
  total_ttc: number;
  pdf_path: string | null;
}

export interface DocumentLigne {
  id: string;
  organization_id: string;
  document_id: string;
  produit_id: string | null;
  ref: string | null;
  designation: string;
  quantite: number;
  unite: string | null;
  prix_unitaire_ht: number;
  total_ht: number;
}

export interface DocumentLinePayload {
  produit_id: string | null;
  ref: string;
  designation: string;
  quantite: number;
  unite: string | null;
  prix_unitaire_ht: number;
}

export interface EditableDocumentLine {
  produit_id: string | null;
  ref: string;
  designation: string;
  quantite: number;
  unite: string;
  prix_unitaire_ht: number;
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

export function getDocTypeConfig(type: DocumentType) {
  return DOC_TYPE_CONFIG[type];
}

export function getStatusLabel(statut: DocumentStatus): string {
  const { t } = useTranslation();
  const labels: Record<DocumentStatus, string> = {
    brouillon: t('status_brouillon'),
    valide: t('status_valide'),
    annule: t('status_annule'),
  };
  return labels[statut];
}

export function getStatusColor(statut: DocumentStatus): string {
  const colors: Record<DocumentStatus, string> = {
    brouillon: '#F59E0B',
    valide: '#10B981',
    annule: '#EF4444',
  };
  return colors[statut];
}
