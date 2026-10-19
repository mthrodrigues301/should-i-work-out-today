import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const output = path.join(root, "marketing", "carousels");
const keyArt = path.join(output, "my-workout-key-art.png");
const W = 1080;
const H = 1350;
const PAPER = "#F2F0E9";
const INK = "#0D100D";
const LIME = "#C7EF47";
const MUTED = "#5B5F59";

const esc = (value) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const lines = (value, x, y, size, leading, fill = INK, weight = 800) =>
  `<text x="${x}" y="${y}" fill="${fill}" font-family="Arial, Helvetica, sans-serif" font-size="${size}" font-weight="${weight}" letter-spacing="${size > 60 ? -2 : -0.5}">${value.split("\n").map((line, index) => `<tspan x="${x}" dy="${index ? leading : 0}">${esc(line)}</tspan>`).join("")}</text>`;

function baseSvg(inner) {
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H}" fill="${PAPER}"/>
    <rect x="35" y="35" width="1010" height="1280" fill="none" stroke="${INK}" stroke-width="3"/>
    ${inner}
  </svg>`;
}

function phone(x, y, accent, label) {
  return `<g transform="translate(${x} ${y})">
    <rect width="310" height="500" rx="34" fill="${INK}"/>
    <rect x="11" y="11" width="288" height="478" rx="26" fill="#171C16" stroke="${accent}" stroke-width="2"/>
    <rect x="111" y="25" width="88" height="9" rx="4.5" fill="#6D756C"/>
    ${lines(label, 35, 92, 20, 24, "#EEF0E9", 700)}
    <rect x="35" y="126" width="240" height="136" rx="12" fill="${accent}"/>
    ${lines("YOUR NEXT", 55, 166, 18, 22, INK, 800)}
    ${lines("EXERCISE", 55, 192, 25, 28, INK, 900)}
    <rect x="35" y="288" width="240" height="2" fill="#4E584C"/>
    ${lines("03 × 10–12", 35, 331, 29, 33, "#EEF0E9", 800)}
    <rect x="35" y="386" width="240" height="62" rx="6" fill="${accent}"/>
    ${lines("START", 55, 425, 19, 23, INK, 900)}
  </g>`;
}

async function makeCover(file, title, subtitle, tag) {
  const bilingualTitle = title.includes("\nMEU");
  const subtitleY = bilingualTitle ? 1090 : 1140;
  const markerY = bilingualTitle ? 1030 : 1080;
  const titleSize = bilingualTitle ? 76 : 112;
  const titleLeading = bilingualTitle ? 84 : 112;
  const overlay = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H}" fill="#071007" fill-opacity="0.53"/>
    <rect x="35" y="35" width="1010" height="1280" fill="none" stroke="#F2F0E9" stroke-opacity="0.9" stroke-width="3"/>
    <rect x="64" y="70" width="167" height="46" fill="${LIME}"/>
    ${lines(tag, 82, 101, 16, 20, INK, 900)}
    ${lines(title, 64, 835, titleSize, titleLeading, "#F7F6F0", 900)}
    <rect x="64" y="${markerY}" width="130" height="7" fill="${LIME}"/>
    ${lines(subtitle, 64, subtitleY, 27, 35, "#F7F6F0", 600)}
    ${lines("01 — 05", 932, 1252, 17, 21, "#F7F6F0", 800)}
  </svg>`;
  await sharp(keyArt).resize(W, H, { fit: "cover", position: "centre" }).composite([{ input: Buffer.from(overlay) }]).png().toFile(path.join(output, file));
}

async function makeSlide(file, index, kicker, title, body, phoneLabel, variant = "standard") {
  const isBi = variant === "bilingual";
  const titleSize = isBi ? 53 : 82;
  const leading = isBi ? 62 : 88;
  const dividerY = isBi ? 465 : 420;
  const bodyY = isBi ? 535 : 495;
  const bodySize = isBi ? 25 : 31;
  const bodyLeading = isBi ? 35 : 41;
  const svg = baseSvg(`
    <rect x="65" y="70" width="56" height="56" fill="${LIME}"/>
    ${lines(String(index).padStart(2, "0"), 79, 108, 17, 20, INK, 900)}
    ${lines(kicker, 65, 196, 20, 24, MUTED, 800)}
    ${lines(title, 65, 285, titleSize, leading, INK, 900)}
    <rect x="65" y="${dividerY}" width="114" height="7" fill="${LIME}"/>
    ${lines(body, 65, bodyY, bodySize, bodyLeading, INK, 600)}
    <rect x="65" y="960" width="950" height="2" fill="#A4A89E"/>
    ${lines("MY WORKOUT", 65, 1018, 19, 22, INK, 900)}
    ${lines("Should I Work Out Today?", 65, 1052, 18, 22, MUTED, 600)}
    ${phone(665, 655, index % 2 ? LIME : "#EFF1E8", phoneLabel)}
    <circle cx="942" cy="1175" r="72" fill="${INK}"/>
    ${lines(`${index} / 5`, 906, 1181, 17, 20, "#F2F0E9", 800)}
  `);
  await sharp(Buffer.from(svg)).png().toFile(path.join(output, file));
}

