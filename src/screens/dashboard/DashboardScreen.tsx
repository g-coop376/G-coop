import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      <ScreenContainer title={t('admin_dashboard')}>
        <Card>
          <Card.Content style={{ gap: 12 }}>
            <Text variant="titleMedium">{t('invite_manager')}</Text>
            <Button mode="outlined" onPress={() => setInviteType(inviteType === 'cooperative' ? 'societe' : 'cooperative')}>
              {t('type')}: {t(inviteType === 'cooperative' ? 'cooperative' : 'company')}
            </Button>
            <Button mode="contained" onPress={() => sendInvitation(inviteEmail, inviteType)}>
              {t('send_invitation_to', { email: inviteEmail })}
            </Button>
          </Card.Content>
        </Card>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer title={t('dashboard_title')}>
      <View style={styles.grid}>
        <StatCard label={t('factures_month')} value={String(factures.length)} />
        <StatCard label={t('ca_month')} value={`${ventes.toFixed(2)} MAD`} />
        <StatCard label={t('produits_stock')} value={String(produits.length)} />
        <StatCard label={t('stock_alerts')} value={String(lowStock.length)} helper={t('stock_min_alert')} />
      </View>

      <Card>
        <Card.Content>
          <Text variant="titleMedium">{t('sales_vs_purchases')}</Text>
          <LineChart
            width={Dimensions.get('window').width - 48}
            height={240}
            data={{
              labels: lastSixMonths.map(item => item.label),
              datasets: [
                { data: lastSixMonths.map(item => item.ventes), color: () => '#0E7C66' },
                { data: lastSixMonths.map(item => item.achats), color: () => '#D97706' },
              ],
              legend: [t('sales'), t('purchases')],
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
          <Text variant="titleMedium">{t('quick_actions')}</Text>
          <Button mode="contained-tonal" onPress={() => navigation.navigate('DocumentForm')}>
            {t('new_document')}
          </Button>
          <Button mode="contained-tonal" onPress={() => navigation.navigate('Stock')}>
            {t('view_stock')}
          </Button>
          <Button mode="contained-tonal" onPress={() => navigation.navigate('Fournisseurs')}>
            {t('manage_suppliers')}
          </Button>
        </Card.Content>
      </Card>

      <Card>
        <Card.Content style={{ gap: 8 }}>
          <Text variant="titleMedium">{t('recent_documents')}</Text>
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
