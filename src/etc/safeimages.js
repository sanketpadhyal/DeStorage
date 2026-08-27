/**
 * Safe Image Registry & Asset Manager for DeStorage
 * Centralizes all application images, logos, AI illustrations, and fallback handling.
 */

import logoImg from '../assets/logo.png';
import heroIllustrationImg from '../assets/hero_illustration.png';
import featuresIllustrationImg from '../assets/features_illustration.png';
import mascotCharacterImg from '../assets/mascot_character.png';

export const safeImages = {
  logo: logoImg || '/assets/logo.png',
  heroIllustration: heroIllustrationImg || '/assets/hero_illustration.png',
  featuresIllustration: featuresIllustrationImg || '/assets/features_illustration.png',
  mascotCharacter: mascotCharacterImg || '/assets/mascot_character.png',
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
