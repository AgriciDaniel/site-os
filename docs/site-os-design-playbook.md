# Site OS design playbook

This document records reusable decisions for a responsive website that uses an
operating-system metaphor without making visitors manage windows.

## Product decision

Make Site OS a locked, single-window website by default at every viewport size.
Route navigation replaces the content in that one window. Keep the draggable
multi-window desktop as an explicit desktop-only playground at
`?experience=os&windows=free`.

This preserves the operating-system metaphor while avoiding accidental dragging,
hidden content, overlapping windows, and touch-screen window management.

## Responsive contract

### Desktop

- Show the taskbar and desktop icon columns.
- Center a locked route window at approximately 80% width and 95% of the
  available desktop height.
- Give content its own scroll viewport. The document body does not scroll.
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

Use hierarchy rather than color volume:

- Keep reading surfaces neutral and calm.
- Use a signal color for the active idea and selected UI.
- Use one distinct signal color for the main action.
- Use supporting accents sparingly for proof and emphasis.
- Let the wallpaper carry atmosphere instead of flooding the reading surface.

For this template, `signal-blue` marks active ideas, `signal-gold` marks the
primary action, `signal-mint` supports product proof, and `signal-coral` adds
human emphasis. Treat these as roles, not fixed brand colors.

## Marketing system

### Lead with the outcome

The first headline should describe the state the visitor wants, not the
implementation. Put technical detail in the supporting paragraph.

### Bridge problem to solution quickly

Use a concise sequence:

1. Name the friction.
2. State the new operating model.
3. Give one believable reason it works.
4. Offer an immediate action.

### Put proof beside the promise

Pair an important claim with a working interaction, specific number, visible
product state, customer result, or an implementation detail that makes it
credible.

### Show before explaining everything

Make the first substantial section interactive. Tabs, compact demos, before and
after states, or working samples let visitors test the idea before reading the
full story.

### Use one loud action and one quiet action

The primary call to action gets the signal color. The secondary action is
neutral and exploratory. Both should reflow from a compact desktop group to a
tablet layout and then a full-width phone stack.

### Sequence a long page deliberately

Use this order when it fits the product:

1. Outcome-led hero and action
2. Immediate proof or interactive demo
3. Product or capability depth
4. Social or customer evidence
5. Context and data story
6. Clear pricing or operating model
7. Why this team or approach
8. Useful resources
9. Playful final invitation

## Community customization checklist

- Replace the template name, copy, and all example content.
- Map signal color roles to the brand palette and check contrast.
- Keep one main action per section.
- Add evidence next to every important claim.
- Test the locked route window at 390, 768, 1024, and 1440 pixels wide.
- Test free-window mode with a mouse at a desktop width.
- Verify single-tap phone icons, internal scrolling, close and reopen, and no
  horizontal overflow.
- Preserve ordinary static routes and the explicit conventional-page escape
  hatch.
