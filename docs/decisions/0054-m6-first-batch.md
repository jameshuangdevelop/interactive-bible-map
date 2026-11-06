# ADR-0054 - M6's first batch: 47 places

- **Date:** 2026-11-06
- **Status:** Accepted
- **By:** the human, approving the M6 lead's proposed inventory on 2026-11-06 ("both approved"), including the six places marked for the human's call. CP5's handoff had asked the new lead to deduplicate a first list of about 50 against the 122 verified records and bring it for approval. The outgoing PO's Gospel/Holy Land recommendation was an input, not an approved list.
- **Context:**
  - Each name below is a New Testament place that has no record yet. The PO checked each against the WEB text in `data/reference/engwebp_vpl.txt` and against the existing ids, names and candidates.
  - All are standard places (ADR-0035), so each gets 1–3 images and no AI reconstruction.
  - Ordinary places don't grow the ancient startup layer; region records need sourced outlines (ADR-0053).
- **Decision:**
  1. **Batch 1A, Holy Land (23): M6-04.**
     - **Places:** the Jordan River, Tiberias, the land of Gennesaret, Enon near Salim, Arimathea, Gaza, Azotus, Lydda, the Plain of Sharon, Antipatris, Zarephath, the Wilderness of Judea, the city of Samaria (Sebaste), Jacob's Well and Mount Gerizim.
     - **Jerusalem sites:** the Kidron Valley, Akeldama, the Praetorium and Gabbatha, the barracks (the Antonia Fortress), Solomon's Porch, the Beautiful Gate, the Sheep Gate and the Valley of Hinnom (Gehenna).
  2. **Batch 1A, Acts, the letters and Revelation (15): M6-05.**
     - **Places:** Cyrene, the Euphrates, the Sea of Adria, Babylon, Mount Sinai and Armageddon (Har-Magedon).
     - **City sites:** the Areopagus, the Agora of Athens, the street called Straight, the theater at Ephesus, the Temple of Artemis, the place of prayer by the river at Philippi, Philippi's forum, the judgment seat at Corinth and Herod's palace at Caesarea.
  3. **Batch 1B, regions (9), after M6-03:** the Decapolis, Idumea, Iturea, Trachonitis, Abilene, Phoenicia, Perea ("beyond the Jordan"), Spain and Ethiopia (Kush/Meroë), each with a sourced outline (ADR-0050).
  4. **The six marked places** keep to the neutrality rules:
     - **Mount Gerizim:** the record says that John 4:20 doesn't name the mountain.
     - **The Valley of Hinnom:** the record describes the valley and where the word "Gehenna" comes from, and takes no theological position.
     - **Babylon:** each reading is given without choosing one. The figurative reading, a name for Rome, goes in `unmappedCandidates` (M6-01).
     - **Mount Sinai and Armageddon:** every serious candidate or reading is listed, and none is preferred.
     - **Perea:** the record says that the New Testament's term is "beyond the Jordan".
  5. **Left out:**
     - Shechem: it is Sychar's mapped candidate.
     - Gadara and Gerasa: they are candidates of the country of the Gadarenes.
     - Dalmanutha and Dalmatia: they are alternate names of existing records.
     - Elam: still unsourced (BACKLOG).
  6. A place that can't be sourced to the standard is reported to the PO, not guessed or dropped silently.
- **Consequences:**
  - Batch 1A runs as two independent data PRs alongside M6-02. Batch 1B follows M6-03.
  - The checkpoint for batch 1 (CP6a) comes after all three merge.
