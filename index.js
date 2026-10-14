#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const REQUIRED_PACKAGES = [
  "tailwindcss",
  "framer-motion",
  "lucide-react",
  "clsx",
  "tailwind-merge",
];

const DEPENDENCY_FIELDS = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
];

const HOUSE_SPRING = {
  type: "spring",
  stiffness: 140,
  damping: 20,
  mass: 0.8,
};

const HOVER_SPRING = {
  type: "spring",
  stiffness: 260,
  damping: 22,
  mass: 0.6,
};

const ANTI_GENERIC_RULES = `
## Strict anti-generic rules

These rules are mandatory for every vibe. Breaking one of them drops the page out of Awwwards SOTD territory.

1. No default Tailwind blue. Forbidden utilities: \`bg-blue-500\`, \`bg-blue-600\`, \`text-blue-600\`, \`border-blue-500\`, \`from-blue-500\`, \`to-indigo-500\`, and any \`blue-*\` / \`indigo-*\` / \`sky-*\` accent. Color comes only from the vibe tokens below.
2. No default gray cards. Forbidden pattern: \`bg-gray-100 rounded-lg shadow\` or \`bg-white border border-gray-200 rounded-xl p-6\` repeated as a feature card. Surfaces use the vibe background, a 1px translucent border, and almost no shadow.
3. No boring equal 3-column grids. Do not use \`grid-cols-3\` of identical icon + heading + paragraph cards. Composition is a 12-column asymmetric grid with unequal spans and unequal visual weight.
4. Framer Motion spring physics are mandatory for entrances, hovers, layout shifts, and nav indicators. Do not use \`transition: { duration, ease }\` or CSS \`transition: all 300ms ease\` for primary motion. House spring: \`{ type: "spring", stiffness: 140, damping: 20, mass: 0.8 }\`. Hover spring: \`{ type: "spring", stiffness: 260, damping: 22, mass: 0.6 }\`.
5. Bento cards must contain an interactive mini-UI mockup. A Lucide icon, a title, and a sentence is not a card. Each cell needs a working micro-interface: scrubber, ticker, message stack, cursor spotlight, toggle, or live metric.
6. One accent color per page. Hairlines stay 1px and translucent (\`border-white/10\` or \`rgba(0,0,0,0.08)\`). Never use a 2px solid gray border.
7. Type is not Inter, Roboto, Arial, or system-ui alone. Pair a grotesque or geometric sans with one editorial serif, used sparingly.
8. Respect \`prefers-reduced-motion\`: set opacity to 1 and transforms to none, and skip pointer-tracking. Springs still define the motion when motion is allowed.
`.trim();

