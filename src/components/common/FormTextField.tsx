import React from 'react';
import { StyleSheet, View, type TextInputProps } from 'react-native';
import { Controller, type Control, type FieldValues } from 'react-hook-form';
import { HelperText, TextInput, useTheme } from 'react-native-paper';

interface FormTextFieldProps {
  control: Control<FieldValues>;
  name: string;
  label: string;
  icon?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: TextInputProps['autoComplete'];
  textContentType?: TextInputProps['textContentType'];
}

function FormTextField({
  control,
  name,
  label,
  icon,
  secureTextEntry,
  keyboardType,
  multiline,
  autoCapitalize = 'sentences',
  autoComplete,
  textContentType,
}: FormTextFieldProps) {
  const theme = useTheme();

  return (
    <Controller
      control={control}
      name={name as never}
      render={({ field: { onBlur, onChange, value }, fieldState: { error } }) => (
        <View style={styles.wrapper}>
          <TextInput
            mode="outlined"
            label={label}
            value={value ? String(value) : ''}
            onBlur={onBlur}
            onChangeText={onChange}
            secureTextEntry={secureTextEntry}
            keyboardType={keyboardType}
            multiline={multiline}
            error={Boolean(error)}
            autoCapitalize={autoCapitalize}
            autoComplete={autoComplete}
            textContentType={textContentType}
            style={[styles.input, multiline && styles.multilineInput]}
            contentStyle={styles.inputContent}
            outlineStyle={[styles.outline, { borderColor: theme.colors.outlineVariant }]}
            activeOutlineColor={theme.colors.primary}
            left={icon ? <TextInput.Icon icon={icon} /> : undefined}
          />
          <HelperText type="error" visible={Boolean(error)}>
            {error?.message ?? ' '}
          </HelperText>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 4,
  },
  input: {
    backgroundColor: 'transparent',
  },
  multilineInput: {
    minHeight: 104,
  },
  inputContent: {
    paddingVertical: 8,
  },
  outline: {
    borderRadius: 18,
  },
});

export default FormTextField;
