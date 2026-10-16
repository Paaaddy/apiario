# Content expansion plan — October 2026

Working reference for the agreed 2× content expansion of the bundled libraries.
Agreed via design interview: scope, topics, quality bar and process all signed off by the product owner.
No code, screen or next-action rule changes — data only. EU/German practice is the canonical frame.
New sourced fact entries live in `beekeeping-facts.md` (F27+). Existing validators must stay green.

## 1. Seasonal tasks — `src/data/seasons.json` (+24 → 46)

### Spring (+5 regular, +1 secret)
| id | summary | urgency | minExp | risk |
|---|---|---|---|---|
| sp-06 | Milbenfall nach dem Winter: natürlicher Milbenfall als Befallsschätzung (broodless window) | important | 0 | caution |
| sp-07 | Waben erneuern: dunkle Brutfäden ausschneiden, Mittelwände prüfen | routine | 1 | — |
| sp-08 | Tracht bewerten: Weide- und Trachtpflanzen in der Umgebung einschätzen | important | 0 | — |
| sp-09 | Eilage prüfen: legt die Königin wieder regulär? | important | 1 | caution |
| sp-10 | Ableger planen: Volksentwicklung für Frühsommer-Splits beurteilen | important | 1 | caution |
| sp-secret-03 | Erste Weidenblüte als Saison-Benchmark beobachten (unlockAt 1) | routine | 0 | — |

### Summer (+5 regular, +1 secret)
| id | summary | urgency | minExp | risk |
|---|---|---|---|---|
| su-06 | Kunstschwarm durchführen, wenn Weiselzellen auftauchen | urgent | 1 | warning |
| su-07 | Schleudern & Einwecken: Erntehygiene, Honig trocken und mottensicher lagern | important | 1 | caution |
| su-08 | Trachtlücke erkennen: bei Nektarmangel kurze Erhaltungsfütterung | routine | 1 | caution |
| su-09 | Bautätigkeit fördern: Mittelwände und Bar-Rähmchen einsetzen | routine | 1 | — |
| su-10 | Ablegerkontrolle: Begattung und Eilage 3–4 Wochen nach Bildung prüfen | important | 1 | caution |
| su-secret-03 | Königin markieren (internationaler Farbcode) (unlockAt 7) | routine | 2 | caution |

### Autumn (+5 regular, +1 secret)
| id | summary | urgency | minExp | risk |
|---|---|---|---|---|
| au-06 | Varroa zählen vor der Behandlung (Milchglas-/Plattenmethode) | important | 0 | caution |
| au-07 | Nachbehanglung: zweiter Varroa-Durchgang nach 1–2 Wochen | urgent | 1 | warning |
| au-08 | Winterfutter vollständig? Heften und Futterkranz prüfen | important | 0 | caution |
| au-09 | Mäusegitter anbrangen, bevor die kalten Nächte kommen | routine | 0 | caution |
| au-10 | Geräte und entdeckeltes Wachs mottensicher lagern | routine | 1 | caution |
| au-secret-02 | Winterableger aus weiselrichtigen Zellen bilden (unlockAt 6) | important | 2 | caution |

### Winter (+4 regular, +2 secrets — fixes zero-secret season)
| id | summary | urgency | minExp | risk |
|---|---|---|---|---|
| wi-05 | Totenfall am Flugloch beobachten: wie viel ist normal? | routine | 0 | — |
| wi-06 | Hefttechnik üben: Gewicht ohne Öffnen einschätzen | routine | 0 | caution |
| wi-07 | Königin und Varroa-Planung für die nächste Saison (Bestellzeit) | important | 1 | — |
| wi-08 | Werkzeug warten und Waben umschmelzen | routine | 1 | caution |
| wi-secret-01 | Winterbienen beobachten: die Biologie der kurzen Bienen (unlockAt 2) | routine | 0 | — |
| wi-secret-02 | Ablegerkalender für das Frühjahr im Winter entwerfen (unlockAt 4) | routine | 1 | — |

