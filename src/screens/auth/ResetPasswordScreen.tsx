import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert } from 'react-native';
import { ActivityIndicator, Button, Card, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import FormTextField from '../../components/common/FormTextField';
import ScreenContainer from '../../components/common/ScreenContainer';
import { useAuth } from '../../hooks/useAuth';

const schema = z.object({
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
}).refine(values => values.password === values.confirmPassword, {
  message: 'Les mots de passe doivent correspondre',
  path: ['confirmPassword'],
});

type FormValues = z.infer<typeof schema>;

function ResetPasswordScreen() {
  const { t } = useTranslation();
  const { updatePassword, session, processingDeepLink, deepLinkError } = useAuth();
  const [submitting, setSubmitting] = React.useState(false);
  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  if (processingDeepLink) {
    return (
      <ScreenContainer title={t('new_password_title')} scrollable={false}>
        <Card>
          <Card.Content style={{ gap: 12, alignItems: 'center' }}>
            <ActivityIndicator />
            <Text>{t('validating_link')}</Text>
          </Card.Content>
        </Card>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer title={t('new_password_title')} scrollable={false}>
      <Card>
        <Card.Content style={{ gap: 12 }}>
          {deepLinkError ? <Text style={{ color: '#b3261e' }}>{deepLinkError}</Text> : null}
          {!deepLinkError && !session ? (
            <Text>{t('open_link_from_email')}</Text>
          ) : null}
          <FormTextField control={control as never} name="password" label={t('password_label')} secureTextEntry />
          <FormTextField control={control as never} name="confirmPassword" label={t('confirm_password')} secureTextEntry />
          <Button
            mode="contained"
            disabled={!session || Boolean(deepLinkError) || submitting}
            loading={submitting}
            onPress={handleSubmit(async values => {
              setSubmitting(true);
              const ok = await updatePassword(values.password);
              setSubmitting(false);
              if (ok) {
                Alert.alert(t('password_updated'));
              }
            })}>
            {t('update')}
          </Button>
        </Card.Content>
      </Card>
    </ScreenContainer>
  );
}

export default ResetPasswordScreen;
