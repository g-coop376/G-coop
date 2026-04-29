// eslint-disable-next-line @typescript-eslint/no-require-imports
const RNHTMLtoPDF = require('react-native-html-to-pdf') as {
  convert: (opts: { html: string; fileName: string; directory: string; base64: boolean }) => Promise<{ filePath?: string }>;
};
import type {
  DocumentWithRelations,
  DocumentLigne,
  Organization,
} from '../types';
import { documentLabels } from './numerotation';

// ─── Color tokens (matches app COLORS) ────────────────────────────────────────
const C = {
  primary:      '#1A3C8F',
  primaryLight: '#EEF2FF',
  primaryDark:  '#0F2460',
  purple:       '#7C3AED',
  amber:        '#D97706',
  green:        '#16A34A',
  red:          '#DC2626',
  gray:         '#6B7280',
  grayLight:    '#F9FAFB',
  border:       '#E5E7EB',
  dark:         '#111827',
  white:        '#FFFFFF',
};

// ─── Doc-type meta (matches DOC_TYPES in DocumentFormScreen) ──────────────────
const DOC_META: Record<string, { color: string; labelAr: string; labelFr: string }> = {
  DEV: { color: C.purple,  labelAr: 'عرض السعر',    labelFr: 'Devis'            },
  FAC: { color: C.primary, labelAr: 'فاتورة',        labelFr: 'Facture'          },
  BDC: { color: C.amber,   labelAr: 'طلب شراء',      labelFr: 'Bon de commande'  },
  BDL: { color: C.green,   labelAr: 'وصل تسليم',     labelFr: 'Bon de livraison' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return n.toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('ar-MA', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch {
    return iso;
  }
}

// ─── Row renderer ─────────────────────────────────────────────────────────────
function renderLine(ligne: DocumentLigne, index: number) {
  const bg = index % 2 === 0 ? C.white : C.grayLight;
  return `
    <tr style="background:${bg};">
      <td style="padding:10px 14px; color:${C.dark}; font-size:13px; border-bottom:1px solid ${C.border};">
        ${ligne.description || '—'}
      </td>
      <td style="padding:10px 14px; text-align:center; color:${C.gray}; font-size:13px; border-bottom:1px solid ${C.border};">
        ${ligne.quantite}
      </td>
      <td style="padding:10px 14px; text-align:center; color:${C.gray}; font-size:13px; border-bottom:1px solid ${C.border};">
        ${fmt(ligne.prix_unitaire)} DH
      </td>
      <td style="padding:10px 14px; text-align:center; font-weight:700; color:${C.primary}; font-size:13px; border-bottom:1px solid ${C.border};">
        ${fmt(ligne.total_ligne)} DH
      </td>
    </tr>
  `;
}

// ─── Main HTML builder ────────────────────────────────────────────────────────
function buildHtml(
  org: Organization,
  doc: DocumentWithRelations,
  lignes: DocumentLigne[],
): string {
  const meta    = DOC_META[doc.type] ?? DOC_META.FAC;
  const accentColor = meta.color;

  // client / fournisseur name (adjust field names to your actual types)
  const partyName  = (doc as any).client?.nom ?? (doc as any).fournisseur?.nom ?? '—';
  const partyPhone = (doc as any).client?.telephone ?? (doc as any).fournisseur?.telephone ?? '';
  const partyEmail = (doc as any).client?.email ?? '';

  const linesHtml = lignes.map(renderLine).join('');

  const tvaAmount = doc.montant_tva  ?? 0;
  const tvaRate   = (doc as any).taux_tva ?? 20;
  const hasTva    = tvaAmount > 0;

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Cairo', 'Arial', sans-serif;
      background: #fff;
      color: ${C.dark};
      direction: rtl;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ── Page wrapper ── */
    .page {
      max-width: 794px;
      margin: 0 auto;
      padding: 0;
    }

    /* ── Header band ── */
    .header {
      background: ${accentColor};
      padding: 28px 36px 22px;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
    }
    .header-brand .logo-text {
      font-size: 30px;
      font-weight: 800;
      color: #fff;
      letter-spacing: -0.5px;
    }
    .header-brand .logo-text span { color: rgba(255,255,255,0.55); }
    .header-brand .org-sub {
      font-size: 11px;
      color: rgba(255,255,255,0.75);
      margin-top: 4px;
    }
    .header-doc {
      text-align: left;
    }
    .header-doc .doc-type-badge {
      display: inline-block;
      background: rgba(255,255,255,0.18);
      color: #fff;
      font-size: 12px;
      font-weight: 700;
      padding: 3px 12px;
      border-radius: 20px;
      border: 1px solid rgba(255,255,255,0.35);
      margin-bottom: 6px;
      letter-spacing: 0.5px;
    }
    .header-doc .doc-num {
      font-size: 22px;
      font-weight: 800;
      color: #fff;
    }
    .header-doc .doc-date {
      font-size: 11px;
      color: rgba(255,255,255,0.75);
      margin-top: 3px;
    }

    /* ── Accent stripe ── */
    .stripe {
      height: 4px;
      background: linear-gradient(90deg, ${accentColor} 0%, rgba(255,255,255,0) 100%);
      opacity: 0.3;
    }

    /* ── Body ── */
    .body { padding: 28px 36px 36px; }

    /* ── Info cards row ── */
    .info-row {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
    }
    .info-card {
      flex: 1;
      background: ${C.grayLight};
      border: 1px solid ${C.border};
      border-radius: 12px;
      padding: 14px 16px;
    }
    .info-card .card-title {
      font-size: 10px;
      font-weight: 700;
      color: ${C.gray};
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 8px;
    }
    .info-card .card-name {
      font-size: 15px;
      font-weight: 700;
      color: ${C.dark};
      margin-bottom: 3px;
    }
    .info-card .card-sub {
      font-size: 12px;
      color: ${C.gray};
      line-height: 1.6;
    }
    .info-card.accent {
      background: ${C.primaryLight};
      border-color: rgba(26,60,143,0.18);
    }
    .info-card.accent .card-name { color: ${C.primary}; }

    /* ── Table ── */
    .table-wrap {
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid ${C.border};
      margin-bottom: 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    thead tr {
      background: ${accentColor};
    }
    thead th {
      padding: 11px 14px;
      color: #fff;
      font-size: 12px;
      font-weight: 700;
      text-align: right;
      letter-spacing: 0.3px;
    }
    thead th:not(:first-child) { text-align: center; }

    /* ── Totals ── */
    .totals-wrap {
      display: flex;
      justify-content: flex-start; /* RTL: start = right side */
    }
    .totals-box {
      width: 300px;
      border: 1px solid ${C.border};
      border-radius: 12px;
      overflow: hidden;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 16px;
      font-size: 13px;
      border-bottom: 1px solid ${C.border};
    }
    .totals-row:last-child { border-bottom: none; }
    .totals-row .t-label { color: ${C.gray}; }
    .totals-row .t-val   { font-weight: 600; color: ${C.dark}; }
    .totals-row.grand {
      background: ${accentColor};
      padding: 13px 16px;
    }
    .totals-row.grand .t-label { color: rgba(255,255,255,0.85); font-weight: 700; font-size: 14px; }
    .totals-row.grand .t-val   { color: #fff; font-weight: 800; font-size: 16px; }

    /* ── Notes ── */
    .notes-section {
      margin-top: 22px;
      background: ${C.grayLight};
      border: 1px solid ${C.border};
      border-radius: 12px;
      padding: 14px 16px;
    }
    .notes-section .notes-title {
      font-size: 11px;
      font-weight: 700;
      color: ${C.gray};
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 6px;
    }
    .notes-section .notes-body {
      font-size: 13px;
      color: ${C.dark};
      line-height: 1.7;
    }

    /* ── Footer ── */
    .footer {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid ${C.border};
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .footer .footer-left {
      font-size: 10px;
      color: ${C.gray};
      line-height: 1.7;
    }
    .footer .footer-brand {
      font-size: 13px;
      font-weight: 800;
      color: ${accentColor};
      opacity: 0.4;
    }
  </style>
</head>
<body>
  <div class="page">

    <!-- ── Header ── -->
    <div class="header">
      <div class="header-brand">
        <div class="logo-text">G<span>coop</span></div>
        <div class="org-sub">${org.nom}</div>
        ${org.adresse ? `<div class="org-sub">${org.adresse}</div>` : ''}
        ${org.telephone ? `<div class="org-sub">📞 ${org.telephone}</div>` : ''}
      </div>
      <div class="header-doc">
        <div class="doc-type-badge">${meta.labelFr} · ${meta.labelAr}</div>
        <div class="doc-num">${doc.numero}</div>
        <div class="doc-date">${formatDate(doc.date_document)}</div>
      </div>
    </div>

    <!-- ── Body ── -->
    <div class="body">

      <!-- Info cards -->
      <div class="info-row">
        <!-- Org info -->
        <div class="info-card">
          <div class="card-title">معلومات المنشأة</div>
          <div class="card-name">${org.nom}</div>
          <div class="card-sub">
            ${org.ice    ? `ICE : ${org.ice}<br/>` : ''}
            ${org.rc     ? `RC  : ${org.rc}<br/>`  : ''}
            ${(org as any).numero_if ? `IF  : ${(org as any).numero_if}<br/>` : ''}
            ${org.adresse ? org.adresse            : ''}
          </div>
        </div>

        <!-- Client / Fournisseur -->
        <div class="info-card accent">
          <div class="card-title">
            ${doc.client_id ? 'العميل' : 'المورد'}
          </div>
          <div class="card-name">${partyName}</div>
          <div class="card-sub">
            ${partyPhone ? `📞 ${partyPhone}<br/>` : ''}
            ${partyEmail ? `✉ ${partyEmail}`       : ''}
          </div>
        </div>

        <!-- Doc status -->
        <div class="info-card" style="flex:0 0 140px; text-align:center;">
          <div class="card-title">الحالة</div>
          <div style="
            display:inline-block;
            margin-top:6px;
            padding: 5px 14px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 700;
            background: ${String(doc.statut).includes('مدفوع') || String(doc.statut) === 'paid'
              ? '#DCFCE7' : '#FEF3C7'};
            color: ${String(doc.statut).includes('مدفوع') || String(doc.statut) === 'paid'
              ? C.green : C.amber};
          ">
            ${doc.statut ?? '—'}
          </div>
        </div>
      </div>

      <!-- Products table -->
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th style="width:45%;">المنتج / الخدمة</th>
              <th style="width:15%;">الكمية</th>
              <th style="width:20%;">السعر الوحدوي</th>
              <th style="width:20%;">المجموع</th>
            </tr>
          </thead>
          <tbody>
            ${linesHtml}
          </tbody>
        </table>
      </div>

      <!-- Totals -->
      <div class="totals-wrap">
        <div class="totals-box">
          <div class="totals-row">
            <span class="t-label">المجموع الفرعي HT</span>
            <span class="t-val">${fmt(doc.sous_total_ht)} DH</span>
          </div>
          ${hasTva ? `
          <div class="totals-row">
            <span class="t-label">TVA (${tvaRate}%)</span>
            <span class="t-val">${fmt(tvaAmount)} DH</span>
          </div>` : ''}
          <div class="totals-row grand">
            <span class="t-label">المجموع الكلي TTC</span>
            <span class="t-val">${fmt(doc.total_ttc)} DH</span>
          </div>
        </div>
      </div>

      <!-- Notes -->
      ${doc.notes ? `
      <div class="notes-section">
        <div class="notes-title">ملاحظات</div>
        <div class="notes-body">${doc.notes}</div>
      </div>` : ''}

      <!-- Footer -->
      <div class="footer">
        <div class="footer-left">
          ${org.nom}<br/>
          ${org.adresse ?? ''}<br/>
          ${org.telephone ? `Tél : ${org.telephone}` : ''}
          ${org.ice       ? ` · ICE : ${org.ice}`    : ''}
        </div>
        <div class="footer-brand">Gcoop</div>
      </div>

    </div><!-- /body -->
  </div><!-- /page -->
</body>
</html>`;
}

// ─── Public API ───────────────────────────────────────────────────────────────
export async function generateDocumentPdf(
  organization: Organization,
  document: DocumentWithRelations,
  lignes: DocumentLigne[],
): Promise<string> {
  const html = buildHtml(organization, document, lignes);

  const file = await RNHTMLtoPDF.convert({
    html,
    fileName: document.numero,
    directory: 'Documents',
    base64: false,
  });

  if (!file.filePath) {
    throw new Error('PDF generation failed – filePath is null');
  }

  return file.filePath;
}