// Simple in-memory store for userId
// In production, you might want to use cookies or session storage

let currentUserId: string | null = null;

export const kontextStore = {
  setUserId: (userId: string | null) => {
    currentUserId = userId;
  },
  getUserId: () => currentUserId,
};