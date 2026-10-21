// Branded practice-set PDF renderer (pdf-lib). Imported ONLY via dynamic import from the admin PDF Builder.
import { PDFDocument, PDFName, PDFString, rgb, degrees, type PDFFont, type PDFPage, type PDFImage, type RGB } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import QRCode from 'qrcode';
import regularUrl from '@/assets/fonts/DejaVuSans.ttf?url';
import boldUrl from '@/assets/fonts/DejaVuSans-Bold.ttf?url';
import logoUrl from '@/assets/pdf-logo.png?url';

export type PdfQuestion = { num: number; question: string; options: string[]; answer: string; explanation?: string | null; topic?: string | null; difficulty?: string | null };
export type PdfInput = {
  title: string; subtitle: string; readFirst: string[]; disclaimer: string;
  sections: { subject: string; items: PdfQuestion[] }[];
  hubUrl: string; channelUrl: string; shareUrl: string;
  /** Optional exam guide page shown as a second text link. */
  guideUrl?: string | null;
};

const hex = (h: string): RGB => rgb(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255);
const C = {
  purple: hex('#9333ea'), magenta: hex('#d946ef'), cyan: hex('#22d3ee'), blue: hex('#3b82f6'),
  title: hex('#6d28d9'), black: hex('#000000'), gray: hex('#555555'), light: hex('#888888'),
  box: hex('#f5efff'), head: hex('#e9d5ff'), grid: hex('#999999'), green: hex('#16a34a'),
};
const W = 595.28, H = 841.89, L = 47, R = 548;
const TOP = H - 66, BOTTOM = 48;

function lerp(a: number[], b: number[], t: number) { return a.map((v, i) => v + (b[i] - v) * t); }
const P = [147, 51, 234], M = [217, 70, 239], Cy = [34, 211, 238];

/** Display-only clean-up of LaTeX tokens that leak into bank text (questions are not edited). */
export const tidy = (t: string) => String(t ?? '').replace(/\\times/g, '×').replace(/\\div/g, '÷').replace(/\\cdot/g, '·').replace(/\\le(q)?\b/g, '≤').replace(/\\ge(q)?\b/g, '≥').replace(/\$/g, '');

function wrap(text: string, font: PDFFont, size: number, max: number): string[] {
  const out: string[] = [];
  for (const para of tidy(text).replace(/\r/g, '').split('\n')) {
    const words = para.split(/\s+/).filter(Boolean);
    let line = '';
    for (const w of words) {
      const t = line ? `${line} ${w}` : w;
      if (font.widthOfTextAtSize(t, size) <= max || !line) line = t; else { out.push(line); line = w; }
    }
    out.push(line);
  }
  return out;
}

function addLink(doc: PDFDocument, page: PDFPage, x: number, y: number, w: number, h: number, url: string) {
  const annot = doc.context.register(doc.context.obj({
    Type: 'Annot', Subtype: 'Link', Rect: [x, y, x + w, y + h], Border: [0, 0, 0],
    A: { Type: 'Action', S: 'URI', URI: PDFString.of(url) },
  }));
  const annots = page.node.lookup(PDFName.of('Annots'));
  if (annots && 'push' in (annots as any)) (annots as any).push(annot);
  else page.node.set(PDFName.of('Annots'), doc.context.obj([annot]));
}

