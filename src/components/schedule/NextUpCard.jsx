// src/components/schedule/NextUpCard.jsx
// Step 5E-2b router: branches to density-specific variant.
// Each variant lives in its own file to respect 150-line cap.
import NextUpCardMin from './NextUpCardMin';
import NextUpCardMed from './NextUpCardMed';
import NextUpCardMax from './NextUpCardMax';

export default function NextUpCard(props) {
  const { density = 'medium' } = props;
  if (density === 'minimal') return <NextUpCardMin {...props} />;
  if (density === 'maximum') return <NextUpCardMax {...props} />;
  return <NextUpCardMed {...props} />;
}