### Side item: wi-04 fix
Replace the flagged "35 ml of 3.2 % per colony" with the sourced per-seam dosing
(~5 ml of 3.2 % oxalic-acid dihydrate in 1:1 syrup per seam of bees; see beekeeping-facts.md F6 and F27).
Update the beekeeping-facts.md verification-table flag accordingly.

## 2. Knowledge facts — `src/data/knowledge.json` (+6 → 11)

| id | title | difficulty | tags | research |
|---|---|---|---|---|
| f6 | Weisellos vs. schlechte Königin erkennen | intermediate | queen, diagnosis, health | F14/F15 + laying-worker note |
| f7 | Schwarmbiologie: Zellen, Nachschwärme, Auslöser | beginner | swarm, brood, biology | F28 |
| f8 | Varroa-Behandlung im Überblick: Oxal-, Ameisen-, Thymol | intermediate | varroa, treatment, health | F6/F27 + F29 |
| f9 | Winterbienen: warum sie länger leben | beginner | winter, biology, bees | F30 |
| f10 | Füttern: Sirup vs. Futterteig — wann was | beginner | feeding, winter, management | F31 |
| f11 | Trachtkalender lesen: wann die Nektarquellen fließen | beginner | forage, season, management | F25 |

## 3. Diagnosis tree — `src/data/diagnosis.json` (+19 nodes → 43)

New question nodes (added as root options; `attrition-normal` reachable via existing `dead-bees`, `superseded-queen` via existing `no-brood`):
| id | question | leads to |
|---|---|---|
| nosema-check | Kotflecken am Flugloch — groß und tropfenförmig oder nur wenige saubere Reinigungsflüge? | nosema-suspect, cleansing-normal |
| mites-visible | Sichtbare Milben auf Bienen, Waben oder am Flugloch? | varroa-heavy, varroa-suspect (existing) |
| comb-webbing | Gespinst, Bohrgänge oder Kotfraß in betroffenen Waben? | wax-moth, storage-advice |
| queen-not-laying | Königin da, aber keine Eier — nach Einweisung oder Jahreswechsel? | virgin-failure, laying-workers, superseded-queen |
| honey-sour | Honig schäumt, riecht sauer oder gärt im Glas? | fermenting-honey, storage-advice |
| brood-smell | Brut riecht sauer/modrig — Geruch und Bild zusammen beurteilen? | foulbrood-suspect, chalkbrood (existing) |
| swarm-gone-check | Erbschwarm ausgezogen oder nur angedeutet? | swarm-gone, swarm-prep (existing) |

New outcome nodes:
| id | callExpert | risk |
|---|---|---|
| attrition-normal (normaler Totenfall am Flugloch — auch erreichbar über existing dead-bees) | false | — |
| nosema-suspect | true | caution |
| cleansing-normal (kein Problem — Reinigungsflüge) | false | — |
| varroa-heavy (massiver Befall — sofort handeln) | true | warning |
| wax-moth (Wachsmottenbefall) | false | caution |
| storage-advice (eingelagerte Waben mottensicher machen) | false | — |
| virgin-failure (Jungkönigin nach Begattung nicht am Legen) | true | caution |
| laying-workers (Drohnenbrüter — fortgeschrittene Weisellosigkeit) | true | warning |
| superseded-queen (Königin wird still ausgetauscht — spärliche Brut) | false | caution |
| fermenting-honey (Honig gärt — Feuchtigkeit zu hoch) | false | caution |
| foulbrood-suspect (Faulbrut unbekannter Art — Labor nötig) | true | warning |
| swarm-gone (Erbschwarm ausgezogen — Restvolk zieht neue Königin) | false | caution |

## 4. Process

1. ✅ Plan written (this file).
2. Research: new sourced entries F27+ in `beekeeping-facts.md`; resolve wi-04 flag.
3. Data edits: seasons.json, knowledge.json, diagnosis.json (bilingual `{de,en}` throughout).
4. `npm run verify` (lint, tests, validators, Pages build) must pass.
