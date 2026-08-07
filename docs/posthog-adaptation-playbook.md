# PostHog-inspired Site OS adaptation playbook

This document records the transferable product, responsive, color, and
marketing lessons observed on the live PostHog website on 6 August 2026. It is
an independent study. Do not copy PostHog's writing, graphics, trademarks,
assets, or exact brand palette.

## Executive decision

Make the Site OS a **locked single-window website by default at every viewport
size**. Route navigation replaces the content in that one window. Keep the
draggable multi-window desktop as an explicit desktop-only playground at
`?experience=os&windows=free`.

This preserves the memorable operating-system metaphor while removing the
largest usability costs: accidental dragging, hidden or overlapping content,
and window management on touch screens.

## What was verified in the live site

The observations below came from direct browser-control checks, not screenshots
or assumptions.

- At a 1649×1210 desktop viewport, PostHog displayed one centered route window
  with internal scrolling, desktop icons at both edges, and a top menu bar.
- Dragging the title bar did not move that route window; its position was
  unchanged after the gesture.
- Opening Pricing from the desktop replaced the route inside the same window.
  The page still contained exactly one app-window element.
- At 768×1024, the menu bar was absent. The window measured roughly 80% of the
  viewport width and 95% of its height, with no horizontal overflow.
- At 390×844, the route window filled the available shell surface, kept only the
  close control visible, and still had no horizontal overflow.
- Closing the phone window exposed a three-column icon launcher; selecting Home
  opened one full-size route window again.
- The content layout changed with the available reading surface: horizontal
  calls to action became two-column and then stacked, while the same proof-led
  page sequence remained intact.

## Responsive contract

### Desktop

- Show the taskbar and desktop icon columns.
- Center a locked route window at approximately 80% width and 95% of the
  available desktop height.
- Give content its own scroll viewport; the document body does not scroll.
- Make the full free-window manager opt-in, not the default.

### Tablet

- Remove the taskbar so chrome does not compete with content.
- Keep the locked window inset at approximately 80% width and 95% height.
- Retain desktop icons behind the window as atmosphere and navigation revealed
  after closing.
- Recompose calls to action and proof cards inside the window.

### Phone

- Use an eight-pixel shell inset and a full-size route window within it.
- Square the top window corners and leave only the close control visible.
- Closing the window reveals a three-column icon grid.
- A single tap launches an app. Do not require double-click, drag, resize, or
  hover.

### Container rule

Responsive content must size against its route window, not only the viewport.
Every app window is a CSS container. Use container-query breakpoints for
headlines, grids, tabs, action groups, and media so a 450-pixel window behaves
like a 450-pixel layout even on a wide monitor.

## Color system

The live site used hierarchy more carefully than sheer color volume:

- Canvas: warm off-white (`rgb(238, 239, 233)` when observed).
- Route window: translucent neutral (`rgba(229, 231, 224, 0.75)`) with a
  restrained gray border and soft shadow.
- Primary copy: near black.
- Highlighted headline phrase: blue (`rgb(47, 128, 250)`) on a very light blue
  tint.
- Main calls to action: warm gold (`rgb(205, 132, 7)`) with dark text.
- Supporting accents appeared in cyan, purple, mint, orange, coral, and green,
  but were not allowed to flood the reading surface.

### Transferable color rule

**Neutral where visitors read; expressive where they orient or act.**

For this independent template:

- `signal-blue` marks the active idea and selected UI.
- `signal-gold` marks the primary action.
- `signal-mint` communicates responsive/product proof.
- `signal-coral` adds human emphasis and contrast.
- The wallpaper carries atmosphere; window surfaces remain calm.

Treat these as roles rather than sacred hex values. Replace them with a
community user's own brand colors while preserving contrast and hierarchy.

## Marketing system

### 1. Lead with the outcome

The first headline should describe the state the visitor wants, not the
implementation. Technical mechanism belongs in the supporting paragraph.
Highlight the decisive phrase with a restrained accent tint.

### 2. Bridge problem to solution quickly

Use one concise sequence:

1. Name the friction.
2. State the new operating model.
3. Give one believable reason it works.
4. Offer an immediate action.

Do not make the visitor assemble the value proposition from feature cards.

### 3. Put proof beside the promise

A claim should travel with one of:

- a working interaction;
- a specific number;
- a visible product state;
- a customer result;
- an implementation detail that makes the claim credible.

The homepage therefore places three concrete architecture facts immediately
after the hero and follows them with a working tabbed demonstration.

### 4. Show before explaining everything

The first substantial section should be interactive. Tabs, a compact demo,
before/after states, or a working sample gives visitors a low-cost way to test
the idea before reading the full story.

### 5. Use one loud action and one quiet action

The primary call to action gets the warm signal color. The secondary action is
neutral and exploratory. Both reflow:

- desktop: compact group or sidebar card;
- tablet: two columns;
- phone: full-width stack.

### 6. Sequence a long page deliberately

A reusable order is:

1. Outcome-led hero and action
2. Immediate proof or interactive demo
3. Product or capability depth
4. Social/customer evidence
5. Context and data story
6. Clear pricing or operating model
7. Why this team or approach
8. Useful resources
9. Playful final invitation

Not every template needs all nine sections. Preserve the logic: promise, proof,
depth, trust, decision, invitation.

### 7. Make brand voice functional

Humor and transparency can lower the pressure of a technical decision, but the
offer must remain explicit. A small human line near a call to action works;
vagueness disguised as personality does not.

## Implementation map

| Concern | Location |
| --- | --- |
| Default locked/free behavior | `components/shell/ShellProvider.tsx` |
| Shell surface and responsive window geometry | `components/shell/Shell.tsx`, `app/globals.css` |
| Locked versus draggable window mechanics | `components/shell/AppWindow.tsx` |
| Mobile three-column launcher | `components/shell/Desktop.tsx` |
| Container-aware homepage composition | `components/apps/HomeApp.tsx` |
| Semantic and signal colors | `app/globals.css`, `tailwind.config.ts` |
| Automated behavior checks | `verify.py` |

## Community customization checklist

- Replace the template name, copy, and all example content.
- Map signal color roles to the brand palette and check contrast.
- Keep one main action per section.
- Add evidence next to every important claim.
- Test the locked route window at 390, 768, 1024, and 1440 pixels wide.
- Test free-window mode with a mouse at a desktop width.
- Verify single-tap phone icons, internal scrolling, close/reopen, and no
  horizontal overflow.
- Preserve ordinary static routes and the explicit conventional-page escape
  hatch.
