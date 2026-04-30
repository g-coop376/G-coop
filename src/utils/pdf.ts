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
  white: '#FFFFFF',
  black: '#000000',
  dark: '#111827',
  gray: '#6B7280',
  grayLight: '#F3F4F6',
  grayMedium: '#9CA3AF',
  border: '#E5E7EB',
  bl: '#0099CC',
  blLight: '#E6F4FA',
  devis: '#607D8B',
  devisLight: '#ECEFF1',
  facture: '#9B1B6E',
  factureLight: '#F8E5F0',
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

function buildCompanyInfo(org: Organization) {
  return `
    <div class="company-name">${org.nom}</div>
    ${org.adresse ? `<div class="company-detail">${org.adresse}</div>` : ''}
    ${org.telephone ? `<div class="company-detail">Tél: ${org.telephone}</div>` : ''}
    ${org.email ? `<div class="company-detail">${org.email}</div>` : ''}
    ${org.ice ? `<div class="company-detail">ICE: ${org.ice}</div>` : ''}
    ${org.rc ? `<div class="company-detail">RC: ${org.rc}</div>` : ''}
  `;
}

function buildClientInfo(doc: DocumentWithRelations) {
  const client = doc.client;
  if (!client) return '<div class="client-name">Client non spécifié</div>';
  return `
    <div class="client-name">${client.nom}</div>
    ${client.adresse ? `<div class="client-detail">${client.adresse}</div>` : ''}
    ${client.telephone ? `<div class="client-detail">Tél: ${client.telephone}</div>` : ''}
    ${client.email ? `<div class="client-detail">${client.email}</div>` : ''}
  `;
}

function buildTableRows(lignes: DocumentLigne[], _color: string) {
  return lignes.map((l, i) => `
    <tr class="${i % 2 === 0 ? 'row-alt' : ''}">
      <td class="col-ref">${l.ref || '—'}</td>
      <td class="col-designation">${l.designation || '—'}</td>
      <td class="col-qty">${l.quantite}</td>
      <td class="col-price">${fmt(l.prix_unitaire_ht)}</td>
      <td class="col-total">${fmt(l.total_ht)}</td>
    </tr>
  `).join('');
}

