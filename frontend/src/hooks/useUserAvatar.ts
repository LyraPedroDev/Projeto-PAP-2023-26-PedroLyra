import { useState, useEffect } from 'react';

export function useUserAvatar(userId?: number | string | null, fallback = '🌱') {
  const [avatar, setAvatar] = useState<string>(
    userId ? localStorage.getItem(`user_avatar_${userId}`) || fallback : fallback
  );

  useEffect(() => {
    if (!userId) return;

    // Reset local state if userId changes
    setAvatar(localStorage.getItem(`user_avatar_${userId}`) || fallback);

    const handleStorageChange = () => {
      setAvatar(localStorage.getItem(`user_avatar_${userId}`) || fallback);
    };
    
    const handleAvatarUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && String(customEvent.detail.userId) === String(userId)) {
        setAvatar(customEvent.detail.avatar);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('user-avatar-updated', handleAvatarUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('user-avatar-updated', handleAvatarUpdate);
    };
  }, [userId, fallback]);

  return avatar;
}
