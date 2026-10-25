# ResearchBoost Agent (RBA)

AI accelerates the research that advances AI.

Organization homepage: https://ai4ai-for-anything.github.io/

This is a buildless static website. GitHub Pages serves `main` from the repository root.

- `index.html`: page structure and copy
- `style.css`: the visual system (bone paper, ink, one red; Instrument Serif, Inter, Geist Mono; figure frames)
- `app.js`: project data, results ladder with domain filters, Mini Bench tabs, Wishing List form
- `loop.js`: the Research Loop (ring of six steps inside the frozen task, a stage showing what each step does to one training step, autoplay) and the replayed agent session
- `motion.js`: headline reveals, Fig. 1 training-step timeline, Fig. 2 research stack, nested orbits; motion pauses off-screen and respects reduced motion
- `assets/`: earlier illustrations and the original workflow diagram (not used by the current page)

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
