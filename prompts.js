// Procedural Race Sentence Generator - Real, Natural Sentences Packed with Random Words!
// All strictly lowercase, no punctuation or special characters (Monkeytype Style).

const ADJECTIVES = [
  "quick", "swift", "silent", "bright", "fierce", "smooth", "heavy", "sharp", "calm", "sudden",
  "wild", "subtle", "rapid", "golden", "steady", "vibrant", "restless", "daring", "clever", "gentle",
  "eager", "brave", "keen", "bold", "fluid", "crisp", "agile", "nimble", "mighty", "endless",
  "fearless", "dynamic", "brilliant", "boundless", "radiant", "intense", "limitless", "electric", "pure", "untamed",
  "cold", "warm", "dark", "deep", "high", "low", "wide", "narrow", "prime", "direct", "clean", "fresh",
  "modern", "classic", "steep", "level", "epic", "grand", "loud", "quiet", "simple", "solid"
];

const NOUNS = [
  "machine", "pilot", "driver", "racer", "engine", "current", "shadow", "horizon", "circuit", "breeze",
  "wheel", "track", "signal", "rhythm", "spirit", "velocity", "motion", "journey", "pulse", "stream",
  "system", "moment", "glance", "target", "path", "whisper", "storm", "spark", "glimmer", "echo",
  "compass", "vision", "energy", "balance", "focus", "passage", "asphalt", "tarmac", "sector", "curve",
  "power", "speed", "force", "surface", "distance", "control", "sound", "light", "space", "line",
  "paddock", "apex", "throttle", "clutch", "chassis", "airflow", "traction", "gearbox", "turbo", "exhaust",
  "champion", "victory", "triumph", "challenge", "rumble", "curb", "rubber", "friction", "momentum", "instinct"
];

const VERBS_S = [
  "accelerates", "glides", "moves", "travels", "charges", "surges", "sweeps", "flows", "carves", "cuts",
  "races", "spins", "drives", "shifts", "climbs", "navigates", "measures", "echoes", "captures", "follows",
  "commands", "delivers", "reaches", "chases", "crosses", "radiates", "ignites", "strikes", "conquers", "maintains"
];

const VERBS_BASE = [
  "accelerate", "glide", "move", "travel", "charge", "surge", "sweep", "flow", "carve", "cut",
  "race", "spin", "drive", "shift", "climb", "navigate", "measure", "echo", "capture", "follow",
  "command", "deliver", "reach", "chase", "cross", "radiate", "ignite", "strike", "conquer", "maintain"
];

const ADVERBS = [
  "smoothly", "rapidly", "silently", "confidently", "effortlessly", "steadily", "sharply", "gracefully",
  "instantly", "fiercely", "naturally", "flawlessly", "brilliantly", "swiftly", "boldly", "eagerly", "purely"
];

const PREPOSITIONS = [
  "across", "through", "along", "towards", "beyond", "beneath", "around", "over", "into", "before", "past", "within"
];

const PRIMARY_PATTERNS = [
  () => `entering the ${pick(ADJECTIVES)} corner with ${pick(ADJECTIVES)} speed every skilled ${pick(NOUNS)} maintains ${pick(ADJECTIVES)} traction`,
  () => `as the ${pick(ADJECTIVES)} light flashes across the ${pick(ADJECTIVES)} circuit twenty ${pick(ADJECTIVES)} machines ${pick(VERBS_S)} past the ${pick(NOUNS)}`,
  () => `pushing the ${pick(ADJECTIVES)} machine to the ${pick(ADJECTIVES)} limit the ${pick(NOUNS)} ${pick(VERBS_S)} ${pick(ADVERBS)} down the ${pick(ADJECTIVES)} track`,
  () => `clean airflow over the ${pick(ADJECTIVES)} wing delivers ${pick(ADJECTIVES)} downforce allowing the ${pick(ADJECTIVES)} car to ${pick(VERBS_BASE)} ${pick(PREPOSITIONS)} the ${pick(ADJECTIVES)} curve`,
  () => `with ${pick(ADJECTIVES)} reflexes and ${pick(ADJECTIVES)} concentration every ${pick(ADJECTIVES)} pilot ${pick(VERBS_S)} past the ${pick(NOUNS)} into the ${pick(ADJECTIVES)} sector`,
  () => `the sound of ${pick(ADJECTIVES)} horsepower echoes ${pick(PREPOSITIONS)} the ${pick(ADJECTIVES)} circuit as the ${pick(ADJECTIVES)} racer ${pick(VERBS_S)} ${pick(ADVERBS)}`,
  () => `carving through the ${pick(ADJECTIVES)} hairpin demands ${pick(ADJECTIVES)} balance and smooth steering along the ${pick(ADJECTIVES)} asphalt`,
  () => `a sudden burst of ${pick(ADJECTIVES)} speed allows the ${pick(ADJECTIVES)} driver to ${pick(VERBS_BASE)} past the ${pick(ADJECTIVES)} rival`,
  () => `gliding smoothly across the ${pick(ADJECTIVES)} starting line with ${pick(ADJECTIVES)} focus and steady control brings ${pick(ADJECTIVES)} victory within reach`,
  () => `the ${pick(ADJECTIVES)} tires grip the ${pick(ADJECTIVES)} tarmac firmly while ${pick(ADVERBS)} feathering the throttle out of every ${pick(ADJECTIVES)} bend`,
  () => `flawless downshifts rev match the ${pick(ADJECTIVES)} gearbox approaching the ${pick(ADJECTIVES)} apex with ${pick(ADJECTIVES)} precision`,
  () => `an extraordinary rhythm of ${pick(ADJECTIVES)} motion guides the ${pick(ADJECTIVES)} pilot ${pick(PREPOSITIONS)} the ${pick(ADJECTIVES)} chicane`,
  () => `the telemetry screen flashes green across all sectors confirming that the ${pick(ADJECTIVES)} machine has set an extraordinary new lap record`,
  () => `precision steering and smooth throttle control are the secrets to mastering the ${pick(ADJECTIVES)} circuit with ${pick(ADJECTIVES)} pace`,
  () => `twenty roaring engines line up along the ${pick(ADJECTIVES)} grid waiting for the green light as each ${pick(ADJECTIVES)} competitor focuses intently`,
  () => `accelerating out of the ${pick(ADJECTIVES)} corner the tachometer bounces off the limiter as the ${pick(ADJECTIVES)} vehicle surges forward`,
  () => `heat waves shimmer off the ${pick(ADJECTIVES)} tarmac while the ${pick(ADJECTIVES)} machine carves through the sweeping downhill curves`
];

