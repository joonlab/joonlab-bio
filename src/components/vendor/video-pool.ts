/*
 * 출처: smoothui «Video Ambient»
 *   (local reference archive)
 * 라이선스: MIT, Copyright (c) 2024 Eduardo Calvo
 *
 * 원본에서 가져온 것: IntersectionObserver 로 화면 밖이면 멈춤, visibilitychange 로 탭이 숨으면 멈춤,
 *   muted 자동 재생이 거절되면(play() 의 promise reject) 조용히 포스터로 남김, reduced-motion 이면 한 프레임(포스터)에서 멈춤.
 * 바꾼 것: 영상 한 개용 React 훅을 판 전체의 «출력물 영상 풀»로 바꿨다.
 *   - 모든 영상은 preload="none" + poster. src 는 처음 재생할 때만 붙인다(data-src).
 *   - 화면 안에 들어온 것 중 많이 보이는 순으로 최대 2개만 재생한다. 가리키고 있는 출력물이 1순위.
 *   - 색 번짐(ambient glow) 캔버스는 이 세계(종이 출력물)에 맞지 않아 뺐다.
 */
const MAX_PLAYING = 2;

export function startVideoPool(root: ParentNode = document) {
  const videos = [...root.querySelectorAll<HTMLVideoElement>('video[data-src]')];
  if (!videos.length) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const seen = new Map<HTMLVideoElement, number>();
  let pointed: HTMLVideoElement | null = null;

  const stop = (v: HTMLVideoElement) => {
    if (!v.paused) v.pause();
  };
  const play = (v: HTMLVideoElement) => {
    if (!v.src && v.dataset.src) v.src = v.dataset.src;
    if (v.paused) v.play().catch(() => { /* 자동 재생 거절: 포스터로 남는다 */ });
  };

  const schedule = () => {
    if (reduce.matches || document.hidden) {
      videos.forEach(stop);
      return;
    }
    const ranked = [...seen.entries()]
      .sort((a, b) => b[1] - a[1] || videos.indexOf(a[0]) - videos.indexOf(b[0]))
      .map(([v]) => v);
    if (pointed && seen.has(pointed)) ranked.unshift(pointed);
    const keep = new Set(ranked.slice(0, MAX_PLAYING));
    videos.forEach((v) => (keep.has(v) ? play(v) : stop(v)));
  };

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const v = e.target as HTMLVideoElement;
        if (e.isIntersecting && e.intersectionRatio >= 0.4) seen.set(v, e.intersectionRatio + (v.dataset.priority ? 1 : 0));
        else seen.delete(v);
      }
      schedule();
    },
    { threshold: [0, 0.4, 0.7, 1] },
  );
  videos.forEach((v) => {
    io.observe(v);
    const host = v.closest<HTMLElement>('.print') ?? v;
    host.addEventListener('pointerenter', () => {
      pointed = v;
      schedule();
    });
    host.addEventListener('pointerleave', () => {
      if (pointed === v) pointed = null;
    });
  });
  document.addEventListener('visibilitychange', schedule);
  reduce.addEventListener?.('change', schedule);
}
