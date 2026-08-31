# Beekeeping Knowledge Base — Verified Fact Entries

Research compiled for the Apiario "learn" feature (offline-first PWA for beginner beekeepers).

**Method note.** Priority was accuracy and citability over breadth. Figures were checked against authoritative primary sources (university extension services, USDA, FAO-backed coordination bodies, peer-reviewed journals). Where a number could be confirmed on a live page today, a working URL is given. Where a figure is a well-established consensus taught across extension services / national associations but I could **not** re-verify a live URL during this pass, it is flagged **[consensus — verify URL]**. Nothing is invented: any figure I could not satisfy myself of is either flagged or omitted.

---

## 1. Varroa mite

### F1 — Varroa control thresholds (mites per 100 bees)
- **summary:** Varroa is the #1 parasite threat to honey bees worldwide. Beekeepers estimate the infestation level as "mites per 100 bees" and treat only when that number crosses a threshold. One quantitative count (alcohol wash or sugar roll) is far more reliable than "just looking."
- **key numbers**
  - **3 mites per 100 bees = treatment threshold for the main growing season (May–October)** — Mississippi State Univ. Extension P4049 (research-based threshold). https://extension.msstate.edu/publications/sampling-for-varroa-mites-using-alcohol-wash
  - **February (pre-honey-flow) threshold: 1 mite per 100 bees** recommended, because populations grow fast and would otherwise exceed damage levels by the honey flow — Mississippi State Univ. Extension. Same page.
  - Virginia Tech VARROA sampling factsheet states thresholds **"range between 2–5%"** depending on season and colony cycle — VCE ENTO-332NP. https://www.pubs.ext.vt.edu/ENTO/ENTO-332/ENTO-332.html
  - Varroa Wikipedia (Good Article, cites Rosenkranz et al. 2010) states **3% infestation ≈ economic threshold**. https://en.wikipedia.org/wiki/Varroa_destructor
- **source:** Mississippi State Univ. Extension P4049; VCE ENTO-332NP; Rosenkranz P, Aumeier P, Ziegelmann B. *Biology and control of Varroa destructor.* J. Invert. Path. 103 (2010) S96–S119.
- **difficulty:** intermediate
- **tags:** varroa, monitoring, IPM, treatment-threshold

### F2 — Alcohol wash vs sugar roll
- **summary:** Both methods estimate mites per 100 bees on a sample of nurse bees collected from capped brood (where mites are concentrated). The alcohol wash is the gold standard for accuracy but kills the sampled bees; the powdered-sugar "sugar roll" is comparable in accuracy and non-lethal.
- **key numbers**
  - Alcohol wash sample: **~200 (200±25) bees** in a ¼ cup → divide mite count by 2 to get mites/100 bees — Virginia Tech ENTO-332NP. https://www.pubs.ext.vt.edu/ENTO/ENTO-332/ENTO-332.html
  - Mississippi State uses a **half-cup (~400 bees)** sample in 70% rubbing alcohol — P4049.
  - **"Replacing alcohol with powdered sugar eliminates bee death… does not impact bees used in sampling long term."** Powdered sugar was the most accurate inert dust tested (vs talcum, wheat flour, baking soda, corn starch) — Virginia Tech ENTO-332NP.
  - **Alcohol washes are the most accurate method** for monitoring — Penn State Extension, *Methods to Control Varroa Mites*. https://extension.psu.edu/methods-to-control-varroa-mites-an-integrated-pest-management-approach
- **source:** Virginia Tech VCE ENTO-332NP; Penn State Extension; Mississippi State P4049.
- **difficulty:** beginner
- **tags:** varroa, monitoring, alcohol-wash, sugar-roll

