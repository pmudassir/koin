import { TextStyle } from 'react-native';

export const Typography: Record<string, TextStyle> = {
  h1: { fontSize: 40, fontWeight: '700', letterSpacing: -0.5 },
  h2: { fontSize: 28, fontWeight: '700', letterSpacing: -0.3 },
  h3: { fontSize: 20, fontWeight: '700', letterSpacing: -0.2 },
  h4: { fontSize: 18, fontWeight: '600', letterSpacing: -0.1 },
  body: { fontSize: 16, fontWeight: '400' },
  bodyBold: { fontSize: 16, fontWeight: '600' },
  caption: { fontSize: 14, fontWeight: '500' },
  small: { fontSize: 12, fontWeight: '400' },
  smallBold: { fontSize: 12, fontWeight: '600' },
  tiny: { fontSize: 10, fontWeight: '500', letterSpacing: 0.5, textTransform: 'uppercase' },
  amount: { fontSize: 56, fontWeight: '700', letterSpacing: -1 },
  amountLarge: { fontSize: 40, fontWeight: '700', letterSpacing: -0.5 },
};
