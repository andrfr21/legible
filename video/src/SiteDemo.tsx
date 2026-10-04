import React from 'react';
import { AbsoluteFill, Audio, Easing, Img, Sequence, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { C, FONT, alpha } from './Legible';
import RECTS from '../public/shots/rects.json';

/* Site demo: the story told in large type on the left, the real site doing it on the right, cut on the music. */
const X = { ...C, warn: '#d97706' };
const SNAP = Easing.bezier(0.16, 1, 0.3, 1);
const SMOOTH = Easing.bezier(0.45, 0, 0.2, 1);
const BAR = (60 / 70) * 4 * 30; // frames per bar at 30 fps (70 BPM)
const BEAT = BAR / 4;
const bar = (n: number) => Math.round(n * BAR);
const MUSIC_FROM = Math.round(5.874 * 30); // one bar before the beat comes in (9.30 s into the track)

const t = (f: number, a: number, d = 10) =>
  interpolate(f, [a, a + d], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: SNAP });

/* ---------- page captures through a camera: centre in CSS px of the page, zoom = screen px per CSS px */
type Cam = { cx: number; cy: number; z: number };
type Box = { x: number; y: number; w: number; h: number };
const R: any = RECTS;
const SIZE: Record<string, { w: number; h: number }> = {
  desk0: R.desk0._root, desk2: R.desk2._root, desk3: R.desk3._root, desk4: R.desk4._root, bench: R.bench._root,
};
const PANEL = { w: 1200, h: 1080 }; // right half of the split layout
const fit = (r: Box, fill = 0.92, W = PANEL.w, H = PANEL.h): Cam =>
  ({ cx: r.x + r.w / 2, cy: r.y + r.h / 2, z: Math.min((W * fill) / r.w, (H * fill) / r.h) });
const push = (c: Cam, k = 1.06): Cam => ({ ...c, z: c.z * k });
const camAt = (f: number, keys: [number, Cam][]): Cam => {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [f1, c1] = keys[i], [f0, c0] = keys[i - 1];
    if (f <= f1) {
      const p = interpolate(f, [f0, f1], [0, 1], { easing: SMOOTH });
      return { cx: c0.cx + (c1.cx - c0.cx) * p, cy: c0.cy + (c1.cy - c0.cy) * p, z: c0.z * Math.pow(c1.z / c0.z, p) };
    }
  }
  return keys[keys.length - 1][1];
};
const toScreen = (cam: Cam, x: number, y: number, W = PANEL.w, H = PANEL.h) => ({ x: W / 2 + (x - cam.cx) * cam.z, y: H / 2 + (y - cam.cy) * cam.z });
const mid = (r: Box) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });

const Shot: React.FC<{ name: string; cam: Cam; W?: number; H?: number }> = ({ name, cam, W = PANEL.w, H = PANEL.h }) => {
  const s = SIZE[name];
  return (
    <Img src={staticFile(`shots/${name}.png`)} style={{
      position: 'absolute', left: W / 2 - cam.cx * cam.z, top: H / 2 - cam.cy * cam.z,
      width: s.w * cam.z, height: s.h * cam.z, boxShadow: '0 24px 70px rgba(0,0,0,.10)',
    }} />
  );
};
/* a marker drawn line by line over the sentence the AI got wrong, left to right */
const Mark: React.FC<{ cam: Cam; lines: Box[]; p: number; color?: string }> = ({ cam, lines, p, color = X.bad }) => (
  <>
    {lines.map((r, i) => {
      const share = Math.max(0, Math.min(1, p * lines.length - i));
      const s = toScreen(cam, r.x, r.y);
      return <div key={i} style={{ position: 'absolute', left: s.x, top: s.y, width: r.w * cam.z * share, height: r.h * cam.z,
        background: alpha(color, 0.16), boxShadow: `inset 0 -4px 0 ${color}` }} />;
    })}
  </>
);
const Cursor: React.FC<{ f: number; path: [number, number, number][]; click?: number }> = ({ f, path, click }) => {
  const fr = path.map((p) => p[0]);
  const o = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const, easing: SMOOTH };
  const x = interpolate(f, fr, path.map((p) => p[1]), o), y = interpolate(f, fr, path.map((p) => p[2]), o);
  const c = click === undefined ? 0 : interpolate(f, [click, click + 14], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <>
      {c > 0 && c < 1 && <div style={{ position: 'absolute', left: x - 36 * c, top: y - 36 * c, width: 72 * c, height: 72 * c, borderRadius: '50%', border: `3px solid ${alpha(X.ink, 1 - c)}` }} />}
      <svg width={34} height={34} viewBox="0 0 24 24" style={{ position: 'absolute', left: x - 4, top: y - 2 }}>
        <path d="M4 2l16 9.5-7 1.6 3.9 7.4-3 1.5-3.9-7.4L4.6 19z" fill={X.ink} stroke={X.paper} strokeWidth={1.4} strokeLinejoin="round" />
      </svg>
    </>
  );
};

