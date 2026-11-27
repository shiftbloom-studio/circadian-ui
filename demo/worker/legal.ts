// SPDX-License-Identifier: AGPL-3.0-or-later
/** Imprint and privacy policy in English and German. Operator details come from the LEGAL var; nothing personal is hardcoded. */

export type LegalInfo = {
  name: string;
  business?: string;
  street: string;
  city: string;
  country: { en: string; de: string };
  email: string;
  phone?: string;
  vatId?: string;
  authority: string;
};
export type LegalKind = "privacy" | "datenschutz" | "imprint" | "impressum";
export const LEGAL_PATHS: Record<string, LegalKind> = {
  "/privacy": "privacy",
  "/datenschutz": "datenschutz",
  "/imprint": "imprint",
  "/impressum": "impressum"
};
const UPDATED = { en: "Last updated 27 November 2026", de: "Stand: 27. November 2026" };

export const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

/** LEGAL is a JSON string var; anything incomplete hides the legal pages instead of rendering half an imprint. */
export function parseLegal(raw: string | undefined): LegalInfo | null {
  if (!raw) return null;
  try {
    const l = JSON.parse(raw) as LegalInfo;
    if (!l.name || !l.street || !l.city || !l.email || !l.authority || !l.country?.en || !l.country?.de) return null;
    return l;
  } catch {
    return null;
  }
}

const CSS = `:root{--paper:#F5FAFE;--ink:#121A2B;--ink62:rgba(18,26,43,.68);--line:#D3E0EA;--root:#0F5BB8}
*{box-sizing:border-box}html{background:var(--paper);color:var(--ink)}
body{margin:0;font:400 17px/1.65 "General Sans",ui-sans-serif,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.wrap{max-width:1120px;margin:0 auto;padding:20px clamp(20px,4vw,40px) 48px}
header{display:flex;align-items:center;justify-content:space-between;padding:4px 0 20px;border-bottom:1px solid var(--line)}
.brand{display:inline-flex;align-items:center;gap:10px;color:var(--ink);text-decoration:none;font:600 22px/1 "Clash Display",ui-sans-serif,system-ui,sans-serif;letter-spacing:-.03em}
.dot{width:22px;height:22px;border-radius:50%;background:linear-gradient(135deg,#ffb36b 0 50%,#1b2452 50% 100%)}
main{max-width:44em;padding:clamp(28px,5vw,56px) 0 0}
h1,h2{font-family:"Clash Display",ui-sans-serif,system-ui,sans-serif;font-weight:600;letter-spacing:-.02em;line-height:1.15}
h1{font-size:clamp(32px,4.6vw,48px);margin:12px 0 0}h2{font-size:22px;margin:36px 0 10px}
p,address{margin:0 0 14px;font-style:normal}
a{color:var(--root);text-underline-offset:3px}a:hover{color:var(--ink)}
.label{font:500 12px/1.4 "JetBrains Mono",ui-monospace,monospace;letter-spacing:.16em;text-transform:lowercase;color:var(--ink62)}
.meta{display:flex;gap:16px;flex-wrap:wrap;margin:14px 0 28px;font-size:14px;color:var(--ink62)}
footer{margin-top:64px;padding-top:20px;border-top:1px solid var(--line);font-size:14px;color:var(--ink62)}
::selection{background:#D6ECFF}`;