const BLUEPRINTS = {
  "dark-luxury-tech": {
    label: "Dark luxury tech",
    summary:
      "Near-black field, champagne metal, a single warm spotlight, and type large enough to feel like a product film still. Think SOTD hardware and AI studios: quiet surfaces, expensive edges, no neon dashboard chrome.",
    css: `
:root {
  --bg: #070708;
  --bg-elevated: #101114;
  --surface: rgba(255, 255, 255, 0.03);
  --ink: #f4f0e8;
  --muted: rgba(244, 240, 232, 0.62);
  --line: rgba(255, 255, 255, 0.08);
  --accent: #d6b48a;
  --glow: rgba(214, 180, 138, 0.22);
  --font-sans: "Geist", "PP Neue Montreal", "Satoshi", sans-serif;
  --font-serif: "Newsreader", "Instrument Serif", serif;
  --display: clamp(3.5rem, 8vw, 8.75rem);
  --headline: clamp(2rem, 4vw, 3.5rem);
  --body: clamp(1rem, 1.15vw, 1.125rem);
  --tracking-display: -0.045em;
  --leading-display: 0.9;
  --radius-card: 28px;
}
`.trim(),
    backgrounds: `
- Page: \`#070708\` with a vignette that darkens the corners to \`#030303\`.
- Elevated panel: \`#101114\`.
- Glass surface: \`rgba(255, 255, 255, 0.03)\` plus \`backdrop-blur-2xl\`.
- Do not use \`bg-black\`, \`bg-zinc-900\`, or \`bg-neutral-900\` as the page. Those read as default Tailwind dark mode.
`.trim(),
    borders: `
- Every card, nav, and divider is exactly 1px: \`border border-white/10\` which resolves to \`rgba(255, 255, 255, 0.08)\`–\`0.10\`.
- Hairline rules use \`h-px w-full bg-white/10\`.
- No solid \`border-zinc-800\` and no 2px borders.
`.trim(),
    type: `
- Display: \`clamp(3.5rem, 8vw, 8.75rem)\`, tracking \`-0.045em\`, leading \`0.9\`, weight 500.
- Headline: \`clamp(2rem, 4vw, 3.5rem)\`, tracking \`-0.035em\`, leading \`0.95\`.
- Body: \`clamp(1rem, 1.15vw, 1.125rem)\`, leading \`1.6\`, color \`var(--muted)\`.
- Sans: Geist, PP Neue Montreal, or Satoshi. Serif accent (one word or one caption only): Newsreader or Instrument Serif, italic.
`.trim(),
    lighting: `
- One ambient spotlight, top-right or behind the hero word: a radial gradient \`circle at 80% 10%\`, color \`rgba(214, 180, 138, 0.22)\`, blur 120px, size about 55vw. It never sits behind a button.
- A second, colder fill at 8% opacity (\`rgba(120, 140, 180, 0.08)\`) on the opposite corner so the field is not flat black.
- Film grain overlay at 3–4% opacity, \`mix-blend-overlay\`, pointer-events none.
- Shadows are ambient only: \`0 30px 80px rgba(0, 0, 0, 0.45)\`. No \`shadow-lg\` drop shadows on cards.
`.trim(),
  },
  "editorial-swiss": {
    label: "Editorial Swiss",
    summary:
      "Warm paper, black ink, one Swiss red, and a grid you can see. Headlines collide with images. Hairline rules do the decorating. This is magazine architecture, not a SaaS marketing template.",
    css: `
:root {
  --bg: #f3efe6;
  --bg-elevated: #fffdf8;
  --surface: #fffdf8;
  --ink: #111111;
  --muted: rgba(17, 17, 17, 0.64);
  --line: rgba(17, 17, 17, 0.14);
  --accent: #e10600;
  --glow: rgba(225, 6, 0, 0.08);
  --font-sans: "Helvetica Now Display", "ABC Diatype", "Geist", sans-serif;
  --font-serif: "Times Now", "PP Editorial New", "Newsreader", serif;
  --display: clamp(4rem, 11vw, 11rem);
  --headline: clamp(2.25rem, 4.5vw, 4rem);
  --body: clamp(1.0625rem, 1.2vw, 1.25rem);
  --tracking-display: -0.05em;
  --leading-display: 0.82;
  --radius-card: 0px;
}
`.trim(),
    backgrounds: `
- Page: warm paper \`#f3efe6\`. Never \`bg-white\` or \`bg-gray-50\`.
- Elevated sheet: \`#fffdf8\`, used for images and pull-quotes only.
- No gradients on the page background. Flat paper is the luxury.
`.trim(),
    borders: `
- 1px ink at 14% opacity: \`border border-black/15\` or \`rgba(17, 17, 17, 0.14)\`.
- Structural rules run to the edge of the 12-column grid. They are \`h-px bg-black/15\`, not cards with shadows.
- Corner radius is 0. Swiss editorial does not use \`rounded-2xl\` feature cards.
`.trim(),
    type: `
- Display: \`clamp(4rem, 11vw, 11rem)\`, tracking \`-0.05em\`, leading \`0.82\`, weight 500, often lowercase or tight grotesk.
- Headline: \`clamp(2.25rem, 4.5vw, 4rem)\`, tracking \`-0.04em\`, leading \`0.9\`.
- Body: \`clamp(1.0625rem, 1.2vw, 1.25rem)\`, leading \`1.45\`, measure max 62ch.
- Index numbers and captions in a mono or tabular grotesque at 11–12px, tracking \`0.14em\`, uppercase.
- Serif is reserved for pull quotes. Sans does the headlines.
`.trim(),
    lighting: `
- No glow orbs. Light is the paper itself.
- Images carry a 4% warm multiply (\`mix-blend-multiply\` over \`#f3efe6\`) so photography sits in the page instead of floating in a white box.
- The single red \`#e10600\` is a printed accent: one rule, one word, or one index number. It is not a button fill repeated down the page.
- If a hover needs light, shift the paper to \`#fffdf8\` with the house spring. Do not add a drop shadow.
`.trim(),
  },
  "clean-neo-minimal": {
    label: "Clean neo-minimal",
    summary:
      "Soft stone canvas, ink almost black, deep pine used once, and large fields of quiet. The craft is spacing, baseline alignment, and one precise interaction per section — not more components.",
    css: `
:root {
  --bg: #f6f6f4;
  --bg-elevated: #ffffff;
  --surface: rgba(255, 255, 255, 0.72);
  --ink: #0e0e0e;
  --muted: rgba(14, 14, 14, 0.58);
  --line: rgba(0, 0, 0, 0.08);
  --accent: #1f3d32;
  --glow: rgba(31, 61, 50, 0.1);
  --font-sans: "Geist", "ABC Monument Grotesk", "Satoshi", sans-serif;
  --font-serif: "PP Editorial New", "Newsreader", serif;
  --display: clamp(3.25rem, 7vw, 7.5rem);
  --headline: clamp(1.75rem, 3vw, 2.75rem);
  --body: clamp(1rem, 1.1vw, 1.0625rem);
  --tracking-display: -0.04em;
  --leading-display: 0.92;
  --radius-card: 24px;
}
`.trim(),
    backgrounds: `
- Page: stone \`#f6f6f4\`. Not \`bg-white\` and not \`bg-slate-50\`.
- Cards: \`#ffffff\` at 72% over the stone, or solid white only when a mini-UI needs a readable screen.
- Alternate bands stay inside a 2% lightness shift (\`#f6f6f4\` to \`#efefec\`). No alternating gray sections.
`.trim(),
    borders: `
- 1px \`rgba(0, 0, 0, 0.08)\`: \`border border-black/10\`.
- Dividers are the same 1px token. Do not mix \`border-gray-200\` with \`divide-gray-100\`.
`.trim(),
    type: `
- Display: \`clamp(3.25rem, 7vw, 7.5rem)\`, tracking \`-0.04em\`, leading \`0.92\`, weight 500.
- Headline: \`clamp(1.75rem, 3vw, 2.75rem)\`, tracking \`-0.03em\`, leading \`1\`.
- Body: \`clamp(1rem, 1.1vw, 1.0625rem)\`, leading \`1.65\`, max measure 60ch.
- Numerals are tabular. Captions are 12px, tracking \`0.08em\`, uppercase, color \`var(--muted)\`.
`.trim(),
    lighting: `
- Diffuse light only. A soft white radial at 40% opacity, 70vw wide, centered behind the hero type. No colored orbs.
- Card elevation is a hair of shadow: \`0 1px 0 rgba(255,255,255,0.8) inset, 0 24px 48px rgba(14,14,14,0.04)\`.
- Accent pine \`#1f3d32\` appears once: a caret, a live status dot, or a single word. Buttons are ink on stone, not green fills.
`.trim(),
  },
};

