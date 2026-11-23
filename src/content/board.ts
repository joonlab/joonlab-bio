// 판서 벽(세계 B) 전용 문구와 연결표.
// 사실(기관·숫자·날짜)은 ko/en/ja.json, photos.json, demos.json, links.json 에서만 가져온다.
// 연결선은 links.json(만든 것 → 강의 줄)과 photos.json 의 link 필드(사진 → 촬영 기관의 강의 줄)에 있는 것만 긋는다.
import type { Lang } from '../lib';
import ko from './ko.json';
import links from './links.json';
import photos from './photos.json';
import demos from './demos.json';

/** teach 키 → ko.json teaching.groups 의 기관 이름. 인덱스는 이름으로 찾는다(세 언어 groups 순서는 같다). */
const TEACH_ORG: Record<string, string> = {
  'lg-academy': 'LG인화원',
  sk: 'SK 그룹',
  cmds: '월간 CMDS',
  community: '온라인 강의·커뮤니티',
};
export const teachIndex = (key: string) => ko.teaching.groups.findIndex((g) => g.org === TEACH_ORG[key]);
/** 'teach:cmds' → 'cmds' */
export const teachKey = (ref: string | null | undefined) => (ref && ref.startsWith('teach:') ? ref.slice(6) : undefined);

/** 연결선 대상 이름(DOM data-target 값) */
export const targetId = (key: string) => `t-${key}`;

type LinkRow = { from: string; to: string; label_ko: string };
const LINK_ROWS = (links as LinkRow[]).filter((l) => l.to.startsWith('teach:') && !l.from.startsWith('photo:'));

/** 근거 문구 en/ja (ko 는 links.json label_ko) */
const LINK_LABEL: Record<string, { en: string; ja: string }> = {
  'demo:agent-session-dashboard': { en: 'Presented at Monthly CMDS #20 (2026-09-03)', ja: '月刊CMDS 第20回（2026-09-03）で紹介' },
  'demo:messenger-wiki': { en: 'Monthly CMDS #20 (2026-09-03), KakaoTalk record recovery case', ja: '月刊CMDS 第20回（2026-09-03）カカオトーク記録の回収事例' },
  'demo:foldable-mac-lab': { en: 'Demonstrated at Monthly CMDS #21 (2026-10-06)', ja: '月刊CMDS 第21回（2026-10-06）で実演' },
  'demo:unattended-ai-relay': { en: 'Presented at Monthly CMDS #21 (2026-10-06)', ja: '月刊CMDS 第21回（2026-10-06）で紹介' },
  'build:lg-edu-agents': { en: 'Used in LG Academy courses · 973 participants · 79 concurrent users', ja: 'LG人和院の研修で実運用・累計973名・同時接続79名' },
};
/** 선 위에 붙는 짧은 근거: 회차·날짜만(같은 줄로 모이는 선은 이 값을 합쳐 라벨 하나로 쓴다) */
const LINE_LABEL: Record<string, Record<Lang, string>> = {
  'demo:agent-session-dashboard': { ko: 'CMDS 20회 · 2026-09-03', en: 'CMDS #20 · 2026-09-03', ja: 'CMDS 第20回 · 2026-09-03' },
  'demo:messenger-wiki': { ko: 'CMDS 20회 · 2026-09-03', en: 'CMDS #20 · 2026-09-03', ja: 'CMDS 第20回 · 2026-09-03' },
  'demo:foldable-mac-lab': { ko: 'CMDS 21회 · 2026-10-06', en: 'CMDS #21 · 2026-10-06', ja: 'CMDS 第21回 · 2026-10-06' },
  'demo:unattended-ai-relay': { ko: 'CMDS 21회 · 2026-10-06', en: 'CMDS #21 · 2026-10-06', ja: 'CMDS 第21回 · 2026-10-06' },
  'build:lg-edu-agents': { ko: '교육 투입 · 누적 973명', en: 'Used in courses · 973 people', ja: '研修で実運用 · 累計973名' },
};

