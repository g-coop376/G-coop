import React from 'react';
import { Alert } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, SegmentedButtons, Text } from 'react-native-paper';
import FormTextField from '../../components/common/FormTextField';
import ScreenContainer from '../../components/common/ScreenContainer';
import { supabase } from '../../api/supabase';
import { useAuth } from '../../hooks/useAuth';

const schema = z.object({
  nom: z.string().min(2),
  adresse: z.string().min(2),
  telephone: z.string().min(6),
  email: z.string().email(),
  ice: z.string().min(2),
  rc: z.string().min(2),
  tva: z.string(),
});

type FormValues = z.infer<typeof schema>;

async function uploadLogo(organizationId: string) {
  const result = await launchImageLibrary({ mediaType: 'photo', selectionLimit: 1 });
  const asset = result.assets?.[0];
  if (!asset?.uri) {
    return null;
  }

  const blob = await (await fetch(asset.uri)).blob();
  const path = `${organizationId}/${Date.now()}-${asset.fileName ?? 'logo.jpg'}`;
  const { error } = await supabase.storage.from('logos').upload(path, blob, {
    contentType: asset.type ?? 'image/jpeg',
    upsert: true,
  });
  if (error) {
    Alert.alert('Logo', error.message);
    return null;
  }
  return supabase.storage.from('logos').getPublicUrl(path).data.publicUrl;
}

function OnboardingScreen() {
  const { profile, completeOnboarding } = useAuth();
  const [logoUrl, setLogoUrl] = React.useState<string | null>(null);
  const [orgType, setOrgType] = React.useState<'cooperative' | 'societe'>('cooperative');
  const { control, handleSubmit, setValue, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nom: '',
      adresse: '',
      telephone: '',
      email: '',
      ice: '',
      rc: '',
      tva: '0',
    },
  });

  React.useEffect(() => {
    if (orgType === 'cooperative') {
      setValue('tva', '0');
    }
  }, [orgType, setValue]);

  const tva = watch('tva');

  return (
    <ScreenContainer title="Onboarding">
      <Card>
        <Card.Content style={{ gap: 12 }}>
          <Text variant="titleMedium">Informations de l'organisation</Text>
          <SegmentedButtons
            value={orgType}
            onValueChange={value => setOrgType(value as 'cooperative' | 'societe')}
            buttons={[
              { label: 'Coopérative', value: 'cooperative' },
              { label: 'Société', value: 'societe' },
            ]}
          />
          <FormTextField control={control as never} name="nom" label="Nom" />
          <FormTextField control={control as never} name="adresse" label="Adresse" multiline />
          <FormTextField control={control as never} name="telephone" label="Téléphone" keyboardType="phone-pad" />
          <FormTextField control={control as never} name="email" label="Email" keyboardType="email-address" />
          <FormTextField control={control as never} name="ice" label="ICE" />
          <FormTextField control={control as never} name="rc" label="RC" />
          {orgType === 'societe' ? (
            <FormTextField control={control as never} name="tva" label="TVA (%)" keyboardType="numeric" />
          ) : (
            <Text>TVA appliquée: {tva}%</Text>
          )}
          <Button
            mode="outlined"
            onPress={async () => {
              const uploaded = await uploadLogo(profile?.id ?? 'pending');
              if (uploaded) {
                setLogoUrl(uploaded);
              }
            }}>
            {logoUrl ? 'Logo sélectionné' : 'Ajouter le logo'}
          </Button>
          <Button
            mode="contained"
            onPress={handleSubmit(async values => {
              const ok = await completeOnboarding({
                ...values,
                logo_url: logoUrl,
                tva: orgType === 'cooperative' ? 0 : Number(values.tva) || 0,
              });
              if (ok) {
                Alert.alert('Organisation créée');
              }
            })}>
            Finaliser
          </Button>
        </Card.Content>
      </Card>
    </ScreenContainer>
  );
}

export default OnboardingScreen;
