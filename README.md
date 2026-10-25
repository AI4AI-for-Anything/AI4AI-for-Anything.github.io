# ResearchBoost Agent (RBA)

AI accelerates the research that advances AI.

Organization homepage: https://ai4ai-for-anything.github.io/

This is a buildless static website. GitHub Pages serves `main` from the repository root.

- `index.html`: page structure and copy
- `style.css`: original responsive styles
- `readability.css`: larger text, stronger contrast, responsive readability adjustments
- `workflow.css` / `workflow.js`: interactive HTML workflow, playback and timing branches
- `carousel.css` / `carousel.js`: single-row project carousel with circular navigation, filters, swipe and automatic playback
- `app.js`: project index, filters, and local form interactions
- `assets/researchboost-workflow.png`: original ResearchBoost workflow diagram
- `illustrations.css` / `illustrations.js`: illustrated section layouts and viewport-aware decorative animation
- `assets/research-lab-atlas.png`: six original robot lab illustrations with transparency
- `assets/research-lab-prompt.txt`: built-in image generation prompt and provenance

Project details and evaluation protocols live in the linked research repositories. Mini Bench rankings remain pending validation. The Star link opens ResearchBoost-Agent on GitHub, where visitors confirm their star.


## Local preview

From this directory:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Open http://127.0.0.1:4173/ or http://127.0.0.1:4173/#workflow.

The workflow is an illustrative guide, not an agent execution interface. Click a
step to inspect it, use Play / Pause to walk through the loop, or select a timing
outcome to explore the full-check and direct-to-log paths. Playback starts only
on request and pauses when the diagram leaves the screen. System reduced-motion
preferences disable visual animation. No build or application dependencies are
required.

The research index is one continuously moving row. Its default speed is 22 CSS
pixels per second, driven by requestAnimationFrame; there are no timed slide jumps.
Drag left or right with a mouse or touch, use horizontal trackpad gestures, or use
arrows, position dots and keyboard navigation. Hovering a card, focusing its links,
leaving the section or hiding the tab temporarily suspends automatic movement.
An explicit Pause remains paused after filtering. Reduced-motion users start paused.
Without JavaScript, the static project grid remains visible.

The illustrated lab theme uses a single cached transparent atlas across the hero,
premise, research intro, six interactive workflow stages, workload invitation,
benchmark and contribution links. HTML labels remain selectable and accessible.
Decorative floating and scanning effects respect reduced-motion preferences.