/* ---------- layouts */
const Split: React.FC<{ kicker: string; color?: string; head: React.ReactNode; sub?: React.ReactNode; children: React.ReactNode }> = ({ kicker, color = X.ink, head, sub, children }) => {
  const f = useCurrentFrame();
  const a = t(f, 0, 8), b = t(f, 3, 9), c = t(f, 9, 9);
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1920 - PANEL.w, height: 1080, boxSizing: 'border-box', padding: '0 60px 0 100px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '0.08em', color, opacity: a }}>{kicker}</div>
        <div style={{ marginTop: 20, fontSize: 64, fontWeight: 600, lineHeight: 1.08, letterSpacing: '-0.035em', opacity: b, transform: `translateY(${(1 - b) * 24}px)` }}>{head}</div>
        {sub && <div style={{ marginTop: 26, fontSize: 36, fontWeight: 500, lineHeight: 1.3, color: X.grey, letterSpacing: '-0.015em', opacity: c, transform: `translateY(${(1 - c) * 16}px)` }}>{sub}</div>}
      </div>
      <div style={{ position: 'absolute', left: 1920 - PANEL.w, top: 0, width: PANEL.w, height: PANEL.h, overflow: 'hidden', background: X.wash }}>{children}</div>
    </AbsoluteFill>
  );
};

/* ---------- the story */
const Title: React.FC = () => {
  const f = useCurrentFrame();
  const a = t(f, 2, 10), b = t(f, Math.round(BEAT * 2), 10);
  return (
    <AbsoluteFill style={{ justifyContent: 'center', padding: '0 160px' }}>
      <div style={{ fontSize: 200, fontWeight: 700, letterSpacing: '-0.055em', lineHeight: 1, opacity: a, transform: `translateY(${(1 - a) * 30}px)` }}>Legible</div>
      <div style={{ marginTop: 30, fontSize: 64, fontWeight: 500, letterSpacing: '-0.03em', opacity: b, transform: `translateY(${(1 - b) * 20}px)` }}>
        checks <span style={{ boxShadow: `inset 0 -12px 0 ${alpha(X.cour, 0.25)}` }}>who said what</span> in legal AI drafts.
      </div>
    </AbsoluteFill>
  );
};

const Example: React.FC = () => {
  const f = useCurrentFrame();
  const r = { x: 1, y: 60, w: 684, h: 560 };
  const cam = camAt(f, [[0, fit(r)], [bar(1.5), push(fit(r))]]);
  return (
    <Split kicker="EXAMPLE · A COUR DE CASSATION DECISION" head="One decision, several voices." sub="The Court, the court of appeal, the parties, the case law it cites.">
      <Shot name="desk0" cam={cam} />
    </Split>
  );
};

const Problem: React.FC = () => {
  const f = useCurrentFrame();
  const r = { x: 711, y: 60, w: 488, h: 330 };
  const cam = camAt(f, [[0, fit(r)], [bar(1), push(fit(r), 1.04)]]);
  return (
    <Split kicker="THE PROBLEM" color={X.bad} head="AI drafts often mix them up." sub="Here, the court of appeal's reasoning is written as the Court's ruling.">
      <Shot name="desk0" cam={cam} />
      <Mark cam={cam} lines={R.desk0.wrongLines} p={interpolate(f, [8, 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: SMOOTH })} />
    </Split>
  );
};

