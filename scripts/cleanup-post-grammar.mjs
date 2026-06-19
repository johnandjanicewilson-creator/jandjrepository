#!/usr/bin/env node
/**
 * Grammar and spelling cleanup for blog posts.
 * Preserves frontmatter, images, links, captions, paragraph breaks.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const POSTS_DIR = path.join(__dirname, "..", "content/posts");

/** High-confidence replacements (regex → replacement). */
const REPLACEMENTS = [
  [/\bexistsand\b/gi, "exists and"],
  [/\bprobable be\b/gi, "probably be"],
  [/\bprobable not\b/gi, "probably not"],
  [/\bprobable was\b/gi, "probably was"],
  [/\bprobable is\b/gi, "probably is"],
  [/\bdrag the cubs\b/gi, "drag the clubs"],
  [/\barcheological\b/gi, "archaeological"],
  [/\bhorderves\b/gi, "hors d'oeuvres"],
  [/\bImmans\b/gi, "Imams"],
  [/\boner the years\b/gi, "over the years"],
  [/\bgoing our to\b/gi, "going out to"],
  [/\bgo our to\b/gi, "go out to"],
  [/\bbought the video to life\b/gi, "brought the video to life"],
  [/\bbought the video\b/gi, "brought the video"],
  [/\bfar cry for\b/gi, "far cry from"],
  [/\bThere house\b/g, "Their house"],
  [/\bThere home\b/g, "Their home"],
  [/\bBobs master\b/g, "Bob's master"],
  [/\bCesna\b/g, "Cessna"],
  [/\bpure bread bison\b/gi, "purebred bison"],
  [/\bThe heard is\b/g, "The herd is"],
  [/\bthe heard is\b/g, "the herd is"],
  [/\bthe heard\b/gi, "the herd"],
  [/\bminuses\b/gi, "minutes"],
  [/\bMont Nebo\b/g, "Mount Nebo"],
  [/\bnon drinking\b/gi, "non-drinking"],
  [/\b48\.000 gallons\b/g, "48,000 gallons"],
  [/\beven then they\b/g, "Even then, they"],
  [/\bbad on us\b/gi, "bad for us"],
  [/\bnc\]luding\b/g, "including"],
  [/\bTestamen\[t\]/g, "Testament"],
  [/\barcheological sit\b/gi, "archaeological site"],
  [/\binterned with\b/gi, "interred with"],
  [/\blie to read\b/gi, "like to read"],
  [/\bfacities\b/gi, "facilities"],
  [/\bwonderfull\b/gi, "wonderful"],
  [/\bbeutiful\b/gi, "beautiful"],
  [/\bbeuatiful\b/gi, "beautiful"],
  [/\breccomend\b/gi, "recommend"],
  [/\baccomodation\b/gi, "accommodation"],
  [/\baccomodations\b/gi, "accommodations"],
  [/\brestaraunt\b/gi, "restaurant"],
  [/\bresturant\b/gi, "restaurant"],
  [/\boccured\b/gi, "occurred"],
  [/\bseperate\b/gi, "separate"],
  [/\bdefinately\b/gi, "definitely"],
  [/\bneccessary\b/gi, "necessary"],
  [/\bbegining\b/gi, "beginning"],
  [/\bbeleive\b/gi, "believe"],
  [/\buntill\b/gi, "until"],
  [/\bfreind\b/gi, "friend"],
  [/\bacheive\b/gi, "achieve"],
  [/\bwierd\b/gi, "weird"],
  [/\btruely\b/gi, "truly"],
  [/\bcalender\b/gi, "calendar"],
  [/\bcemetary\b/gi, "cemetery"],
  [/\benviroment\b/gi, "environment"],
  [/\btommorrow\b/gi, "tomorrow"],
  [/\btommorow\b/gi, "tomorrow"],
  [/\bthier\b/gi, "their"],
  [/\bwich\b/gi, "which"],
  [/\bteh\b/gi, "the"],
  [/\bhte\b/gi, "the"],
  [/\balot\b/gi, "a lot"],
  [/\bUmayyed\b/g, "Umayyad"],
  [/\bAmmán\b/g, "Amman"],
  [/\bDon Quijote en Ammán\b/g, "Don Quijote in Amman"],
  [/\bexpresso\b/gi, "espresso"],
  [/\bcould have not\b/gi, "could not have"],
  [/\bhas spoke\b/gi, "has spoken"],
  [/\bgo our to\b/gi, "go out to"],
  [/\bwhere great and fun\b/gi, "were great and fun"],
  [/\bthe cattle where great\b/gi, "the cattle were great"],
  [/\bherding of the cattle where\b/gi, "herding of the cattle were"],
  [/\bdrops the ground\b/gi, "drops to the ground"],
  [/\bBig Ear Bats\b/g, "Big-eared Bats"],
  [/\bMalcolm Konnor\b/g, "Malcolm Konner"],
  [/\bKonner'\b/g, "Konner's"],
  [/\bBristish\b/gi, "British"],
  [/\bAthensl\b/g, "Athens"],
  [/\bFYords\b/gi, "Fjords"],
  [/\bfyords\b/gi, "fjords"],
  [/\bBristish\b/gi, "British"],
  [/\bsnorkling\b/gi, "snorkeling"],
  [/\bSoltice\b/g, "Solstice"],
  [/\bsoltice\b/gi, "solstice"],
  [/\bwondering through\b/gi, "wandering through"],
  [/\bwondering through Virginia\b/gi, "wandering through Virginia"],
  [/\btheTV\b/g, "the TV"],
  [/\bmaster is now\b/g, "master bedroom is now"],
  [/\bSioux and Bobs\b/g, "Sioux and Bob's"],
  [/\bhead the Marriott\b/g, "head to the Marriott"],
  [/\bDon Quijote en\b/g, "Don Quijote in"],
  [/\bothers pottery\b/g, "other pottery"],
  [/\bYikes!\.\.\./g, "Yikes!"],
  [/\bexistsand\b/gi, "exists and"],
];