function buildBlHtml(org: Organization, doc: DocumentWithRelations, lignes: DocumentLigne[]) {
  const config = DOC_TYPE_CONFIG[doc.type as DocumentType];
  const color = config?.color ?? C.bl;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', Arial, sans-serif; color: ${C.dark}; background: #fff; }
  .page { max-width: 794px; margin: 0 auto; }
  .header { background: ${color}; padding: 30px 40px; display: flex; justify-content: space-between; align-items: flex-start; }
  .header-left { color: #fff; }
  .header-logo { font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
  .header-logo span { color: rgba(255,255,255,0.6); }
  .header-org { font-size: 11px; color: rgba(255,255,255,0.75); margin-top: 4px; }
  .header-right { text-align: right; color: #fff; }
  .header-badge { display: inline-block; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3); border-radius: 20px; padding: 4px 14px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 8px; }
  .header-num { font-size: 22px; font-weight: 800; }
  .header-date { font-size: 11px; color: rgba(255,255,255,0.7); margin-top: 4px; }
  .stripe { height: 4px; background: linear-gradient(90deg, ${color}, transparent); opacity: 0.3; }
  .body { padding: 24px 40px 40px; }
  .info-row { display: flex; gap: 20px; margin-bottom: 24px; }
  .info-card { flex: 1; background: ${C.grayLight}; border: 1px solid ${C.border}; border-radius: 10px; padding: 14px 16px; }
  .info-card-title { font-size: 10px; font-weight: 700; color: ${C.gray}; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; }
  .company-name { font-size: 15px; font-weight: 700; color: ${C.dark}; margin-bottom: 4px; }
  .company-detail { font-size: 12px; color: ${C.gray}; line-height: 1.6; }
  .client-name { font-size: 15px; font-weight: 700; color: ${color}; margin-bottom: 4px; }
  .client-detail { font-size: 12px; color: ${C.gray}; line-height: 1.6; }
  .bl-info { background: ${C.blLight}; border-color: rgba(0,153,204,0.2); }
  .bl-info .info-card-title { color: ${color}; }
  .bl-extras { display: flex; gap: 16px; margin-bottom: 20px; }
  .bl-extra-card { flex: 1; background: ${C.grayLight}; border: 1px solid ${C.border}; border-radius: 10px; padding: 12px 14px; }
  .bl-extra-label { font-size: 10px; font-weight: 700; color: ${C.gray}; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
  .bl-extra-value { font-size: 13px; font-weight: 600; color: ${C.dark}; }
  .table { border: 1px solid ${C.border}; border-radius: 10px; overflow: hidden; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; }
  thead { background: ${color}; }
  thead th { padding: 10px 14px; color: #fff; font-size: 11px; font-weight: 700; text-align: left; letter-spacing: 0.3px; }
  thead th.col-qty, thead th.col-price, thead th.col-total { text-align: center; }
  .col-ref { width: 12%; padding: 10px 14px; font-size: 12px; }
  .col-designation { width: 40%; padding: 10px 14px; font-size: 12px; }
  .col-qty { width: 12%; padding: 10px 14px; font-size: 12px; text-align: center; }
  .col-price { width: 18%; padding: 10px 14px; font-size: 12px; text-align: center; }
  .col-total { width: 18%; padding: 10px 14px; font-size: 12px; text-align: center; font-weight: 700; color: ${color}; }
  .row-alt { background: ${C.grayLight}; }
  td { border-bottom: 1px solid ${C.border}; }
  .signatures { display: flex; gap: 20px; margin-bottom: 24px; }
  .sig-box { flex: 1; border: 1px solid ${C.border}; border-radius: 10px; padding: 14px; min-height: 100px; }
  .sig-title { font-size: 10px; font-weight: 700; color: ${C.gray}; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px; }
  .sig-subtitle { font-size: 11px; color: ${C.gray}; margin-bottom: 20px; }
  .footer { border-top: 2px solid ${color}; padding-top: 16px; display: flex; justify-content: space-between; align-items: flex-end; }
  .footer-left { font-size: 10px; color: ${C.gray}; line-height: 1.7; }
  .footer-brand { font-size: 14px; font-weight: 800; color: ${color}; opacity: 0.4; }
  .footer-bank { font-size: 10px; color: ${C.gray}; text-align: right; }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="header-left">
      <div class="header-logo">G<span>coop</span></div>
      <div class="header-org">${org.nom}</div>
    </div>
    <div class="header-right">
      <div class="header-badge">BON DE LIVRAISON</div>
      <div class="header-num">${doc.numero}</div>
      <div class="header-date">Date: ${formatDate(doc.date_document)}</div>
    </div>
  </div>
  <div class="stripe"></div>
  <div class="body">
    <div class="info-row">
      <div class="info-card">
        <div class="info-card-title">Émetteur</div>
        ${buildCompanyInfo(org)}
      </div>
      <div class="info-card bl-info">
        <div class="info-card-title">Client</div>
        ${buildClientInfo(doc)}
      </div>
    </div>
    ${doc.lieu_livraison || doc.numero_commande ? `
    <div class="bl-extras">
      ${doc.lieu_livraison ? `<div class="bl-extra-card"><div class="bl-extra-label">Lieu de livraison</div><div class="bl-extra-value">${doc.lieu_livraison}</div></div>` : ''}
      ${doc.numero_commande ? `<div class="bl-extra-card"><div class="bl-extra-label">N° Commande</div><div class="bl-extra-value">${doc.numero_commande}</div></div>` : ''}
    </div>` : ''}
    <div class="table">
      <table>
        <thead>
          <tr>
            <th class="col-ref">Ref</th>
            <th class="col-designation">Désignation</th>
            <th class="col-qty">Qté</th>
            <th class="col-price">Prix Unit. HT</th>
            <th class="col-total">Total HT</th>
          </tr>
        </thead>
        <tbody>${buildTableRows(lignes, color)}</tbody>
      </table>
    </div>
    <div class="signatures">
      <div class="sig-box">
        <div class="sig-title">Le client</div>
        <div class="sig-subtitle">Signature et cachet</div>
      </div>
      <div class="sig-box">
        <div class="sig-title">Le livreur</div>
        <div class="sig-subtitle">Signature</div>
      </div>
    </div>
    <div class="footer">
      <div class="footer-left">
        ${org.nom}<br/>
        ${org.adresse ?? ''}<br/>
        ${org.telephone ? `Tél: ${org.telephone}` : ''}
        ${org.ice ? ` · ICE: ${org.ice}` : ''}
      </div>
      <div class="footer-bank">${org.rc ? `RC: ${org.rc}` : ''}</div>
      <div class="footer-brand">Gcoop</div>
    </div>
  </div>
</div>
</body>
</html>`;
}

function buildDevisHtml(org: Organization, doc: DocumentWithRelations, lignes: DocumentLigne[]) {
  const config = DOC_TYPE_CONFIG[doc.type as DocumentType];
  const color = config?.color ?? C.devis;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', Arial, sans-serif; color: ${C.dark}; background: #fff; }
  .page { max-width: 794px; margin: 0 auto; }
  .header { background: ${color}; padding: 30px 40px; display: flex; justify-content: space-between; align-items: flex-start; }
  .header-left { color: #fff; }
  .header-logo { font-size: 28px; font-weight: 800; }
  .header-logo span { color: rgba(255,255,255,0.6); }
  .header-org { font-size: 11px; color: rgba(255,255,255,0.7); margin-top: 4px; }
  .header-right { text-align: right; color: #fff; }
  .header-badge { display: inline-block; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3); border-radius: 20px; padding: 4px 14px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 8px; }
  .header-num { font-size: 22px; font-weight: 800; }
  .header-date { font-size: 11px; color: rgba(255,255,255,0.7); margin-top: 4px; }
  .header-valid { font-size: 11px; color: rgba(255,255,255,0.85); margin-top: 2px; }
  .stripe { height: 4px; background: linear-gradient(90deg, ${color}, transparent); opacity: 0.3; }
  .body { padding: 24px 40px 40px; }
  .info-row { display: flex; gap: 20px; margin-bottom: 24px; }
  .info-card { flex: 1; background: ${C.grayLight}; border: 1px solid ${C.border}; border-radius: 10px; padding: 14px 16px; }
  .info-card-title { font-size: 10px; font-weight: 700; color: ${C.gray}; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; }
  .company-name { font-size: 15px; font-weight: 700; color: ${C.dark}; margin-bottom: 4px; }
  .company-detail { font-size: 12px; color: ${C.gray}; line-height: 1.6; }
  .client-name { font-size: 15px; font-weight: 700; color: ${color}; margin-bottom: 4px; }
  .client-detail { font-size: 12px; color: ${C.gray}; line-height: 1.6; }
  .table { border: 1px solid ${C.border}; border-radius: 10px; overflow: hidden; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; }
  thead { background: ${color}; }
  thead th { padding: 10px 14px; color: #fff; font-size: 11px; font-weight: 700; text-align: left; }
  thead th.col-qty, thead th.col-price, thead th.col-total { text-align: center; }
  .col-ref { width: 12%; padding: 10px 14px; font-size: 12px; }
  .col-designation { width: 40%; padding: 10px 14px; font-size: 12px; }
  .col-qty { width: 12%; padding: 10px 14px; font-size: 12px; text-align: center; }
  .col-price { width: 18%; padding: 10px 14px; font-size: 12px; text-align: center; }
  .col-total { width: 18%; padding: 10px 14px; font-size: 12px; text-align: center; font-weight: 700; color: ${color}; }
  .row-alt { background: ${C.grayLight}; }
  td { border-bottom: 1px solid ${C.border}; }
  .totals-section { display: flex; justify-content: flex-end; margin-bottom: 24px; }
  .totals-box { width: 280px; border: 1px solid ${C.border}; border-radius: 10px; overflow: hidden; }
  .totals-row { display: flex; justify-content: space-between; padding: 10px 16px; font-size: 13px; border-bottom: 1px solid ${C.border}; }
  .totals-row .t-label { color: ${C.gray}; }
  .totals-row .t-val { font-weight: 600; color: ${C.dark}; }
  .totals-grand { background: ${color}; }
  .totals-grand .t-label { color: rgba(255,255,255,0.85); font-weight: 700; font-size: 14px; }
  .totals-grand .t-val { color: #fff; font-weight: 800; font-size: 16px; }
  .notes-box { background: ${C.grayLight}; border: 1px solid ${C.border}; border-radius: 10px; padding: 14px 16px; margin-bottom: 24px; }
  .notes-title { font-size: 10px; font-weight: 700; color: ${C.gray}; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 6px; }
  .notes-text { font-size: 12px; color: ${C.dark}; line-height: 1.6; }
  .footer { border-top: 2px solid ${color}; padding-top: 16px; display: flex; justify-content: space-between; align-items: flex-end; }
  .footer-left { font-size: 10px; color: ${C.gray}; line-height: 1.7; }
  .footer-brand { font-size: 14px; font-weight: 800; color: ${color}; opacity: 0.4; }
  .footer-mentions { font-size: 10px; color: ${C.gray}; text-align: center; font-style: italic; }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="header-left">
      <div class="header-logo">G<span>coop</span></div>
      <div class="header-org">${org.nom}</div>
    </div>
    <div class="header-right">
      <div class="header-badge">DEVIS</div>
      <div class="header-num">${doc.numero}</div>
      <div class="header-date">Date: ${formatDate(doc.date_document)}</div>
      <div class="header-valid">Valable 30 jours</div>
    </div>
  </div>
  <div class="stripe"></div>
  <div class="body">
    <div class="info-row">
      <div class="info-card">
        <div class="info-card-title">Émetteur</div>
        ${buildCompanyInfo(org)}
      </div>
      <div class="info-card" style="background: ${C.devisLight}; border-color: rgba(96,125,139,0.2);">
        <div class="info-card-title" style="color: ${color};">Client</div>
        ${buildClientInfo(doc)}
      </div>
    </div>
    <div class="table">
      <table>
        <thead>
          <tr>
            <th class="col-ref">Ref</th>
            <th class="col-designation">Désignation</th>
            <th class="col-qty">Qté</th>
            <th class="col-price">Prix Unit. HT</th>
            <th class="col-total">Total HT</th>
          </tr>
        </thead>
        <tbody>${buildTableRows(lignes, color)}</tbody>
      </table>
    </div>
    <div class="totals-section">
      <div class="totals-box">
        <div class="totals-row">
          <span class="t-label">Total HT</span>
          <span class="t-val">${fmt(doc.sous_total_ht)} DH</span>
        </div>
        <div class="totals-row">
          <span class="t-label">TVA (${doc.taux_tva}%)</span>
          <span class="t-val">${fmt(doc.montant_tva)} DH</span>
        </div>
        <div class="totals-row totals-grand">
          <span class="t-label">Total TTC</span>
          <span class="t-val">${fmt(doc.total_ttc)} DH</span>
        </div>
      </div>
    </div>
    ${doc.notes ? `<div class="notes-box"><div class="notes-title">Conditions / Notes</div><div class="notes-text">${doc.notes}</div></div>` : ''}
    <div class="footer">
      <div class="footer-left">
        ${org.nom}<br/>
        ${org.adresse ?? ''}<br/>
        ${org.telephone ? `Tél: ${org.telephone}` : ''}
        ${org.ice ? ` · ICE: ${org.ice}` : ''}
      </div>
      <div class="footer-mentions">Devis valable 30 jours à compter de la date d'émission</div>
      <div class="footer-brand">Gcoop</div>
    </div>
  </div>
</div>
</body>
</html>`;
}

function buildFactureHtml(org: Organization, doc: DocumentWithRelations, lignes: DocumentLigne[]) {
  const config = DOC_TYPE_CONFIG[doc.type as DocumentType];
  const color = config?.color ?? C.facture;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', Arial, sans-serif; color: ${C.dark}; background: #fff; }
  .page { max-width: 794px; margin: 0 auto; }
  .header { background: ${color}; padding: 30px 40px; display: flex; justify-content: space-between; align-items: flex-start; }
  .header-left { color: #fff; }
  .header-logo { font-size: 28px; font-weight: 800; }
  .header-logo span { color: rgba(255,255,255,0.6); }
  .header-org { font-size: 11px; color: rgba(255,255,255,0.7); margin-top: 4px; }
  .header-right { text-align: right; color: #fff; }
  .header-badge { display: inline-block; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3); border-radius: 20px; padding: 4px 14px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 8px; }
  .header-num { font-size: 22px; font-weight: 800; }
  .header-date { font-size: 11px; color: rgba(255,255,255,0.7); margin-top: 4px; }
  .stripe { height: 4px; background: linear-gradient(90deg, ${color}, transparent); opacity: 0.3; }
  .body { padding: 24px 40px 40px; }
  .info-row { display: flex; gap: 20px; margin-bottom: 24px; }
  .info-card { flex: 1; background: ${C.grayLight}; border: 1px solid ${C.border}; border-radius: 10px; padding: 14px 16px; }
  .info-card-title { font-size: 10px; font-weight: 700; color: ${C.gray}; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; }
  .company-name { font-size: 15px; font-weight: 700; color: ${C.dark}; margin-bottom: 4px; }
  .company-detail { font-size: 12px; color: ${C.gray}; line-height: 1.6; }
  .client-name { font-size: 15px; font-weight: 700; color: ${color}; margin-bottom: 4px; }
  .client-detail { font-size: 12px; color: ${C.gray}; line-height: 1.6; }
  .table { border: 1px solid ${C.border}; border-radius: 10px; overflow: hidden; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; }
  thead { background: ${color}; }
  thead th { padding: 10px 14px; color: #fff; font-size: 11px; font-weight: 700; text-align: left; }
  thead th.col-qty, thead th.col-price, thead th.col-total { text-align: center; }
  .col-ref { width: 12%; padding: 10px 14px; font-size: 12px; }
  .col-designation { width: 40%; padding: 10px 14px; font-size: 12px; }
  .col-qty { width: 12%; padding: 10px 14px; font-size: 12px; text-align: center; }
  .col-price { width: 18%; padding: 10px 14px; font-size: 12px; text-align: center; }
  .col-total { width: 18%; padding: 10px 14px; font-size: 12px; text-align: center; font-weight: 700; color: ${color}; }
  .row-alt { background: ${C.grayLight}; }
  td { border-bottom: 1px solid ${C.border}; }
  .totals-section { display: flex; justify-content: flex-end; margin-bottom: 24px; }
  .totals-box { width: 300px; border: 1px solid ${C.border}; border-radius: 10px; overflow: hidden; }
  .totals-row { display: flex; justify-content: space-between; padding: 10px 16px; font-size: 13px; border-bottom: 1px solid ${C.border}; }
  .totals-row .t-label { color: ${C.gray}; }
  .totals-row .t-val { font-weight: 600; color: ${C.dark}; }
  .totals-grand { background: ${color}; padding: 14px 16px; }
  .totals-grand .t-label { color: rgba(255,255,255,0.85); font-weight: 700; font-size: 14px; }
  .totals-grand .t-val { color: #fff; font-weight: 800; font-size: 16px; }
  .net-a-payer { background: ${color}; border-radius: 10px; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
  .net-label { color: rgba(255,255,255,0.85); font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
  .net-amount { color: #fff; font-size: 24px; font-weight: 800; }
  .tva-mention { background: ${C.factureLight}; border: 1px solid rgba(155,27,110,0.2); border-radius: 10px; padding: 12px 16px; margin-bottom: 24px; text-align: center; }
  .tva-mention-text { font-size: 12px; color: ${color}; font-weight: 600; font-style: italic; }
  .notes-box { background: ${C.grayLight}; border: 1px solid ${C.border}; border-radius: 10px; padding: 14px 16px; margin-bottom: 24px; }
  .notes-title { font-size: 10px; font-weight: 700; color: ${C.gray}; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 6px; }
  .notes-text { font-size: 12px; color: ${C.dark}; line-height: 1.6; }
  .footer { border-top: 2px solid ${color}; padding-top: 16px; display: flex; justify-content: space-between; align-items: flex-end; }
  .footer-left { font-size: 10px; color: ${C.gray}; line-height: 1.7; }
  .footer-brand { font-size: 14px; font-weight: 800; color: ${color}; opacity: 0.4; }
  .footer-bank { font-size: 10px; color: ${C.gray}; text-align: right; line-height: 1.7; }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="header-left">
      <div class="header-logo">G<span>coop</span></div>
      <div class="header-org">${org.nom}</div>
    </div>
    <div class="header-right">
      <div class="header-badge">FACTURE</div>
      <div class="header-num">${doc.numero}</div>
      <div class="header-date">Date: ${formatDate(doc.date_document)}</div>
    </div>
  </div>
  <div class="stripe"></div>
  <div class="body">
    <div class="info-row">
      <div class="info-card">
        <div class="info-card-title">Émetteur</div>
        ${buildCompanyInfo(org)}
      </div>
      <div class="info-card" style="background: ${C.factureLight}; border-color: rgba(155,27,110,0.2);">
        <div class="info-card-title" style="color: ${color};">Client</div>
        ${buildClientInfo(doc)}
      </div>
    </div>
    <div class="table">
      <table>
        <thead>
          <tr>
            <th class="col-ref">Ref</th>
            <th class="col-designation">Désignation</th>
            <th class="col-qty">Qté</th>
            <th class="col-price">Prix Unit. HT</th>
            <th class="col-total">Total HT</th>
          </tr>
        </thead>
        <tbody>${buildTableRows(lignes, color)}</tbody>
      </table>
    </div>
    <div class="totals-section">
      <div class="totals-box">
        <div class="totals-row">
          <span class="t-label">Total HT</span>
          <span class="t-val">${fmt(doc.sous_total_ht)} DH</span>
        </div>
        <div class="totals-row">
          <span class="t-label">TVA (${doc.taux_tva}%)</span>
          <span class="t-val">${fmt(doc.montant_tva)} DH</span>
        </div>
        <div class="totals-row totals-grand">
          <span class="t-label">Total TTC</span>
          <span class="t-val">${fmt(doc.total_ttc)} DH</span>
        </div>
      </div>
    </div>
    <div class="net-a-payer">
      <span class="net-label">Net à payer</span>
      <span class="net-amount">${fmt(doc.total_ttc)} DH</span>
    </div>
    <div class="tva-mention">
      <div class="tva-mention-text">TVA article 91 du Code Général des Impôts</div>
    </div>
    ${doc.notes ? `<div class="notes-box"><div class="notes-title">Notes</div><div class="notes-text">${doc.notes}</div></div>` : ''}
    <div class="footer">
      <div class="footer-left">
        ${org.nom}<br/>
        ${org.adresse ?? ''}<br/>
        ${org.telephone ? `Tél: ${org.telephone}` : ''}
        ${org.ice ? ` · ICE: ${org.ice}` : ''}
      </div>
      <div class="footer-bank">
        ${org.rc ? `RC: ${org.rc}<br/>` : ''}
        ${org.ice ? `ICE: ${org.ice}` : ''}
      </div>
      <div class="footer-brand">Gcoop</div>
    </div>
  </div>
</div>
</body>
</html>`;
}

function buildHtml(org: Organization, doc: DocumentWithRelations, lignes: DocumentLigne[]): string {
  switch (doc.type) {
    case 'bon_livraison': return buildBlHtml(org, doc, lignes);
    case 'devis': return buildDevisHtml(org, doc, lignes);
    case 'facture': return buildFactureHtml(org, doc, lignes);
    default: return buildDevisHtml(org, doc, lignes);
  }
}

export async function generateDocumentPdf(
  organization: Organization,
  document: DocumentWithRelations,
  lignes: DocumentLigne[],
): Promise<string> {
  try {
    const html = buildHtml(organization, document, lignes);
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