const Attribute: React.FC = () => {
  const f = useCurrentFrame();
  const d0 = R.desk0;
  const both = { x: 40, y: 80, w: 1140, h: 980 }; // § 13, the thread and the draft sentence, filling the panel
  let body: React.ReactNode;
  if (f < 16) { // run the check
    const cam = fit({ x: 700, y: 760, w: 500, h: 220 });
    const v = toScreen(cam, mid(d0.verify).x, mid(d0.verify).y);
    body = <><Shot name="desk0" cam={cam} /><Cursor f={f} path={[[0, v.x + 240, v.y + 140], [9, v.x, v.y]]} click={10} /></>;
  } else {
    body = <Shot name="desk2" cam={camAt(f, [[16, fit(both, 0.96)], [bar(1), push(fit(both, 0.96), 1.04)]])} />;
  }
  return (
    <Split kicker="LEGIBLE" color={X.cour} head="Every line, attributed to who speaks." sub="Each sentence of the draft is traced to the paragraph it relies on.">
      {body}
    </Split>
  );
};

const Block: React.FC = () => {
  const f = useCurrentFrame();
  const d2 = R.desk2;
  const r = { x: d2.card.x, y: d2.card.y, w: d2.card.w, h: 360 };
  const cam = camAt(f, [[0, fit(r)], [bar(1.5), push(fit(r), 1.04)]]);
  return (
    <Split kicker="LEGIBLE" color={X.cour} head="Wrong speaker: blocked, with the proof." sub="§ 13 is the court of appeal, and the Court quashed it.">
      <Shot name="desk2" cam={cam} />
    </Split>
  );
};

const Fix: React.FC = () => {
  const f = useCurrentFrame();
  const d2 = R.desk2, d3 = R.desk3, d4 = R.desk4;
  let body: React.ReactNode;
  if (f < 30) {
    const cam = fit({ x: d2.card.x, y: d2.apply.y - 190, w: d2.card.w, h: 240 });
    const ap = toScreen(cam, mid(d2.apply).x, mid(d2.apply).y);
    body = <><Shot name="desk2" cam={cam} /><Cursor f={f} path={[[0, ap.x + 240, ap.y - 90], [18, ap.x, ap.y]]} click={20} /></>;
  } else if (f < 60) {
    body = <Shot name="desk3" cam={fit(d3.sel, 0.75)} />;
  } else {
    body = <Shot name="desk4" cam={fit({ x: 380, y: d4._root.h - 400, w: 820, h: 400 }, 0.98)} />;
  }
  return (
    <Split kicker="LEGIBLE" color={X.cour} head="Fixed from the source, before the client sees it.">
      {body}
    </Split>
  );
};

const Results: React.FC = () => {
  const f = useCurrentFrame();
  const table: Box = R.bench.table;
  const W = 1920, H = 760;
  const cam = camAt(f, [[0, fit(table, 0.94, W, H)], [bar(1), push(fit(table, 0.94, W, H), 1.03)]]);
  const a = t(f, 0, 8), b = t(f, 3, 9);
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 100, top: 90, right: 100 }}>
        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '0.08em', color: X.ok, opacity: a }}>RESULTS · 15 TEST SENTENCES</div>
        <div style={{ marginTop: 16, fontSize: 60, fontWeight: 600, letterSpacing: '-0.035em', opacity: b, transform: `translateY(${(1 - b) * 20}px)` }}>
          GPT-6 Luna gets 2–3 wrong. Legible gets none, and names every source.
        </div>
      </div>
      <div style={{ position: 'absolute', left: 0, top: 320, width: W, height: H, overflow: 'hidden' }}>
        <Shot name="bench" cam={cam} W={W} H={H} />
      </div>
    </AbsoluteFill>
  );
};

