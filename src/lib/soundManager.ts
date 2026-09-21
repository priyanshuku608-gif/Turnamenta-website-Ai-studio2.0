// Sound and Audio Manager for BattlePro Arena

let bgmAudio: HTMLAudioElement | null = null;
let currentBgmUrl: string | null = null;
let isAudioUnlocked = false;

// Check if user previously muted sound
export const isSoundMuted = (): boolean => {
  try {
    return localStorage.getItem('battlepro_sound_muted') === 'true';
  } catch {
    return false;
  }
};

export const setSoundMuted = (muted: boolean): void => {
  try {
    localStorage.setItem('battlepro_sound_muted', muted ? 'true' : 'false');
    if (bgmAudio) {
      bgmAudio.muted = muted;
      if (!muted && bgmAudio.paused && bgmAudio.src) {
        bgmAudio.play().catch(() => {});
      }
    }
  } catch {
    // ignore
  }
};

// Play short UI click / tap sound effect
export const playClickSound = (url?: string): void => {
  if (!url || !url.trim()) return;
  if (isSoundMuted()) return;

  try {
    const clickAudio = new Audio(url.trim());
    clickAudio.volume = 0.6;
    const playPromise = clickAudio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay policy or invalid audio URL handled silently
      });
    }
  } catch (err) {
    // Fail silently
  }
};

// Synchronize and manage background music
export const updateBackgroundMusic = (url?: string): void => {
  const trimmedUrl = url?.trim() || '';

  if (!trimmedUrl) {
    if (bgmAudio) {
      bgmAudio.pause();
      bgmAudio.src = '';
      bgmAudio = null;
      currentBgmUrl = null;
    }
    return;
  }

  // If URL changed or audio instance doesn't exist
  if (!bgmAudio || currentBgmUrl !== trimmedUrl) {
    if (bgmAudio) {
      bgmAudio.pause();
      bgmAudio.src = '';
    }

    try {
      bgmAudio = new Audio(trimmedUrl);
      bgmAudio.loop = true;
      bgmAudio.volume = 0.35;
      bgmAudio.muted = isSoundMuted();
      currentBgmUrl = trimmedUrl;

      const attemptPlay = () => {
        if (!bgmAudio || isSoundMuted()) return;
        const playPromise = bgmAudio.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              isAudioUnlocked = true;
            })
            .catch(() => {
              // Browser autoplay policy blocked - unlock on first user gesture
              if (!isAudioUnlocked) {
                const unlockHandler = () => {
                  if (bgmAudio && !isSoundMuted()) {
                    bgmAudio.play().catch(() => {});
                  }
                  isAudioUnlocked = true;
                  window.removeEventListener('click', unlockHandler);
                  window.removeEventListener('touchstart', unlockHandler);
                };
                window.addEventListener('click', unlockHandler, { once: true });
                window.addEventListener('touchstart', unlockHandler, { once: true });
              }
            });
        }
      };

      attemptPlay();
    } catch (e) {
      console.warn('Could not initialize background music audio:', e);
    }
  } else if (bgmAudio) {
    // Same URL, ensure muted state matches and it's playing if unmuted
    bgmAudio.muted = isSoundMuted();
    if (!bgmAudio.muted && bgmAudio.paused) {
      bgmAudio.play().catch(() => {});
    }
  }
};
