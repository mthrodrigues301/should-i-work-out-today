import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const dir = path.join(root, "marketing", "instagram-feed");
const keyArt = path.join(root, "marketing", "instagram-feed", "my-workout-key-art.png");
const W = 1080;
const H = 1350;
const PAPER = "#F4F2EB";
const INK = "#10130E";
const LIME = "#C8F342";
const GREY = "#62665E";
const esc = (value) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

function text(value, x, y, size, opts = {}) {
  const { fill = INK, weight = 800, leading = Math.round(size * 1.05), anchor = "start", tracking = -1 } = opts;
  return `<text x="${x}" y="${y}" fill="${fill}" font-family="Arial, Helvetica, sans-serif" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}" letter-spacing="${tracking}">${value.split("\n").map((line, i) => `<tspan x="${x}" dy="${i ? leading : 0}">${esc(line)}</tspan>`).join("")}</text>`;
}

function shell(inner) {
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H}" fill="${PAPER}"/>
    <rect x="54" y="54" width="972" height="1242" fill="none" stroke="${INK}" stroke-width="3"/>
    ${inner}
  </svg>`;
}

function workoutCard(label, exercise, details, completion = "0 OF 3 SETS") {
  return `<g transform="translate(112 724)">
    <rect width="856" height="405" rx="12" fill="${INK}"/>
    <rect x="28" y="28" width="800" height="68" rx="5" fill="${LIME}"/>
    ${text(label, 54, 72, 20, { weight: 900, tracking: 0 })}
    ${text(exercise, 33, 163, 44, { fill: "#F7F8F0", weight: 900, tracking: -1.6 })}
    ${text(details, 33, 218, 26, { fill: "#E1E4DA", weight: 700, tracking: -0.3 })}
    <rect x="33" y="265" width="790" height="2" fill="#566052"/>
    ${text(completion, 33, 317, 21, { fill: "#E1E4DA", weight: 800, tracking: 0 })}
    <rect x="33" y="342" width="790" height="30" rx="4" fill="#31382E"/>
    <rect x="33" y="342" width="270" height="30" rx="4" fill="${LIME}"/>
  </g>`;
}

async function cover(file, badge, title, subtitle) {
  const overlay = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H}" fill="#071007" fill-opacity="0.55"/>
    <rect x="54" y="54" width="972" height="1242" fill="none" stroke="#F8F7F0" stroke-width="3"/>
    <rect x="94" y="100" width="${badge.length > 16 ? 350 : 230}" height="50" fill="${LIME}"/>
    ${text(badge, 114, 133, 16, { weight: 900, tracking: 0 })}
    ${text(title, 94, 805, 105, { fill: "#F9F8F1", weight: 900, leading: 104, tracking: -3 })}
    <rect x="94" y="1032" width="132" height="8" fill="${LIME}"/>
    ${text(subtitle, 94, 1106, 30, { fill: "#F9F8F1", weight: 700, leading: 40, tracking: -0.5 })}
    ${text("SWIPE", 899, 1240, 17, { fill: "#F9F8F1", weight: 900, tracking: 1 })}
  </svg>`;
  await sharp(keyArt).resize(W, H, { fit: "cover", position: "centre" }).composite([{ input: Buffer.from(overlay) }]).png({ compressionLevel: 9 }).toFile(path.join(dir, file));
}

async function slide(file, page, eyebrow, title, body, card, bilingual = false) {
  const titleSize = bilingual ? 56 : 84;
  const titleLeading = bilingual ? 64 : 86;
  const bodySize = bilingual ? 27 : 32;
  const bodyLeading = bilingual ? 38 : 43;
  const bodyY = bilingual ? 570 : 550;
  const svg = shell(`
    <rect x="94" y="98" width="66" height="66" fill="${LIME}"/>
    ${text(String(page).padStart(2, "0"), 127, 140, 19, { weight: 900, tracking: 0, anchor: "middle" })}
    ${text("MY WORKOUT", 184, 140, 19, { weight: 900, tracking: 0 })}
    <rect x="94" y="221" width="130" height="7" fill="${LIME}"/>
    ${text(eyebrow, 94, 294, 20, { fill: GREY, weight: 900, tracking: 0 })}
    ${text(title, 94, 390, titleSize, { weight: 900, leading: titleLeading, tracking: bilingual ? -1.5 : -2.4 })}
    ${text(body, 94, bodyY, bodySize, { weight: 650, leading: bodyLeading, tracking: -0.4 })}
    ${workoutCard(...card)}
    ${text(`${page} / 5`, 950, 1240, 19, { fill: GREY, weight: 800, tracking: 0, anchor: "end" })}
  `);
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(path.join(dir, file));
}

