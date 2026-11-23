/*
 * 출처: Aceternity UI «Focus Cards»
 *   https://ui.aceternity.com/components (registry: focus-cards.json)
 *   (components/ui/focus-cards.tsx, Manu Arora / Aceternity)
 * 라이선스: Aceternity 무료 컴포넌트 — 개인·상업 프로젝트 사용 가능, 컴포넌트 라이브러리로 재배포 금지.
 *
 * 원본이 하는 일: 카드 하나에 hover 하면 `hovered !== index` 인 나머지 카드를 흐리게(blur-sm scale-[0.98]).
 * 이 사이트에서 바꾼 것(판서 벽 세계):
 *   - 카드 격자를 렌더하지 않는다. 판(data-board) 위에 서버 렌더된 출력물·마커 글씨를 두고,
 *     hovered 상태만 이 섬이 들고 있다가 DOM 속성(data-on / data-dim)으로 내려 준다.
 *   - 같은 상태로 «출력물 → 이어진 강의 줄»을 초록 마커 화살표로 긋는다. 선 모양은 한 가지다:
 *       출력물 왼쪽 변 → (두 열 사이 통로 안에서만 움직이는 큰 반경 S곡선) → 합류점 → 가로 줄기 → 줄 글자 끝 + 8px.
 *     같은 줄로 오는 선은 합류점에서 합쳐 화살촉 하나, 라벨 하나(«CMDS 21회 · 2026-10-06 · 2건»)만 갖는다.
 *     통로 밖으로 나가야 하거나, 글자·출력물에 닿거나, 다른 줄로 가는 선과 엇갈리면 그 판에서는 선을 긋지 않고
 *     1023px 이하처럼 캡션의 «↳» 표시만 남긴다. 1024px 미만에서는 선을 긋지 않는다.
 *   - 흐림(blur)은 글을 못 읽게 하므로 쓰지 않고, 이어지지 않은 출력물만 옅게 한다(CSS).
 *   - 줄(data-target)을 가리키면 거꾸로 그 줄과 이어진 출력물들이 앞으로 나온다(data-noline 묶음은 선 없이 강조만).
 *   - 키보드 포커스도 hover 와 같이 동작한다. prefers-reduced-motion 이면 선이 바로 보인다(CSS).
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';

type R = { l: number; t: number; r: number; b: number };
type P = [number, number];
type Pair = { src: number; key: string };
type Branch = { src: number; d: string };
type Group = { key: string; trunk: string; branches: Branch[]; label?: { x: number; y: number; text: string } };

const rel = (r: DOMRect, o: DOMRect): R => ({ l: r.left - o.left, t: r.top - o.top, r: r.right - o.left, b: r.bottom - o.top });
const f = (n: number) => n.toFixed(1);
const bez = (c: P[], t: number): P => {
  const u = 1 - t;
  const a = u * u * u, b = 3 * u * u * t, cc = 3 * u * t * t, d = t * t * t;
  return [a * c[0][0] + b * c[1][0] + cc * c[2][0] + d * c[3][0], a * c[0][1] + b * c[1][1] + cc * c[2][1] + d * c[3][1]];
};
const inside = (p: P, r: R, pad: number) => p[0] > r.l - pad && p[0] < r.r + pad && p[1] > r.t - pad && p[1] < r.b + pad;
const overlap = (a: R, b: R) => a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t;
/** 두 선분이 교차하는가 */
function cross(a: P, b: P, c: P, d: P) {
  const o = (p: P, q: P, r: P) => Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]));
  return o(a, b, c) * o(a, b, d) < 0 && o(c, d, a) * o(c, d, b) < 0;
}