const FIXED_REPLACEMENTS = REPLACEMENTS;

const CONTRACTIONS = [
  [/\bdont\b/gi, "don't"],
  [/\bcant\b/gi, "can't"],
  [/\bwont\b/gi, "won't"],
  [/\bdidnt\b/gi, "didn't"],
  [/\bwouldnt\b/gi, "wouldn't"],
  [/\bcouldnt\b/gi, "couldn't"],
  [/\bshouldnt\b/gi, "shouldn't"],
  [/\bisnt\b/gi, "isn't"],
  [/\barent\b/gi, "aren't"],
  [/\bwasnt\b/gi, "wasn't"],
  [/\bwerent\b/gi, "weren't"],
  [/\bhasnt\b/gi, "hasn't"],
  [/\bhavent\b/gi, "haven't"],
  [/\bhadnt\b/gi, "hadn't"],
  [/\bdoesnt\b/gi, "doesn't"],
  [/\bthats\b/gi, "that's"],
  [/\bheres\b/gi, "here's"],
  [/\btheres\b/gi, "there's"],
  [/\btheyre\b/gi, "they're"],
  [/\byoure\b/gi, "you're"],
  [/\bweve\b/gi, "we've"],
  [/\btheyve\b/gi, "they've"],
  [/\bIve\b/g, "I've"],
];