const decks = [
  { prefix: "en", badge: "NEW VERSION", title: "MY\nWORKOUT.", subtitle: "Your training.\nOne exercise at a time.", slides: [
    ["A CLEAR PLAN", "YOUR NEXT\nEXERCISE.", "Choose a day. Start when you are ready.\nThe next step is always clear.", ["TODAY'S WORKOUT", "BARBELL SQUAT", "3 sets × 6–8 reps"]],
    ["PROGRESS", "EVERY SET\nCOUNTS.", "Mark one set or complete an exercise.\nYour pace sets the workout.", ["SET PROGRESS", "BENCH PRESS", "3 sets × 6–8 reps", "2 OF 3 SETS"]],
    ["REST", "REST WITH\nPURPOSE.", "Set your rest time and get an alert\nwhen it is time to return.", ["REST TIMER", "NEXT: LOW ROW", "01:30 remaining", "REST IN PROGRESS"]],
    ["HISTORY", "BUILD A\nRHYTHM.", "Your workouts, pauses, and time invested\nbecome a routine you can keep.", ["THIS WEEK", "3 WORKOUTS", "126 minutes trained", "KEEP GOING"]]
  ]},
  { prefix: "ptbr", badge: "NOVA VERSÃO", title: "MEU\nTREINO.", subtitle: "Seu treino.\nUm exercício de cada vez.", slides: [
    ["PLANO CLARO", "SEU PRÓXIMO\nEXERCÍCIO.", "Escolha o dia. Comece quando estiver pronto.\nO próximo passo está sempre claro.", ["TREINO DE HOJE", "AGACHAMENTO LIVRE", "3 séries × 6–8 repetições"]],
    ["PROGRESSO", "CADA SÉRIE\nCONTA.", "Marque uma série ou conclua o exercício.\nO treino segue o seu ritmo.", ["PROGRESSO", "SUPINO RETO", "3 séries × 6–8 repetições", "2 DE 3 SÉRIES"]],
    ["DESCANSO", "DESCANSE COM\nPROPÓSITO.", "Defina o tempo de descanso e receba\no aviso na hora de voltar.", ["TEMPO DE DESCANSO", "PRÓXIMO: REMADA BAIXA", "01:30 restante", "DESCANSO EM ANDAMENTO"]],
    ["HISTÓRICO", "CRIE O SEU\nRITMO.", "Treinos, pausas e tempo investido\nviram uma rotina que você mantém.", ["ESTA SEMANA", "3 TREINOS", "126 minutos de treino", "CONTINUE"]]
  ]},
  { prefix: "bilingual", badge: "NEW VERSION / NOVA VERSÃO", title: "MY WORKOUT.\nMEU TREINO.", subtitle: "Your training. Seu treino.\nOne exercise at a time.", slides: [
    ["PLAN / PLANO", "YOUR NEXT EXERCISE.\nSEU PRÓXIMO EXERCÍCIO.", "Choose your day. Escolha o dia.\nStart when you are ready. Comece quando quiser.", ["TODAY / HOJE", "BARBELL SQUAT", "3 sets × 6–8 reps"], true],
    ["PROGRESS / PROGRESSO", "EVERY SET COUNTS.\nCADA SÉRIE CONTA.", "Track a set or the whole exercise.\nMarque uma série ou o exercício completo.", ["PROGRESS / PROGRESSO", "BENCH PRESS", "3 sets × 6–8 reps", "2 OF 3 SETS"], true],
    ["REST / DESCANSO", "REST WITH PURPOSE.\nDESCANSE COM PROPÓSITO.", "Set your rest time and receive the alert.\nDefina o descanso e receba o aviso.", ["REST / DESCANSO", "NEXT: LOW ROW", "01:30 remaining", "REST IN PROGRESS"], true],
    ["HISTORY / HISTÓRICO", "BUILD A RHYTHM.\nCRIE UM RITMO.", "A workout designed around the routine\nyou can keep. Uma rotina para manter.", ["THIS WEEK / SEMANA", "3 WORKOUTS", "126 minutes trained", "KEEP GOING"], true]
  ]}
];

await fs.mkdir(dir, { recursive: true });
for (const deck of decks) {
  await cover(`${deck.prefix}-01.png`, deck.badge, deck.title, deck.subtitle);
  for (const [i, item] of deck.slides.entries()) await slide(`${deck.prefix}-0${i + 2}.png`, i + 2, ...item);
}

await fs.writeFile(path.join(dir, "README.md"), `# Instagram feed carousels\n\nFinal 4:5 Instagram feed assets (1080 × 1350 px). Publish each language sequence in numerical order, from 01 to 05.\n`);
console.log("Created Instagram-feed-ready carousel assets.");
