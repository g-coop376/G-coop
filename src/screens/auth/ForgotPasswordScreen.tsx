import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert } from 'react-native';
import { Button, Card } from 'react-native-paper';
import FormTextField from '../../components/common/FormTextField';
import ScreenContainer from '../../components/common/ScreenContainer';
import { useAuth } from '../../hooks/useAuth';

const schema = z.object({
  email: z.string().email(),
});

type FormValues = z.infer<typeof schema>;

function ForgotPasswordScreen() {
  const { sendReset } = useAuth();
  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  return (
    <ScreenContainer title="Réinitialiser" scrollable={false}>
      <Card>
        <Card.Content style={{ gap: 12 }}>
          <FormTextField control={control as never} name="email" label="Email" keyboardType="email-address" />
          <Button
            mode="contained"
            onPress={handleSubmit(async values => {
              const ok = await sendReset(values.email);
              if (ok) {
                Alert.alert('Email envoyé', 'Vérifiez votre boîte email.');
              }
            })}>
            Envoyer le lien
          </Button>
        </Card.Content>
      </Card>
    </ScreenContainer>
  );
}

export default ForgotPasswordScreen;
