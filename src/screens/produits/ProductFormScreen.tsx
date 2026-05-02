import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, Menu } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import ScreenContainer from '../../components/common/ScreenContainer';
import FormTextField from '../../components/common/FormTextField';
import { useProduits } from '../../hooks/useProduits';
import type { Produit } from '../../types';

const schema = z.object({
  nom: z.string().min(2),
  description: z.string().optional(),
  prix_unitaire: z.string(),
  quantite_stock: z.string(),
  seuil_minimum: z.string(),
  unite: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;

function ProductFormScreen({
  route,
  navigation,
}: {
  route?: { params?: { produit?: Produit } };
  navigation: { goBack: () => void };
}) {
  const { t } = useTranslation();
  const produit = route?.params?.produit;
  const { fournisseurs, saveProduit } = useProduits();
  const [menuVisible, setMenuVisible] = React.useState(false);
  const [fournisseurId, setFournisseurId] = React.useState<string | null>(
    produit?.fournisseur_id ?? null,
  );
  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nom: produit?.nom ?? '',
      description: produit?.description ?? '',
      prix_unitaire: String(produit?.prix_unitaire ?? 0),
      quantite_stock: String(produit?.quantite_stock ?? 0),
      seuil_minimum: String(produit?.seuil_minimum ?? 0),
      unite: produit?.unite ?? 'u',
    },
  });

  return (
    <ScreenContainer title={produit ? t('edit_product') : t('new_product')}>
      <Card>
        <Card.Content style={{ gap: 12 }}>
          <FormTextField control={control as never} name="nom" label={t('name')} />
          <FormTextField control={control as never} name="description" label={t('description')} multiline />
          <FormTextField control={control as never} name="prix_unitaire" label={t('price')} keyboardType="numeric" />
          <FormTextField control={control as never} name="quantite_stock" label={t('quantity_stock')} keyboardType="numeric" />
          <FormTextField control={control as never} name="seuil_minimum" label={t('min_threshold')} keyboardType="numeric" />
          <FormTextField control={control as never} name="unite" label={t('unit')} />
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <Button mode="outlined" onPress={() => setMenuVisible(true)}>
                {fournisseurs.find(item => item.id === fournisseurId)?.nom ?? t('choose_supplier')}
              </Button>
            }>
            {fournisseurs.map(item => (
              <Menu.Item
                key={item.id}
                title={item.nom}
                onPress={() => {
                  setFournisseurId(item.id);
                  setMenuVisible(false);
                }}
              />
            ))}
          </Menu>
          <Button
            mode="outlined"
            onPress={handleSubmit(async values => {
              const ok = await saveProduit(
                {
                  ...values,
                  id: produit?.id,
                  fournisseur_id: fournisseurId,
                  photo_url: produit?.photo_url ?? null,
                  prix_unitaire: Number(values.prix_unitaire) || 0,
                  quantite_stock: Number(values.quantite_stock) || 0,
                  seuil_minimum: Number(values.seuil_minimum) || 0,
                },
                true,
              );
              if (ok) {
                navigation.goBack();
              }
            })}>
            {t('save_and_choose_photo')}
          </Button>
        </Card.Content>
      </Card>
    </ScreenContainer>
  );
}

export default ProductFormScreen;