const USED_TO = [
  [
    /\b(Janice|John|we|they|I|you|He|She|It|visitors|people|You|They|We) use to\b/gi,
    (m, who) => `${who} used to`,
  ],
  [/\buse to enjoy\b/gi, "used to enjoy"],
  [/\buse to keep\b/gi, "used to keep"],
  [/\buse to connect\b/gi, "used to connect"],
  [/\buse to have\b/gi, "used to have"],
  [/\buse to rest\b/gi, "used to rest"],
  [/\buse to be\b/gi, "used to be"],
  [/\buse to fly\b/gi, "used to fly"],
  [/\buse to stay\b/gi, "used to stay"],
  [/\buse to make\b/gi, "used to make"],
  [/\buse to get\b/gi, "used to get"],
  [/\buse to see\b/gi, "used to see"],
  [/\buse to visit\b/gi, "used to visit"],
  [/\buse to go\b/gi, "used to go"],
  [/\buse to live\b/gi, "used to live"],
  [/\buse to work\b/gi, "used to work"],
  [/\buse to remember\b/gi, "used to remember"],
  [/\buse to eat\b/gi, "used to eat"],
  [/\buse to drive\b/gi, "used to drive"],
  [/\buse to walk\b/gi, "used to walk"],
  [/\buse to travel\b/gi, "used to travel"],
  [/\buse to camp\b/gi, "used to camp"],
  [/\buse to ride\b/gi, "used to ride"],
  [/\buse to hit\b/gi, "used to hit"],
  [/\buse to find\b/gi, "used to find"],
  [/\buse to feel\b/gi, "used to feel"],
  [/\buse to hear\b/gi, "used to hear"],
  [/\buse to know\b/gi, "used to know"],
  [/\buse to leave\b/gi, "used to leave"],
  [/\buse to put\b/gi, "used to put"],
  [/\buse to bring\b/gi, "used to bring"],
  [/\buse to take\b/gi, "used to take"],
  [/\buse to give\b/gi, "used to give"],
  [/\buse to write\b/gi, "used to write"],
  [/\buse to read\b/gi, "used to read"],
  [/\buse to watch\b/gi, "used to watch"],
  [/\buse to look\b/gi, "used to look"],
  [/\buse to golf\b/gi, "used to golf"],
  [/\buse to love\b/gi, "used to love"],
  [/\buse to think\b/gi, "used to think"],
  [/\buse to come\b/gi, "used to come"],
  [/\buse to drink\b/gi, "used to drink"],
  [/\buse to sleep\b/gi, "used to sleep"],
  [/\buse to wake\b/gi, "used to wake"],
  [/\buse to stand\b/gi, "used to stand"],
  [/\buse to sit\b/gi, "used to sit"],
  [/\buse to play\b/gi, "used to play"],
  [/\buse to run\b/gi, "used to run"],
  [/\buse to hunt\b/gi, "used to hunt"],
  [/\buse to fish\b/gi, "used to fish"],
];

function isImageLine(line) {
  return /^!\[[^\]]*\]\([^)]+\)\s*$/.test(line.trim());
}

function isCaptionLine(line) {
  return /^\*[^*\n]+\*\s*$/.test(line.trim());
}

function isSkippableLine(line) {
  const t = line.trim();
  if (!t) return true;
  if (isImageLine(line)) return true;
  if (isCaptionLine(line)) return true;
  if (/^#{1,6}\s/.test(t)) return false; // process headings
  return false;
}

function applyRules(text, rules) {
  let out = text;
  for (const [re, rep] of rules) {
    out =
      typeof rep === "function"
        ? out.replace(re, rep)
        : out.replace(re, rep);
  }
  return out;
}

/** Protect URLs and markdown links before punctuation passes. */
function protectTokens(text) {
  const tokens = [];
  const safe = text.replace(
    /(\[[^\]]*\]\([^)]+\)|https?:\/\/[^\s)>"]+)/gi,
    (m) => {
      const id = tokens.length;
      tokens.push(m);
      return `\x00T${id}\x00`;
    },
  );
  return { safe, tokens };
}

function restoreTokens(text, tokens) {
  return text.replace(/\x00T(\d+)\x00/g, (_, i) => tokens[Number(i)]);
}