export type Conn = { key: string; label: string; line: string };
/** 만든 것(demo:slug | build:id) 의 연결. 없으면 undefined */
export function connOf(from: string, lang: Lang): Conn | undefined {
  const row = LINK_ROWS.find((l) => l.from === from);
  if (!row) return undefined;
  const key = row.to.slice(6);
  const label = lang === 'ko' ? row.label_ko : LINK_LABEL[from]?.[lang] ?? row.label_ko;
  return { key, label, line: LINE_LABEL[from]?.[lang] ?? label };
}
export const demosLinkedTo = (key: string) => LINK_ROWS.filter((l) => l.to === `teach:${key}` && l.from.startsWith('demo:')).map((l) => l.from.slice(5));

/** 사진 장소(venue) 번역 */
const VENUE: Record<string, { en: string; ja: string }> = {
  '평택 LG디지털파크': { en: 'LG Digital Park, Pyeongtaek', ja: '平沢 LGデジタルパーク' },
  'LG인화원': { en: 'LG Academy', ja: 'LG人和院' },
  '경남': { en: 'Gyeongnam', ja: '慶南' },
  '도쿄 미드타운 히비야': { en: 'Tokyo Midtown Hibiya', ja: '東京ミッドタウン日比谷' },
  'SK에코플랜트': { en: 'SK ecoplant', ja: 'SKエコプラント' },
  'SKT 타워': { en: 'SKT Tower', ja: 'SKTタワー' },
  '국립농업과학원': { en: 'National Institute of Agricultural Sciences', ja: '国立農業科学院' },
  '이포넷': { en: 'E4NET', ja: 'E4NET' },
  'MARU180': { en: 'MARU180', ja: 'MARU180' },
};
export const venue = (v: string, lang: Lang) => (lang === 'ko' ? v : VENUE[v]?.[lang] ?? v);

export type Photo = (typeof photos)[number];
export const photosLinkedTo = (key: string) => photos.filter((p) => teachKey(p.link) === key);
export const unlinkedPhotos = photos.filter((p) => !p.link);