const carousels = [
  {
    prefix: "en", tag: "NEW RELEASE", title: "MY\nWORKOUT.", subtitle: "Your training. One exercise at a time.",
    slides: [
      ["A CLEAR PLAN", "YOUR NEXT\nEXERCISE.", "Choose your day, start the timer,\nand focus on what is in front of you.", "TODAY"],
      ["PROGRESS", "EVERY SET\nCOUNTS.", "Mark one set or the whole exercise.\nYour workout moves at your pace.", "PROGRESS"],
      ["REST", "REST WITH\nPURPOSE.", "Set your rest time. Keep the sound on.\nGet a reminder when the break ends.", "REST"],
      ["YOUR HISTORY", "BUILD A\nRHYTHM.", "See training days, pauses, time spent,\nand the routine you are building.", "HISTORY"]
    ]
  },
  {
    prefix: "ptbr", tag: "NOVA VERSÃO", title: "MEU\nTREINO.", subtitle: "Seu treino. Um exercício de cada vez.",
    slides: [
      ["PLANO CLARO", "SEU PRÓXIMO\nEXERCÍCIO.", "Escolha o dia, inicie o cronômetro\ne foque no que está à frente.", "HOJE"],
      ["PROGRESSO", "CADA SÉRIE\nCONTA.", "Marque uma série ou o exercício completo.\nO treino acompanha o seu ritmo.", "PROGRESSO"],
      ["DESCANSO", "DESCANSE COM\nPROPÓSITO.", "Defina o tempo de descanso. Ative o som.\nReceba o aviso quando ele terminar.", "DESCANSO"],
      ["HISTÓRICO", "CRIE O SEU\nRITMO.", "Veja os dias de treino, as pausas, o tempo\ninvestido e a rotina que você constrói.", "HISTÓRICO"]
    ]
  },
  {
    prefix: "bilingual", tag: "NEW RELEASE / NOVA VERSÃO", title: "MY WORKOUT.\nMEU TREINO.", subtitle: "Your training. Seu treino.\nOne exercise at a time. Um exercício de cada vez.",
    slides: [
      ["PLANO / PLAN", "YOUR NEXT EXERCISE.\nSEU PRÓXIMO EXERCÍCIO.", "Choose your day. Escolha o dia.\nStart when you are ready. Comece quando estiver pronto.", "TODAY", "bilingual"],
      ["PROGRESS / PROGRESSO", "EVERY SET COUNTS.\nCADA SÉRIE CONTA.", "Track a set or an entire exercise.\nMarque uma série ou o exercício completo.", "PROGRESS", "bilingual"],
      ["REST / DESCANSO", "REST WITH PURPOSE.\nDESCANSE COM PROPÓSITO.", "Set your rest time and receive the alert\nwhen it ends. Defina o descanso e receba o aviso.", "REST", "bilingual"],
      ["HISTORY / HISTÓRICO", "BUILD A RHYTHM.\nCRIE UM RITMO.", "A focused workout experience, built for\nthe routine you can keep. Uma rotina possível.", "HISTORY", "bilingual"]
    ]
  }
];

await fs.mkdir(output, { recursive: true });
for (const carousel of carousels) {
  await makeCover(`${carousel.prefix}-01-cover.png`, carousel.title, carousel.subtitle, carousel.tag);
  for (const [offset, slide] of carousel.slides.entries()) {
    await makeSlide(`${carousel.prefix}-${String(offset + 2).padStart(2, "0")}.png`, offset + 2, ...slide);
  }
}

console.log("Created 15 Instagram carousel slides in marketing/carousels.");