export function legalPage(kind: LegalKind, l: LegalInfo): string {
  const de = kind === "datenschutz" || kind === "impressum";
  const lang = de ? "de" : "en";
  const isPrivacy = kind === "privacy" || kind === "datenschutz";
  const title = { privacy: "Privacy policy", datenschutz: "Datenschutzerklärung", imprint: "Imprint", impressum: "Impressum" }[kind];
  const other = { privacy: "/datenschutz", datenschutz: "/privacy", imprint: "/impressum", impressum: "/imprint" }[kind];
  const mail = `<a href="mailto:${esc(l.email)}">${esc(l.email)}</a>`;
  const address = `<address>${esc(l.name)}<br>${l.business ? `${esc(l.business)}<br>` : ""}${esc(l.street)}<br>${esc(l.city)}<br>${esc(l.country[lang])}</address>`;
  const body = isPrivacy ? (de ? privacyDe(address, mail, l) : privacyEn(address, mail, l)) : imprint(de, address, mail, l);
  const links = de
    ? `<a href="/">Zur Demo</a> · <a href="/datenschutz">Datenschutz</a> · <a href="/impressum">Impressum</a>`
    : `<a href="/">Back to the demo</a> · <a href="/privacy">Privacy</a> · <a href="/imprint">Imprint</a>`;
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} · circadian-ui</title><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/fonts/fonts.css"><style>${CSS}</style></head>
<body><div class="wrap"><header><a class="brand" href="/" aria-label="circadian-ui demo"><span class="dot" aria-hidden="true"></span><span>circadian</span></a></header>
<main><span class="label">${de ? "circadian-ui rechtliches" : "circadian-ui legal"}</span><h1>${title}</h1>
<div class="meta">${isPrivacy ? `<span>${UPDATED[lang]}</span>` : ""}<a href="${other}" hreflang="${de ? "en" : "de"}">${de ? "English" : "Deutsch"}</a></div>
${body}
</main>
<footer><p>${links}</p></footer>
</div></body></html>`;
}

function imprint(de: boolean, address: string, mail: string, l: LegalInfo) {
  const phone = l.phone
    ? `<br>${de ? "Telefon" : "Phone"}: <a href="tel:${esc(l.phone.replace(/[^\d+]/g, ""))}">${esc(l.phone)}</a>`
    : "";
  const vat = l.vatId
    ? `<p>${de ? "Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG" : "VAT ID pursuant to § 27a UStG"}: ${esc(l.vatId)}</p>`
    : "";
  return de
    ? `<p>Angaben gemäß § 5 DDG:</p>${address}<p>E-Mail: ${mail}${phone}</p>${vat}
<h2>Verbraucherstreitbeilegung</h2><p>Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>`
    : `<p>Information pursuant to § 5 DDG:</p>${address}<p>Email: ${mail}${phone}</p>${vat}
<h2>Consumer dispute resolution</h2><p>We are not willing or obliged to take part in dispute resolution proceedings before a consumer arbitration board.</p>`;
}

function privacyEn(address: string, mail: string, l: LegalInfo) {
  return `<p>This site is a live demo of the open source library circadian-ui. It has no accounts, sets no cookies, stores nothing in your browser and uses no analytics, tracking or advertising. Everything you do on the demo (moving the sun, picking a city, changing colors) is calculated in your browser and never sent to us. This policy covers the personal data that is processed nonetheless when you open the site, above all your IP address.</p>
<h2>Controller</h2>${address}<p>Email: ${mail}</p>
<h2>Hosting</h2>
<p>Cloudflare, Inc., 101 Townsend St., San Francisco, CA 94107, USA, runs this site on our behalf (as static files and a Cloudflare Worker). To do so, Cloudflare processes your IP address, the address of the page you request, the time, and details your browser sends, such as its user agent. You don't have to provide this data, but without it nothing can be shown to you.</p>
<p>Requests that our Worker handles (the start page, these legal pages and the fonts) are also logged, including the IP address, the approximate location Cloudflare derives from it, and the address requested. We use these logs only to fix errors and to prevent abuse, and they are deleted after at most 7 days.</p>
<p>Fonts are fetched by our Worker and delivered from this site itself, so your browser doesn't contact Fontshare or jsDelivr.</p>
<p>The legal basis is our legitimate interest in running the site securely and reliably (Art. 6(1)(f) GDPR). Cloudflare processes the data as our processor under a data processing agreement (Art. 28 GDPR). Cloudflare, Inc. is certified under the EU-U.S. Data Privacy Framework, for which the European Commission has adopted an adequacy decision (Art. 45 GDPR); the agreement also contains the EU standard contractual clauses. More in <a href="https://www.cloudflare.com/privacypolicy/">Cloudflare's privacy policy</a>.</p>
<h2>Your time and location</h2>
<p>The demo reads your device's clock, time zone and display settings (such as a preference for more contrast) to pick a theme. It does not ask for your location: the cities in the demo are a fixed list, and sunrise and sunset are calculated in your browser. None of this leaves your device.</p>
<h2>Links to other sites</h2>
<p>Links to GitHub and npm only take you there when you click them. Those sites have their own privacy policies.</p>
<h2>Email</h2>
<p>If you email us, we use your address and message only to reply (Art. 6(1)(f) GDPR) and delete them once the matter is settled, unless the law requires us to keep them.</p>
<h2>Your rights</h2>
<p>You have the right of access to your personal data (Art. 15 GDPR), to rectification (Art. 16), to erasure (Art. 17), to restriction of processing (Art. 18) and to data portability (Art. 20). To exercise them, email us. You can also lodge a complaint with a data protection supervisory authority (Art. 77 GDPR), for example the one where you live or the one responsible for us: ${esc(l.authority)}.</p>
<h2>Right to object</h2>
<p><strong>You may object at any time, on grounds relating to your particular situation, to the processing of your personal data based on Art. 6(1)(f) GDPR (Art. 21 GDPR).</strong></p>`;
}

function privacyDe(address: string, mail: string, l: LegalInfo) {
  return `<p>Diese Website ist eine Live-Demo der Open-Source-Bibliothek circadian-ui. Sie hat keine Benutzerkonten, setzt keine Cookies, speichert nichts in deinem Browser und verwendet keine Analyse-, Tracking- oder Werbedienste. Alles, was du in der Demo tust (die Sonne verschieben, eine Stadt wählen, Farben ändern), wird in deinem Browser berechnet und nie an uns gesendet. Diese Erklärung beschreibt, welche personenbezogenen Daten trotzdem verarbeitet werden, wenn du die Seite öffnest, vor allem deine IP-Adresse.</p>
