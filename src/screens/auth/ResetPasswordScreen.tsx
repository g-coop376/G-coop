import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert } from 'react-native';
import { ActivityIndicator, Button, Card, Text } from 'react-native-paper';
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
  const { updatePassword, session, processingDeepLink, deepLinkError } = useAuth();
  const [submitting, setSubmitting] = React.useState(false);
  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  if (processingDeepLink) {
    return (
      <ScreenContainer title="Nouveau mot de passe" scrollable={false}>
        <Card>
          <Card.Content style={{ gap: 12, alignItems: 'center' }}>
            <ActivityIndicator />
            <Text>Validation du lien en cours...</Text>
          </Card.Content>
        </Card>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer title="Nouveau mot de passe" scrollable={false}>
      <Card>
        <Card.Content style={{ gap: 12 }}>
          {deepLinkError ? <Text style={{ color: '#b3261e' }}>{deepLinkError}</Text> : null}
          {!deepLinkError && !session ? (
            <Text>Ouvrez ce lien depuis votre email pour definir un nouveau mot de passe.</Text>
          ) : null}
          <FormTextField control={control as never} name="password" label="Mot de passe" secureTextEntry />
          <FormTextField control={control as never} name="confirmPassword" label="Confirmer" secureTextEntry />
          <Button
            mode="contained"
            disabled={!session || Boolean(deepLinkError) || submitting}
            loading={submitting}
            onPress={handleSubmit(async values => {
              setSubmitting(true);
              const ok = await updatePassword(values.password);
              setSubmitting(false);
              if (ok) {
                Alert.alert('Mot de passe modifié');
              }
            })}>
            Mettre à jour
          </Button>
        </Card.Content>
      </Card>
    </ScreenContainer>
  );
}

export default ResetPasswordScreen;
