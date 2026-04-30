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
  Produit,
} from '../types';
import { generateDocumentPdf } from '../utils/pdf';
import { shareFile } from '../utils/share';

export interface DocumentPayload {
  id?: string;
  type: DocumentType;
  date_document: string;
  client_id?: string | null;
  lieu_livraison?: string | null;
  numero_commande?: string | null;
  notes?: string | null;
  lines: Array<{
    produit_id: string | null;
    ref: string;
    designation: string;
    quantite: number;
    prix_unitaire_ht: number;
  }>;
}

export function useDocuments() {
  const organization = useAuthStore(state => state.organization);
  const [documents, setDocuments] = React.useState<DocumentWithRelations[]>([]);
  const [clients, setClients] = React.useState<Client[]>([]);
  const [produits, setProduits] = React.useState<Produit[]>([]);
  const [loading, setLoading] = React.useState(false);

  const fetchDocuments = React.useCallback(async () => {
    if (!organization) return;
    setLoading(true);

    const [{ data: docs, error }, clientsRes, produitsRes] = await Promise.all([
      supabase.from('documents').select('*').eq('organization_id', organization.id).order('created_at', { ascending: false }),
      supabase.from('clients').select('*').eq('organization_id', organization.id).order('nom'),
      supabase.from('produits').select('*').eq('organization_id', organization.id).order('nom'),
    ]);

    setLoading(false);

    if (error) {
      Alert.alert('Documents', error.message);
      return;
    }

    const rawDocs = (docs as Document[]) ?? [];
    const clientList = (clientsRes.data as Client[]) ?? [];

    const { data: lignes } = await supabase
      .from('document_lignes')
      .select('*')
      .in('document_id', rawDocs.map(doc => doc.id));

    const lineList = (lignes as DocumentLigne[]) ?? [];

    setClients(clientList);
    setProduits((produitsRes.data as Produit[]) ?? []);
    setDocuments(
      rawDocs.map(doc => ({
        ...doc,
        client: clientList.find(client => client.id === doc.client_id) ?? null,
        lignes: lineList.filter(line => line.document_id === doc.id),
      })),
    );
  }, [organization]);

  React.useEffect(() => {
    void fetchDocuments();
  }, [fetchDocuments]);

  const fetchDocumentsByType = React.useCallback(async (type: DocumentType) => {
    if (!organization) return [];

    const { data, error } = await supabase
      .from('documents').select('*')
      .eq('organization_id', organization.id)
      .eq('type', type)
      .order('created_at', { ascending: false });

    if (error) { Alert.alert('Documents', error.message); return []; }

    const docs = (data as Document[]) ?? [];
    const clientIds = [...new Set(docs.map(d => d.client_id).filter(Boolean))];
    const { data: clientsData } = await supabase.from('clients').select('*').in('id', clientIds);
    const clientList = (clientsData as Client[]) ?? [];
    const { data: lignesData } = await supabase.from('document_lignes').select('*').in('document_id', docs.map(d => d.id));
    const lineList = (lignesData as DocumentLigne[]) ?? [];

    return docs.map(doc => ({
      ...doc,
      client: clientList.find(c => c.id === doc.client_id) ?? null,
      lignes: lineList.filter(l => l.document_id === doc.id),
    }));
  }, [organization]);

  const fetchDocumentsByClient = React.useCallback(async (clientId: string) => {
    if (!organization) return [];

    const { data, error } = await supabase
      .from('documents').select('*')
      .eq('organization_id', organization.id)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) { Alert.alert('Documents', error.message); return []; }

    const docs = (data as Document[]) ?? [];
    const { data: lignesData } = await supabase.from('document_lignes').select('*').in('document_id', docs.map(d => d.id));
    const lineList = (lignesData as DocumentLigne[]) ?? [];
    const clientData = clients.find(c => c.id === clientId) ?? null;

    return docs.map(doc => ({
      ...doc,
      client: clientData,
      lignes: lineList.filter(l => l.document_id === doc.id),
    }));
  }, [organization, clients]);

  const saveDocument = async (payload: DocumentPayload) => {
    if (!organization) return false;

    const subtotal = payload.lines.reduce((sum, line) => sum + line.quantite * line.prix_unitaire_ht, 0);
    const tauxTva = organization.tva ?? 20;
    const totalTva = subtotal * (tauxTva / 100);

    const { data: documentData, error } = await supabase
      .from('documents')
      .upsert({
        id: payload.id,
        organization_id: organization.id,
        type: payload.type,
        date_document: payload.date_document,
        client_id: payload.client_id ?? null,
        lieu_livraison: payload.lieu_livraison ?? null,
        numero_commande: payload.numero_commande ?? null,
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

    if (payload.lines.length > 0) {
      const { error: linesError } = await supabase.from('document_lignes').insert(
        payload.lines.map(line => ({
          document_id: savedDocument.id,
          produit_id: line.produit_id || null,
          ref: line.ref,
          designation: line.designation,
          quantite: line.quantite,
          prix_unitaire_ht: line.prix_unitaire_ht,
          total_ht: line.quantite * line.prix_unitaire_ht,
        })),
      );

      if (linesError) {
        Alert.alert('Lignes du document', linesError.message);
        return false;
      }
    }

    await fetchDocuments();
    return true;
  };

  const updateStatus = async (documentId: string, statut: Document['statut']) => {
    const { error } = await supabase.from('documents').update({ statut }).eq('id', documentId);
    if (error) { Alert.alert('Statut document', error.message); return false; }
    await fetchDocuments();
    return true;
  };

  const duplicateDocument = async (document: DocumentWithRelations, type: DocumentType) => {
    const success = await saveDocument({
      type,
      date_document: new Date().toISOString().slice(0, 10),
      client_id: document.client_id,
      lieu_livraison: document.lieu_livraison,
      numero_commande: document.numero_commande,
      notes: document.notes,
      lines: document.lignes?.map(line => ({
        produit_id: line.produit_id,
        ref: line.ref ?? '',
        designation: line.designation,
        quantite: line.quantite,
        prix_unitaire_ht: line.prix_unitaire_ht,
      })) ?? [],
    });

    if (success) {
      Alert.alert('Document créé', `Conversion vers ${type} réalisée.`);
    }
  };

  const exportAndShare = async (document: DocumentWithRelations) => {
    if (!organization || !document.lignes?.length) {
      Alert.alert('Erreur', 'Document vide ou organisation introuvable');
      return;
    }

    try {
      const filePath = await generateDocumentPdf(organization, document, document.lignes);
      await shareFile(filePath, document.numero);
    } catch (error) {
      Alert.alert('PDF', `Erreur: ${String(error)}`);
    }
  };

  React.useEffect(() => {
    if (!organization) return;

    const channelName = `documents-changes-${organization.id}-${Date.now()}`;

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents', filter: `organization_id=eq.${organization.id}` }, () => { void fetchDocuments(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'document_lignes' }, () => { void fetchDocuments(); })
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [organization, fetchDocuments]);

  return {
    documents,
    clients,
    produits,
    loading,
    fetchDocuments,
    fetchDocumentsByType,
    fetchDocumentsByClient,
    saveDocument,
    updateStatus,
    duplicateDocument,
    exportAndShare,
  };
}