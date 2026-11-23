# joonlab-bio

박준(PARK JOON)의 bio·포트폴리오 사이트.

- **라이브**: https://bio.joonlab98.com (`/`, `/en/`, `/ja/`)
- **워커**: `joonlab-bio` (Cloudflare Workers 정적 에셋)

## 스택

Astro 7 + React island. 빌드 결과 `dist/` 를 Cloudflare Workers 정적 에셋으로 서빙한다. Node 24 (`.node-version`).

```
.
├── astro.config.mjs
├── package.json / package-lock.json
├── src/
│   ├── pages/            # index.astro, en/, ja/
│   ├── layouts/Base.astro
│   ├── components/       # Page.astro(판 구성), Printout·PhotoPrint·BuildSheet, vendor/(레퍼런스 컴포넌트 이식본)
│   ├── content/          # ko·en·ja.json(본문), demos.json(포트폴리오 데모), photos.json(강의 사진), links.json(만든 것↔가르친 것 연결 근거), board.ts
│   └── styles/board.css
├── public/               # photos/(개인정보 가림 처리본), assets/(OG·아이콘·프로필), favicon
├── wrangler.jsonc        # assets.directory = ./dist
└── .github/workflows/deploy.yml   # push → npm ci → astro build → wrangler deploy
```

## 로컬

```bash
npm ci
npm run dev        # http://localhost:4321
npm run build      # dist/
```

## 내용 고치기

- 본문: `src/content/ko.json`(정본) → 같은 키를 `en.json`·`ja.json` 에 반영.
- 연결선: `src/content/links.json` 에 근거가 있는 연결만 넣는다. 사진은 `photos.json` 의 `link`.
- 강의 사진을 추가할 때: 화이트보드·화면·명찰에 전화번호·이메일·이름·비밀번호가 읽히는지 원본 해상도로 확인하고, 있으면 단색으로 가린 뒤 넣는다(블러 금지).

## 배포

`main` push → GitHub Actions 가 Node 24 로 빌드하고 `cloudflare/wrangler-action@v3`(`wranglerVersion: "4.77.0"` 고정)로 배포한다. Secret `CLOUDFLARE_API_TOKEN` 필요.

## 크레딧

디자인 참고: impeccable(design skill), Aceternity UI Focus Cards 이식(`src/components/vendor/`, 원본 라이선스 주석 유지).
