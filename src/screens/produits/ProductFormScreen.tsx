import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, Menu } from 'react-native-paper';
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
    <ScreenContainer title={produit ? 'Modifier produit' : 'Nouveau produit'}>
      <Card>
        <Card.Content style={{ gap: 12 }}>
          <FormTextField control={control as never} name="nom" label="Nom" />
          <FormTextField control={control as never} name="description" label="Description" multiline />
          <FormTextField control={control as never} name="prix_unitaire" label="Prix unitaire" keyboardType="numeric" />
          <FormTextField control={control as never} name="quantite_stock" label="Quantité stock" keyboardType="numeric" />
          <FormTextField control={control as never} name="seuil_minimum" label="Seuil minimum" keyboardType="numeric" />
          <FormTextField control={control as never} name="unite" label="Unité" />
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <Button mode="outlined" onPress={() => setMenuVisible(true)}>
                {fournisseurs.find(item => item.id === fournisseurId)?.nom ?? 'Choisir un fournisseur'}
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
            Enregistrer et choisir une photo
          </Button>
        </Card.Content>
      </Card>
    </ScreenContainer>
  );
}

export default ProductFormScreen;
