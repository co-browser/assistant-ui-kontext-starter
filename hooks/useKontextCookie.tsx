"use client";

import { useKontext } from '@kontext.dev/kontext-sdk/react';
import { useEffect } from 'react';

export function useKontextCookie() {
  const { userId, isConnected } = useKontext();

  useEffect(() => {
    console.log('[useKontextCookie] userId:', userId, 'isConnected:', isConnected);
    
    if (userId && isConnected) {
      // Set cookie with userId for server-side access
      // Use Secure flag if on HTTPS, and ensure proper SameSite setting
      const isSecure = window.location.protocol === 'https:';
      const cookieString = `kontext_user_id=${userId}; path=/; max-age=86400; SameSite=Lax${isSecure ? '; Secure' : ''}`;
      document.cookie = cookieString;
      console.log('[useKontextCookie] Cookie set:', cookieString);
      
      // Verify cookie was set
      const cookies = document.cookie.split(';');
      const kontextCookie = cookies.find(c => c.trim().startsWith('kontext_user_id='));
      console.log('[useKontextCookie] Cookie verification:', kontextCookie);
    } else {
      // Clear cookie if not connected
      document.cookie = 'kontext_user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC';
      console.log('[useKontextCookie] Cookie cleared');
    }
  }, [userId, isConnected]);

  return { userId, isConnected };
}