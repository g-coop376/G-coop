import { generatePDF } from 'react-native-html-to-pdf';
import { Alert, Platform } from 'react-native';
import RNFS from 'react-native-fs';

import type {
  DocumentWithRelations,
  DocumentLigne,
  Organization,
  DocumentType,
} from '../types';
import { DOC_TYPE_CONFIG } from '../types';

const C = {
  primary: '#1E40AF',
  secondary: '#2563EB',
  lightBlue: '#DBEAFE',
  background: '#F9FAFB',
  card: '#FFFFFF',
  textDark: '#111827',
  textGray: '#6B7280',
  border: '#E5E7EB',
  success: '#10B981',
  danger: '#EF4444',
  white: '#FFFFFF',
  black: '#000000',
  grayLight: '#F3F4F6',
  grayMedium: '#9CA3AF',
};

function showPdfDebugAlert(step: string, details: string) {
  if (Platform.OS !== 'android') {
    return;
  }
  Alert.alert('PDF Debug', `${step}\n${details}`);
}

function fmt(n: number) {
  return n.toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch {
    return iso;
  }
}

function formatDateShort(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function buildTypeLabel(type: DocumentType): string {
  const labels: Record<DocumentType, string> = {
    facture: 'FACTURE',
    bon_commande: 'BON DE COMMANDE',
    bon_livraison: 'BON DE LIVRAISON',
  };
  return labels[type];
}

function buildTypeLabelArabic(type: DocumentType): string {
  const labels: Record<DocumentType, string> = {
    facture: 'فاتورة',
    bon_commande: 'أمر شراء',
    bon_livraison: 'وصل تسليم',
  };
  return labels[type];
}

function buildCompanyInfo(org: Organization, isRTL: boolean = false) {
  const dir = isRTL ? 'rtl' : 'ltr';
  return `
    <div class="company-name" dir="${dir}">${org.nom}</div>
    ${org.adresse ? `<div class="company-detail" dir="${dir}"><span class="detail-icon">📍</span>${org.adresse}</div>` : ''}
    ${org.telephone ? `<div class="company-detail" dir="${dir}"><span class="detail-icon">📞</span>${org.telephone}</div>` : ''}
    ${org.email ? `<div class="company-detail" dir="${dir}"><span class="detail-icon">✉️</span>${org.email}</div>` : ''}
    ${org.ice ? `<div class="company-detail" dir="${dir}"><span class="detail-icon">🏢</span>ICE: ${org.ice}</div>` : ''}
    ${org.rc ? `<div class="company-detail" dir="${dir}"><span class="detail-icon">📋</span>RC: ${org.rc}</div>` : ''}
  `;
}

function buildClientInfo(doc: DocumentWithRelations, isRTL: boolean = false) {
  const dir = isRTL ? 'rtl' : 'ltr';
  const client = doc.client;
  if (!client) return `<div class="client-name" dir="${dir}">Client non spécifié</div>`;
  return `
    <div class="client-name" dir="${dir}">${client.nom}</div>
    ${client.adresse ? `<div class="client-detail" dir="${dir}"><span class="detail-icon">📍</span>${client.adresse}</div>` : ''}
    ${client.telephone ? `<div class="client-detail" dir="${dir}"><span class="detail-icon">📞</span>${client.telephone}</div>` : ''}
    ${client.email ? `<div class="client-detail" dir="${dir}"><span class="detail-icon">✉️</span>${client.email}</div>` : ''}
  `;
}

function buildTableRows(lignes: DocumentLigne[], color: string, isRTL: boolean = false) {
  return lignes.map((l, i) => {
    const totalHt = l.total_ht ?? (l.quantite * l.prix_unitaire_ht);
    return `
    <tr class="${i % 2 === 0 ? 'row-alt' : ''}">
      <td class="col-ref" ${isRTL ? 'dir="rtl"' : ''}>${l.ref || '—'}</td>
      <td class="col-designation" ${isRTL ? 'dir="rtl"' : ''}>${l.designation || '—'}</td>
      <td class="col-qty">${l.quantite}</td>
      <td class="col-unit">${l.unite || 'Pièce'}</td>
      <td class="col-price">${fmt(l.prix_unitaire_ht)}</td>
      <td class="col-total">${fmt(totalHt)}</td>
    </tr>
  `;
  }).join('');
}

function buildExtraFields(doc: DocumentWithRelations, type: DocumentType, isRTL: boolean = false) {
  let html = '';

  if (type === 'facture') {
    html += `
    <div class="extra-row">
      <div class="extra-card">
        <div class="extra-label">Mode de paiement</div>
        <div class="extra-value">Espèces</div>
      </div>
      <div class="extra-card">
        <div class="extra-label">Statut</div>
        <div class="extra-value" style="color: ${C.success}; font-weight: 700;">${doc.statut === 'valide' ? 'Payé' : doc.statut === 'brouillon' ? 'Brouillon' : 'Annulé'}</div>
      </div>
    </div>`;
  }

  if (type === 'bon_commande') {
    html += `
    <div class="extra-row">
      <div class="extra-card">
        <div class="extra-label">Délai de paiement</div>
        <div class="extra-value">30 jours</div>
      </div>
      ${doc.numero_commande ? `<div class="extra-card">
        <div class="extra-label">N° Commande</div>
        <div class="extra-value">${doc.numero_commande}</div>
      </div>` : ''}
    </div>`;
  }

  if (type === 'bon_livraison') {
    html += `
    <div class="extra-row">
      ${doc.lieu_livraison ? `<div class="extra-card">
        <div class="extra-label">Lieu de livraison</div>
        <div class="extra-value">${doc.lieu_livraison}</div>
      </div>` : ''}
      ${doc.numero_commande ? `<div class="extra-card">
        <div class="extra-label">N° Commande</div>
        <div class="extra-value">${doc.numero_commande}</div>
      </div>` : ''}
    </div>`;
  }

  return html;
}

function buildDocumentHtml(
  org: Organization, 
  doc: DocumentWithRelations, 
  lignes: DocumentLigne[],
  isRTL: boolean = false
) {
  const type = doc.type as DocumentType;
  const config = DOC_TYPE_CONFIG[type];
  const color = config?.color ?? C.primary;
  const typeLabel = buildTypeLabel(type);
  const typeLabelAr = buildTypeLabelArabic(type);

  const subtotal = doc.sous_total_ht ?? 0;
  const tvaAmount = doc.montant_tva ?? 0;
  const totalTTC = doc.total_ttc ?? 0;

  const dir = isRTL ? 'rtl' : 'ltr';
  const textAlign = isRTL ? 'right' : 'left';
  const reverseFlex = isRTL ? 'row-reverse' : 'row';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', Arial, sans-serif; color: ${C.textDark}; background: #fff; }
  .page { max-width: 794px; margin: 0 auto; }

  /* Header style COOP ONAS9 */
  .header { 
    background: ${color}; 
    padding: 32px 40px; 
    display: flex; 
    justify-content: space-between; 
    align-items: flex-start;
    flex-direction: ${reverseFlex};
  }
  .header-left { color: #fff; flex: 1; }
  .header-logo { 
    font-size: 26px; 
    font-weight: 800; 
    letter-spacing: -0.5px; 
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .header-logo img { 
    width: 48px; 
    height: 48px; 
    border-radius: 50%; 
    background: #fff; 
    padding: 4px;
  }
  .header-logo span { color: rgba(255,255,255,0.6); }
  .header-org { font-size: 11px; color: rgba(255,255,255,0.75); margin-top: 4px; }
  .header-right { 
    text-align: ${isRTL ? 'left' : 'right'}; 
    color: #fff; 
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 12px;
    padding: 16px 20px;
    min-width: 200px;
  }
  .header-badge { 
    display: inline-block; 
    background: rgba(255,255,255,0.15); 
    border: 1px solid rgba(255,255,255,0.3); 
    border-radius: 20px; 
    padding: 4px 14px; 
    font-size: 10px; 
    font-weight: 700; 
    letter-spacing: 1px; 
    margin-bottom: 8px; 
  }
  .header-num { font-size: 20px; font-weight: 800; }
  .header-date { font-size: 11px; color: rgba(255,255,255,0.7); margin-top: 4px; }

  .stripe { height: 4px; background: linear-gradient(${isRTL ? '270deg' : '90deg'}, ${color}, transparent); opacity: 0.3; }

  .body { padding: 24px 40px 40px; }

  /* Info cards */
  .info-row { display: flex; gap: 16px; margin-bottom: 20px; flex-direction: ${reverseFlex}; }
  .info-card { 
    flex: 1; 
    background: ${C.grayLight}; 
    border: 1px solid ${C.border}; 
    border-radius: 10px; 
    padding: 14px 16px; 
  }
  .info-card-title { 
    font-size: 10px; 
    font-weight: 700; 
    color: ${C.textGray}; 
    text-transform: uppercase; 
    letter-spacing: 0.8px; 
    margin-bottom: 8px; 
  }
  .company-name { font-size: 14px; font-weight: 700; color: ${C.textDark}; margin-bottom: 6px; }
  .company-detail { font-size: 11px; color: ${C.textGray}; line-height: 1.7; }
  .detail-icon { margin-${isRTL ? 'left' : 'right'}: 4px; }
  .client-name { font-size: 14px; font-weight: 700; color: ${color}; margin-bottom: 6px; }
  .client-detail { font-size: 11px; color: ${C.textGray}; line-height: 1.7; }

  /* Extra fields */
  .extra-row { display: flex; gap: 16px; margin-bottom: 20px; flex-direction: ${reverseFlex}; }
  .extra-card { 
    flex: 1; 
    background: ${C.card}; 
    border: 1px solid ${C.border}; 
    border-radius: 10px; 
    padding: 12px 14px; 
  }
  .extra-label { 
    font-size: 9px; 
    font-weight: 700; 
    color: ${C.textGray}; 
    text-transform: uppercase; 
    letter-spacing: 0.5px; 
    margin-bottom: 4px; 
  }
  .extra-value { font-size: 12px; font-weight: 600; color: ${C.textDark}; }

  /* Table style */
  .table { 
    border: 1px solid ${C.border}; 
    border-radius: 10px; 
    overflow: hidden; 
    margin-bottom: 20px; 
  }
  table { width: 100%; border-collapse: collapse; }
  thead { background: ${color}; }
  thead th { 
    padding: 10px 12px; 
    color: #fff; 
    font-size: 10px; 
    font-weight: 700; 
    text-align: ${textAlign}; 
    letter-spacing: 0.3px; 
  }
  thead th.col-qty, thead th.col-unit, thead th.col-price, thead th.col-total { text-align: center; }
  .col-ref { width: 10%; padding: 10px 12px; font-size: 11px; text-align: ${textAlign}; }
  .col-designation { width: 35%; padding: 10px 12px; font-size: 11px; text-align: ${textAlign}; }
  .col-qty { width: 8%; padding: 10px 12px; font-size: 11px; text-align: center; }
  .col-unit { width: 10%; padding: 10px 12px; font-size: 11px; text-align: center; }
  .col-price { width: 18%; padding: 10px 12px; font-size: 11px; text-align: center; }
  .col-total { 
    width: 19%; 
    padding: 10px 12px; 
    font-size: 11px; 
    text-align: center; 
    font-weight: 700; 
    color: ${color}; 
  }
  .row-alt { background: ${C.grayLight}; }
  td { border-bottom: 1px solid ${C.border}; }

  /* Totals */
  .totals-section { 
    display: flex; 
    justify-content: ${isRTL ? 'flex-start' : 'flex-end'}; 
    margin-bottom: 24px; 
  }
  .totals-box { 
    width: 300px; 
    border: 1px solid ${C.border}; 
    border-radius: 10px; 
    overflow: hidden; 
  }
  .totals-row { 
    display: flex; 
    justify-content: space-between; 
    padding: 10px 16px; 
    font-size: 12px; 
    border-bottom: 1px solid ${C.border}; 
    flex-direction: ${reverseFlex};
  }
  .totals-row .t-label { color: ${C.textGray}; }
  .totals-row .t-val { font-weight: 600; color: ${C.textDark}; }
  .totals-grand { background: ${color}; border-bottom: none; }
  .totals-grand .t-label { 
    color: rgba(255,255,255,0.9); 
    font-weight: 700; 
    font-size: 13px; 
    text-transform: uppercase; 
    letter-spacing: 0.5px; 
  }
  .totals-grand .t-val { color: #fff; font-weight: 800; font-size: 18px; }

  /* Net à payer (facture uniquement) */
  ${type === 'facture' ? `
  .net-a-payer { 
    background: ${color}; 
    border-radius: 10px; 
    padding: 14px 20px; 
    display: flex; 
    justify-content: space-between; 
    align-items: center; 
    margin-bottom: 20px; 
    flex-direction: ${reverseFlex};
  }
  .net-label { 
    color: rgba(255,255,255,0.9); 
    font-size: 13px; 
    font-weight: 700; 
    text-transform: uppercase; 
    letter-spacing: 1px; 
  }
  .net-amount { color: #fff; font-size: 22px; font-weight: 800; }
  ` : ''}

  /* Signatures */
  .signatures { 
    display: flex; 
    gap: 16px; 
    margin-bottom: 24px; 
    flex-direction: ${reverseFlex};
  }
  .sig-box { 
    flex: 1; 
    border: 1px dashed ${C.border}; 
    border-radius: 10px; 
    padding: 12px; 
    min-height: 90px; 
    text-align: center; 
  }
  .sig-title { 
    font-size: 10px; 
    font-weight: 700; 
    color: ${C.textGray}; 
    text-transform: uppercase; 
    letter-spacing: 0.8px; 
    margin-bottom: 4px; 
  }
  .sig-subtitle { font-size: 10px; color: ${C.grayMedium}; margin-bottom: 16px; }
  .sig-line { 
    border-top: 1px solid ${C.border}; 
    margin-top: 40px; 
    padding-top: 8px; 
    font-size: 11px; 
    color: ${C.textGray}; 
    font-style: italic;
  }

  /* Notes */
  ${doc.notes ? `
  .notes-box { 
    background: ${C.grayLight}; 
    border: 1px solid ${C.border}; 
    border-radius: 10px; 
    padding: 12px 14px; 
    margin-bottom: 20px; 
  }
  .notes-title { 
    font-size: 10px; 
    font-weight: 700; 
    color: ${C.textGray}; 
    text-transform: uppercase; 
    letter-spacing: 0.8px; 
    margin-bottom: 6px; 
  }
  .notes-text { font-size: 11px; color: ${C.textDark}; line-height: 1.6; }
  ` : ''}

  /* Footer */
  .footer { 
    border-top: 2px solid ${color}; 
    padding-top: 14px; 
    display: flex; 
    justify-content: space-between; 
    align-items: flex-end; 
    flex-direction: ${reverseFlex};
  }
  .footer-left { font-size: 9px; color: ${C.textGray}; line-height: 1.7; }
  .footer-brand { font-size: 13px; font-weight: 800; color: ${color}; opacity: 0.35; }
  .footer-bank { font-size: 9px; color: ${C.textGray}; text-align: ${isRTL ? 'left' : 'right'}; line-height: 1.7; }
  
  /* Stamp */
  .stamp { 
    width: 80px; 
    height: 80px; 
    border: 2px solid ${color}; 
    border-radius: 50%; 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    margin: 0 auto; 
    opacity: 0.6;
    font-size: 9px;
    color: ${color};
    font-weight: 700;
    text-transform: uppercase;
    transform: rotate(-15deg);
  }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="header-left">
      <div class="header-logo">
        <div style="width:48px;height:48px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;font-size:20px;">🏔️</div>
        <div>
          <div style="font-size:20px;font-weight:800;">COOP ONAS9</div>
          <div style="font-size:11px;opacity:0.75;">Coopérative Agricole ONAS9</div>
        </div>
      </div>
      <div class="header-org" style="margin-top:8px;">
        ${org.adresse ? org.adresse + '<br/>' : ''}
        ${org.telephone ? 'Tél: ' + org.telephone + '<br/>' : ''}
        ${org.email ? 'Email: ' + org.email : ''}
      </div>
    </div>
    <div class="header-right">
      <div class="header-badge">${typeLabel}</div>
      <div style="font-size:11px;color:rgba(255,255,255,0.7);margin-bottom:4px;">N° : ${doc.numero}</div>
      <div style="font-size:11px;color:rgba(255,255,255,0.7);margin-bottom:4px;">Date : ${formatDateShort(doc.date_document)}</div>
      ${doc.numero_commande ? `<div style="font-size:11px;color:rgba(255,255,255,0.7);">Commande : ${doc.numero_commande}</div>` : ''}
    </div>
  </div>
  <div class="stripe"></div>
  <div class="body">
    <div class="info-row">
      <div class="info-card">
        <div class="info-card-title">Émetteur</div>
        ${buildCompanyInfo(org, isRTL)}
      </div>
      <div class="info-card" style="background: ${C.lightBlue}; border-color: rgba(30,64,175,0.15);">
        <div class="info-card-title" style="color: ${color};">Client</div>
        ${buildClientInfo(doc, isRTL)}
      </div>
    </div>

    ${buildExtraFields(doc, type, isRTL)}

    <div class="table">
      <table>
        <thead>
          <tr>
            <th class="col-ref">Réf. Produit</th>
            <th class="col-designation">Description</th>
            <th class="col-qty">Qté</th>
            <th class="col-unit">Unité</th>
            <th class="col-price">Prix Unit.</th>
            <th class="col-total">Total</th>
          </tr>
        </thead>
        <tbody>${buildTableRows(lignes, color, isRTL)}</tbody>
      </table>
    </div>

    <div class="totals-section">
      <div class="totals-box">
        <div class="totals-row">
          <span class="t-label">Sous-total</span>
          <span class="t-val">${fmt(subtotal)} DH</span>
        </div>
        <div class="totals-row totals-grand">
          <span class="t-label">Total</span>
          <span class="t-val">${fmt(totalTTC)} DH</span>
        </div>
      </div>
    </div>

    ${type === 'facture' ? `
    <div class="net-a-payer">
      <span class="net-label">Net à payer</span>
      <span class="net-amount">${fmt(totalTTC)} DH</span>
    </div>
    ` : ''}

    ${doc.notes ? `
    <div class="notes-box">
      <div class="notes-title">Informations complémentaires</div>
      <div class="notes-text">${doc.notes}</div>
    </div>
    ` : ''}

    <div class="signatures">
      <div class="sig-box">
        <div class="sig-title">Visa du client</div>
        <div class="sig-subtitle">Reçu le : ${formatDateShort(doc.date_document)}</div>
        <div class="sig-line">Signature</div>
      </div>
      <div class="sig-box">
        <div class="sig-title">${type === 'bon_livraison' ? 'Visa du livreur' : 'Visa du fournisseur'}</div>
        <div class="sig-subtitle">Livré le : ${formatDateShort(doc.date_document)}</div>
        <div class="stamp">COOP<br/>ONAS9</div>
      </div>
    </div>

    <div class="footer">
      <div class="footer-left">
        <strong>${org.nom}</strong><br/>
        ${org.adresse ?? ''}<br/>
        ${org.telephone ? `Tél: ${org.telephone}` : ''}
        ${org.ice ? ` · ICE: ${org.ice}` : ''}
      </div>
      <div class="footer-bank">
        ${org.rc ? `RC: ${org.rc}<br/>` : ''}
        ${org.ice ? `ICE: ${org.ice}` : ''}
      </div>
      <div class="footer-brand">COOP ONAS9</div>
    </div>
  </div>
</div>
</body>
</html>`;
}

/**
 * Génère un PDF pour un document
 */
export async function generateDocumentPdf(
  organization: Organization,
  document: DocumentWithRelations,
  lignes: DocumentLigne[],
  isRTL: boolean = false
): Promise<string> {
  try {
    const html = buildDocumentHtml(organization, document, lignes, isRTL);
    const fileName = document.numero.replace(/[^a-zA-Z0-9-_]/g, '_');
    
    const file = await generatePDF({
      html,
      fileName,
      ...(Platform.OS === 'ios' ? { directory: 'Documents' } : {}),
      base64: false,
    });
    
    showPdfDebugAlert('generatePDF result', JSON.stringify(file));

    if (!file.filePath) {
      throw new Error('PDF generation failed – filePath is null');
    }

    const generatedPath = file.filePath.trim();
    showPdfDebugAlert('Generated path', generatedPath);

    const generatedExists = await RNFS.exists(generatedPath);
    showPdfDebugAlert('Generated file exists', `${generatedExists} @ ${generatedPath}`);

    if (!generatedExists) {
      throw new Error(`Generated PDF does not exist at path: ${generatedPath}`);
    }

    if (Platform.OS !== 'android') {
      return generatedPath;
    }

    const cachedPath = `${RNFS.CachesDirectoryPath}/${fileName}.pdf`;

    if (generatedPath !== cachedPath) {
      if (await RNFS.exists(cachedPath)) {
        await RNFS.unlink(cachedPath);
      }
      await RNFS.copyFile(generatedPath, cachedPath);
      showPdfDebugAlert('Copied to cache', cachedPath);
    } else {
      showPdfDebugAlert('Using cache path', cachedPath);
    }

    const cachedExists = await RNFS.exists(cachedPath);
    showPdfDebugAlert('Cache file exists', `${cachedExists} @ ${cachedPath}`);

    if (!cachedExists) {
      throw new Error(`Cached PDF does not exist at path: ${cachedPath}`);
    }

    return cachedPath;
  } catch (error) {
    console.error('generateDocumentPdf error:', error);
    showPdfDebugAlert(
      'PDF generation error',
      error instanceof Error ? error.message : String(error),
    );
    throw error;
  }
}

/**
 * Génère un PDF RTL (Arabe) pour un document
 */
export async function generateDocumentPdfRTL(
  organization: Organization,
  document: DocumentWithRelations,
  lignes: DocumentLigne[]
): Promise<string> {
  return generateDocumentPdf(organization, document, lignes, true);
}