/** demos.json 에 언어 필드가 들어오기 전까지 쓰는 제목 번역(언어 필드가 있으면 그쪽이 먼저) */
const DEMO_TITLE: Record<string, { en: string; ja: string }> = {
  'exam-video-factory': { en: 'Unattended production line for Korean exam lecture and explainer videos', ja: '韓国語試験の講義・解説動画 無人制作ライン' },
  'exam-content-pipeline': { en: 'Automated generation and review of Korean exam items and audio', ja: '韓国語試験の問題・音声 自動生成・検収パイプライン' },
  'retail-daily-report-agent': { en: 'Daily retail sales report agent', ja: '小売の日次実績レポート自動化エージェント' },
  'lodging-ops-agent': { en: 'Local AI agent for lodging operations', ja: '宿泊運営ローカルAIエージェント' },
  'researcher-ai-os': { en: 'AI working setup for an individual researcher', ja: '個人研究者向けAI運用体系' },
  'unattended-ai-relay': { en: 'AI work relay that keeps running without a person', ja: '人の介入なしで引き継ぎ続けるAI作業リレー' },
  'voice-writing-harness': { en: 'Writing harness in my own voice that passes blind judges', ja: 'ブラインド審査を通る「自分の文体」執筆ハーネス' },
  'commerce-ops-agent': { en: 'Operations agent for group-buying commerce', ja: '共同購入コマース業務の自動化エージェント' },
  'agent-trace-analysis': { en: 'Analysis of frontier-model agent execution traces', ja: 'フロンティアモデルのエージェント実行軌跡の分析' },
  'seoul-live-map': { en: '"Seoul Now" live city status map', ja: '「ソウルいま」リアルタイム都市状況マップ' },
  'messenger-wiki': { en: 'Turning group chats into a private wiki', ja: 'グループチャットを非公開Wikiに' },
  'qr-recipe-system': { en: 'Multilingual standard recipes opened by QR code', ja: 'QRで開く多言語標準レシピシステム' },
  'accident-survey-ai': { en: 'Traffic accident survey AI: fault classification and sketch maps', ja: '交通事故現場調査AI：過失分類・略図の自動生成' },
  'senior-travel-app': { en: 'Domestic travel booking app for seniors', ja: 'シニア向け国内旅行予約アプリ' },
  'homework-assign-app': { en: 'Automatic assignment of unfinished homework for a cram school', ja: '塾の未完了課題 自動割り当てアプリ' },
  'foldable-mac-lab': { en: 'Foldable phone × Mac lab', ja: '折りたたみスマホ × Mac 連携ラボ' },
  'subway-seat-predictor': { en: '"Can I sit?" subway seat prediction app', ja: '「座れるかな」地下鉄着席予測アプリ' },
  'dualcue-live-interpreter': { en: 'Two-way live interpretation captions for video calls', ja: 'ビデオ会議の双方向リアルタイム通訳字幕' },
  'local-tts-voice-clone': { en: 'Large open TTS model on a local server, plus a clone of my voice', ja: '大型オープンTTSのローカルサーバー化と自分の声の複製' },
  'coding-tutor-curriculum': { en: 'AI coding tutoring curriculum and textbook site for non-developer founders', ja: '非開発者の経営者向けAIコーディング指導カリキュラム・教材サイト' },
  'motion-reel-engine': { en: 'Motion graphics video engine written in code', ja: 'コードで作るモーショングラフィックス動画エンジン' },
  'character-video-system': { en: 'Repeatable AI video production with consistent characters', ja: 'キャラクターの一貫性を保つAI動画の反復制作システム' },
  'agent-session-dashboard': { en: 'Dashboard to monitor and recover dozens of AI coding sessions', ja: 'AIコーディングセッション数十件の監視・復旧ダッシュボード' },
};
const CATEGORY: Record<string, { en: string; ja: string }> = {
  '영상·모션': { en: 'Video and motion', ja: '映像・モーション' },
  'AI 에이전트·자동화': { en: 'AI agents and automation', ja: 'AIエージェント・自動化' },
  '컨설팅·업무설계': { en: 'Consulting and workflow design', ja: 'コンサルティング・業務設計' },
  '연구·평가': { en: 'Research and evaluation', ja: '研究・評価' },
  '웹앱·대시보드': { en: 'Web apps and dashboards', ja: 'Webアプリ・ダッシュボード' },
  '모바일·디바이스': { en: 'Mobile and devices', ja: 'モバイル・デバイス' },
  '음성·오디오': { en: 'Voice and audio', ja: '音声・オーディオ' },
  '교육·콘텐츠 제작': { en: 'Training content', ja: '教育コンテンツ制作' },
};

export type Demo = (typeof demos)[number];
type Metric = { value: string; unit: string; label: string };
type LangFields = { title?: string; category?: string; metrics?: Metric[] };
/** 언어별 출력물 캡션: d[lang] 필드 → 이 파일의 번역 → ko 순 */
export function demoText(d: Demo, lang: Lang) {
  const lf = (lang === 'ko' ? undefined : (d as unknown as Record<string, LangFields | undefined>)[lang]) ?? {};
  const title = lf.title ?? (lang === 'ko' ? d.title : DEMO_TITLE[d.slug]?.[lang] ?? d.title);
  const category = lf.category ?? (lang === 'ko' ? d.category : CATEGORY[d.category]?.[lang] ?? d.category);
  // 지표 문구는 번역이 확인된 경우에만(ko 원문 또는 lang 필드) 보여 준다
  const metric: Metric | undefined = lang === 'ko' ? d.metrics?.[0] : lf.metrics?.[0];
  return { title, category, metric };
}
export const demoBy = Object.fromEntries(demos.map((d) => [d.slug, d])) as Record<string, Demo>;

/** 날짜·기간을 줄바꿈 없이: 텍스트를 이스케이프하고 날짜 부분만 nowrap span 으로 감싼다 */
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// 날짜·회차 앞뒤의 괄호와 바로 붙은 조사(에서·에·로 / で·に 등)까지 한 덩어리로 묶는다
const DATE_CORE = String.raw`\d{4}[-.]\d{2}(?:[-.]\d{2})?(?:\s?[–-]\s?(?:\d{4}[-.])?\d{2}(?:[-.]\d{2})?)?|#\d+|第\d+回|\d+회째?`;
const DATE_RE = new RegExp(String.raw`([(（]?(?:${DATE_CORE})[)）]?(?:[가-힣]{1,2}(?=[\s,.·]|$)|[ぁ-ゖ]{1,2}(?=[\s、。・]|$))?)`, 'g');
export const nowrapDates = (s: string) => esc(s).replace(DATE_RE, '<span class="nw">$1</span>');

