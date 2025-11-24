import { Linking } from 'react-native';
import { router } from 'expo-router';
import { logger } from '@/utils/logger';

export type DeepLinkParams = {
  screen?: string;
  params?: Record<string, string>;
};

export const handleDeepLink = (url: string) => {
  try {
    const parsedUrl = new URL(url);
    const path = parsedUrl.pathname;
    const searchParams = Object.fromEntries(parsedUrl.searchParams);

    // Handle different deep link patterns
    if (path.startsWith('/route/')) {
      const routeId = path.split('/')[2];
      router.push(`/route/${routeId}` as any);
    } else if (path === '/search') {
      router.push({
        pathname: '/search' as any,
        params: searchParams,
      });
    } else if (path.startsWith('/place/')) {
      const placeId = path.split('/')[2];
      // Navigate to place details or set as destination
      router.push('/map' as any);
    } else {
      // Default to home
      router.push('/' as any);
    }
  } catch (error) {
    logger.error('Error handling deep link', error as Error, { url });
    router.push('/' as any);
  }
};

export const createShareableLink = (screen: string, params?: Record<string, string>) => {
  const baseUrl = 'https://kidmap.app'; // Replace with your actual domain
  const url = new URL(baseUrl);
  url.pathname = screen;

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  return url.toString();
};

export const shareRoute = async (routeId: string) => {
  const url = createShareableLink(`/route/${routeId}`);
  try {
    await Linking.openURL(`sms:?body=Check out this route: ${url}`);
  } catch (error) {
    logger.error('Error sharing route', error as Error, { routeId, url });
  }
};
