// SPDX-License-Identifier: AGPL-3.0-or-later
// The shiftbloom bloom, exactly as shiftbloom.studio draws it (brand book v2, "The Mark").
// viewBox 0 0 200 200, four interleaved petal rings + seed. Gradient only inside the mark.
// Sizes >= 32px use the gradient; below that (favicons) use the solid variant.
const RINGS = [
  { r: 100, petals: 10, w: 32, l: 90, root: "#D8163F", tip: "#FF2E52", offset: 0 },
  { r: 74, petals: 10, w: 25.16, l: 66.6, root: "#FF2E52", tip: "#FF7E9E", offset: 18 },
  { r: 50, petals: 8, w: 19, l: 45, root: "#FF7E9E", tip: "#FFC2D3", offset: 40.5 },
  { r: 27, petals: 6, w: 12.96, l: 24.3, root: "#FFB4CA", tip: "#FFDCE7", offset: 70.5 },
];
const n = (v: number) => Number(v.toFixed(2));
const petal = (w: number, l: number) => `M 0,0 C ${w},0 ${w},${-n(0.55 * l)} 0,${-l} C ${-w},${-n(0.55 * l)} ${-w},0 0,0 Z`;

/**
 * `variant: "solid"` is the flat Bloom Red bloom for favicons and sizes below 32px.
 * `anim` wraps each ring in <g class="ring rN"> (N = 0 outer … 3 inner) for unfurl/breathe motion.
 * `id` must be unique per page when more than one gradient bloom is rendered.
 */
export function bloomSvg({ size = 30, variant = "gradient", id = "sb-bloom-ring", cls = "", title = "", anim = false }: { size?: number; variant?: "gradient" | "solid"; id?: string; cls?: string; title?: string; anim?: boolean } = {}): string {
  const solid = variant === "solid";
  const defs = solid
    ? ""
    : `<defs>${RINGS.map((g) => `<linearGradient id="${id}-${g.r}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="${-g.l}"><stop offset="0%" stop-color="${g.root}"/><stop offset="100%" stop-color="${g.tip}"/></linearGradient>`).join("")}</defs>`;
  let body = "";
  RINGS.forEach((g, i) => {
    const d = petal(g.w, g.l);
    const fill = solid ? "#FF2E52" : `url(#${id}-${g.r})`;
    if (anim) body += `<g class="ring r${i}">`;
    for (let p = 0; p < g.petals; p++) {
      body += `<path d="${d}" fill="${fill}" transform="translate(100 100) rotate(${n(g.offset + (360 / g.petals) * p)}) translate(0 ${-n(g.r - g.l)})"/>`;
    }
    if (anim) body += "</g>";
  });
  const a11y = title ? `role="img" aria-label="${title}"` : `aria-hidden="true"`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 200 200"${cls ? ` class="${cls}"` : ""} ${a11y}>${title ? `<title>${title}</title>` : ""}${defs}${body}<circle cx="100" cy="100" r="7" fill="#FF2E52"/></svg>`;
}

/** Favicon: the solid bloom, as on shiftbloom.studio's small icons. */
export const faviconSvg = (): string => bloomSvg({ size: 32, variant: "solid" }).replace(/ aria-hidden="true"/, "");
