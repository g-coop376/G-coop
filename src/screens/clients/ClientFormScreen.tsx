import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import ScreenContainer from '../../components/common/ScreenContainer';
import FormTextField from '../../components/common/FormTextField';
import { useClients } from '../../hooks/useClients';
import type { Client } from '../../types';

const schema = z.object({
  nom: z.string().min(2),
  telephone: z.string().min(6),
  adresse: z.string().min(2),
  email: z.string().email(),
});

type FormValues = z.infer<typeof schema>;

function ClientFormScreen({
  route,
  navigation,
}: {
  route?: { params?: { client?: Client } };
  navigation: { goBack: () => void };
}) {
  const { t } = useTranslation();
  const client = route?.params?.client;
  const { saveClient } = useClients();
  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nom: client?.nom ?? '',
      telephone: client?.telephone ?? '',
      adresse: client?.adresse ?? '',
      email: client?.email ?? '',
    },
  });

  return (
    <ScreenContainer title={client ? t('edit_client') : t('new_client')}>
      <Card>
        <Card.Content style={{ gap: 12 }}>
          <FormTextField control={control as never} name="nom" label={t('name')} />
          <FormTextField control={control as never} name="telephone" label={t('phone')} keyboardType="phone-pad" />
          <FormTextField control={control as never} name="adresse" label={t('address')} multiline />
          <FormTextField control={control as never} name="email" label={t('email')} keyboardType="email-address" />
          <Button
            mode="contained"
            onPress={handleSubmit(async values => {
              const ok = await saveClient({ ...values, id: client?.id });
              if (ok) {
                navigation.goBack();
              }
            })}>
            {t('save')}
          </Button>
        </Card.Content>
      </Card>
    </ScreenContainer>
  );
}

export default ClientFormScreen;
