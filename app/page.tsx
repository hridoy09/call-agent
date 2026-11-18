import VoiceDesk from './voice-desk';

export default function Page() {
  return <VoiceDesk code={process.env.NEXT_PUBLIC_GUAVA_WEBRTC_CODE || 'grtc-C4lL313vMSat6r2ePSYnEY2AkyuxaBZpBLk02wZl'} />;
}
