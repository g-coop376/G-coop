import type { DocumentType } from '../types';

export const documentLabels: Record<DocumentType, string> = {
  bon_livraison: 'Bon de livraison',
  devis: 'Devis',
  facture: 'Facture',
};

export function getDocumentImpact(type: DocumentType) {
  if (type === 'facture') {
    return 'Stock -';
  }
  return 'Sans impact';
}