/**
 * 넓은 판(가르친 곳 ↔ 만든 것). 줄마다 왼쪽 기관 묶음과 오른쪽 만든 것을 마주 보게 놓는다.
 * 오른쪽 항목: p = projects.items 인덱스, demo = 그 자리에 붙이는 출력물(첫 화면에 없는 것만), ref = 첫 화면 출력물을 가리키는 마커 참조.
 */
export type MadeItem = { p?: number; demo?: string; ref?: 'sheet' | 'video' | 'demo'; line?: boolean };
export const WIDE_ROWS: { teach: string[]; made: MadeItem[] }[] = [
  { teach: ['lg-academy', 'lgu'], made: [{ p: 1, ref: 'sheet', line: true }, { p: 2, demo: 'exam-video-factory' }] },
  { teach: ['sk', 'seoul'], made: [{ p: 3, demo: 'seoul-live-map' }, { p: 5, demo: 'dualcue-live-interpreter' }] },
  { teach: ['cmds', 'community'], made: [{ p: 0, demo: 'agent-session-dashboard', ref: 'video', line: true }, { demo: 'messenger-wiki', line: true }, { p: 4, ref: 'demo' }] },
  { teach: ['others'], made: [{ p: 6 }, { p: 7 }] },
];
/** 넓은 판 아래쪽 «포트폴리오의 다른 데모» 몇 장(첫 화면·넓은 판에 없는 것) */
export const MORE_DEMOS = ['retail-daily-report-agent', 'qr-recipe-system', 'motion-reel-engine'];
/** 연락 쪽지로 남기는 주요 3개(주소로 고른다) */
export const MAIN_CONTACT = ['class.cmdspace.kr', 'open.kakao.com/o/sUXWYvlf', 'joonlab98.com/portfolio'];

/** 첫 화면 판 */
export const HERO = {
  video: 'unattended-ai-relay',
  demo: 'foldable-mac-lab',
  photos: ['lg-academy-2025', 'skt-tower'],
};
/** 첫 화면 파란 마커 강의 줄 */
const HERO_LINES: Record<Lang, { key: string | null; org: string; text: string }[]> = {
  ko: [
    { key: 'lg-academy', org: 'LG인화원', text: '계열사 임원 AX 강의, AX Camp 3개 차수' },
    { key: 'sk', org: 'SK 그룹', text: 'SKT AI Frontier 1–8기 파트너' },
    { key: null, org: '서울AI허브', text: '「AI Native CEO」 1·2기' },
    { key: 'cmds', org: '월간 CMDS', text: '22회째 (2026-11-04)' },
  ],
  en: [
    { key: 'lg-academy', org: 'LG Academy', text: 'executive AX, 3 AX Camps' },
    { key: 'sk', org: 'SK Group', text: 'Partner for SKT AI Frontier, cohorts 1–8' },
    { key: null, org: 'Seoul AI Hub', text: '"AI Native CEO" 1 and 2' },
    { key: 'cmds', org: 'Monthly CMDS', text: '22nd session (2026-11-04)' },
  ],
  ja: [
    { key: 'lg-academy', org: 'LG人和院', text: '役員AX講義、AX Camp 3回' },
    { key: 'sk', org: 'SKグループ', text: 'SKT AI Frontier 第1–8期 パートナー' },
    { key: null, org: 'ソウルAIハブ', text: '「AI Native CEO」第1・2期' },
    { key: 'cmds', org: '月刊CMDS', text: '第22回（2026-11-04）' },
  ],
};

