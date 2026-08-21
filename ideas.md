# HealthMate AI — Design Direction

## Three possible stylistic approaches

| Theme Name | Very Brief Intro | Probability |
|---|---|---:|
| Clinical Atelier | An editorial health workspace with warm paper surfaces, cobalt signals, and careful typographic hierarchy. It should feel calm, capable, and considered rather than overtly clinical. | 0.07 |
| Quiet Observatory | A low-contrast nocturnal wellness console that uses constellations and soft data luminescence to make health tracking feel reflective. | 0.04 |
| Garden Protocol | A biophilic, daylight-first interface where preventive habits unfold as a living system of leaves, checks, and gentle milestones. | 0.09 |

## Chosen approach: Clinical Atelier

### Design Movement

**Contemporary editorial healthcare**: the poised utility of a premium clinic intake experience combined with the tactile restraint of a well-designed medical journal.

### Core Principles

1. **Calm before complexity**: present one relevant priority at a time, with supporting details layered below.
2. **Human precision**: use clinical indicators and data language, balanced by reassuring conversational cues.
3. **Asymmetric order**: anchor navigation in a steady side rail and let the main content move through deliberately varied columns.
4. **Visible safety**: distinguish information, suggestions, and urgent-care boundaries through both copy and color.

### Color Philosophy

The interface uses paper-white and warm mist as a low-stress working surface, then reserves deep **cobalt blue** for purposeful actions and trustworthy system states. Eucalyptus green signals routine progress, while muted coral is only used for attention and escalation. The visual language avoids alarm while keeping clinically important signals discoverable.

### Layout Paradigm

The application is organized as a **clinical desk**: a fixed, tactile navigation rail; a wide editorial canvas; and a narrow contextual column for status, reminders, and safety guidance. At small sizes, the rail becomes a compact top bar and the contextual area returns to the content flow.

### Signature Elements

1. **Vitals ribbon**: a slim, softly segmented status strip that appears across major module views.
2. **Specimen cards**: small warm-white cards with ink-like labels, numeric markers, and a single colored edge.
3. **Care rings**: restrained circular progress cues that make habits and follow-ups immediately readable.

### Interaction Philosophy

Every interaction should reduce uncertainty. Actions use direct, medically literate labels; feedback appears adjacent to the action; and demo-generated outputs always identify their informational limitation. The prototype favours selections, clear next steps, and progressive disclosure over dense data entry.

### Animation

Module panels ease in with a 180–240 ms opacity and 6–10 px vertical translation using `cubic-bezier(0.23, 1, 0.32, 1)`. The health rings complete with a short stroke-dash transition. Buttons reduce to 0.97 scale on press. Hover effects remain subtle, and all nonessential motion respects reduced-motion preferences.

### Typography System

**Manrope** provides highly readable UI text, labels, and data. **DM Serif Display** is used sparingly for page-level statements and human-focused reflections. Page titles use the serif face at 34–48 px; section titles use Manrope at 16–20 px with a bold weight; supporting data uses small uppercase Manrope labels with expanded tracking.

### Brand Essence

**HealthMate AI is a calm, explainable health companion for students and families who want to understand health information and build safer routines without pretending to replace a clinician.**

Personality: **reassuring, exact, humane**.

### Brand Voice

Headlines should be grounded and helpful, not sensational. CTAs should state the action and limit, with compact microcopy that keeps the user in control.

> “Your report, in clearer language.”

> “Ask a health question — get context, not a diagnosis.”

### Wordmark & Logo

The mark is an abstract **H** constructed from two cobalt care arcs surrounding a warm coral pulse point. It symbolizes a bridge between a person and clear health context; the wordmark sits beside it in a custom, letter-spaced Manrope treatment.

### Signature Brand Color

**Cobalt Care — #2458E6**
