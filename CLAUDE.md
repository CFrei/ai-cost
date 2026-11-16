# Why a longer context costs more

An interactive teaching page for a 15-minute university seminar talk on cost-efficient use of AI. The audience knows how LLMs work technically (tokens, matrix multiplication) but not how usage is billed. The page shows why compute, and therefore cost, grows with context length.

## The file

- `index.html` is the whole page: inline CSS, inline script, no build step. Open it in a browser.
- The only outside dependency is the Lato font from Google Fonts.
- The script is one IIFE at the end of the file (from about line 418), in sections marked by comments.

## What the page shows

- **Left figure, one attention head.** Sizes are GPT-2's by default (768 numbers per token, 64 per head); Settings can switch them to a guess at Claude Opus 5.5 (8,192 and 128). Two views:
  - *Close-up* (1 to 12 tokens): every cell drawn, 1 of every 16 numbers at GPT-2 sizes, not to scale. The grid is the same at the Opus sizes; only the labels change. Hovering a Query, Key or attention cell highlights the row and column that produce it. W_K sits behind W_Q and comes forward when a Key cell is hovered.
  - *To scale* (any length up to 1,048,576 tokens): each matrix is a block whose area is its number of values.
- **Right column:** a chart with two vertical axes. Stacked areas on the left axis are multiplications (queries and keys, attention scores). Lines on the right axis are the input bill for the chosen models. The legend for the areas sits below the chart. Large left-axis ticks are written in the unit named in the axis title, for example "multiplications (trillions)"; see `UNITS` in the script. The horizontal axis always runs from 0 to the context length set by the slider, so the chart has no marker, hover box or click action.

## Controls

- Context length slider: steps through `STOPS`.
- Close-up / To scale toggle. Past 12 tokens the page switches to To scale by itself.
- Cold cache and warm cache: two independent toggles, both may be off (`state.mode` is `cold`, `warm`, `both` or `none`).
- Settings: matrix sizes (a choice between the entries of `SIZES`: GPT-2 or the Opus 5.5 guess), and heads per layer and layers, which multiply the multiplication counts (not the bill). The GPT-2 and Opus 5.5 buttons set all three at once (12 × 12, and 64 heads × 100 layers); One head resets heads and layers only.
- Model buttons: toggle each model's bill line.
- Left and right arrow keys step the context. In the close-up, the right arrow plays an animation that fills in the new token's cells.

## The numbers

- Cold, whole context of n tokens: queries and keys `2 * n * 768 * 64`, attention scores `n * n * 64`.
- Warm, newest token only: queries and keys `2 * 768 * 64`, attention scores `n * 64`.
- The formulas use `DM` and `DH` in place of 768 and 64 when the sizes are switched. Both are equal at n = 2 × `DM`: 1,536 for GPT-2, 16,384 for the Opus guess.
- The Opus 5.5 sizes are a guess, extrapolated on 16 November 2026 from open-weight models (Kimi K3, Qwen3-235B, GLM-5, DeepSeek-V3). Anthropic publishes none of them.
- Bill, cold: every token billed at the cache-write rate. Bill, warm: n - 1 tokens at the cache-read rate plus 1 token written.
- Prices are in the `MODELS` array, in US dollars per million tokens, checked on 16 November 2026. `tier` and `mult` model long-prompt pricing: Claude Haiku 5.5 bills five times the rate above 100,000 tokens, OpenAI twice above 272,000.
- The cache-write prices for GPT-6 Luna and GPT-6.1 Terra are derived from OpenAI's stated rule (1.25 times input), not read from a price table.

## Code map

- `DM`, `DH`: the current matrix sizes, changed only by `setSize(id)`. `sizeLabels()` rewrites every label that states them.
- `state`: all UI state. `render()` redraws everything from it; call it after any change.
- `renderCells()`: close-up figure. `drawScale(n)`: to-scale figure.
- `drawChart()` and `drawBill()`: the chart. `chartTo(xm)` eases the axes and is always called with the context length; `cur` holds the displayed scales (`xm`, `yl`, `yr`).
- `addToken()`: the close-up fill animation.
- Colours and fonts are CSS custom properties in `:root`, with dark-theme overrides under `prefers-color-scheme` and `[data-theme="dark"]`.

## Things to know before changing it

- The page was built by many small requests, so some CSS is left over from removed parts (for example `.tiles` and `.tile`, `.below`, `.band`).
- The two vertical axes are independent, so where a line crosses an area means nothing. This was a deliberate request.
- While marks rise from or sink to "nothing shown", they are drawn at a share of their final height and not on the axis scale; see `ya` in `drawChart()`.
- Removed on request, so not shown anywhere on the page now: the big total-multiplication numbers above the chart, the chart's marker, hover box and click-to-jump (so the page no longer states a total number of multiplications anywhere; read it off the left axis), the bottom section "What a new message costs", the sentence explaining the chart (areas on the left axis, lines on the right, solid lines cold and dashed lines warm, click to jump), and the list of prices per model.
- Simplifications the page no longer states in text: the cold count includes the masked half of the attention grid, the purple shades in the close-up are illustrative, and Value, the MLP and the output projection are not counted.
- Tested in Chrome at 780, 904 and 1,280 pixels wide. The dark theme was only checked in one screenshot.
- The page is public at https://cfrei.github.io/ai-cost/, served by GitHub Pages from the root of `main` in the repo `CFrei/ai-cost`. A push to `main` republishes it after about a minute.
- The page is also published as a Claude artifact. Editing this file does not update that copy.
