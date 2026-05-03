import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../api/supabase';
import { useAuthStore } from '../store/authStore';
import type { 
  DocumentWithRelations, 
  DocumentType, 
  DocumentLigne, 
  DocumentStatus,
  DocumentLinePayload,
  EditableDocumentLine,
  Client,
  Produit 
} from '../types';
import { generateDocumentNumber } from '../utils/numerotation';
import { generateDocumentPdf } from '../utils/pdf';
import { sharePdf } from '../utils/share';

interface UseDocumentsReturn {
  documents: DocumentWithRelations[];
  clients: Client[];
  produits: Produit[];
  loading: boolean;
  fetchDocuments: () => Promise<void>;
  fetchClients: () => Promise<void>;
  fetchProduits: () => Promise<void>;
  saveDocument: (data: SaveDocumentData) => Promise<boolean>;
  deleteDocument: (id: string) => Promise<boolean>;
  exportAndShare: (doc: DocumentWithRelations) => Promise<void>;
  generatePdf: (doc: DocumentWithRelations) => Promise<string>;
}

export interface SaveDocumentData {
  id?: string;
  type: DocumentType;
  date_document: string;
  client_id: string | null;
  lieu_livraison?: string | null;
  numero_commande?: string | null;
  notes?: string | null;
  lines: DocumentLinePayload[] | EditableDocumentLine[];
  statut?: DocumentStatus;
}

export function useDocuments(): UseDocumentsReturn {
  const organization = useAuthStore(state => state.organization);
  const [documents, setDocuments] = useState<DocumentWithRelations[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDocuments = useCallback(async () => {
    if (!organization) {
      setDocuments([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          client:clients(*),
          lignes:document_lignes(*)
        `)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      Alert.alert('Erreur', 'Impossible de charger les documents');
    } finally {
      setLoading(false);
    }
  }, [organization]);

  const fetchClients = useCallback(async () => {
    if (!organization) {
      setClients([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('organization_id', organization.id)
        .order('nom');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  }, [organization]);

  const fetchProduits = useCallback(async () => {
    if (!organization) {
      setProduits([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('produits')
        .select('*')
        .eq('organization_id', organization.id)
        .order('nom');

      if (error) throw error;
      setProduits(data || []);
    } catch (error) {
      console.error('Error fetching produits:', error);
    }
  }, [organization]);

  const saveDocument = useCallback(async (data: SaveDocumentData): Promise<boolean> => {
    if (!organization) {
      Alert.alert('Erreur', 'Organisation non disponible');
      return false;
    }

    try {
      const sousTotal = data.lines.reduce((sum, line) => 
        sum + (line.quantite * line.prix_unitaire_ht), 0
      );
      const tauxTva = 0;
      const montantTva = 0;
      const totalTtc = sousTotal;

      const numero = data.id 
        ? undefined 
        : generateDocumentNumber(data.type, documents.map(d => d.numero));

      const documentData = {
        ...(numero ? { numero } : {}),
        organization_id: organization.id,
        type: data.type,
        date_document: data.date_document,
        client_id: data.client_id,
        lieu_livraison: data.lieu_livraison,
        numero_commande: data.numero_commande,
        notes: data.notes,
        statut: data.statut || 'brouillon',
        taux_tva: tauxTva,
        sous_total_ht: sousTotal,
        montant_tva: montantTva,
        total_ttc: totalTtc,
      };

      let docId = data.id;

      if (data.id) {
        const { error } = await supabase
          .from('documents')
          .update(documentData)
          .eq('id', data.id)
          .eq('organization_id', organization.id);
        
        if (error) throw error;
        
        await supabase
          .from('document_lignes')
          .delete()
          .eq('document_id', data.id);
      } else {
        const { data: newDoc, error } = await supabase
          .from('documents')
          .insert(documentData)
          .select()
          .single();
        
        if (error) throw error;
        docId = newDoc.id;
      }

      if (docId && data.lines.length > 0) {
        const lignesData = data.lines.map(line => ({
          document_id: docId,
          produit_id: line.produit_id,
          ref: line.ref,
          designation: line.designation,
          quantite: line.quantite,
          unite: (line as EditableDocumentLine).unite ?? null,
          prix_unitaire_ht: line.prix_unitaire_ht,
          total_ht: line.quantite * line.prix_unitaire_ht,
        }));

        const { error: lignesError } = await supabase
          .from('document_lignes')
          .insert(lignesData);

        if (lignesError) throw lignesError;
      }

      await fetchDocuments();
      return true;
    } catch (error) {
      console.error('Error saving document:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder le document');
      return false;
    }
  }, [organization, documents, fetchDocuments]);

  const deleteDocument = useCallback(async (id: string): Promise<boolean> => {
    if (!organization) return false;

    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id)
        .eq('organization_id', organization.id);
      
      if (error) throw error;
      await fetchDocuments();
      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      Alert.alert('Erreur', 'Impossible de supprimer le document');
      return false;
    }
  }, [organization, fetchDocuments]);

  const generatePdf = useCallback(async (doc: DocumentWithRelations): Promise<string> => {
    const org = organization || doc.client?.nom;

    if (!org) throw new Error('Organization not found');

    const orgData = typeof org === 'string'
      ? { id: '', nom: org, adresse: '', telephone: '', email: '', ice: '', rc: '', logo_url: '', type: 'cooperative' as const, tva: 0 }
      : org;

    const lignes = doc.lignes || [];
    const filePath = await generateDocumentPdf(orgData, doc, lignes);
    return filePath;
  }, [organization]);

  const exportAndShare = useCallback(async (doc: DocumentWithRelations) => {
    try {
      const filePath = await generatePdf(doc);
      await sharePdf(filePath, `${doc.type} ${doc.numero}`);
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Erreur', 'Impossible de partager le document');
    }
  }, [generatePdf]);

  return {
    documents,
    clients,
    produits,
    loading,
    fetchDocuments,
    fetchClients,
    fetchProduits,
    saveDocument,
    deleteDocument,
    exportAndShare,
    generatePdf,
  };
}