/* four strengths, same weight */
const Icon: React.FC<{ k: string }> = ({ k }) => {
  const s = { fill: 'none', stroke: X.ink, strokeWidth: 2.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <svg width={64} height={64} viewBox="0 0 24 24">
      {k === 'source' && <><path d="M7 3h7l4 4v14H7z" {...s} /><path d="M14 3v4h4M10 12h5M10 16h5" {...s} /></>}
      {k === 'fast' && <><circle cx="12" cy="13" r="8" {...s} /><path d="M12 9v4l3 2M10 2h4" {...s} /></>}
      {k === 'any' && <><rect x="3" y="4" width="7" height="7" {...s} /><rect x="14" y="4" width="7" height="7" {...s} /><rect x="3" y="15" width="7" height="6" {...s} /><path d="M17.5 14v7M14 17.5h7" {...s} /></>}
      {k === 'lock' && <><rect x="5" y="11" width="14" height="10" {...s} /><path d="M8 11V8a4 4 0 0 1 8 0v3" {...s} /></>}
    </svg>
  );
};
const POINTS = [
  { k: 'source', head: 'Every line sourced', sub: 'Paragraph and speaker for each sentence.' },
  { k: 'fast', head: 'Fast', sub: 'Under a second per sentence.' },
  { k: 'any', head: 'Works behind any legal AI', sub: 'Legora, Harvey, ChatGPT or your own model.' },
  { k: 'lock', head: 'Confidential by design', sub: 'Your case map stays on your servers.' },
];
const Why: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ padding: '0 100px', justifyContent: 'center' }}>
      <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '0.08em', opacity: t(f, 0, 8) }}>WHY LEGIBLE</div>
      <div style={{ marginTop: 40, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 28 }}>
        {POINTS.map((p, i) => {
          const a = t(f, Math.round(BEAT * i) + 2, 9);
          return (
            <div key={p.k} style={{ borderTop: `3px solid ${X.ink}`, paddingTop: 28, opacity: a, transform: `translateY(${(1 - a) * 24}px)` }}>
              <Icon k={p.k} />
              <div style={{ marginTop: 22, fontSize: 40, fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.12 }}>{p.head}</div>
              <div style={{ marginTop: 14, fontSize: 28, fontWeight: 500, lineHeight: 1.35, color: X.grey }}>{p.sub}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const End: React.FC = () => {
  const f = useCurrentFrame();
  const a = t(f, 0, 9);
  return (
    <AbsoluteFill style={{ justifyContent: 'center', padding: '0 160px' }}>
      <div style={{ fontSize: 180, fontWeight: 700, letterSpacing: '-0.055em', lineHeight: 1, opacity: a, transform: `translateY(${(1 - a) * 24}px)` }}>Legible</div>
      <div style={{ marginTop: 18, fontSize: 60, fontWeight: 500, letterSpacing: '-0.03em', opacity: t(f, 5, 8) }}>Who said it.</div>
    </AbsoluteFill>
  );
};

/* ---------- timeline, in bars */
const PLAN: [React.FC, number][] = [
  [Title, 1], [Example, 1.5], [Problem, 1], [Attribute, 1], [Block, 1.5], [Fix, 1], [Results, 1], [Why, 1.5], [End, 1],
];
const STARTS = PLAN.reduce<number[]>((acc, [, len], i) => [...acc, (acc[i] ?? 0) + len], [0]);
export const SITE_DEMO_FRAMES = bar(STARTS[STARTS.length - 1]);

export const SiteDemo: React.FC = () => {
  const f = useCurrentFrame();
  const vol = interpolate(f, [0, 8, SITE_DEMO_FRAMES - 45, SITE_DEMO_FRAMES - 2], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ background: X.paper, color: X.ink, fontFamily: FONT, fontFeatureSettings: '"tnum" 1' }}>
      <Audio src={staticFile('music.mp3')} trimBefore={MUSIC_FROM} volume={() => vol} />
      {PLAN.map(([Comp], i) => (
        <Sequence key={i} from={bar(STARTS[i])} durationInFrames={bar(STARTS[i + 1]) - bar(STARTS[i])}>
          <AbsoluteFill style={{ background: X.paper }}><Comp /></AbsoluteFill>
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
