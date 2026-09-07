const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const outputDirectory = path.join(__dirname, "launch-feed");
const bilingualDirectory = path.join(__dirname, "bilingual-feed");
fs.mkdirSync(outputDirectory, { recursive: true });
fs.mkdirSync(bilingualDirectory, { recursive: true });

const palette = {
  lime: "#eaff38",
  ink: "#11110f",
  cream: "#f1efe8",
  gray: "#77766f",
};

const posts = [
  { file: "01-welcome", background: "cream", foreground: "ink", kicker: "WELCOME TO", lines: ["SHOULD I", "WORK OUT", "TODAY?"], accent: "THE ANSWER IS ALWAYS YES." },
  { file: "02-five-minutes", background: "lime", foreground: "ink", kicker: "TODAY'S ANSWER", lines: ["YES."], accent: "FIVE MINUTES STILL COUNT." },
  { file: "03-start-first", background: "ink", foreground: "cream", kicker: "YOUR REASON TO MOVE", lines: ["START", "FIRST."], accent: "MOTIVATION OFTEN SHOWS UP LATER." },
  { file: "04-start-small", background: "cream", foreground: "ink", kicker: "NO ENERGY?", lines: ["START", "SMALL."], accent: "KEEP THE PROMISE YOU MADE TO YOURSELF." },
  { file: "05-future-self", background: "lime", foreground: "ink", kicker: "TODAY'S ANSWER", lines: ["YES."], accent: "YOUR FUTURE SELF IS ALREADY GRATEFUL." },
  { file: "06-visit-site", background: "ink", foreground: "cream", kicker: "NEED A REASON?", lines: ["GET", "YOURS."], accent: "SHOULDIWORKOUT.TODAY" },
  { file: "07-consistency", background: "cream", foreground: "ink", kicker: "REMEMBER", lines: ["ONE DAY", "BECOMES", "A HABIT."], accent: "SHOWING UP IS THE WIN." },
  { file: "08-your-pace", background: "lime", foreground: "ink", kicker: "TODAY'S ANSWER", lines: ["YES."], accent: "YOUR PACE. YOUR WORKOUT. YOUR WIN." },
  { file: "09-community", background: "ink", foreground: "cream", kicker: "YOUR TURN", lines: ["WHAT MADE", "YOU SAY", "YES TODAY?"], accent: "TELL US IN THE COMMENTS." },
];

const portuguesePosts = [
  { file: "01-welcome", background: "cream", foreground: "ink", kicker: "BEM-VINDO AO", lines: ["DEVO", "TREINAR", "HOJE?"], accent: "A RESPOSTA É SEMPRE SIM." },
  { file: "02-five-minutes", background: "lime", foreground: "ink", kicker: "RESPOSTA DE HOJE", lines: ["SIM."], accent: "CINCO MINUTOS TAMBÉM CONTAM." },
  { file: "03-start-first", background: "ink", foreground: "cream", kicker: "SEU MOTIVO PARA SE MOVER", lines: ["COMECE", "PRIMEIRO."], accent: "A MOTIVAÇÃO COSTUMA APARECER DEPOIS." },
  { file: "04-start-small", background: "cream", foreground: "ink", kicker: "SEM ENERGIA?", lines: ["COMECE", "DEVAGAR."], accent: "CUMPRA A PROMESSA QUE FEZ A SI MESMO." },
  { file: "05-future-self", background: "lime", foreground: "ink", kicker: "RESPOSTA DE HOJE", lines: ["SIM."], accent: "SEU EU DO FUTURO JÁ ESTÁ AGRADECENDO." },
  { file: "06-visit-site", background: "ink", foreground: "cream", kicker: "PRECISA DE UM MOTIVO?", lines: ["ENCONTRE", "O SEU."], accent: "SHOULDIWORKOUT.TODAY" },
  { file: "07-consistency", background: "cream", foreground: "ink", kicker: "LEMBRE-SE", lines: ["UM DIA", "VIRA UM", "HÁBITO."], accent: "TER COMEÇADO JÁ É UMA VITÓRIA." },
  { file: "08-your-pace", background: "lime", foreground: "ink", kicker: "RESPOSTA DE HOJE", lines: ["SIM."], accent: "SEU RITMO. SEU TREINO. SUA VITÓRIA." },
  { file: "09-community", background: "ink", foreground: "cream", kicker: "SUA VEZ", lines: ["O QUE FEZ", "VOCÊ DIZER", "SIM HOJE?"], accent: "CONTE PARA A GENTE NOS COMENTÁRIOS." },
];