const T = {
  ko: {
    title: ['기업 AI 교육', '에이전트 시스템 설계'],
    taught: '강의한 곳',
    portfolio: '포트폴리오 24건',
    pen_blue: '강의',
    pen_green: '확인된 연결',
    pen_black: '만든 것',
    other_photos: '다른 강의 현장',
    other_demos: '포트폴리오의 다른 데모',
    ref: { sheet: '첫 화면에 붙인 LMS 인쇄물', video: '첫 화면의 작업 릴레이 출력물', demo: '첫 화면의 폴더블 출력물' },
    count: (n: number) => `${n}건`,
    all_demos: '포트폴리오 24건 전체 보기',
    drawers: '판 아래 서랍',
    items: (n: number) => `${n}건`,
    other_links: '다른 링크',
    sheet_head: '교육 운영 화면 4종',
    sheet_parts: ['인터뷰 에이전트', '에이전트 빌더', '멀티에이전트 패널토의', '교육 LMS'],
    sheet_total: '누적 참가자',
    sheet_peak: '동시접속 무중단',
    unit_people: '명',
    mail_label: '메일',
    mail_short: '문의 메일 쓰기',
    to_top: '맨 위로',
    figures_note: '출처·기준일을 함께 적었습니다.',
  },
  en: {
    title: ['Corporate AI training', 'Agent system design'],
    taught: 'Where I teach',
    portfolio: 'Portfolio, 24 cases',
    pen_blue: 'Teaching',
    pen_green: 'Confirmed link',
    pen_black: 'Built',
    other_photos: 'More teaching photos',
    other_demos: 'More demos from the portfolio',
    ref: { sheet: 'LMS printout on the first board', video: 'AI work relay printout on the first board', demo: 'Foldable printout on the first board' },
    count: (n: number) => `${n} systems`,
    all_demos: 'See all 24 portfolio cases',
    drawers: 'Drawers under the board',
    items: (n: number) => `${n} items`,
    other_links: 'More links',
    sheet_head: '4 apps used in the courses',
    sheet_parts: ['Interview agent', 'Agent builder', 'Multi-agent panel discussion', 'Course LMS'],
    sheet_total: 'total participants',
    sheet_peak: 'concurrent users, no downtime',
    unit_people: '',
    mail_label: 'Email',
    mail_short: 'Email me',
    to_top: 'Back to top',
    figures_note: 'Each figure lists its source and date.',
  },
  ja: {
    title: ['企業向けAI研修', 'エージェントシステム設計'],
    taught: '講義先',
    portfolio: 'ポートフォリオ24件',
    pen_blue: '講義',
    pen_green: '確認済みのつながり',
    pen_black: '作ったもの',
    other_photos: 'その他の講義風景',
    other_demos: 'ポートフォリオのその他のデモ',
    ref: { sheet: '最初のボードに貼ったLMSの印刷物', video: '最初のボードのAI作業リレー', demo: '最初のボードの折りたたみスマホ' },
    count: (n: number) => `${n}件`,
    all_demos: 'ポートフォリオ24件をすべて見る',
    drawers: 'ボード下の引き出し',
    items: (n: number) => `${n}件`,
    other_links: 'その他のリンク',
    sheet_head: '研修で使ったアプリ4種',
    sheet_parts: ['インタビューエージェント', 'エージェントビルダー', 'マルチエージェント・パネル討論', '研修LMS'],
    sheet_total: '累計参加者',
    sheet_peak: '同時接続・無停止',
    unit_people: '名',
    mail_label: 'メール',
    mail_short: 'メールで問い合わせ',
    to_top: 'ページ上部へ',
    figures_note: '出典と時点を併記しています。',
  },
} as const;

export const boardText = (l: Lang) => T[l];
export const heroLines = (l: Lang) => HERO_LINES[l];

/** 판 위 출력물 기울기: 인덱스로 정해지는 값(빌드마다 같다) */
const TILTS = [-1.6, 1.2, -0.8, 1.8, -1.2, 0.9, -2, 1.4, -0.6, 1.6];
export const tilt = (i: number) => `${TILTS[((i % TILTS.length) + TILTS.length) % TILTS.length]}deg`;
const MAGNETS = ['var(--magnet-yellow)', 'var(--magnet-blue)', 'var(--magnet-red)'];
export const magnet = (i: number) => MAGNETS[((i % MAGNETS.length) + MAGNETS.length) % MAGNETS.length];
