import React from 'react';
import { StyleSheet, View } from 'react-native';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button, Surface, Text, useTheme } from 'react-native-paper';
import ScreenContainer from '../../components/common/ScreenContainer';
import BrandMark from '../../components/common/BrandMark';
import FormTextField from '../../components/common/FormTextField';
import { useAuth } from '../../hooks/useAuth';

const schema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, '6 caractères minimum'),
});

type FormValues = z.infer<typeof schema>;

function LoginScreen({ navigation }: { navigation: { navigate: (screen: string) => void } }) {
  const theme = useTheme();
  const { signIn, loading } = useAuth();
  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  return (
    <ScreenContainer scrollable={false} backgroundColor={theme.colors.background}>
      <View style={styles.screen}>
        <View style={[styles.backdrop, styles.backdropPrimary, { backgroundColor: `${theme.colors.primary}14` }]} />
        <View style={[styles.backdrop, styles.backdropSecondary, { backgroundColor: `${theme.colors.secondary}22` }]} />

        <View style={styles.content}>
          <View style={styles.header}>
            <BrandMark compact />
            <View style={styles.headerCopy}>
              <Text variant="headlineMedium" style={{ color: theme.colors.onSurface }}>
                Welcome back 👋
              </Text>
              <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
                Sign in to manage products, stock, and documents with better focus.
              </Text>
            </View>
          </View>

          <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={3}>
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>
                  Login
                </Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  Use your cooperative account credentials.
                </Text>
              </View>

              <FormTextField
                control={control as never}
                name="email"
                label="Email"
                icon="email-outline"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
              />
              <FormTextField
                control={control as never}
                name="password"
                label="Password"
                icon="lock-outline"
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password"
                textContentType="password"
              />

              <Button
                mode="contained"
                contentStyle={styles.primaryButton}
                onPress={handleSubmit(values => signIn(values.email, values.password))}
                loading={loading}>
                Login
              </Button>

              <Button onPress={() => navigation.navigate('ForgotPassword')}>Forgot password?</Button>
            </View>
          </Surface>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  content: {
    gap: 28,
    justifyContent: 'center',
  },
  backdrop: {
    position: 'absolute',
    borderRadius: 999,
  },
  backdropPrimary: {
    width: 240,
    height: 240,
    top: -20,
    right: -70,
  },
  backdropSecondary: {
    width: 180,
    height: 180,
    bottom: 40,
    left: -50,
  },
  header: {
    gap: 18,
  },
  headerCopy: {
    gap: 8,
  },
  card: {
    borderRadius: 28,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.12,
    shadowRadius: 22,
  },
  cardContent: {
    padding: 24,
    gap: 8,
  },
  cardHeader: {
    gap: 6,
    marginBottom: 8,
  },
  primaryButton: {
    height: 56,
  },
});

export default LoginScreen;