/** 판 안 글자 상자(텍스트 노드 줄 단위)와 출력물 상자 */
function obstacles(board: HTMLElement, o: DOMRect) {
  const text: { r: R; el: Element }[] = [];
  const walker = document.createTreeWalker(board, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => {
      const p = n.parentElement;
      if (!p || !n.textContent?.trim()) return NodeFilter.FILTER_REJECT;
      if (p.closest('svg, .sr, details:not([open]) > :not(summary)')) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const range = document.createRange();
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    range.selectNodeContents(n);
    for (const r of range.getClientRects()) if (r.width > 0 && r.height > 0) text.push({ r: rel(r, o), el: n.parentElement! });
  }
  const prints = [...board.querySelectorAll<HTMLElement>('.print, .tags')].filter((el) => el.offsetParent).map((el) => ({ r: rel(el.getBoundingClientRect(), o), el }));
  return { text, prints };
}

let measureCtx: CanvasRenderingContext2D | null = null;
function textWidth(s: string, font: string) {
  measureCtx ??= document.createElement('canvas').getContext('2d');
  if (!measureCtx) return s.length * 8;
  measureCtx.font = font;
  return measureCtx.measureText(s).width;
}

export default function FocusLinks({ countFmt = '{n}' }: { countFmt?: string }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const boardRef = useRef<HTMLElement | null>(null);
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [active, setActive] = useState<{ kind: 'src'; id: number } | { kind: 'tgt'; id: string } | null>(null);
  const [drawn, setDrawn] = useState<Map<number, number>>(new Map());

  useEffect(() => {
    const svg = svgRef.current;
    const board = svg?.closest<HTMLElement>('[data-board]');
    if (!svg || !board) return;
    boardRef.current = board;
    const sources = [...board.querySelectorAll<HTMLElement>('[data-link]')];
    sources.forEach((el, si) => (el.dataset.srcId = String(si)));
    const pr: Pair[] = [];
    sources.forEach((el, si) => (el.dataset.link || '').split(/\s+/).filter(Boolean).forEach((key) => pr.push({ src: si, key })));
    setPairs(pr);
    const wide = window.matchMedia('(min-width: 1024px)');
    const bodyFont = getComputedStyle(board).fontFamily;
    const range = document.createRange();

    let raf = 0;
    const measure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const o = board.getBoundingClientRect();
        setSize({ w: o.width, h: o.height });
        const report = (g: Group[], reason: string) => {
          (board as HTMLElement & { __lines?: unknown }).__lines = {
            pairs: pr.length,
            groups: g.length,
            branches: g.reduce((n, x) => n + x.branches.length, 0),
            labels: g.filter((x) => x.label).length,
            reason,
          };
          board.toggleAttribute('data-nolines', g.length === 0 && reason !== 'none');
          setGroups(g);
        };
        if (!wide.matches) return report([], 'narrow');
        const { text, prints } = obstacles(board, o);

        // 선을 긋는 쌍만(data-noline 묶음은 강조만 한다)
        const byKey = new Map<string, { src: number; el: HTMLElement }[]>();
        pr.forEach((p) => {
          const el = sources[p.src];
          if (el.hasAttribute('data-noline') || !el.offsetParent) return;
          byKey.set(p.key, [...(byKey.get(p.key) ?? []), { src: p.src, el }]);
        });
        if (!byKey.size) return report([], 'none');

        const out: Group[] = [];
        const polys: { key: string; pts: P[] }[] = [];
        const labelBoxes: R[] = [];
        for (const [key, srcs] of byKey) {
          const t = board.querySelector<HTMLElement>(`[data-target="${key}"]`);
          const lane = t?.closest<HTMLElement>('[data-lane]');
          if (!t || !lane || !t.offsetParent) return report([], `no-target:${key}`);
          // 도착점: 줄 글자 bbox 의 마지막 줄 끝 + 8px
          range.selectNodeContents(t);
          const rs = [...range.getClientRects()].filter((r) => r.width > 0);
          if (!rs.length) return report([], `no-text:${key}`);
          const last = rel(rs[rs.length - 1], o);
          const E: P = [last.r + 8, (last.t + last.b) / 2];
          const laneR = rel(lane.getBoundingClientRect(), o).r;
          const J: P = [Math.max(laneR + 14, E[0] + 24), E[1]];
          const own = (el: Element) => t.contains(el) || el.contains(t);
          // 줄기(J → E) 위에 다른 글자가 있으면 이 판은 선을 긋지 않는다
          const trunkBox: R = { l: E[0] - 2, r: J[0], t: E[1] - 5, b: E[1] + 5 };
          if (text.some((x) => !own(x.el) && overlap(x.r, trunkBox)) || prints.some((x) => overlap(x.r, trunkBox))) return report([], `trunk-blocked:${key}`);

          const branches: Branch[] = [];
          let minW = Infinity;
          for (const { src, el } of srcs) {
            const s = rel(el.getBoundingClientRect(), o);
            const w = s.l - J[0];
            if (w < 40) return report([], `no-gutter:${key}`);
            const sy = Math.min(Math.max(E[1], s.t + 24), s.b - 24);
            // 큰 반경 S곡선: 제어점 x 가 통로 [J.x, s.l] 안에 있으므로 곡선 전체가 통로 안에 머문다
            // 시작점: 출력물이면 종이 밑으로 12px 들어가고(기울어 있어도 종이에 닿아 보이게, 선은 종이 아래 층), 메모면 글자 앞 6px
            const x0 = el.classList.contains('print') ? s.l + 12 : s.l - 6;
            const c: P[] = [[x0, sy], [s.l - w * 0.55, sy], [J[0] + w * 0.55, E[1]], J];
            minW = Math.min(minW, w);
            const pts = Array.from({ length: 41 }, (_, i) => bez(c, i / 40));
            const obs = [...text.filter((x) => !own(x.el) && !el.contains(x.el)), ...prints.filter((x) => x.el !== el && !el.contains(x.el))];
            if (pts.slice(1).some((p) => obs.some((x) => inside(p, x.r, 4)))) return report([], `blocked:${key}`);
            polys.push({ key, pts });
            branches.push({ src, d: `M${f(c[0][0])} ${f(c[0][1])} C${f(c[1][0])} ${f(c[1][1])} ${f(c[2][0])} ${f(c[2][1])} ${f(J[0])} ${f(J[1])}` });
          }
          polys.push({ key, pts: [J, E] });
          // 화살촉 하나(왼쪽을 향함)
          const h = 12, a = 0.5;
          const trunk = `M${f(J[0])} ${f(J[1])} L${f(E[0])} ${f(E[1])} M${f(E[0] + h * Math.cos(a))} ${f(E[1] - h * Math.sin(a))} L${f(E[0])} ${f(E[1])} L${f(E[0] + h * Math.cos(a))} ${f(E[1] + h * Math.sin(a))}`;
          const g: Group = { key, trunk, branches };
          // 라벨 하나: 회차·날짜를 합치고, 2건 이상이면 건수를 붙인다. 줄기 위 → 줄기 아래 순으로 자리를 찾는다
          const parts = [...new Set(srcs.map((s) => s.el.dataset.line).filter(Boolean) as string[])];
          if (parts.length) {
            const txt = parts.join(' / ') + (srcs.length > 1 ? ` · ${countFmt.replace('{n}', String(srcs.length))}` : '');
            const lw = textWidth(txt, `700 13px ${bodyFont}`) + 10;
            const allObs = [...text.filter((x) => !own(x.el)).map((x) => x.r), ...prints.map((x) => x.r), ...labelBoxes];
            const xMax = Math.min(o.width - 4, J[0] + minW - 8);
            const cands: R[] = [];
            for (const dy of [-1, 1]) {
              for (let x = E[0] + 14; x + lw <= xMax; x += 12) {
                const top = dy < 0 ? E[1] - 24 : E[1] + 6;
                cands.push({ l: x, r: x + lw, t: top, b: top + 18 });
              }
            }
            const box = cands.find((b) => !allObs.some((r) => overlap(b, r)) && !polys.some((p) => p.key !== key && p.pts.some((q) => inside(q, b, 0))));
            if (box) {
              labelBoxes.push(box);
              g.label = { x: box.l + 5, y: box.b - 4, text: txt };
            }
          }
          out.push(g);
        }
        // 다른 줄로 가는 선끼리 엇갈리면 이 판은 ↳ 표시로 대신한다
        for (let i = 0; i < polys.length; i++)
          for (let j = i + 1; j < polys.length; j++) {
            if (polys[i].key === polys[j].key) continue;
            const A = polys[i].pts, B = polys[j].pts;
            for (let a = 1; a < A.length; a++) for (let b = 1; b < B.length; b++) if (cross(A[a - 1], A[a], B[b - 1], B[b])) return report([], 'crossing');
          }
        report(out, 'ok');
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(board);
    document.fonts?.ready.then(measure);
    const imgs = [...board.querySelectorAll('img')];
    imgs.forEach((i) => i.addEventListener('load', measure));
    window.addEventListener('load', measure);
    wide.addEventListener?.('change', measure);
    board.addEventListener('toggle', measure, true);

    // 출력물이 화면에 들어올 때 그 출력물의 선만 순서대로 한 번 그린다
    const io = new IntersectionObserver(
      (entries) => {
        const fresh = entries.filter((e) => e.isIntersecting).map((e) => Number((e.target as HTMLElement).dataset.srcId));
        if (!fresh.length) return;
        fresh.forEach((n) => io.unobserve(sources[n]));
        setDrawn((prev) => {
          const next = new Map(prev);
          fresh.sort((a, b) => a - b).forEach((n, k) => next.set(n, k));
          return next;
        });
      },
      { threshold: 0.3, rootMargin: '0px 0px -8% 0px' },
    );
    sources.forEach((el) => io.observe(el));

    const pick = (n: EventTarget | null) => {
      const el = (n as Element | null)?.closest?.<HTMLElement>('[data-link],[data-target]');
      if (!el || !board.contains(el)) return null;
      if (el.dataset.link !== undefined && el.dataset.srcId) return { kind: 'src' as const, id: Number(el.dataset.srcId) };
      if (el.dataset.target) return { kind: 'tgt' as const, id: el.dataset.target };
      return null;
    };
    const over = (e: Event) => setActive(pick(e.target));
    const out = (e: Event) => setActive(pick((e as PointerEvent | FocusEvent).relatedTarget));
    board.addEventListener('pointerover', over);
    board.addEventListener('pointerout', out);
    board.addEventListener('focusin', over);
    board.addEventListener('focusout', out);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      imgs.forEach((i) => i.removeEventListener('load', measure));
      window.removeEventListener('load', measure);
      wide.removeEventListener?.('change', measure);
      board.removeEventListener('toggle', measure, true);
      board.removeEventListener('pointerover', over);
      board.removeEventListener('pointerout', out);
      board.removeEventListener('focusin', over);
      board.removeEventListener('focusout', out);
    };
  }, []);

  useLayoutEffect(() => {
    svgRef.current?.querySelectorAll<SVGPathElement>('path').forEach((p) => {
      p.style.setProperty('--len', String(Math.ceil(p.getTotalLength()) + 2));
    });
  }, [groups]);

  const onSrc = new Set<number>();
  const onKey = new Set<string>();
  if (active?.kind === 'src') {
    onSrc.add(active.id);
    pairs.filter((l) => l.src === active.id).forEach((l) => onKey.add(l.key));
  } else if (active?.kind === 'tgt') {
    onKey.add(active.id);
    pairs.filter((l) => l.key === active.id).forEach((l) => onSrc.add(l.src));
  }
  const live = active !== null && pairs.some((l) => onSrc.has(l.src) && onKey.has(l.key));

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    board.querySelectorAll<HTMLElement>('[data-link],[data-target]').forEach((el) => {
      el.removeAttribute('data-on');
      el.removeAttribute('data-dim');
      if (!live) return;
      const on = (el.dataset.srcId !== undefined && el.dataset.link !== undefined && onSrc.has(Number(el.dataset.srcId))) || (el.dataset.target !== undefined && onKey.has(el.dataset.target));
      el.setAttribute(on ? 'data-on' : 'data-dim', '');
    });
    board.toggleAttribute('data-focus', live);
  });

  return (
    <svg
      ref={svgRef}
      className={clsx('links', live && 'is-live')}
      width={size.w}
      height={size.h}
      viewBox={`0 0 ${Math.max(1, size.w)} ${Math.max(1, size.h)}`}
      aria-hidden="true"
      focusable="false"
    >
      {groups.map((g) => {
        const gOn = live && onKey.has(g.key) && g.branches.some((b) => onSrc.has(b.src));
        const gDrawn = g.branches.filter((b) => drawn.has(b.src));
        const order = gDrawn.length ? Math.max(...gDrawn.map((b) => drawn.get(b.src) ?? 0)) : 0;
        return (
          <g key={g.key} className={clsx('lk', gOn && 'lk--on')}>
            {g.branches.map((b) => {
              const on = gOn && onSrc.has(b.src);
              return (
                <path
                  key={b.src}
                  d={b.d}
                  className={clsx('link', drawn.has(b.src) && 'link--drawn', live && (on ? 'link--on' : 'link--off'))}
                  style={{ ['--i' as string]: drawn.get(b.src) ?? 0 }}
                />
              );
            })}
            <path
              d={g.trunk}
              className={clsx('link link--trunk', gDrawn.length > 0 && 'link--drawn', live && (gOn ? 'link--on' : 'link--off'))}
              style={{ ['--i' as string]: order + 1 }}
            />
            {g.label && (
              <text className="link__label" x={g.label.x} y={g.label.y}>
                {g.label.text}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
