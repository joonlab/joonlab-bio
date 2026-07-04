# joonlab-bio

박준(PARK JOON)의 커스텀 bio-link & 포트폴리오 사이트.

- **라이브**: https://bio.joonlab98.com
- **워커**: `joonlab-bio` (Cloudflare Workers)

## 스택

순수 정적 HTML/CSS + **Cloudflare Workers 정적 에셋(assets)** 서빙. 빌드 스텝·프레임워크 없음.

```
.
├── wrangler.jsonc          # Cloudflare Workers 설정 (정적 에셋 + 커스텀 도메인)
├── public/                 # 배포되는 정적 에셋
│   ├── index.html
│   ├── favicon.svg
│   └── assets/             # 프로필 사진, OG 이미지 등
└── .github/workflows/
    └── deploy.yml          # push → Actions → wrangler deploy
```

## 로컬 미리보기

```bash
# Cloudflare Workers 런타임 그대로 로컬 실행
npx wrangler dev

# 또는 단순 정적 서버로 확인
python3 -m http.server -d public 8000   # → http://localhost:8000
```

## 배포

`main` 브랜치에 push하면 GitHub Actions가 `cloudflare/wrangler-action`으로 `wrangler deploy`를 실행해 자동 배포됩니다.

### 필요한 GitHub Secret

| 이름 | 설명 |
|------|------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API 토큰 (권한: **Account · Workers Scripts · Edit** + **Zone · Workers Routes · Edit**, 대상 `joonlab98.com`) |

토큰 생성: Cloudflare 대시보드 → My Profile → API Tokens → Create Token → *Edit Cloudflare Workers* 템플릿.
등록: `gh secret set CLOUDFLARE_API_TOKEN --repo joonlab/joonlab-bio`

### 수동 배포 (로컬)

```bash
npx wrangler deploy
```

## 크레딧

레이아웃·구성은 요한님의 **cmds-bio** bio-link 사이트에서 영감을 받았습니다.