const COMPONENTS = {
  "bento-grid": {
    title: "12-column asymmetric Bento grid",
    body: `
Build one section, not a card gallery. The grid is the composition.

## Architecture

- Wrapper: \`<section className="relative px-[clamp(1.25rem,4vw,4rem)] py-[clamp(4rem,10vw,8rem)]">\`
- A 12-column header sits above the grid and is itself asymmetric: the title occupies columns 1–7, the lede occupies columns 9–12. Column 8 is empty. That gap is intentional.
- Grid: \`grid grid-cols-1 gap-3 md:grid-cols-12 md:gap-4\`.
- Desktop span map, in this order:
  1. Stage — \`md:col-span-7 md:row-span-2\`, min-height 520px. Primary mini-UI.
  2. Signal — \`md:col-span-5\`, min-height 248px. Scrubber.
  3. Thread — \`md:col-span-5\`, min-height 248px. Message stack. This cell sits under Signal, beside the lower half of Stage.
  4. Proof — \`md:col-span-8\`, min-height 220px. Draggable metric rail.
  5. Quote — \`md:col-span-4\`, min-height 220px. Editorial pull quote.
- Do not collapse this into three equal columns at any breakpoint. Below \`md\`, stack in the same order with unequal min-heights (320, 200, 220, 180, 180).

## Card shell

Shared classes, using the active vibe tokens, never gray/blue utilities:

\`relative flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 md:p-8\`

Header row inside every cell: a 11px uppercase label (tracking 0.14em, muted) and a live status dot in \`var(--accent)\`. The rest of the cell is the mini-UI, aligned to the bottom.

## Mandatory mini-UIs

1. Stage: a fake product surface. A cursor-follow spotlight (\`radial-gradient\` 180px, accent at 18% opacity) tracks the pointer with the hover spring. Under it, a metric ticker counts between two numbers using \`animate\` from Framer Motion (spring, stiffness 140). A small row of three pills toggles the metric. The toggle pill uses \`layoutId="stage-pill"\`.
2. Signal: a 48-bar waveform. Bars are \`w-px\` or \`w-0.5\` with heights from a fixed array. Pointer x scrubs the active index. The active bar uses \`var(--accent)\`; others use \`var(--line)\`. Readout of the scrubbed value sits top-right.
3. Thread: three message rows. On hover of the card, rows shift \`y\` by -6, -2, and 4 with stagger 0.04 and the house spring, revealing a reply composer. This is not a static list.
4. Proof: horizontal rail of four numbers. Drag with \`drag="x"\` and \`dragConstraints\`. A 1px progress hairline under the rail maps drag position to width.
5. Quote: serif italic quote, attribution in the sans caption style, and a one-line index (\`01 — 05\`). No icon.

## Motion

\`\`\`jsx
const list = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
};
const item = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 140, damping: 20, mass: 0.8 } },
};
\`\`\`

- Parent is \`motion.div\` with \`variants={list}\`, \`initial="hidden"\`, \`whileInView="show"\`, \`viewport={{ once: true, margin: "-10%" }}\`.
- Each cell is \`motion.article\` with \`variants={item}\` and \`whileHover={{ y: -4, transition: { type: "spring", stiffness: 260, damping: 22, mass: 0.6 } }}\`.
- Reduced motion: provide a \`useReducedMotion()\` branch that sets \`initial={false}\` and disables hover y and pointer spotlight.

## Composition rules

- Use \`cn()\` built from \`clsx\` and \`tailwind-merge\` for span and state classes.
- Lucide icons are allowed only as 14px inline controls inside a mini-UI (play, drag handle). They are never the hero of a cell.
- Do not put a heading and paragraph as the only content of any cell.
`.trim(),
  },
  "editorial-hero": {
    title: "Staggered editorial hero",
    body: `
A full-viewport opening spread. Type and image occupy the same 12 columns and overlap. Nothing is centered.

## Architecture

- \`<section className="relative min-h-[100svh] overflow-hidden">\` on the page background token.
- Inner grid: \`grid min-h-[100svh] grid-cols-12 gap-x-4 px-[clamp(1.25rem,4vw,4rem)] pb-8 pt-28\`.
- Column map:
  - Col 1: vertical index. \`writing-mode: vertical-rl\`, rotated 180deg, caption style, text "Index 01 — Featured". It spans the full height and sits on the hairline of column 1.
  - Cols 1–8, starting around 18vh: the headline. Three or four lines, each line its own \`motion.span\` set to \`display: block\`. Size is \`var(--display)\`. Last line may switch to the serif italic for one word only.
  - Cols 7–12, row overlapping the headline (pull it up with \`-mt-[12vh]\` on desktop): the image plate. Aspect \`4/5\`, max-height 72vh. It crosses the headline on purpose. The headline remains selectable and above the image (\`z-10\` on type, \`z-0\` on image).
  - Bottom bar, columns 1–12, \`self-end\`: a 1px top border in \`var(--line)\`, then a 12-column meta row: issue label, location, year, and a text button "Enter project" with an arrow that moves 8px on hover via the hover spring. The button is not a filled blue pill. It is ink text plus a 1px underline.
- Top-left or top-right of the section leaves room for the floating nav. Do not put a second navbar inside the hero.

## Image reveal

- Wrap the image in \`motion.div\` with \`style={{ overflow: "hidden" }}\` and animate \`clipPath\` from \`inset(100% 0% 0% 0%)\` to \`inset(0% 0% 0% 0%)\` using the house spring, delayed by 0.15s.
- Image scale animates from 1.12 to 1 over the same spring so the crop settles as the mask opens.
- A caption sits on the bottom edge of the image, mixed blend, and translates toward the pointer by a maximum of 12px. Smooth that translation with \`useSpring\` from Framer Motion (stiffness 140, damping 20, mass 0.8), not a CSS transition.

## Type stagger

\`\`\`jsx
const lines = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
const line = {
  hidden: { opacity: 0, y: "40%" },
  show: { opacity: 1, y: "0%", transition: { type: "spring", stiffness: 140, damping: 20, mass: 0.8 } },
};
\`\`\`

Each line is wrapped in \`overflow-hidden\` so the y travel clips. Do not fade the whole \`h1\` in as one block.

## Rules

- No centered stack of eyebrow + h1 + subcopy + two buttons.
- No gradient blob behind the headline.
- No stock "hero image on the right, text on the left" 50/50 split. The overlap is the layout.
- Body lede, if present, is columns 1–5 under the headline, color \`var(--muted)\`, max 42ch. It enters last in the stagger.
- Reduced motion: clip-path fully open, y at 0, opacity 1, pointer caption disabled.
`.trim(),
  },
  "floating-glass-nav": {
    title: "Floating glassmorphic navbar",
    body: `
A pill that floats inside the viewport, not a full-bleed white bar stuck to \`top: 0\`.

## Architecture

- \`<motion.header className="fixed left-1/2 top-4 z-50 w-[min(44rem,calc(100%-1.5rem))] -translate-x-1/2">\`
- Pill: \`flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-[color:var(--surface)] px-2 py-2 backdrop-blur-2xl\`
- Shadow is ambient and low: \`shadow-[0_20px_60px_rgba(0,0,0,0.18)]\`. On the paper vibes, drop the shadow alpha to 0.06.
- Interior is three zones:
  1. Wordmark, \`px-3\`, sans, tracking \`-0.03em\`. No logo icon block.
  2. Links, centered, \`hidden md:flex\`. Four links maximum.
  3. One action, \`ml-auto\`, height 36px, \`rounded-full px-4\`, background \`var(--ink)\`, color the page background. Not \`bg-blue-600\`.

## Active indicator

- Each link is \`relative px-3 py-1.5 text-sm\`.
- The active link renders a \`motion.span\` with \`layoutId="nav-pill"\` absolutely behind the label: \`absolute inset-0 rounded-full bg-current/10\`.
- \`layoutId\` transition uses the house spring. Do not crossfade backgrounds with a duration tween.
- Current page label uses \`text-[color:var(--ink)]\`; inactive uses \`var(--muted)\`.

## Magnetic hover

- On pointer move inside a link, set \`x\` and \`y\` to the offset from the link center, clamped to 6px.
- Apply with \`animate={{ x, y }}\` and the hover spring.
- On leave, animate back to \`{ x: 0, y: 0 }\` with the same spring.

## Scroll behavior

- Track scroll direction with a ref of the last \`window.scrollY\`.
- Past 80px, scrolling down animates the header to \`y: -120\` (fully offscreen, since top-4 plus height is under 80px, use \`-140\` if needed). Scrolling up animates \`y: 0\`.
- Transition: \`{ type: "spring", stiffness: 140, damping: 20, mass: 0.8 }\`. Do not use \`transition-transform duration-300\`.
- When hidden, \`pointer-events: none\`.

## Mobile

- Below \`md\`, links collapse into a single "Menu" text button. Opening it drops a glass panel from the pill (\`origin-top\`, scale from 0.96 and opacity 0 to 1 with the house spring). The panel is the same surface and 1px border, radius 24px, not a full-screen white drawer.
- Panel links are stacked, 48px tall, with the same \`layoutId\` treatment if one is current.

## Rules

- The bar never spans edge to edge.
- No hamburger icon as the only craft. The word "Menu" is enough; a 14px Lucide icon may sit beside it.
- Border stays 1px and translucent. Blur is \`backdrop-blur-2xl\`. If the background is too opaque to see the page through it, the glass has failed — lower the surface alpha.
- Reduced motion: snap \`y\` without spring, disable magnetic offset, keep the indicator in place.
`.trim(),
  },
};

