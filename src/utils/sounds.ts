// Sound effects utility
const successSound = new Audio('/success.mp3');

export const playSuccessSound = () => {
  successSound.play().catch(() => {
    // Ignore autoplay errors
  });
}; 