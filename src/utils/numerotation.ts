import type { DocumentType } from '../types';

export const documentLabels: Record<DocumentType, string> = {
  FAC: 'Facture',
  DEV: 'Devis',
  BDC: 'Bon de commande',
  BDL: 'Bon de livraison',
};

export function getDocumentImpact(type: DocumentType) {
  if (type === 'FAC') {
    return 'Stock -';
  }
  if (type === 'BDC') {
    return 'Stock +';
  }
  return 'Sans impact';
}
