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