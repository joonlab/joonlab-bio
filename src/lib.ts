import ko from './content/ko.json';
import en from './content/en.json';
import ja from './content/ja.json';
export const CONTENT = { ko, en, ja } as const;
export type Lang = keyof typeof CONTENT;
export const LANGS: Lang[] = ['ko', 'en', 'ja'];
export const UPDATED = '2026-11-23';
export const SITE = 'https://bio.joonlab98.com';
export const pathFor = (l: Lang) => (l === 'ko' ? '/' : `/${l}/`);