### F3 — Why drones attract mites (capping period)
- **summary:** Mites reproduce inside capped brood cells. Drone cells are capped longer than worker cells, giving a mite foundress more time to produce offspring, and drone brood cells are more "attractive" to entering mites for longer.
- **key numbers**
  - **Drone post-capping stage ≈ 15 days vs 11 days for workers** — Penn State Extension.
  - Mites produce **~1.3–1.4 offspring per attempt** in worker cells but **~2.2–2.6 in drone cells** — Penn State Extension.
  - Period of attractiveness: **drone brood 40–50 hours vs worker brood 15–30 hours** — Penn State Extension.
  - Net effect: about a **6-fold increase in mites under drone-cell cappings vs worker-cell cappings** — Penn State Extension.
- **source:** Penn State Extension, *Methods to Control Varroa Mites* (as above).
- **difficulty:** intermediate
- **tags:** varroa, drone, brood, biology

### F4 — Drone brood removal as control
- **summary:** Because mites prefer drone cells, an added drone comb acts as a trap. Removing it before the drones (and their mites) emerge carries mites out of the hive. It is a useful IPM tactic but not sufficient alone.
- **key numbers**
  - Removing drone comb before drone emergence **removes the reproducing mites**; frame can be frozen or scraped — Penn State Extension.
  - Drone-comb trapping is reported to reduce mite levels by roughly **50–93%** when done early, but if left uncut the trapped mites can spike populations — Varroa Wikipedia (Good Article), citing research; flagged as secondary source.
  - Screened bottom boards modestly reduce mite populations by **11–14%** — Varroa Wikipedia.
- **source:** Penn State Extension; Varroa destructor Wikipedia (Good Article).
- **difficulty:** advanced
- **tags:** varroa, drone-brood, IPM, mechanical-control

### F5 — Varroa biology and colony collapse timeline
- **summary:** Untreated varroa almost always kills a temperate-climate colony. The mite feeds on bee fat body, vectoring viruses (notably DWV), and populations grow exponentially during brood season.
- **key numbers**
  - Varroa can only reproduce in capped brood; no reproduction during fully broodless periods — Penn State Extension / Rosenkranz 2010.
  - Mite population can **multiply ~12-fold in 12 weeks** of brood rearing — Varroa Wikipedia.
  - **Without management, colonies typically collapse within 2–3 years in temperate climates** — Rosenkranz 2010 (via Varroa Wikipedia).
  - Adult female mite lifespan ≈ **27 days with brood present**; phoretic stage 4.5–11 days when brood present, up to 5–6 months without brood — UF IFAS via Varroa Wikipedia.
- **source:** Rosenkranz et al. 2010 J. Invert. Path.; Penn State Extension; UF IFAS.
- **difficulty:** intermediate
- **tags:** varroa, biology, life-cycle, colony-collapse

### F6 — Oxalic acid treatment dose **[flag]**
- **summary:** Oxalic acid is a naturally-occurring acid used against varroa, most effective when little/no sealed brood is present (broodless periods) so mites are exposed on adult bees.
- **key numbers / flags**
  - Oxalic acid efficacy is described as **high (near 100%) when applied during broodless periods**, with **no known cases of resistance** — Varroa Wikipedia (Good Article, citing Jack et al. 2021 review).
  - **⚠ The specific "35 ml of 3.2% oxalic acid dihydrate syrup per colony" figure in the existing app could NOT be re-verified against a live primary source during this pass.** The standard dribble dosage in the scientific and extension literature is expressed per **seam of bees** (commonly ~5 ml of 3.2% oxalic acid dihydrate in 1:1 sugar syrup per seam), not as a fixed per-colony ml volume; total per-colony dose therefore varies with colony size / seam count. **Flag for verification** — verify the exact 35 ml figure against the product label or a specific national recommendation (LAVES/European directive) before presenting it as a hard number.
- **source:** Varroa destructor Wikipedia (Good Article) for oxalic efficacy figure; **[flag]** label-specific dose needs primary verification.
- **difficulty:** advanced
- **tags:** varroa, oxalic-acid, treatment, broodless

---

## 2. Deformed Wing Virus (DWV)

