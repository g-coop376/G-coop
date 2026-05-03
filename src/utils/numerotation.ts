import type { DocumentType } from '../types';
import { DOC_TYPE_CONFIG } from '../types';

export const documentLabels: Record<DocumentType, string> = {
  bon_livraison: 'Bon de livraison',
  bon_commande: 'Bon de commande',
  facture: 'Facture',
};

export function getDocumentImpact(type: DocumentType) {
  if (type === 'facture') {
    return 'Stock -';
  }
  return 'Sans impact';
}

export function generateDocumentNumber(type: DocumentType, existingNumbers: string[]): string {
  const config = DOC_TYPE_CONFIG[type];
  const prefix = config.prefix;
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');

  const samePrefix = existingNumbers.filter(n => n.startsWith(`${prefix}-${year}${month}`));
  const nextSeq = samePrefix.length + 1;
  const seq = String(nextSeq).padStart(4, '0');

  return `${prefix}-${year}${month}-${seq}`;
}
