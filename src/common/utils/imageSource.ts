import { ImageSourcePropType } from 'react-native';

const NGROK_IMAGE_HEADERS = {
  'ngrok-skip-browser-warning': '1',
};

export const buildRemoteImageSource = (
  uri?: string | null
): ImageSourcePropType | undefined => {
  const trimmed = String(uri || '').trim();
  if (!trimmed) {
    return undefined;
  }

  if (/^https?:\/\/[^/]*ngrok/i.test(trimmed)) {
    return {
      uri: trimmed,
      headers: NGROK_IMAGE_HEADERS,
    } as any;
  }

  return { uri: trimmed } as any;
};