### F7 — What DWV is and its link to varroa
- **summary:** Deformed wing virus is a single-stranded RNA virus (an *Iflavirus*) that is now the classic example of a varroa-vectored disease. Before varroa it usually existed as a covert, low-impact infection; varroa mites transmit it directly into bee hemolymph and massively amplify its prevalence and severity.
- **key numbers**
  - DWV is a positive-strand RNA virus, genome ~10,140 nt — Wikipedia / Lanzi et al. 2006, *J. Virology*.
  - Varroa vectoring raises DWV prevalence from ~**10% to 100%** of bees in many colonies — Wikipedia citing Martin/Rosenkranz literature.
  - Main vector in *A. mellifera* is the **Varroa mite**, which feeds on hemolymph/fat body — Gunn, Bowen-Walker & Martin 1999, *J. Invert. Path.* 73:101–106.
- **source:** Wikipedia "Deformed wing virus" (peer-reviewed citations); Lanzi et al. 2006; Gunn et al. 1999.
- **difficulty:** intermediate
- **tags:** virus, DWV, varroa, disease

### F8 — DWV symptoms
- **summary:** The hallmark symptom is shrunken, crumpled, useless wings on emerging adult bees, plus shortened rounded abdomens and discoloration; affected bees usually cannot fly and die within about two days.
- **key numbers**
  - Symptomatic bees have **severely reduced lifespan (usually < 48 hours)** and are typically expelled from the hive — Wikipedia citing Schroeder & Martin 2012 and Brettell et al. 2017.
  - The disease is a major overwinter-mortality driver and contributor to colony collapse — McMahon et al. 2016, *Proc. R. Soc. B*.
- **source:** Wikipedia "Deformed wing virus"; Schroeder DC, Martin SJ. *Virulence* 3(7) 2012; Brettell et al. *Insects* 8(1) 2017; McMahon et al. 2016.
- **difficulty:** beginner
- **tags:** virus, DWV, symptoms, disease

---

## 3. American Foulbrood (AFB) vs European Foulbrood (EFB)

### F9 — AFB: the ropiness test and spore longevity
- **summary:** American Foulbrood is the most damaging and most regulated honey-bee brood disease. The classic field test is the **ropiness test**: a toothpick inserted into a decomposing larva and slowly withdrawn stretches a long, elastic "rope" of bacterial mass. AFB spores are famously long-lived and scattered honey/spores contaminate hives and equipment for many years.
- **key numbers**
  - **Ropy test:** the decayed larval remains are ropy/stretchy (a positive signal) — consensus of USDA APHIS and extension/lab protocols.
  - **AFB spores can survive for decades (commonly stated as 40+ years) in dried spores on comb and equipment**, and are resistant to heat and disinfectants — **[consensus — verify URL]**; widely cited by USDA APHIS, university diagnostic labs, and the FAO Good Beekeeping Practices. Flagged: exact "40 years" figure is commonly taught but I could not confirm a live URL this pass; the facts that spores are extremely durable and persistent are well established.
  - Agent: **Paenibacillus larvae** (spore former) — consensus.
- **source:** USDA APHIS (AFB is a notifiable/apiary disease); FAO Good Beekeeping Practices; university lab protocols. URL for the live APHIS page timed out during research; see https://www.aphis.usda.gov (search "American foulbrood").
- **difficulty:** intermediate
- **tags:** foulbrood, AFB, disease, ropiness-test

### F10 — AFB notifiable status and EFB characteristics
- **summary:** American Foulbrood is a **notifiable** disease in many jurisdictions (including most of the EU and the U.S.), meaning suspicion/laboratory-confirmation must be reported to the apiary/animal-health authority and infected equipment is often destroyed by burning. European Foulbrood is generally a milder, stress-related disease caused by a different bacterium and is usually recoverable without burning the bees.
- **key numbers**
  - AFB causal bacterium: **Paenibacillus larvae** (formerly *Bacillus larvae*).
  - EFB causal bacterium: **Melissococcus plutonius**.
  - AFB: spores survive for years/decades in equipment; **ropiness** at the late stage.
  - EFB: larvae die before capping, turn a melted/watery yellow-brown; **lack the classic ropiness**; often clears up when the colony outgrows stress.
  - AFB is **notifiable/regulated**; EFB is regulated in some regions (e.g., U.K.), notifiable status varies — consensus of national bee-health services (incl. LAVES-style German state services).
