import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import ScreenContainer from '../../components/common/ScreenContainer';
import FormTextField from '../../components/common/FormTextField';
import { supabase } from '../../api/supabase';
import { useAuthStore } from '../../store/authStore';
import type { Fournisseur } from '../../types';

const schema = z.object({
  nom: z.string().min(2),
  telephone: z.string().min(6),
  adresse: z.string().min(2),
  email: z.string().email(),
});

type FormValues = z.infer<typeof schema>;

function SupplierFormScreen({
  route,
  navigation,
}: {
  route?: { params?: { fournisseur?: Fournisseur } };
  navigation: { goBack: () => void };
}) {
  const { t } = useTranslation();
  const organization = useAuthStore(state => state.organization);
  const fournisseur = route?.params?.fournisseur;
  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nom: fournisseur?.nom ?? '',
      telephone: fournisseur?.telephone ?? '',
      adresse: fournisseur?.adresse ?? '',
      email: fournisseur?.email ?? '',
    },
  });

  return (
    <ScreenContainer title={fournisseur ? t('edit_supplier') : t('new_supplier')}>
      <Card>
        <Card.Content style={{ gap: 12 }}>
          <FormTextField control={control as never} name="nom" label={t('name')} />
          <FormTextField control={control as never} name="telephone" label={t('phone')} keyboardType="phone-pad" />
          <FormTextField control={control as never} name="adresse" label={t('address')} multiline />
          <FormTextField control={control as never} name="email" label={t('email')} keyboardType="email-address" />
          <Button
            mode="contained"
            onPress={handleSubmit(async values => {
              await supabase.from('fournisseurs').upsert({
                id: fournisseur?.id,
                organization_id: organization?.id,
                ...values,
              });
              navigation.goBack();
            })}>
            {t('save')}
          </Button>
        </Card.Content>
      </Card>
    </ScreenContainer>
  );
}

export default SupplierFormScreen;
