/**
 * Safe Image Registry & Asset Manager for DeStorage
 * Centralizes all application images, logos, AI illustrations, and fallback handling.
 */

import logoImg from '../assets/logo.png';
import heroIllustrationImg from '../assets/hero_illustration.jpg';
import featuresIllustrationImg from '../assets/features_illustration.jpg';
import mascotCharacterImg from '../assets/mascot_character.jpg';

export const safeImages = {
  logo: logoImg || '/assets/logo.png',
  heroIllustration: heroIllustrationImg || '/assets/hero_illustration.jpg',
  featuresIllustration: featuresIllustrationImg || '/assets/features_illustration.jpg',
  mascotCharacter: mascotCharacterImg || '/assets/mascot_character.jpg',
};

/**
 * Returns a guaranteed valid image source with fallback support.
 * @param {string} key
 * @param {string} [fallback]
 * @returns {string}
 */
export const getSafeImage = (key, fallback = '') => {
  return safeImages[key] || fallback || safeImages.logo;
};

export {
  logoImg as logo,
  heroIllustrationImg as heroIllustration,
  featuresIllustrationImg as featuresIllustration,
  mascotCharacterImg as mascotCharacter
};

export default safeImages;
