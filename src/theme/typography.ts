import { Platform, Text, TextInput } from 'react-native';

export const systemFontFamily = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: undefined,
});

const baseTextStyle = systemFontFamily ? { fontFamily: systemFontFamily } : undefined;
const NativeText = Text as typeof Text & { defaultProps?: { style?: unknown } };

let configured = false;

export function configureGlobalTextRendering() {
  if (configured) {
    return;
  }

  configured = true;

  if (baseTextStyle) {
    NativeText.defaultProps = NativeText.defaultProps ?? {};
    NativeText.defaultProps.style = [baseTextStyle, NativeText.defaultProps.style].filter(Boolean);
  }
}
