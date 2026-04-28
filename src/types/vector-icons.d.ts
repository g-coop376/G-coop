declare module 'react-native-vector-icons/MaterialCommunityIcons' {
  import type { ComponentType } from 'react';

  interface IconProps {
    name: string;
    color?: string;
    size?: number;
  }

  const MaterialCommunityIcons: ComponentType<IconProps>;
  export default MaterialCommunityIcons;
}
