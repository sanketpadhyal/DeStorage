/**
 * Safe Image Imports pointing to src/assets/
 */
import heroIllustration from '../src/assets/hero_illustration.png';
import featuresIllustration from '../src/assets/features_illustration.png';
import mascotCharacter from '../src/assets/mascot_character.png';
import logo from '../src/assets/logo.png';

export const safeImages = {
  heroIllustration: heroIllustration || '/assets/hero_illustration.png',
  featuresIllustration: featuresIllustration || '/assets/features_illustration.png',
  mascotCharacter: mascotCharacter || '/assets/mascot_character.png',
  logo: logo || '/assets/logo.png',
};
