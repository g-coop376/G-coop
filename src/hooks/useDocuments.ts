import React from 'react';
import { Alert } from 'react-native';
import { supabase } from '../api/supabase';
import { useAuthStore } from '../store/authStore';
import type {
  Client,
  Document,
  DocumentLigne,
  DocumentType,
  DocumentWithRelations,
  Fournisseur,
  Produit,
} from '../types';
import { generateDocumentPdf } from '../utils/pdf';
import { shareFile } from '../utils/share';

export interface DocumentPayload {
  id?: string;
  type: DocumentType;
  date_document: string;
  client_id?: string | null;
  fournisseur_id?: string | null;
  parent_document_id?: string | null;
  notes?: string | null;
  lines: Array<{
    produit_id: string | null;
    description: string;
    quantite: number;
    prix_unitaire: number;
  }>;
}

export function useDocuments() {
  const organization = useAuthStore(state => state.organization);
  const [documents, setDocuments] = React.useState<DocumentWithRelations[]>([]);
  const [clients, setClients] = React.useState<Client[]>([]);
  const [fournisseurs, setFournisseurs] = React.useState<Fournisseur[]>([]);
  const [produits, setProduits] = React.useState<Produit[]>([]);
  const [loading, setLoading] = React.useState(false);

  const fetchDocuments = React.useCallback(async () => {
    if (!organization) {
      return;
    }

    setLoading(true);

    const [{ data: docs, error }, clientsRes, fournisseursRes, produitsRes] =
      await Promise.all([
        supabase
          .from('documents')
          .select('*')
          .eq('organization_id', organization.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('clients')
          .select('*')
          .eq('organization_id', organization.id)
          .order('nom'),
        supabase
          .from('fournisseurs')
          .select('*')
          .eq('organization_id', organization.id)
          .order('nom'),
        supabase
          .from('produits')
          .select('*')
          .eq('organization_id', organization.id)
          .order('nom'),
      ]);

    setLoading(false);

    if (error) {
      Alert.alert('Documents', error.message);
      return;
    }

    const rawDocs = (docs as Document[]) ?? [];
    const clientList = (clientsRes.data as Client[]) ?? [];
    const fournisseurList = (fournisseursRes.data as Fournisseur[]) ?? [];

    const { data: lignes } = await supabase
      .from('document_lignes')
      .select('*')
      .in(
        'document_id',
        rawDocs.map(doc => doc.id),
      );

    const lineList = (lignes as DocumentLigne[]) ?? [];

    setClients(clientList);
    setFournisseurs(fournisseurList);
    setProduits((produitsRes.data as Produit[]) ?? []);
    setDocuments(
      rawDocs.map(doc => ({
        ...doc,
        client: clientList.find(client => client.id === doc.client_id) ?? null,
        fournisseur:
          fournisseurList.find(fournisseur => fournisseur.id === doc.fournisseur_id) ??
          null,
        lignes: lineList.filter(line => line.document_id === doc.id),
      })),
    );
  }, [organization]);

  React.useEffect(() => {
    void fetchDocuments();
  }, [fetchDocuments]);

  const saveDocument = async (payload: DocumentPayload) => {
    if (!organization) {
      return false;
    }

    const subtotal = payload.lines.reduce(
      (sum, line) => sum + line.quantite * line.prix_unitaire,
      0,
    );
    const tauxTva = organization.tva ?? 0;
    const totalTva = subtotal * (tauxTva / 100);

    const { data: documentData, error } = await supabase
      .from('documents')
      .upsert({
        id: payload.id,
        organization_id: organization.id,
        type: payload.type,
        date_document: payload.date_document,
        client_id: payload.client_id ?? null,
        fournisseur_id: payload.fournisseur_id ?? null,
        parent_document_id: payload.parent_document_id ?? null,
        notes: payload.notes ?? null,
        taux_tva: tauxTva,
        sous_total_ht: subtotal,
        montant_tva: totalTva,
        total_ttc: subtotal + totalTva,
      })
      .select('*')
      .single();

    const savedDocument = (documentData as Document | null) ?? null;

    if (error || !savedDocument) {
      Alert.alert('Document', error?.message ?? 'Erreur inconnue');
      return false;
    }

    await supabase.from('document_lignes').delete().eq('document_id', savedDocument.id);

    const { error: linesError } = await supabase.from('document_lignes').insert(
      payload.lines.map(line => ({
        document_id: savedDocument.id,
        produit_id: line.produit_id,
        description: line.description,
        quantite: line.quantite,
        prix_unitaire: line.prix_unitaire,
        total_ligne: line.quantite * line.prix_unitaire,
      })),
    );

    if (linesError) {
      Alert.alert('Lignes du document', linesError.message);
      return false;
    }

    await fetchDocuments();
    return true;
  };

  const updateStatus = async (documentId: string, statut: Document['statut']) => {
    const { error } = await supabase
      .from('documents')
      .update({ statut })
      .eq('id', documentId);

    if (error) {
      Alert.alert('Statut document', error.message);
      return false;
    }

    await fetchDocuments();
    return true;
  };

  const duplicateDocument = async (document: DocumentWithRelations, type: DocumentType) => {
    const success = await saveDocument({
      type,
      date_document: new Date().toISOString().slice(0, 10),
      client_id: document.client_id,
      fournisseur_id: document.fournisseur_id,
      parent_document_id: document.id,
      notes: document.notes,
      lines:
        document.lignes?.map(line => ({
          produit_id: line.produit_id,
          description: line.description,
          quantite: line.quantite,
          prix_unitaire: line.prix_unitaire,
        })) ?? [],
    });

    if (success) {
      Alert.alert('Document créé', `Conversion vers ${type} réalisée.`);
    }
  };

  const exportAndShare = async (document: DocumentWithRelations) => {
    if (!organization || !document.lignes?.length) {
      return;
    }

    const filePath = await generateDocumentPdf(organization, document, document.lignes);
    if (!filePath) {
      return;
    }

    await shareFile(filePath, document.numero);
  };

  return {
    documents,
    clients,
    fournisseurs,
    produits,
    loading,
    fetchDocuments,
    saveDocument,
    updateStatus,
    duplicateDocument,
    exportAndShare,
  };
}