function fixPunctuation(text) {
  const { safe, tokens } = protectTokens(text);
  let out = safe
    .replace(/  +/g, " ")
    .replace(/ \./g, ".")
    .replace(/ ,/g, ",")
    .replace(/ ;/g, ";")
    .replace(/ :/g, ":")
    .replace(/ !/g, "!")
    .replace(/ \?/g, "?")
    .replace(/"Godfather" One/g, '"Godfather," one')
    .replace(/\.  +/g, ". ")
    .replace(/,  +/g, ", ");
  return restoreTokens(out, tokens);
}

function processTextSegment(text) {
  let out = text;
  out = applyRules(out, FIXED_REPLACEMENTS);
  out = applyRules(out, USED_TO);
  out = applyRules(out, CONTRACTIONS);
  out = fixPunctuation(out);
  return out;
}

/** Process markdown body while preserving structure. */
function processBody(body) {
  const lines = body.split("\n");
  const out = [];

  for (const line of lines) {
    if (isImageLine(line) || isCaptionLine(line)) {
      out.push(line);
      continue;
    }

    if (/^!\[.*\]\(.*\)/.test(line) && !isImageLine(line)) {
      // Inline image in paragraph - protect URLs, fix surrounding text
      const parts = line.split(/(!\[[^\]]*\]\([^)]+\))/g);
      out.push(
        parts
          .map((p) => (/^!\[/.test(p) ? p : processTextSegment(p)))
          .join(""),
      );
      continue;
    }

    if (/^\s*>/.test(line)) {
      out.push(processTextSegment(line));
      continue;
    }

    if (/^\[.+\]\(https?:\/\//.test(line.trim()) && line.includes("![")) {
      out.push(line);
      continue;
    }

    out.push(processTextSegment(line));
  }

  return out.join("\n");
}

function countCorrections(before, after) {
  if (before === after) return 0;
  // Simple line-level diff estimate
  const bLines = before.split("\n");
  const aLines = after.split("\n");
  let n = 0;
  const len = Math.max(bLines.length, aLines.length);
  for (let i = 0; i < len; i++) {
    if ((bLines[i] || "") !== (aLines[i] || "")) n++;
  }
  return n;
}

// --- Main ---
const files = fs
  .readdirSync(POSTS_DIR)
  .filter((f) => f.endsWith(".md"))
  .sort();

console.log(`Grammar cleanup: ${files.length} posts\n`);

let totalCorrections = 0;
let postsChanged = 0;
const samples = [];
for (let i = 0; i < files.length; i++) {
  const file = files[i];
  const filePath = path.join(POSTS_DIR, file);
  const raw = fs.readFileSync(filePath, "utf8");
  const fmMatch = raw.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);
  if (!fmMatch) continue;

  const frontmatter = fmMatch[0];
  const content = raw.slice(frontmatter.length).replace(/^\s+/, "");

  const cleanedBody = processBody(content);
  const corrections = countCorrections(content, cleanedBody);

  if (cleanedBody !== content) {
    postsChanged++;
    totalCorrections += corrections;

    if (samples.length < 15) {
      for (const [re, rep] of [...FIXED_REPLACEMENTS, ...USED_TO, ...CONTRACTIONS]) {
        const repStr = typeof rep === "string" ? rep : "";
        const m = content.match(re);
        if (m && repStr && m[0].toLowerCase() !== repStr.toLowerCase()) {
          samples.push({ file, from: m[0], to: repStr });
          break;
        }
      }
    }

    fs.writeFileSync(
      filePath,
      `${frontmatter}${cleanedBody}\n`,
      "utf8",
    );
  }

  console.log(
    `Processing ${i + 1} of ${files.length}... ${file}${corrections > 0 ? ` (${corrections} fixes)` : ""}`,
  );
}

console.log("\n========== Grammar Cleanup Summary ==========");
console.log(`Posts processed:     ${files.length}`);
console.log(`Posts changed:       ${postsChanged}`);
console.log(`Corrections (est.):  ${totalCorrections}`);
if (samples.length > 0) {
  console.log("\nSample corrections:");
  for (const s of samples) {
    console.log(`  ${s.file}: "${s.from}" → "${s.to}"`);
  }
}
console.log("============================================\nDone.");
