import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert } from 'react-native';
import { Button, Card } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import FormTextField from '../../components/common/FormTextField';
import ScreenContainer from '../../components/common/ScreenContainer';
import { useAuth } from '../../hooks/useAuth';

const schema = z.object({
  email: z.string().email(),
});

type FormValues = z.infer<typeof schema>;

function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const { sendReset } = useAuth();
  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  return (
    <ScreenContainer title={t('forgot_password_title')} scrollable={false}>
      <Card>
        <Card.Content style={{ gap: 12 }}>
          <FormTextField control={control as never} name="email" label={t('email')} keyboardType="email-address" />
          <Button
            mode="contained"
            onPress={handleSubmit(async values => {
              const ok = await sendReset(values.email);
              if (ok) {
                Alert.alert(t('email_sent'), t('check_email'));
              }
            })}>
            {t('send_link')}
          </Button>
        </Card.Content>
      </Card>
    </ScreenContainer>
  );
}

export default ForgotPasswordScreen;