export async function renderPracticePdf(input: PdfInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const [reg, bold, logoBytes] = await Promise.all([regularUrl, boldUrl, logoUrl].map((u) => fetch(u).then((r) => r.arrayBuffer())));
  const F = await doc.embedFont(reg, { subset: true });
  const B = await doc.embedFont(bold, { subset: true });
  const logo = await doc.embedPng(logoBytes);
  const qr = await doc.embedPng(await QRCode.toDataURL(input.hubUrl, { margin: 1, width: 360, errorCorrectionLevel: 'M' }));
  doc.setTitle(input.title); doc.setAuthor('MCQsAI'); doc.setSubject('Unofficial practice set — original questions by MCQsAI');
  doc.setProducer('MCQsAI PDF Builder'); doc.setCreator('MCQsAI');

  const pages: PDFPage[] = [];
  let page!: PDFPage; let y = TOP;

  const decorate = (p: PDFPage) => {
    // faint logo + diagonal watermark (drawn first, sits behind content)
    p.drawImage(logo, { x: 152, y: -6, width: 256, height: 256, opacity: 0.06 });
    p.drawText('mcqsai.com', { x: 135, y: 330, size: 66, font: B, color: C.purple, opacity: 0.07, rotate: degrees(35) });
    // header
    p.drawImage(logo, { x: L - 5, y: H - 34, width: 24, height: 24 });
    p.drawText('MCQS', { x: L + 25, y: H - 27, size: 11.5, font: B, color: C.purple });
    p.drawText('AI', { x: L + 25 + B.widthOfTextAtSize('MCQS', 11.5), y: H - 27, size: 11.5, font: B, color: C.blue });
    const t = 'mcqsai.com';
    p.drawText(t, { x: W - L + 5 - F.widthOfTextAtSize(t, 7.5), y: H - 27, size: 7.5, font: F, color: C.light });
    // purple → magenta → cyan rule
    const x0 = L - 5, x1 = W - L + 5, steps = 160, sw = (x1 - x0) / steps;
    for (let i = 0; i < steps; i++) {
      const t2 = i / (steps - 1);
      const c = t2 < 0.5 ? lerp(P, M, t2 * 2) : lerp(M, Cy, (t2 - 0.5) * 2);
      p.drawRectangle({ x: x0 + i * sw, y: H - 39.5, width: sw + 0.4, height: 3.4, color: rgb(c[0] / 255, c[1] / 255, c[2] / 255) });
    }
  };
  const newPage = () => { page = doc.addPage([W, H]); pages.push(page); decorate(page); y = TOP; };
  const ensure = (h: number) => { if (y - h < BOTTOM) newPage(); };
  const text = (s: string, x: number, size: number, font: PDFFont, color: RGB = C.black) => page.drawText(s, { x, y, size, font, color });

  // ---------- Cover ----------
  newPage();
  y = H - 92;
  for (const ln of wrap(input.title, B, 20, R - L)) { text(ln, L, 20, B, C.title); y -= 24; }
  y += 6;
  for (const ln of wrap(input.subtitle, F, 10, R - L)) { text(ln, L, 10, F, C.gray); y -= 13; }
  y -= 8;
  // Please read first box with QR
  const qrS = 78, innerW = R - L - qrS - 24;
  const bullets = input.readFirst.flatMap((b, i) => wrap(`• ${b}`, F, 8.6, innerW).map((l, j) => ({ l, gap: j === 0 && i > 0 })));
  const boxH = Math.max(qrS + 16, 26 + bullets.length * 11.6);
  const boxTop = y;
  page.drawRectangle({ x: L, y: boxTop - boxH, width: R - L + 5, height: boxH, color: C.box, borderColor: C.purple, borderWidth: 0.9 });
  y = boxTop - 15; text('Please read first', L + 9, 8.8, B);
  y -= 13;
  bullets.forEach(({ l }) => { text(l, L + 9, 8.6, F); y -= 11.6; });
  page.drawRectangle({ x: R - qrS - 3, y: boxTop - 8 - qrS - 2, width: qrS + 4, height: qrS + 4, color: rgb(1, 1, 1) });
  page.drawImage(qr, { x: R - qrS - 1, y: boxTop - 8 - qrS, width: qrS, height: qrS });
  addLink(doc, page, R - qrS - 1, boxTop - 8 - qrS, qrS, qrS, input.hubUrl);
  y = boxTop - boxH - 20;
  // Summary table
  const tx = 129, tw = 340, c1 = 255, rh = 18;
  const rows: [string, string][] = [['Section', 'Questions'], ...input.sections.map((s) => [s.subject, String(s.items.length)] as [string, string]), ['Total', String(input.sections.reduce((n, s) => n + s.items.length, 0))]];
  rows.forEach(([a, b], i) => {
    const top = y - i * rh;
    page.drawRectangle({ x: tx, y: top - rh, width: tw, height: rh, color: i === 0 ? C.head : rgb(1, 1, 1), borderColor: C.grid, borderWidth: 0.6 });
    page.drawLine({ start: { x: tx + c1, y: top }, end: { x: tx + c1, y: top - rh }, thickness: 0.6, color: C.grid });
    const f = i === 0 || i === rows.length - 1 ? B : F;
    page.drawText(a, { x: tx + 6, y: top - 12.5, size: 8.2, font: f });
    page.drawText(b, { x: tx + c1 + 6, y: top - 12.5, size: 8.2, font: f });
  });
  y -= rows.length * rh + 16;
  const note = 'Unofficial practice set — original questions by MCQsAI';
  text(note, L, 8.6, B, C.title); y -= 13;
  for (const ln of [...wrap(input.disclaimer, F, 7.4, R - L + 10), ...wrap('Found a mistake? Please tell us: https://mcqsai.com (Contact / Report an error). Mock tests and more practice: https://mcqsai.com', F, 7.4, R - L + 10)]) { text(ln, L, 7.4, F, C.gray); y -= 10.2; }

  // ---------- Questions ----------
  newPage();
  const optX = L + 30, qMax = R - L + 8;
  const qHeight = (q: PdfQuestion) => {
    const ql = wrap(`Q${q.num}. ${q.question}`, B, 8.6, qMax);
    const ol = q.options.flatMap((o, i) => wrap(`${'ABCD'[i]}) ${o}`, F, 8.4, R - optX));
    return { ql, ol, h: ql.length * 12 + ol.length * 11.6 + 10 };
  };
  input.sections.forEach((sec) => {
    const first = sec.items[0] ? qHeight(sec.items[0]).h : 0;
    ensure(26 + first);
    if (y < TOP) y -= 6;
    text(sec.subject, L, 13, B, C.title); y -= 18;
    sec.items.forEach((q) => {
      const { ql, ol, h } = qHeight(q);
      ensure(h);
      ql.forEach((l, i) => { text(l, i === 0 ? L : L + 16, 8.6, B); y -= 12; });
      ol.forEach((l) => { text(l, optX, 8.4, F); y -= 11.6; });
      y -= 10;
    });
  });

  // ---------- Answer key ----------
  const all = input.sections.flatMap((s) => s.items);
  const keyRows = Math.ceil(all.length / 10), kh = 20;
  ensure(46 + keyRows * kh);
  y -= 14; text('Answer Key', L, 20, B, C.title); y -= 16;
  const kx = L - 5, kw = (W - 2 * (L - 5)) / 10;
  all.forEach((q, i) => {
    const r = Math.floor(i / 10), c = i % 10, top = y - r * kh;
    page.drawRectangle({ x: kx + c * kw, y: top - kh, width: kw, height: kh, borderColor: C.grid, borderWidth: 0.6 });
    const s = `Q${q.num}: ${q.answer}`;
    page.drawText(s, { x: kx + c * kw + (kw - F.widthOfTextAtSize(s, 7.6)) / 2, y: top - 13, size: 7.6, font: F });
  });
  y -= keyRows * kh + 22;

  // ---------- Next step box ----------
  const ns: { pre: string; link: string; post: string; url: string; color: RGB }[] = [
    { pre: '1) ', link: 'Take the full online practice test', post: ' for an instant score (scan the QR).', url: input.hubUrl, color: C.purple },
    { pre: '2) ', link: 'Join the MCQsAI WhatsApp channel', post: ' for daily MCQs, answer keys and updates.', url: input.channelUrl, color: C.green },
    { pre: '3) ', link: 'Share this practice set with a friend on WhatsApp', post: '.', url: input.shareUrl, color: C.green },
  ];
  const nsW = R - L - qrS - 30;
  const lines = ns.map((n) => ({ n, l: wrap(`${n.pre}${n.link}${n.post}`, F, 8.8, nsW) }));
  const nsH = Math.max(qrS + 18, 30 + lines.reduce((s, x) => s + x.l.length, 0) * 13 + (input.guideUrl ? 12 : 0));
  ensure(nsH + 4);
  const nTop = y;
  page.drawRectangle({ x: L, y: nTop - nsH, width: R - L + 5, height: nsH, color: C.box, borderColor: C.purple, borderWidth: 0.9 });
  y = nTop - 17; text('Next step', L + 11, 9, B); y -= 15;
  lines.forEach(({ n, l }) => {
    l.forEach((ln, i) => {
      let x = L + 11;
      if (i === 0) {
        page.drawText(n.pre, { x, y, size: 8.8, font: F }); x += F.widthOfTextAtSize(n.pre, 8.8);
        // link part (bold, coloured, underlined) — may be cut by wrap; render what fits on line 1
        const rest = ln.slice(n.pre.length);
        const linkTxt = rest.startsWith(n.link) ? n.link : rest;
        const lw = B.widthOfTextAtSize(linkTxt, 8.8);
        page.drawText(linkTxt, { x, y, size: 8.8, font: B, color: n.color });
        page.drawLine({ start: { x, y: y - 1.6 }, end: { x: x + lw, y: y - 1.6 }, thickness: 0.7, color: n.color });
        addLink(doc, page, x, y - 3, lw, 12, n.url);
        x += lw;
        const after = rest.slice(linkTxt.length);
        if (after) page.drawText(after, { x, y, size: 8.8, font: F });
      } else page.drawText(ln, { x, y, size: 8.8, font: F });
      y -= 13;
    });
  });
  if (input.guideUrl) {
    const g = 'Exam guide: ' + input.guideUrl.split('?')[0].replace(/^https?:\/\//, '');
    const gw = Math.min(F.widthOfTextAtSize(g, 8), nsW);
    page.drawText(g, { x: L + 11, y, size: 8, font: F, color: C.purple });
    addLink(doc, page, L + 11, y - 3, gw, 11, input.guideUrl);
    y -= 12;
  }
  page.drawRectangle({ x: R - qrS - 3, y: nTop - 10 - qrS - 2, width: qrS + 4, height: qrS + 4, color: rgb(1, 1, 1) });
  page.drawImage(qr, { x: R - qrS - 1, y: nTop - 10 - qrS, width: qrS, height: qrS });
  addLink(doc, page, R - qrS - 1, nTop - 10 - qrS, qrS, qrS, input.hubUrl);
  y = nTop - nsH - 10;

  // ---------- Explanations ----------
  const withExp = all.filter((q) => String(q.explanation || '').trim());
  if (withExp.length) {
    newPage();
    text('Explanations', L, 13, B, C.title); y -= 20;
    withExp.forEach((q) => {
      const head = [`Q${q.num}`, q.answer, q.topic, q.difficulty?.toLowerCase()].filter(Boolean).join(' · ');
      const hl = wrap(head, B, 8.4, qMax), el = wrap(String(q.explanation), F, 8.4, qMax);
      ensure(hl.length * 11.5 + el.length * 11.5 + 6);
      hl.forEach((l) => { text(l, L, 8.4, B); y -= 11.5; });
      el.forEach((l) => { text(l, L, 8.4, F); y -= 11.5; });
      y -= 6;
    });
  }

  // ---------- Footers ----------
  const foot = `MCQsAI · ${input.title} · Unofficial practice set — original questions by MCQsAI · mcqsai.com`;
  pages.forEach((p, i) => {
    const fl = wrap(foot, F, 6.6, 440)[0];
    p.drawText(fl, { x: L - 5, y: 22, size: 6.6, font: F, color: C.light });
    const pn = `Page ${i + 1}`;
    p.drawText(pn, { x: W - L + 5 - F.widthOfTextAtSize(pn, 6.6), y: 22, size: 6.6, font: F, color: C.light });
  });

  return doc.save();
}