function textResult(text, isError = false) {
  return {
    isError,
    content: [{ type: "text", text }],
  };
}

function lookupPackage(pkgJson, name) {
  for (const field of DEPENDENCY_FIELDS) {
    const bucket = pkgJson?.[field];
    if (bucket && typeof bucket === "object" && !Array.isArray(bucket)) {
      const version = bucket[name];
      if (typeof version === "string" && version.length > 0) {
        return { field, version };
      }
    }
  }
  return null;
}

async function loadPackageJson(projectPath) {
  if (typeof projectPath !== "string" || projectPath.trim().length === 0) {
    throw new Error("projectPath must be a non-empty path to a project root or a package.json file.");
  }

  const resolved = path.resolve(projectPath.trim());
  const packageJsonPath = resolved.toLowerCase().endsWith(`${path.sep}package.json`)
    || resolved.toLowerCase().endsWith("package.json")
    ? resolved
    : path.join(resolved, "package.json");

  let raw;
  try {
    raw = await readFile(packageJsonPath, "utf8");
  } catch (error) {
    if (error && error.code === "ENOENT") {
      throw new Error(`No package.json found at ${packageJsonPath}`);
    }
    throw new Error(`Could not read ${packageJsonPath}: ${error instanceof Error ? error.message : String(error)}`);
  }

  try {
    const pkg = JSON.parse(raw);
    if (!pkg || typeof pkg !== "object" || Array.isArray(pkg)) {
      throw new Error("package.json must be a JSON object.");
    }
    return { packageJsonPath, pkg };
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`package.json at ${packageJsonPath} is not valid JSON.`);
    }
    throw error;
  }
}

