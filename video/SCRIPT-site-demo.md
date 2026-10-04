# Legible: site demo film (draft script v3, for validation)

**Format:** about 41 s, 1920×1080, English captions, no voice-over. Fast cuts on the beat.

**Music:** "NOTHIN LIKE U (INSTRUMENTAL)", starting one bar before the beat comes in (about 6.9 s into the track), so the film opens on the drop. Fade out at the end.

**Tempo:** about 70 BPM, so a bar is about 3.4 s and a beat about 0.86 s. Shots last 1 bar; "How it works" cuts every 2 beats.

**Sources:** **SITE** = a real screen capture of the website. **GFX** = added type, diagrams, zooms.

| # | Time | Source | On screen |
|---|---|---|---|
| 1 | 0:00–0:03 | GFX | **"Legal AI drafts in seconds."** Half a bar later it is replaced by **"But who said it?"** |
| 2 | 0:03–0:07 | GFX | The beat comes in. Three error cards, one per beat: *Party's argument → "the Court held"* · *Quashed finding → "the law"* · *Allegation → "a fact"* |
| 3 | 0:07–0:10 | SITE | Real hero, **"Who said it."**, with a fast push-in. Caption: **"Legible. The harness for legal AI."** |
| 4 | 0:10–0:14 | SITE + GFX | Real scenario block with moving arrows; the chips flash: Legora · Harvey · ChatGPT · Mistral · yours. Caption: **"Keep your models. We check every sentence they write."** |
| 5 | 0:14–0:17 | GFX | **"Every AI summary, cross-checked against your source files."** Subtitle: *calibrated attribution models + legal drafting rules* |
| 6 | 0:17–0:19 | GFX + SITE | **MAP: every file, one map of who said what.** Judgment, pleadings, expert report and exhibits light up by speaker, then merge into a single case map (real coloured decision from the site). |
| 7 | 0:19–0:21 | GFX | **TRACE: each sentence, linked to its source.** A summary sentence sends a thread to § 13. |
| 8 | 0:21–0:22 | GFX | **CHECK: decided by fixed rules, not by an AI's guess.** *Says: the Court* ≠ *Source: the court of appeal, quashed* → **BLOCKED** |
| 9 | 0:22–0:24 | GFX | **FIX: proof and correction, ready to send.** → **PASS** |
| 10 | 0:24–0:31 | SITE | Live on the real site, fast. Click **Run the check** → the verdicts appear → zoom on the BLOCKED § 13 card and its thread → **Apply the fix** → **Send to client**. Caption: **"Under a second per sentence."** |
| 11 | 0:31–0:34 | GFX | Lock icon: **"Confidential by design."** Lines: **"Your case map stays on your servers."** · **"Every model in the loop can be swapped for an on-premise one."** |
| 12 | 0:34–0:37 | GFX + SITE | Scope, as a quick flash: court decisions & client notes **Live** · litigation files **Prototype** · due diligence, arbitration, any court **Next**. Then the real benchmark: **"GPT alone names the source in 5–8 of 15 answers. Legible: 15 of 15."** |
| 13 | 0:37–0:41 | GFX | End card: **Legible** · **Who said it.** · **Works behind any legal AI.** Music fades out. |

## Fact check

- **"Every file, one map":** each document is mapped sentence by sentence (speaker, status, probability). The litigation-file prototype does this across 9 documents of one case.
- **"Fixed rules":** models pick the supporting passage and read who the summary names. The pass / review / blocked verdict itself is a fixed rule.
- **"Under a second per sentence":** 0.44 s on average, measured.
- **"5–8 of 15", "15 of 15":** measured on 2 decisions and 15 sentences.
- **Confidentiality.** "Case map on your servers" is true: Legible is a self-hostable app, and its registries are local files. "Can be swapped for an on-premise model" is an architecture fact (provider-agnostic System 1 client; open models exist for both roles), not a deployment we have done. **Today's demo calls Jev (US-hosted, inputs retained) and the Mistral API, so the film must not say "zero retention" or "nothing leaves your firm".**
- **Not claimed:** a partnership with Legora or Harvey, or "state of the art".
