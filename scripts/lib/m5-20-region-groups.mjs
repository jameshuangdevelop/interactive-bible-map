function labelMap(entries) {
  const map = new Map();
  for (const [label, anchorIds] of entries) {
    for (const anchorId of anchorIds) map.set(anchorId, label);
  }
  return map;
}

export const GROUP_A_LABELS = labelMap([
  ["pisidia", ["termessus", "pednelissus", "selge", "sagalassus", "cremna", "adada", "anabura", "amblada", "sinda"]],
  ["lycaonia", ["coropassus", "lystra-pleiades", "derbe-pleiades", "isaura-vetus", "isaura-nova"]],
  ["mysia", ["cyzicus", "miletopolis", "apollonia-rhyndacum", "pergamum", "teuthrania", "elaea"]],
  ["phrygia", ["dorylaeum", "cotiaeum", "midaeum", "nacolia", "aizani", "cadi", "synnada", "amorium", "philomelium", "iconium-phrygia", "antioch-near-pisidia", "apollonia-phrygia", "laodicea-phrygia", "colossae-pleiades", "apamea-cibotus"]],
  ["outside", ["attalia", "perge", "sillyon", "aspendus", "side", "kibyra", "milyas", "balbura", "garsaura", "tyana", "laranda", "lake-tatta", "pessinus", "ancyra", "prusa", "apamea-myrlea", "nicomedia", "claudiopolis-bithynia", "cyme", "magnesia-ad-sipylum", "antioch-maeander", "philadelphia-lydia", "carura"]]
]);

export const GROUP_B_LABELS = labelMap([
  ["media", ["gazaca", "ecbatana", "rhagae"]],
  ["mesopotamia", ["edessa", "carrhae", "nisibis"]],
  ["outside", ["artaxata", "hecatompylos", "hyrcania", "persepolis", "pasargadae", "susa", "arbela", "arsamosata", "babylon", "seleucia-tigris"]]
]);
