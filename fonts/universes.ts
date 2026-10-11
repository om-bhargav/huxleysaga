/**
 * One display face per world. Body copy stays on the site's own faces;
 * only headlines change per world.
 *
 *   Spy Files    (Agent Scarlett, The Silk Sting)  Stencil
 *   Wild West    (Venom Vixens)                    Go 2 Old Western
 *   Game World   (The Boundless Loop)              Astroz
 *   Fantasy Land (Chains of Fate)                  Morris Roman Black
 *   The Living Library (not in a world yet)        EB Garamond
 *
 * next/font resolves these at build time, so every option has to be written out
 * literally here — shared variables or spreads will not compile.
 *
 * Faces with a single weight list the same file at 400 and 700.
 * That stops the browser faking a bold when a heading asks for one.
 */
import localFont from 'next/font/local';
import { EB_Garamond } from 'next/font/google';

export const stencil = localFont({
  src: [
    { path: './sources/Stencil/Stencil.ttf', weight: '400', style: 'normal' },
    { path: './sources/Stencil/Stencil.ttf', weight: '700', style: 'normal' },
  ],
  variable: '--font-u-stencil',
  display: 'swap',
  adjustFontFallback: false,
});

/* Has real regular, bold and italic files, so each is mapped to its own weight/style */
export const western = localFont({
  src: [
    { path: './sources/go_2_old_western/Go2OldWestern-Regular.ttf', weight: '400', style: 'normal' },
    { path: './sources/go_2_old_western/Go2OldWestern-Bold.ttf', weight: '700', style: 'normal' },
    { path: './sources/go_2_old_western/Go2OldWestern-Italic.ttf', weight: '400', style: 'italic' },
  ],
  variable: '--font-u-western',
  display: 'swap',
  adjustFontFallback: false,
});

export const astroz = localFont({
  src: [
    { path: './sources/astroz/Astroz Trial.ttf', weight: '400', style: 'normal' },
    { path: './sources/astroz/Astroz Trial.ttf', weight: '700', style: 'normal' },
  ],
  variable: '--font-u-astroz',
  display: 'swap',
  adjustFontFallback: false,
});

export const morris = localFont({
  src: [
    { path: './sources/morris-roman/MorrisRoman-Black.ttf', weight: '400', style: 'normal' },
    { path: './sources/morris-roman/MorrisRoman-Black.ttf', weight: '700', style: 'normal' },
  ],
  variable: '--font-u-morris',
  display: 'swap',
  adjustFontFallback: false,
});

/* Stands in for Cormorant Garamond on the light universe */
export const garamond = EB_Garamond({ subsets: ['latin'], display: 'swap', variable: '--font-u-garamond' });

export const universeFontVariables = [stencil, western, astroz, morris, garamond]
  .map((f) => f.variable)
  .join(' ');

/**
 * Maps a universe's `display` key to the font stack its headlines use.
 * Any character a display face can't draw falls back to the site's body face.
 */
export const displayFont: Record<string, string> = {
  stencil: 'var(--font-u-stencil), var(--font-nb-architekt), sans-serif',
  western: 'var(--font-u-western), var(--font-nb-architekt), sans-serif',
  astroz: 'var(--font-u-astroz), var(--font-nb-architekt), sans-serif',
  morris: 'var(--font-u-morris), var(--font-nb-architekt), serif',
  garamond: 'var(--font-u-garamond), serif',
};