function escapeXml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&apos;",
  })[character]);
}

function arrowMark(x, y, size, foreground, tile = true) {
  const padding = size * 0.22;
  const start = x + padding;
  const end = x + size - padding;
  return `
    ${tile ? `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${size * 0.22}" fill="${palette.lime}"/>` : ""}
    <path d="M${start} ${y + end - x} ${end} ${y + padding} M${x + size * 0.42} ${y + padding} H${end} V${y + size * 0.58}"
      fill="none" stroke="${foreground}" stroke-width="${size * 0.125}" stroke-linecap="square" stroke-linejoin="miter"/>`;
}

function renderPost(post, index) {
  const background = palette[post.background];
  const foreground = palette[post.foreground];
  const invertedAccent = post.background === "lime" ? palette.ink : palette.lime;
  const lineCount = post.lines.length;
  const longestLine = Math.max(...post.lines.map((line) => Array.from(line).length));
  const fontSize = lineCount === 1
    ? 330
    : lineCount === 2
      ? (longestLine >= 8 ? 165 : 190)
      : (longestLine >= 10 ? 140 : 150);
  const lineHeight = fontSize * 0.86;
  const totalHeight = (lineCount - 1) * lineHeight;
  const firstY = 600 - totalHeight / 2;
  const mainLines = post.lines.map((line, lineIndex) =>
    `<text x="72" y="${firstY + lineIndex * lineHeight}" class="main">${escapeXml(line)}</text>`
  ).join("\n");
  const accentFill = foreground;
  const markTile = post.background !== "lime";
  const markStroke = palette.ink;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
  <rect width="1080" height="1350" fill="${background}"/>
  <style>
    text { font-family: Arial, Helvetica, sans-serif; fill: ${foreground}; }
    .brand { font-size: 25px; font-weight: 900; letter-spacing: 1.5px; }
    .kicker { font-size: 28px; font-weight: 800; letter-spacing: 4px; }
    .main { font-size: ${fontSize}px; font-weight: 900; letter-spacing: -8px; }
    .accent { font-size: 34px; font-weight: 900; letter-spacing: 1px; fill: ${accentFill}; }
    .footer { font-size: 22px; font-weight: 800; letter-spacing: 1px; }
    .number { font-size: 20px; font-weight: 900; }
  </style>
  ${arrowMark(72, 58, 72, markStroke, markTile)}
  <text x="164" y="106" class="brand">SHOULD I WORK OUT TODAY?</text>
  <line x1="72" y1="164" x2="1008" y2="164" stroke="${foreground}" stroke-width="2" opacity=".35"/>
  <text x="72" y="250" class="kicker">${escapeXml(post.kicker)}</text>
  ${mainLines}
  <rect x="72" y="985" width="12" height="86" fill="${invertedAccent}"/>
  <text x="112" y="1038" class="accent">${escapeXml(post.accent)}</text>
  <line x1="72" y1="1172" x2="1008" y2="1172" stroke="${foreground}" stroke-width="2" opacity=".35"/>
  <text x="72" y="1240" class="footer">SHOULDIWORKOUT.TODAY</text>
  <text x="72" y="1282" class="footer">@SHOULDIWORKOUT.TODAY</text>
  <text x="1008" y="1282" text-anchor="end" class="number">0${index + 1}/09</text>
</svg>`;
}

async function generate() {
  for (const [index, post] of posts.entries()) {
    const svg = renderPost(post, index);
    const svgPath = path.join(outputDirectory, `${post.file}.svg`);
    const pngPath = path.join(outputDirectory, `${post.file}.png`);
    fs.writeFileSync(svgPath, svg);
    await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(pngPath);

    const bilingualEnglishPath = path.join(bilingualDirectory, `${post.file}-01-en.png`);
    await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(bilingualEnglishPath);

    const portugueseSvg = renderPost(portuguesePosts[index], index);
    const bilingualPortuguesePath = path.join(bilingualDirectory, `${post.file}-02-pt.png`);
    await sharp(Buffer.from(portugueseSvg)).png({ compressionLevel: 9 }).toFile(bilingualPortuguesePath);
  }
  console.log(`Generated ${posts.length} English posts and ${posts.length} bilingual carousel pairs.`);
}

generate().catch((error) => {
  console.error(error);
  process.exit(1);
});
