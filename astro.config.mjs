import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import { readdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// public/photos 에 남겨 둔 «*.removed» 원본(개인정보가 보이는 사진)은 빌드 결과에 실리지 않게 한다.
// public 원본 파일은 건드리지 않고, 생성된 dist 안의 사본만 뺀다.
const dropRemoved = {
  name: 'drop-removed-photos',
  hooks: {
    'astro:build:done': ({ dir, logger }) => {
      const photos = new URL('photos/', dir);
      let names = [];
      try { names = readdirSync(photos); } catch { return; }
      for (const n of names.filter((x) => x.endsWith('.removed'))) {
        rmSync(fileURLToPath(new URL(n, photos)));
        logger.info(`dist/photos/${n} 제외`);
      }
    },
  },
};

export default defineConfig({
  site: 'https://bio.joonlab98.com',
  integrations: [react(), dropRemoved],
  trailingSlash: 'ignore',
  build: { format: 'directory' },
});