<h2>Verantwortlicher</h2>${address}<p>E-Mail: ${mail}</p>
<h2>Hosting</h2>
<p>Cloudflare, Inc., 101 Townsend St., San Francisco, CA 94107, USA, betreibt diese Website in unserem Auftrag (als statische Dateien und einen Cloudflare Worker). Dazu verarbeitet Cloudflare deine IP-Adresse, die Adresse der aufgerufenen Seite, den Zeitpunkt und Angaben, die dein Browser mitsendet, etwa den User-Agent. Du musst diese Daten nicht bereitstellen, ohne sie kann dir aber nichts angezeigt werden.</p>
<p>Anfragen, die unser Worker bearbeitet (die Startseite, diese Rechtsseiten und die Schriften), werden zusätzlich protokolliert, samt IP-Adresse, dem ungefähren Standort, den Cloudflare daraus ableitet, und der aufgerufenen Adresse. Wir nutzen diese Protokolle nur, um Fehler zu beheben und Missbrauch zu verhindern; sie werden nach spätestens 7 Tagen gelöscht.</p>
<p>Schriften lädt unser Worker selbst und liefert sie von dieser Website aus, dein Browser verbindet sich also nicht mit Fontshare oder jsDelivr.</p>
<p>Rechtsgrundlage ist unser berechtigtes Interesse an einem sicheren und zuverlässigen Betrieb der Website (Art. 6 Abs. 1 lit. f DSGVO). Cloudflare verarbeitet die Daten als unser Auftragsverarbeiter auf Grundlage eines Auftragsverarbeitungsvertrags (Art. 28 DSGVO). Cloudflare, Inc. ist nach dem EU-U.S. Data Privacy Framework zertifiziert, für das ein Angemessenheitsbeschluss der Europäischen Kommission besteht (Art. 45 DSGVO); der Vertrag enthält zusätzlich die EU-Standardvertragsklauseln. Mehr dazu in der <a href="https://www.cloudflare.com/de-de/privacypolicy/">Datenschutzerklärung von Cloudflare</a>.</p>
<h2>Deine Uhrzeit und dein Standort</h2>
<p>Die Demo liest die Uhrzeit, die Zeitzone und die Anzeigeeinstellungen deines Geräts (etwa den Wunsch nach mehr Kontrast), um ein Farbschema zu wählen. Nach deinem Standort fragt sie nicht: Die Städte in der Demo sind eine feste Liste, und Sonnenauf- und -untergang werden in deinem Browser berechnet. Nichts davon verlässt dein Gerät.</p>
<h2>Links zu anderen Websites</h2>
<p>Links zu GitHub und npm führen dich nur dorthin, wenn du sie anklickst. Dort gelten deren eigene Datenschutzerklärungen.</p>
<h2>E-Mail</h2>
<p>Wenn du uns schreibst, nutzen wir deine Adresse und Nachricht nur, um dir zu antworten (Art. 6 Abs. 1 lit. f DSGVO), und löschen sie, sobald die Sache erledigt ist, es sei denn, das Gesetz verpflichtet uns zur Aufbewahrung.</p>
<h2>Deine Rechte</h2>
<p>Du hast das Recht auf Auskunft über deine personenbezogenen Daten (Art. 15 DSGVO), auf Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18) und Datenübertragbarkeit (Art. 20). Schreib uns dazu eine E-Mail. Außerdem kannst du dich bei einer Datenschutz-Aufsichtsbehörde beschweren (Art. 77 DSGVO), etwa bei der an deinem Wohnort oder bei der für uns zuständigen: ${esc(l.authority)}.</p>
<h2>Widerspruchsrecht</h2>
<p><strong>Du kannst der Verarbeitung deiner personenbezogenen Daten auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO jederzeit aus Gründen widersprechen, die sich aus deiner besonderen Situation ergeben (Art. 21 DSGVO).</strong></p>`;
}