function auditProject(packageJsonPath, pkg) {
  const rows = REQUIRED_PACKAGES.map((name) => {
    const found = lookupPackage(pkg, name);
    return found
      ? { name, installed: true, version: found.version, field: found.field }
      : { name, installed: false };
  });

  const missing = rows.filter((row) => !row.installed).map((row) => row.name);
  const lines = [
    "Awwwards design stack audit",
    `Project: ${path.dirname(packageJsonPath)}`,
    `package.json: ${packageJsonPath}`,
    `Name: ${typeof pkg.name === "string" ? pkg.name : "(unnamed)"}`,
    "",
    "Packages:",
    ...rows.map((row) =>
      row.installed
        ? `- ${row.name}@${row.version} — installed (${row.field})`
        : `- ${row.name} — MISSING`
    ),
    "",
  ];

  if (missing.length === 0) {
    lines.push("All required packages are installed. No install command is required.");
  } else {
    lines.push("Missing: " + missing.join(", "));
    lines.push("");
    lines.push("Install command:");
    lines.push(`npm install ${missing.join(" ")}`);
  }

  return lines.join("\n");
}

function blueprintFor(vibe) {
  const blueprint = BLUEPRINTS[vibe];
  if (!blueprint) {
    throw new Error(`Unknown vibe "${vibe}".`);
  }

  return [
    `# Awwwards SOTD blueprint — ${blueprint.label}`,
    "",
    blueprint.summary,
    "",
    "## Tokens",
    "",
    blueprint.css,
    "",
    "### Backgrounds",
    blueprint.backgrounds,
    "",
    "### 1px translucent borders",
    blueprint.borders,
    "",
    "### Fluid typography",
    blueprint.type,
    "",
    "### Ambient lighting",
    blueprint.lighting,
    "",
    "### Motion",
    `House spring (entrances, layout, scroll): \`${JSON.stringify(HOUSE_SPRING)}\`.`,
    `Hover spring (magnetic links, card lift): \`${JSON.stringify(HOVER_SPRING)}\`.`,
    "",
    ANTI_GENERIC_RULES,
  ].join("\n");
}

