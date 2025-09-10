"use client";

import { useKontext } from '@kontext.dev/kontext-sdk/react';
import { useEffect } from 'react';

export function useKontextCookie() {
  const { userId, isConnected } = useKontext();

  useEffect(() => {
    if (userId && isConnected) {
      // Set cookie with userId for server-side access
      // Use Secure flag if on HTTPS, and ensure proper SameSite setting
      const isSecure = window.location.protocol === 'https:';
      const cookieString = `kontext_user_id=${userId}; path=/; max-age=86400; SameSite=Lax${isSecure ? '; Secure' : ''}`;
      document.cookie = cookieString;
    } else {
      // Clear cookie if not connected
      document.cookie = 'kontext_user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC';
    }
  }, [userId, isConnected]);

  return { userId, isConnected };
}
