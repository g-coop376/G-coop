import { generatePDF } from 'react-native-html-to-pdf';
import type {
  DocumentWithRelations,
  DocumentLigne,
  Organization,
} from '../types';
import { documentLabels } from './numerotation';

function renderLine(ligne: DocumentLigne) {
  return `
    <tr>
      <td>${ligne.description}</td>
      <td>${ligne.quantite}</td>
      <td>${ligne.prix_unitaire.toFixed(2)} MAD</td>
      <td>${ligne.total_ligne.toFixed(2)} MAD</td>
    </tr>
  `;
}

export async function generateDocumentPdf(
  organization: Organization,
  document: DocumentWithRelations,
  lignes: DocumentLigne[],
) {
  const html = `
    <html>
      <body style="font-family: Arial; padding: 24px;">
        <h1>${documentLabels[document.type]} ${document.numero}</h1>
        <p><strong>${organization.nom}</strong></p>
        <p>${organization.adresse ?? ''}</p>
        <p>Tél: ${organization.telephone ?? ''}</p>
        <p>ICE: ${organization.ice ?? ''} - RC: ${organization.rc ?? ''}</p>
        <hr />
        <p>Date: ${document.date_document}</p>
        <p>Statut: ${document.statut}</p>
        <table width="100%" border="1" cellspacing="0" cellpadding="8">
          <tr>
            <th>Description</th>
            <th>Qté</th>
            <th>PU</th>
            <th>Total</th>
          </tr>
          ${lignes.map(renderLine).join('')}
        </table>
        <h3>Sous-total HT: ${document.sous_total_ht.toFixed(2)} MAD</h3>
        <h3>TVA: ${document.montant_tva.toFixed(2)} MAD</h3>
        <h2>Total TTC: ${document.total_ttc.toFixed(2)} MAD</h2>
      </body>
    </html>
  `;

  const file = await generatePDF({
    html,
    fileName: document.numero,
    directory: 'Documents',
  });

  return file.filePath;
}