function componentFor(componentType) {
  const component = COMPONENTS[componentType];
  if (!component) {
    throw new Error(`Unknown componentType "${componentType}".`);
  }

  return [
    `# High-craft component — ${component.title}`,
    "",
    "Stack: React, Tailwind utilities bound to the active vibe tokens, Framer Motion springs, `cn()` from clsx + tailwind-merge.",
    "Call `get_awwwards_blueprint` first and apply that vibe's CSS variables. Do not hardcode Tailwind blue or gray.",
    "",
    component.body,
    "",
    ANTI_GENERIC_RULES,
  ].join("\n");
}

const server = new McpServer({
  name: "awwwards-design-mcp",
  version: "1.0.0",
});

server.registerTool(
  "audit_project_design",
  {
    title: "Audit project design stack",
    description:
      "Read a project's package.json and check whether tailwindcss, framer-motion, lucide-react, clsx, and tailwind-merge are installed. Returns an audit summary and the exact npm install command for any missing packages.",
    inputSchema: z.object({
      projectPath: z
        .string()
        .describe("Absolute or relative path to the project root, or directly to its package.json"),
    }),
  },
  async ({ projectPath }) => {
    try {
      const { packageJsonPath, pkg } = await loadPackageJson(projectPath);
      return textResult(auditProject(packageJsonPath, pkg));
    } catch (error) {
      return textResult(error instanceof Error ? error.message : String(error), true);
    }
  }
);