const COMPLEMENT_PATTERNS = [
  () => `while ${pick(ADVERBS)} shifting gears towards the ${pick(ADJECTIVES)} finish line`,
  () => `while maintaining ${pick(ADJECTIVES)} balance across the ${pick(ADJECTIVES)} ${pick(NOUNS)}`,
  () => `allowing the ${pick(ADJECTIVES)} vehicle to ${pick(VERBS_BASE)} ${pick(ADVERBS)} down the straightaway`,
  () => `delivering ${pick(ADJECTIVES)} power to ${pick(VERBS_BASE)} past the ${pick(ADJECTIVES)} rival before the final turn`,
  () => `chasing the ${pick(ADJECTIVES)} record across the ${pick(ADJECTIVES)} ${pick(NOUNS)} with ${pick(ADJECTIVES)} momentum`,
  () => `leaving a trail of ${pick(ADJECTIVES)} ${pick(NOUNS)} along the ${pick(ADJECTIVES)} ${pick(NOUNS)}`,
  () => `where the ${pick(ADJECTIVES)} engine ${pick(VERBS_S)} with ${pick(ADJECTIVES)} power and ${pick(ADJECTIVES)} energy`,
  () => `and securing the ${pick(ADJECTIVES)} lead before heading into the ${pick(ADJECTIVES)} straightaway`,
  () => `as every ${pick(ADJECTIVES)} machine ${pick(VERBS_S)} ${pick(ADVERBS)} towards the checkered flag`,
  () => `proving that ${pick(ADJECTIVES)} bravery and ${pick(ADJECTIVES)} rhythm separate the champion from the rest of the pack`
];

const TRACK_TITLES = [
  "monza sprint",
  "silverstone grand prix",
  "nurburgring dash",
  "suzuka circuit",
  "spa sector run",
  "le mans straight",
  "interlagos sweep",
  "daytona speedway",
  "mount panorama ascent",
  "monaco coastal run"
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomRacePrompt(minWords = 25) {
  const primaryIdx = Math.floor(Math.random() * PRIMARY_PATTERNS.length);
  let primary = PRIMARY_PATTERNS[primaryIdx]();

  const compIdx1 = Math.floor(Math.random() * COMPLEMENT_PATTERNS.length);
  let complement = COMPLEMENT_PATTERNS[compIdx1]();
  let full = `${primary} ${complement}`;

  let words = full.toLowerCase().replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim().split(' ');

  if (words.length < minWords) {
    let compIdx2;
    do {
      compIdx2 = Math.floor(Math.random() * COMPLEMENT_PATTERNS.length);
    } while (compIdx2 === compIdx1 && COMPLEMENT_PATTERNS.length > 1);

    let second = COMPLEMENT_PATTERNS[compIdx2]();
    full = `${full} ${second}`;
    words = full.toLowerCase().replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim().split(' ');
  }

  const cleanText = words.join(' ');
  const title = pick(TRACK_TITLES);

  return {
    id: Date.now(),
    title: title,
    text: cleanText,
    wordCount: words.length
  };
}

module.exports = {
  getRandomRacePrompt,
  ADJECTIVES,
  NOUNS,
  VERBS_S,
  VERBS_BASE,
  ADVERBS,
  TRACK_TITLES
};
