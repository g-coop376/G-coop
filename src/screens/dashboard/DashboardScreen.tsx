import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { LineChart } from 'react-native-chart-kit';
import ScreenContainer from '../../components/common/ScreenContainer';
import StatCard from '../../components/common/StatCard';
import { useDocuments } from '../../hooks/useDocuments';
import { useProduits } from '../../hooks/useProduits';
import { useAuth } from '../../hooks/useAuth';
import { useOrgStore } from '../../store/orgStore';
import { documentLabels } from '../../utils/numerotation';

function monthLabel(offset: number) {
  const date = new Date();
  date.setMonth(date.getMonth() - offset);
  return date.toLocaleDateString('fr-MA', { month: 'short' });
}

function DashboardScreen({ navigation }: { navigation: { navigate: (screen: string) => void } }) {
  const { documents } = useDocuments();
  const { produits } = useProduits();
  const { profile, sendInvitation } = useAuth();
  const { selectedMonth } = useOrgStore();
  const [inviteEmail, setInviteEmail] = React.useState('responsable@example.com');
  const [inviteType, setInviteType] = React.useState<'cooperative' | 'societe'>('cooperative');

  const monthlyDocs = documents.filter(doc => doc.date_document.startsWith(selectedMonth));
  const factures = monthlyDocs.filter(doc => doc.type === 'facture' && doc.statut === 'valide');
  const ventes = factures.reduce((sum, doc) => sum + doc.total_ttc, 0);
  const lowStock = produits.filter(produit => produit.quantite_stock <= produit.seuil_minimum);

  const lastSixMonths = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - index));
    const month = date.toISOString().slice(0, 7);
    const docs = documents.filter(doc => doc.date_document.startsWith(month) && doc.statut === 'valide');
    return {
      label: monthLabel(5 - index),
      ventes: docs.filter(doc => doc.type === 'facture').reduce((sum, doc) => sum + doc.total_ttc, 0),
      achats: docs.filter(doc => doc.type === 'bon_livraison').reduce((sum, doc) => sum + doc.total_ttc, 0),
    };
  });

  if (profile?.role === 'super_admin') {
    return (
      <ScreenContainer title="Administration G-COOP">
        <Card>
          <Card.Content style={{ gap: 12 }}>
            <Text variant="titleMedium">Inviter un responsable</Text>
            <Button mode="outlined" onPress={() => setInviteType(inviteType === 'cooperative' ? 'societe' : 'cooperative')}>
              Type: {inviteType}
            </Button>
            <Button mode="contained" onPress={() => sendInvitation(inviteEmail, inviteType)}>
              Envoyer l'invitation à {inviteEmail}
            </Button>
          </Card.Content>
        </Card>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer title="Tableau de bord">
      <View style={styles.grid}>
        <StatCard label="Factures du mois" value={String(factures.length)} />
        <StatCard label="CA du mois" value={`${ventes.toFixed(2)} MAD`} />
        <StatCard label="Produits en stock" value={String(produits.length)} />
        <StatCard label="Alertes stock" value={String(lowStock.length)} helper="Stock sous seuil minimum" />
      </View>

      <Card>
        <Card.Content>
          <Text variant="titleMedium">Ventes vs achats (6 mois)</Text>
          <LineChart
            width={Dimensions.get('window').width - 48}
            height={240}
            data={{
              labels: lastSixMonths.map(item => item.label),
              datasets: [
                { data: lastSixMonths.map(item => item.ventes), color: () => '#0E7C66' },
                { data: lastSixMonths.map(item => item.achats), color: () => '#D97706' },
              ],
              legend: ['Ventes', 'Achats'],
            }}
            chartConfig={{
              backgroundColor: '#FFF9F1',
              backgroundGradientFrom: '#FFF9F1',
              backgroundGradientTo: '#FFFDF9',
              decimalPlaces: 0,
              color: opacity => `rgba(14, 124, 102, ${opacity})`,
              labelColor: () => '#1F2937',
            }}
            bezier
            style={styles.chart}
          />
        </Card.Content>
      </Card>

      <Card>
        <Card.Content style={{ gap: 8 }}>
          <Text variant="titleMedium">Actions rapides</Text>
          <Button mode="contained-tonal" onPress={() => navigation.navigate('DocumentForm')}>
            Nouveau document
          </Button>
          <Button mode="contained-tonal" onPress={() => navigation.navigate('Stock')}>
            Voir le stock
          </Button>
          <Button mode="contained-tonal" onPress={() => navigation.navigate('Fournisseurs')}>
            Gérer les fournisseurs
          </Button>
        </Card.Content>
      </Card>

      <Card>
        <Card.Content style={{ gap: 8 }}>
          <Text variant="titleMedium">Derniers documents</Text>
          {documents.slice(0, 5).map(doc => (
            <Text key={doc.id}>
              {documentLabels[doc.type]} {doc.numero} • {doc.total_ttc.toFixed(2)} MAD
            </Text>
          ))}
        </Card.Content>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  chart: {
    marginTop: 16,
    borderRadius: 16,
  },
});

export default DashboardScreen;
