import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Button, Card, Menu, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import FormTextField from '../../components/common/FormTextField';
import { useProduits } from '../../hooks/useProduits';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../api/supabase';
import { launchImageLibrary } from 'react-native-image-picker';
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
  const organization = useAuthStore(state => state.organization);

  const [menuVisible, setMenuVisible] = useState(false);
  const [fournisseurId, setFournisseurId] = useState<string | null>(
    produit?.fournisseur_id ?? null,
  );
  const [photoUrl, setPhotoUrl] = useState<string | null>(produit?.photo_url ?? null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

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

  // Upload image avec ArrayBuffer
  const handleUploadImage = async () => {
    if (!organization) return;

    try {
      setUploading(true);
      const result = await launchImageLibrary({ mediaType: 'photo', selectionLimit: 1 });
      const asset = result.assets?.[0];

      if (!asset?.uri) {
        setUploading(false);
        return;
      }

      // Convertir en ArrayBuffer
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();

      const path = `${organization.id}/${Date.now()}-${asset.fileName ?? 'produit.jpg'}`;

      const { error } = await supabase.storage.from('produits').upload(path, arrayBuffer, {
        upsert: true,
        contentType: asset.type ?? 'image/jpeg',
      });

      if (error) {
        Alert.alert('Upload image', error.message);
        setUploading(false);
        return;
      }

      const { data } = supabase.storage.from('produits').getPublicUrl(path);
      setPhotoUrl(data.publicUrl);
    } catch (error: any) {
      Alert.alert('Upload image', error.message || 'Network request failed');
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    const ok = await saveProduit(
      {
        ...values,
        id: produit?.id,
        fournisseur_id: fournisseurId,
        photo_url: photoUrl,
        prix_unitaire: Number(values.prix_unitaire) || 0,
        quantite_stock: Number(values.quantite_stock) || 0,
        seuil_minimum: Number(values.seuil_minimum) || 0,
      },
      false,
    );
    setSaving(false);
    if (ok) {
      navigation.goBack();
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text variant="headlineSmall" style={styles.title}>
          {produit ? t('edit_product') : t('new_product')}
        </Text>

        {/* Image Upload */}
        <TouchableOpacity style={styles.imageContainer} onPress={handleUploadImage}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.placeholderContainer}>
              <Icon name="camera-plus" size={40} color="#9CA3AF" />
              <Text style={styles.placeholderText}>اضغط لإضافة صورة</Text>
            </View>
          )}
          {uploading && (
            <View style={styles.uploadingOverlay}>
              <ActivityIndicator size="large" color="#1E40AF" />
              <Text style={styles.uploadingText}>جاري الرفع...</Text>
            </View>
          )}
        </TouchableOpacity>

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
              mode="contained"
              onPress={handleSubmit(onSubmit)}
              loading={saving}
              disabled={saving || uploading}
              style={[styles.saveButton, { backgroundColor: '#1E40AF' }]}>
              {produit ? t('save_changes') : t('add_product')}
            </Button>
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 16,
    gap: 12,
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  imageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    overflow: 'hidden',
    backgroundColor: '#F9FAFB',
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    marginTop: 8,
    color: '#9CA3AF',
    fontSize: 14,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingText: {
    color: '#FFFFFF',
    marginTop: 8,
    fontSize: 14,
  },
  saveButton: {
    marginTop: 8,
    borderRadius: 12,
  },
});

export default ProductFormScreen;