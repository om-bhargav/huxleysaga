import localFont from 'next/font/local';
export const nbArchitekt = localFont({
  src: [
    { path: './sources/nb_architekt_light-webfont.woff2', weight: '300', style: 'normal' },
    { path: './sources/nb_architekt_regular-webfont.woff2', weight: '400', style: 'normal' },
    { path: './sources/nb_architekt_bold-webfont.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-nb-architekt',
  display: 'swap',
});

export const candyCane = localFont({
  src: [
    { path: './sources/candy_cane.ttf', weight: '300', style: 'normal' },
    { path: './sources/candy_cane.ttf', weight: '400', style: 'normal' },
    { path: './sources/candy_cane.ttf', weight: '700', style: 'normal' },
  ],
  variable: '--font-candy-cane',
    display: 'swap',
  adjustFontFallback: false,
  declarations: [
    // space, 0–9, A–Z, a–z
    { prop: 'unicode-range', value: 'U+0020, U+0030-0039, U+0041-005A, U+0061-007A' },
  ],
});

export const rooster = localFont({
  src: [
    { path: './sources/rooster.ttf', weight: '300', style: 'normal' },
    { path: './sources/rooster.ttf', weight: '400', style: 'normal' },
    { path: './sources/rooster.ttf', weight: '700', style: 'normal' },
  ],
  variable: '--font-rooster',
  display: 'swap',
  fallback: ['sans-serif'],
  adjustFontFallback: false,
  declarations: [
    // space, A–Z, a–z (digits fall back to sans-serif)
    { prop: 'unicode-range', value: 'U+0020, U+0041-005A, U+0061-007A' },
  ],
});
export const timesNewRoman = localFont({
  src: './sources/times.ttf',
  variable: '--font-times-new-roman',
  display: 'swap',
  weight: '400',
});