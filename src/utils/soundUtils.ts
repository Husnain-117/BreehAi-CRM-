/**
 * Attempts to play a preloaded sound effect.
 * Make sure audio elements with IDs matching the 'type' are in your HTML (e.g., in index.html).
 * Example HTML:
 * <audio id="successSound" src="/sounds/success.mp3" preload="auto"></audio>
 * <audio id="errorSound" src="/sounds/error.mp3" preload="auto"></audio>
 * <audio id="infoSound" src="/sounds/info.mp3" preload="auto"></audio>
 *
 * @param type The type of sound to play ('success', 'error', 'info').
 */
export const playNotificationSound = (type: 'success' | 'error' | 'info'): void => {
  let soundId = '';
  switch (type) {
    case 'success':
      soundId = 'successSound';
      break;
    case 'error':
      soundId = 'errorSound';
      break;
    case 'info':
      soundId = 'infoSound';
      break;
    default:
      console.warn('Unknown sound type:', type);
      return;
  }

  const audioElement = document.getElementById(soundId) as HTMLAudioElement | null;
  
  if (audioElement) {
    // Resetting currentTime ensures the sound plays from the beginning if rapidly triggered
    audioElement.currentTime = 0;
    audioElement.play().catch(error => {
      // Autoplay was prevented, common in browsers until user interaction.
      // You might want to inform the user they need to interact for sounds to play.
      console.warn(`Sound play failed for ${soundId}:`, error);
    });
  } else {
    console.warn(`Audio element with ID '${soundId}' not found.`);
  }
}; 