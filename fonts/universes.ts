/**
 * One display face per universe, as named in specification section 6.
 * Body copy stays on the site's own faces; only headlines change per world.
 *
 * next/font resolves these at build time, so every option has to be written out
 * literally here — shared variables or spreads will not compile.
 */
import { Anton, Bebas_Neue, Cinzel, EB_Garamond, Rajdhani, Rye } from 'next/font/google';

export const rye = Rye({ subsets: ['latin'], display: 'swap', weight: '400', variable: '--font-u-rye' });

export const bebas = Bebas_Neue({
  subsets: ['latin'],
  display: 'swap',
  weight: '400',
  variable: '--font-u-bebas',
});

export const cinzel = Cinzel({ subsets: ['latin'], display: 'swap', variable: '--font-u-cinzel' });

export const rajdhani = Rajdhani({
  subsets: ['latin'],
  display: 'swap',
  weight: ['500', '700'],
  variable: '--font-u-rajdhani',
});

export const anton = Anton({ subsets: ['latin'], display: 'swap', weight: '400', variable: '--font-u-anton' });

/* Stands in for Cormorant Garamond on the light universe */
export const garamond = EB_Garamond({ subsets: ['latin'], display: 'swap', variable: '--font-u-garamond' });

export const universeFontVariables = [rye, bebas, cinzel, rajdhani, anton, garamond]
  .map((f) => f.variable)
  .join(' ');

/** Maps a universe's `display` key to the CSS variable its headlines use. */
export const displayFont: Record<string, string> = {
  rye: 'var(--font-u-rye)',
  bebas: 'var(--font-u-bebas)',
  cinzel: 'var(--font-u-cinzel)',
  rajdhani: 'var(--font-u-rajdhani)',
  anton: 'var(--font-u-anton)',
  garamond: 'var(--font-u-garamond)',
};
