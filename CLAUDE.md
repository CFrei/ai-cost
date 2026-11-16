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
- **Right column:** a chart with two vertical axes. Its horizontal axis is the position in the conversation, in three parts: the existing context, the new message and the output. Every curve is a running total up to that position. Stacked areas on the left axis are multiplications (queries and keys, attention scores). Lines on the right axis are the bill for the chosen models. The parts are marked by grey bands in the plot and a bar under the axis, each named where the name fits; the small squares beside the three sliders are the key. Two sliders above the chart set the length of the new message and of the output. The legend for the areas and the model buttons sit below the chart. Large left-axis ticks are written in the unit named in the axis title, for example "multiplications (trillions)"; see `UNITS` in the script. The chart has no marker, hover box or click action.

## Controls

- Existing context length slider (`state.n`): steps through `STOPS`. It is the context before the new message; the left figure draws these n tokens.
- Close-up / To scale toggle. Past 12 tokens the page switches to To scale by itself.
- Cold cache and warm cache: two independent toggles, both may be off (`state.mode` is `cold`, `warm`, `both` or `none`).
- Two sliders above the chart: the new message in input tokens (`state.msg`, default 1, steps in `MSG_STOPS`) and the output in tokens (`state.out`, default 0, steps in `OUT_STOPS`), both up to 100,000.
- Settings: matrix sizes (a choice between the entries of `SIZES`: GPT-2 or the Opus 5.5 guess), and heads per layer and layers, which multiply the multiplication counts (not the bill). The GPT-2 and Opus 5.5 buttons set all three at once (12 × 12, and 64 heads × 100 layers); One head resets heads and layers only.
- Model buttons below the chart: toggle each model's bill line. They were tried as a drop-down menu and moved back out on request.
- The Settings menu closes on a click outside it and on Escape.
- Left and right arrow keys step the context. In the close-up, the right arrow plays an animation that fills in the new token's cells.

## The numbers

- The conversation is n tokens of existing context, then m tokens of new message, then o tokens of output. At position x in that sequence, k tokens have been computed: cold k = x, warm k = max(0, x - n), because the existing context is read from the cache.
- Running totals at x: queries and keys `2 * k * 768 * 64`, attention scores `k * x * 64`. Each computed token is scored against the x tokens so far, so the masked part of the grid is included in both cases.
- The cold curve is therefore `2 * x * 768 * 64` and `x * x * 64`, as on the original page. The warm curve is zero through the existing context and rises only in the new message and the output.
- The formulas use `DM` and `DH` in place of 768 and 64 when the sizes are switched. On the cold curve the two parts are equal at x = 2 × `DM`: 1,536 for GPT-2, 16,384 for the Opus guess.
- The Opus 5.5 sizes are a guess, extrapolated on 16 November 2026 from open-weight models (Kimi K3, Qwen3-235B, GLM-5, DeepSeek-V3). Anthropic publishes none of them.
- Running bill at x (`billAt`). Cold: every input token at the cache-write rate. Warm: the existing context at the cache-read rate, the new message at the cache-write rate. Both: output tokens at the output rate.
- Prices are in the `MODELS` array, in US dollars per million tokens, checked on 16 November 2026. `tier`, `mult` and `omult` model long-prompt pricing: the tier is decided by the whole input (n + m) and then applies to the whole line; above 100,000 input tokens Claude Haiku 5.5 bills five times the rate for input and output; above 272,000 OpenAI bills twice the input rate and 1.5 times the output rate.
- Output prices (`out`) were added on 16 November 2026: the Claude ones from Anthropic's model table, the OpenAI ones and the 1.5 times output rule from third-party price lists, not from OpenAI's own page.
- The cache-write prices for GPT-6 Luna and GPT-6.1 Terra are derived from OpenAI's stated rule (1.25 times input), not read from a price table.

## Code map

- `DM`, `DH`: the current matrix sizes, changed only by `setSize(id)`. `sizeLabels()` rewrites every label that states them.
- `state`: all UI state. `render()` redraws everything from it; call it after any change.
- `renderCells()`: close-up figure. `drawScale(n)`: to-scale figure.
- `drawChart()` and `drawBill()`: the chart. `drawParts()` draws the three parts of the horizontal axis and `samples()` picks the positions the curves are drawn through. `chartTo(xm)` eases the axes and is always called with `total()`, the length of the whole conversation; `cur` holds the displayed scales (`xm`, `yl`, `yr`).
- `addToken()`: the close-up fill animation.
- Colours and fonts are CSS custom properties in `:root`, with dark-theme overrides under `prefers-color-scheme` and `[data-theme="dark"]`.

## Things to know before changing it

- The page was built by many small requests, so some CSS is left over from removed parts (for example `.tiles` and `.tile`, `.below`, `.band`).
- The two vertical axes are independent, so where a line crosses an area means nothing. This was a deliberate request.
- The left figure does not follow the two chart sliders: it draws the existing context, and with a warm cache it highlights only the newest of those tokens, as the original page did.
- With realistic lengths (a long context, a short message and output) the last two parts of the axis are slivers a few pixels wide and their names are left out.
- While marks rise from or sink to "nothing shown", they are drawn at a share of their final height and not on the axis scale; see `ya` in `drawChart()`.
- Removed on request, so not shown anywhere on the page now: the big total-multiplication numbers above the chart, the chart's marker, hover box and click-to-jump (so the page no longer states a total number of multiplications anywhere; read it off the left axis), the bottom section "What a new message costs", the list under the chart of each chosen model's bill (so the page states no bill in numbers either; read it off the right axis), the sentence explaining the chart (areas on the left axis, lines on the right, solid lines cold and dashed lines warm, click to jump), and the list of prices per model.
- Simplifications the page no longer states in text: the cold count includes the masked half of the attention grid, the purple shades in the close-up are illustrative, and Value, the MLP and the output projection are not counted.
- Tested in Chrome at 780, 904 and 1,280 pixels wide. The dark theme was only checked in one screenshot.
- The page is public at https://cfrei.github.io/ai-cost/, served by GitHub Pages from the root of `main` in the repo `CFrei/ai-cost`. A push to `main` republishes it after about a minute.
- The page is also published as a Claude artifact. Editing this file does not update that copy.