server.registerTool(
  "get_awwwards_blueprint",
  {
    title: "Get Awwwards SOTD blueprint",
    description:
      "Return strict Awwwards Site of the Day design tokens (backgrounds, 1px translucent borders, fluid type, ambient light) and anti-generic rules for a visual vibe.",
    inputSchema: z.object({
      vibe: z
        .enum(["dark-luxury-tech", "editorial-swiss", "clean-neo-minimal"])
        .describe("Visual direction to tokenize"),
    }),
  },
  async ({ vibe }) => {
    try {
      return textResult(blueprintFor(vibe));
    } catch (error) {
      return textResult(error instanceof Error ? error.message : String(error), true);
    }
  }
);

server.registerTool(
  "get_high_craft_component",
  {
    title: "Get high-craft component architecture",
    description:
      "Return architectural React, Tailwind, and Framer Motion instructions for a 12-column asymmetric Bento grid, a staggered editorial hero, or a floating glassmorphic navbar.",
    inputSchema: z.object({
      componentType: z
        .enum(["bento-grid", "editorial-hero", "floating-glass-nav"])
        .describe("Component architecture to return"),
    }),
  },
  async ({ componentType }) => {
    try {
      return textResult(componentFor(componentType));
    } catch (error) {
      return textResult(error instanceof Error ? error.message : String(error), true);
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
