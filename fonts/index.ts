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

export const timesNewRoman = localFont({
  src: './sources/times.ttf',
  variable: '--font-times-new-roman',
  display: 'swap',
  weight: '400',
});

/* ───────────── Super Sliced ───────────── */

export const superSliced = localFont({
  src: [
    { path: './sources/super-sliced-font/SuperSliced-OG156.ttf', weight: '400', style: 'normal' },
    { path: './sources/super-sliced-font/SuperSlicedItalic-aYoJK.ttf', weight: '400', style: 'italic' },
  ],
  variable: '--font-super-sliced',
  display: 'swap',
});

/* ───────────── Supercharge (slanted) ───────────── */

export const supercharge = localFont({
  src: [
    { path: './sources/supercharge-font/Supercharge-JRgPo.otf', weight: '400', style: 'normal' },
    { path: './sources/supercharge-font/SuperchargeItalic-ywOWd.otf', weight: '400', style: 'italic' },
  ],
  variable: '--font-supercharge',
  display: 'swap',
});

export const supercharge3D = localFont({
  src: './sources/supercharge-font/Supercharge3D-GO79P.otf',
  variable: '--font-supercharge-3d',
  display: 'swap',
  weight: '400',
});

export const superchargeCondensed = localFont({
  src: './sources/supercharge-font/SuperchargeCondensed-jE5KO.otf',
  variable: '--font-supercharge-condensed',
  display: 'swap',
  weight: '400',
});

export const superchargeExpanded = localFont({
  src: './sources/supercharge-font/SuperchargeExpanded-z83aw.otf',
  variable: '--font-supercharge-expanded',
  display: 'swap',
  weight: '400',
});

export const superchargeGradient = localFont({
  src: './sources/supercharge-font/SuperchargeGradient-51oqZ.otf',
  variable: '--font-supercharge-gradient',
  display: 'swap',
  weight: '400',
});

export const superchargeHalftone = localFont({
  src: './sources/supercharge-font/SuperchargeHalftone-6Y0Vq.otf',
  variable: '--font-supercharge-halftone',
  display: 'swap',
  weight: '400',
});

export const superchargeLaser = localFont({
  src: './sources/supercharge-font/SuperchargeLaser-9YZjj.otf',
  variable: '--font-supercharge-laser',
  display: 'swap',
  weight: '400',
});

/* ───────────── Supercharge (straight) ───────────── */

export const superchargeSemiStraight = localFont({
  src: './sources/supercharge-font/SuperchargeSemiStraight-lgnvD.otf',
  variable: '--font-supercharge-semi-straight',
  display: 'swap',
  weight: '400',
});

export const superchargeStraight3D = localFont({
  src: './sources/supercharge-font/SuperchargeStraight3D-1Gwx0.otf',
  variable: '--font-supercharge-straight-3d',
  display: 'swap',
  weight: '400',
});

export const superchargeStraightCondensed = localFont({
  src: './sources/supercharge-font/SuperchargeStraightCondensed-RpVWV.otf',
  variable: '--font-supercharge-straight-condensed',
  display: 'swap',
  weight: '400',
});

export const superchargeStraightExpanded = localFont({
  src: './sources/supercharge-font/SuperchargeStraightExpanded-BWRxB.otf',
  variable: '--font-supercharge-straight-expanded',
  display: 'swap',
  weight: '400',
});

export const superchargeStraightGradient = localFont({
  src: './sources/supercharge-font/SuperchargeStraightGradient-8MEoM.otf',
  variable: '--font-supercharge-straight-gradient',
  display: 'swap',
  weight: '400',
});

export const superchargeStraightHalftone = localFont({
  src: './sources/supercharge-font/SuperchargeStraightHalftone-YzY7q.otf',
  variable: '--font-supercharge-straight-halftone',
  display: 'swap',
  weight: '400',
});

export const superchargeStraightLaser = localFont({
  src: './sources/supercharge-font/SuperchargeStraightLaser-rg7jx.otf',
  variable: '--font-supercharge-straight-laser',
  display: 'swap',
  weight: '400',
});

/* ───────────── Varesco ───────────── */

export const varesco = localFont({
  src: './sources/varesco-font/VarescodemoRegular-j9KZ7.ttf',
  variable: '--font-varesco',
  display: 'swap',
  weight: '400',
});