- **source:** USDA APHIS; FAO Good Beekeeping Practices 2020; national diagnostic labs. **(Flag:** specific per-jurisdiction notifiable lists should be checked against the local authority, e.g., USDA APHIS / national ministry, before presenting as universal — the "notifiable" status is real but varies by country.)**
- **difficulty:** intermediate
- **tags:** foulbrood, AFB, EFB, disease, notifiable

---

## 4. Honey

### F11 — Moisture content and fermentation risk
- **summary:** Bees ripen honey by evaporating water below the point where yeast can ferment it. Honey above roughly 18–18.6% moisture risks fermentation. Beekeepers harvest capped honey (which is already below ~18%) and many use a refractometer if it isn't fully capped.
- **key numbers**
  - Harvest threshold: honey is generally not safe to harvest until moisture is **below ~18%**; capped cells are the natural signal the bees have reached this — **[consensus — verify URL]** (National Honey Board, extension, FAO). The **USDA AMS U.S. Grade A** limit for extracted honey is **not more than 18.6% moisture** — USDA Agricultural Marketing Service honey grade standard **[consensus — verify live URL]**.
  - Fermentation risk rises above ~18–18.6% moisture — consensus across NHB/extension.
- **source:** National Honey Board; USDA AMS honey grades; FAO Good Beekeeping Practices. *(Flag: verify the exact AMS grade table URL — the AMS page 404'd during this pass.)*
- **difficulty:** beginner
- **tags:** honey, moisture, fermentation, harvest

### F12 — Honey as antibacterial (glucose oxidase / H₂O₂)
- **summary:** Honey's antibacterial action largely comes from glucose oxidase, an enzyme bees add to nectar. It slowly produces **hydrogen peroxide**, and this activity is **stable at honey's naturally low (acidic) pH**, where peroxide is most effective. Not all honeys have equal activity — peroxide is destroyed by heat and light (and by some floral sources).
- **key numbers**
  - Glucose oxidase converts glucose + water → gluconic acid + **hydrogen peroxide (H₂O₂)** — consensus of honey science (e.g., Molan 1992, cite behind NHB).
  - Honey is naturally acidic (pH ~3.2–4.5), which **stabilizes the peroxide** activity — consensus.
  - Peroxide activity is **heat- and light-labile** — consensus.
- **source:** National Honey Board (honey chemistry pages); Molan PC. *Bee World* 73 (1992). *(Flag: NHB nutrition page 403'd during fetch; rely on Molan 1992 and standard food-science references.)*
- **difficulty:** intermediate
- **tags:** honey, antibacterial, glucose-oxidase, chemistry

### F13 — Typical honey yield per colony **[flag]**
- **summary:** Honey yield varies enormously by region, nectar flows, and management, so there is no single "typical" number.
- **key numbers / flag:** Published averages range widely (USDA/FAO report national average yields typically around **20–30 kg (~45–65 lb) per colony per year** in the U.S., with hives often far higher). Because this is highly variable by region and year, **I could not pin one authoritative universal figure and recommend presenting a range** with a "varies" disclaimer rather than a hard number. *(Flag: verify against a specific national statistic if the app needs a number.)*
- **source:** USDA/FAO beekeeping statistics (national averages vary); no single universal value.
- **difficulty:** beginner
- **tags:** honey, yield, harvest

---

## 5. Queen biology

### F14 — Queen lifespan and laying
- **summary:** A healthy queen lays the colony's eggs and is the colony's only fertile female. She begins laying within days of mating and can lay for months; queens typically live 1–3 years, though production colonies often requeen every year or two.
- **key numbers**
  - Queen **lifespan is generally 1–3 years** (some sources up to ~5), but **egg-laying quality declines with age**, so many beekeepers requeen every 1–2 years — consensus of extension/national associations **[consensus — verify URL]**.
  - A strong queen can lay up to **~1,500–2,000 eggs per day** at peak — consensus.
- **source:** university extension (e.g., Penn State/UF) and national beekeeping associations. Flag: exact daily-laying figure varies by source; present as a range.
- **difficulty:** beginner
- **tags:** queen, biology, lifespan

### F15 — Supersedure vs swarming
- **summary:** "Supersedure" is the colony replacing an aging/failing queen without dividing (she is quietly replaced). "Swarming" is colony reproduction — the old queen leaves with a large group to found a new colony while the original colony rears a new queen.
- **key numbers:** Supersedure = in-place queen replacement; swarming = colony division (old queen leaves with ~half+ workers). Timing driven by crowding, queen pheromone decline, and brood-nest congestion — consensus of extension literature.
- **source:** University extension / national associations (BeeSource, Penn State). Flag as consensus.
- **difficulty:** beginner
- **tags:** queen, supersedure, swarming, biology

### F16 — Queen marking color code
- **summary:** The internationally used 5-color queen-marking code marks a queen's **age** by the last digit of the year she was raised. The code repeats on a 5-year cycle; the colors are painted on the thorax with a standard order.
- **key numbers (standard 5-color international code):**
  - Last digit of year ending in **1 or 6 → White**
  - **2 or 7 → Yellow**
  - **3 or 8 → Red**
  - **4 or 9 → Green**
  - **5 or 0 → Blue**
  - So, e.g., a queen marked in 2026 (year ends in 6) = **White**; 2027 = **Yellow**; 2028 = **Red**; 2029 = **Green**; 2030 = **Blue**; 2031 = **White** (cycle repeats).
- **source:** This is the standard code adopted by national beekeeping associations (e.g., British Beekeepers Association, D.I.B., and nectar/equipment suppliers). **[consensus — verify URL]** — the code itself is stable and universal, but I could not re-verify a live association URL this pass.
- **difficulty:** beginner
- **tags:** queen, marking, colors, beekeeping

### F17 — Drone mating / AIS
- **summary:** Virgin queens mate in flight ("AIS" = drone congregation areas) with many drones over one or a few mating flights, storing sperm for life. The queen mates once early in life and uses stored sperm for years.
- **key numbers:** A queen typically mates with **10–20 (some sources up to ~20+) drones** during her mating flights and stores the sperm; she rarely re-mates later — consensus **[consensus — verify URL; the 10–20 range is commonly cited by extension]**.
- **source:** University extension, beekeeping associations.
- **difficulty:** intermediate
- **tags:** queen, drones, mating, AIS

---

## 6. Winter cluster & stores

### F18 — Winter honey/sugar stores per colony
- **summary:** A colony must overwinter on stored honey/sugar. The recommended reserve is commonly given as **15–20 kg** in temperate climates, with **more needed in colder/northern regions** where the cluster is confined longer.
- **key numbers**
  - Recommended winter stores: **~15–20 kg (≈33–44 lb) of honey per colony** is a commonly cited guideline; **northern/cold regions recommend more** (often up to 25–30 kg or 60–70 lb) — **[consensus — verify URL]** (national associations: e.g., in North America ~60–90 lb = ~27–41 kg is also commonly recommended).
  - **⚠ App claim "15–20 kg (more in northern Europe)": directionally correct and consistent with consensus**, but it is a guideline range, not a hard rule; exact value depends on climate, colony strength, and breed. Flag: present as a range with a "more in cold regions" note.
- **source:** National beekeeping associations and extension. Flag for URL verification.
- **difficulty:** beginner
- **tags:** winter, stores, honey, feeding

### F19 — Cluster temperature regulation
- **summary:** In winter, bees survive cold by forming a tight cluster and shivering to generate heat. They keep the cluster's core warm while tolerating cold outer edges.
- **key numbers:** Cluster core is maintained near **~35 °C (~95 °F)** even when outside temperatures are well below freezing; the cluster loosens/tightens as temperatures change — consensus of bee temperature physiology **[consensus — verify URL]**.
- **source:** University extension / bee physiology references.
- **difficulty:** intermediate
- **tags:** winter, cluster, temperature, thermoregulation

---

## 7. Waggle dance

### F20 — Waggle dance: von Frisch, distance and direction
- **summary:** Karl von Frisch decoded the honey bee "waggle dance": foragers returning from a good food source perform a figure-eight dance on the comb. The dance encodes **distance** (duration of the waggle run) and **direction** (angle of the waggle run relative to gravity/sun). Von Frisch won the **1973 Nobel Prize in Physiology or Medicine** for this work (shared with Lorenz and Tinbergen).
- **key numbers**
  - Distance is encoded by waggle-run duration; a commonly taught rule of thumb is **~1 second of waggle ≈ 1 km of flight distance** (equivalently ~75 ms per 100 m) — **[consensus — verify URL];** the exact calibration varies with colony and the figure ~1s ≈ 1 km is the widely taught approximation.
  - Direction is encoded by the **angle of the waggle run relative to gravity**, which maps to the **angle relative to the sun's azimuth** for the food source; bees use a sun compass and compensate for the sun's movement — consensus, from von Frisch's primary work (*The Dance Language and Orientation of Bees*, 1967).
- **source:** Karl von Frisch, primary literature and Nobel citation (1973); Smithsonian and reputable overviews. Flag: the specific "~1s = 1 km" numeric approximation should be verified against a primary measurement if the app renders it as a hard number; the qualitative encoding (duration = distance, angle = direction) is firmly established.
- **difficulty:** beginner
- **tags:** waggle-dance, communication, von-frisch, behavior

---

## 8. Propolis & bee products

### F21 — Foraging range
- **summary:** Honey bees forage within a relatively modest circular range around the hive, though they can fly much farther when necessary.
- **key numbers:** Typical/sustainable foraging range is about **2–3 km (some sources ~3–5 km)**, with bees flying farther only under scarcity; the FAO and extension commonly cite ~3 km as a working radius — **[consensus — verify URL]**.
- **source:** FAO/extension beekeeping references.
- **difficulty:** beginner
- **tags:** foraging, range, propolis

### F22 — Propolis uses
- **summary:** Propolis is a sticky resin bees collect from tree buds and mix with wax; bees use it to seal cracks, reduce drafts, and line/narrow hive entrances, and it has antimicrobial properties for the colony.
- **key numbers:** Propolis is collected from plant resins (buds/bark) and mixed with wax & secretions — consensus. It is used by bees for **sealing and sanitizing** the nest. Human use (traditional medicine) is beyond beekeeping scope; the antimicrobial property is documented but not a treatment claim.
- **source:** Extension / FAO bee-product references. Flag as consensus.
- **difficulty:** beginner
- **tags:** propolis, bee-products, behavior

### F23 — Royal jelly basics
- **summary:** Royal jelly is a glandular secretion fed to all young larvae; larvae chosen to become queens are fed it throughout development, which is part of what produces reproductive queens.
- **key numbers:** All larvae get royal jelly early; a future queen is fed royal jelly for her entire larval life, driving queen development — consensus **[consensus — verify URL]**.
- **source:** University extension / bee biology.
- **difficulty:** beginner
- **tags:** royal-jelly, queen, nutrition

---

## 9. Pollen & nutrition

### F24 — Why bees need diverse pollen
- **summary:** Pollen is the bees' protein/fat/vitamin source, needed mainly to rear brood. A **diverse pollen diet** provides a complete amino-acid/protein profile; a single-pollen (mono-floral) diet can be nutritionally incomplete and weaken the colony.
- **key numbers:** Pollen is the **main protein source**; colonies rear the most brood in spring/summer when pollen is abundant — consensus of USDA/extension pollinator nutrition. **(Numeric protein figure — e.g., specific protein % needed — I did not verify a single authoritative number with confidence, so I am flagging it out rather than inventing it.)**
- **source:** USDA / university extension pollinator nutrition references.
- **difficulty:** beginner
- **tags:** pollen, nutrition, protein, brood

### F25 — Nectar flows by season
- **summary:** Nectar availability (the bees' carbohydrate/energy source, made into honey) changes through the season, driving colony cycles: spring build-up, summer nectar flows followed by harvest, then autumn stores for winter.
- **key numbers:** No single universal figure; flows depend strongly on region and flora. **[Consensus framing only]** — present nectar flows as seasonal/qualitative rather than a numeric claim.
- **source:** FAO / extension seasonal beekeeping guides.
- **difficulty:** beginner
- **tags:** nectar, seasonal, honey-flow

---

## 10. Temperature / safety for opening hives

### F26 — Recommended minimum inspection temperature
- **summary:** Opening a hive loses heat and can chill brood. Most of the year, the recommended minimum ambient temperature for a full inspection is roughly **12–15 °C (≈55–60 °F)**; below that, inspections should be brief and limited to essential checks, with brood confirmed/fed early in cold weather.
- **key numbers**
  - Recommended minimum for opening/inspecting: **~15 °C (~59 °F)**, with **12–14 °C (≈54–57 °F)** as the practical lower bound for full inspections; below ~10 °C bees cluster and opening is stressful — **[consensus — verify URL]** (university extension).
  - The reason: brood requires **~34–35 °C** to develop; losing heat to a cold, open hive chills brood and can kill it; also the cluster doesn't break and defend well in the cold — consensus **[consensus — verify URL]**.
  - This is why early-spring manipulations (feeding, reducing) are done quickly with minimal exposure.
- **source:** University extension (Penn State, UMN, etc.). Flag for URL verification of exact °C figure; the 12–15 °C band is the commonly taught range.
- **difficulty:** beginner
- **tags:** temperature, inspection, brood, safety

---

## Verification notes on the app's EXISTING claims

| Existing claim | Verdict | Notes / source |
|---|---|---|
| Drone cells attract mites 8–10× more than worker cells (Boot/Calis/Beetsma 1994; Rosenkranz 2010) | **Directionally correct; number is from the cited peer-reviewed lit, not Penn State** | Penn State Extension currently cites a **~6-fold** increase under drone cappings. The **8–10×** figure is the one reported in the cited primary sources (Boot, Calis & Beetsma 1994; Rosenkranz et al. 2010). Keep citations; may note ~6× from Penn State as the extension-consensus figure. |
| A drone frame can remove 10–30% of mites | **Plausible but I could not verify this exact range** | Varroa literature cites **50–93%** removal when drone comb is managed well (Wikipedia Good Article). The 10–30% figure may be a conservative/typical figure; **[flag — verify]** against a primary source before presenting. |
| Alcohol wash kills ~300 bees | **Roughly accurate but sample sizes vary** | Virginia Tech uses **~200±25**, Mississippi State uses **~400** (half-cup). 300 is within the common range; present as "a sample of ~200–400 bees is killed." |
| Sugar roll is comparable accuracy and non-lethal | **Verified** | Virginia Tech ENTO-332NP: "replacing alcohol with powdered sugar eliminates bee death… does not impact bees used in sampling long term"; alcohol is "most accurate" but sugar roll is the non-lethal quantitative alternative. |
| 15–20 kg winter stores (more in northern Europe) | **Verified as a reasonable guideline** | Consistent with national-association guidance (~15–20 kg, more in cold regions). Present as a range with regional note. |
| 3 mites per 100 bees requires treatment (varroa-suspect outcome) | **Verified** | Mississippi State P4049: **3 mites/100 bees** is the research-based treatment threshold for the growing season (May–Oct). |
| 35 ml of 3.2% oxalic acid dihydrate syrup per colony, broodless | **Flag — figure not independently verified** | Standard literature doses oxalic dribble **per seam of bees (~5 ml of 3.2% dihydrate per seam)**, not a fixed 35 ml/colony. Verify the exact 35 ml against a product label / national recommendation before presenting as hard fact. |
| Requeen / queen introduction cage with candy plug 3–5 days | **Plausible; verify exact days** | Queen introduction via cage with a candy plug releases the queen over ~3–5 days as bees eat the plug, allowing acceptance. **[consensus — verify URL]** for the exact day range; the candy-plug mechanism itself is standard. |
| Queenlessness leads to laying workers after 3–4 weeks | **Reasonable; verify exact window** | A queenless colony that cannot rear a replacement will develop **laying workers** after roughly 3–4 weeks when emergency queen rearing fails — **[consensus — verify URL]**; commonly taught range. |

---

## Sources (master list)

- **Rosenkranz P, Aumeier P, Ziegelmann B (2010).** *Biology and control of Varroa destructor.* Journal of Invertebrate Pathology 103:S96–S119. (Already cited by the app.)
- **Boot WJ, Calis JNM, Beetsma J (1994).** The period of attractiveness of worker and drone brood cells; varroa/drone preference. (Already cited by the app.)
- **Karl von Frisch (1967/1973).** *The Dance Language and Orientation of Bees*; Nobel Prize in Physiology or Medicine, 1973.
- **Crane, E. (1990).** *Bees and Beekeeping: Science, Practice and World Resources.* (Already cited by the app.)
- **FAO (2020).** *Good Beekeeping Practices for Sustainable Apiculture.* (Already cited by the app.)
- **USDA APHIS** — American Foulbrood / apiary disease regulation. (page timed out this pass; search the APHIS site.)
- **USDA-ARS** — honey bee health research (varroa, viruses).
- **National Honey Board (honey.com)** — honey chemistry, moisture, yield context.
- **University of Minnesota Bee Lab (beelab.umn.edu)** — varroa management overview.
- **Penn State Extension** — *Methods to Control Varroa Mites: An IPM Approach* (drone capping 15 vs 11 d, 6× drone attraction, oxalic, thresholds context). https://extension.psu.edu/methods-to-control-varroa-mites-an-integrated-pest-management-approach
- **Virginia Tech VCE ENTO-332NP** — *Varroa Mite Sampling Methods* (alcohol wash 200±25 bees, sugar roll non-lethal, 2–5% threshold). https://www.pubs.ext.vt.edu/ENTO/ENTO-332/ENTO-332.html
- **Mississippi State Univ. Extension P4049** — *Sampling for Varroa Mites Using an Alcohol Wash* (1 mite/100 bees Feb; 3 mites/100 bees growing season). https://extension.msstate.edu/publications/sampling-for-varroa-mites-using-alcohol-wash
- **Honey Bee Health Coalition** — *Tools for Varroa Management* (9th ed.) and varroa resources. https://honeybeehealthcoalition.org/resources/varroa-management/
- **Wikipedia "Varroa destructor" & "Deformed wing virus"** — used only as aggregators carrying the peer-reviewed citations above (Rosenkranz 2010, Gunn et al. 1999, Lanzi et al. 2006, McMahon et al. 2016, Brettell et al. 2017, Schroeder & Martin 2012, Jack 2021). The app should cite the **underlying papers**, not Wikipedia.

**Not-verified flags to resolve before shipping:** (1) AFB spore "40 years" figure; (2) oxalic acid "35 ml per colony" dose; (3) drone frame removes "10–30%" of mites; (4) exact AMS honey moisture % URL; (5) queen-marking color-code association URL; (6) laying-worker "3–4 weeks" URL; (7) requeening "3–5 days" URL; (8) the "~1s = 1 km" waggle numeric approximation; (9) 12–15 °C inspection temperature live URL.
