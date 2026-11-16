# Why a longer context costs more

An interactive teaching page for a 15-minute university seminar talk on cost-efficient use of AI. The audience knows how LLMs work technically (tokens, matrix multiplication) but not how usage is billed. The page shows why compute, and therefore cost, grows with context length.

## The file

- `index.html` is the whole page: inline CSS, inline script, no build step. Open it in a browser.
- The only outside dependency is the Lato font from Google Fonts.
- The script is one IIFE at the end of the file (from about line 514), in sections marked by comments.

## What the page shows

- **Left figure, one attention head at GPT-2 sizes** (768 numbers per token, 64 per head). Two views:
  - *Close-up* (1 to 12 tokens): every cell drawn, 1 of every 16 numbers, not to scale. Hovering a Query, Key or attention cell highlights the row and column that produce it. W_K sits behind W_Q and comes forward when a Key cell is hovered.
  - *To scale* (any length up to 1,048,576 tokens): each matrix is a block whose area is its number of values.
- **Right column:** total multiplications, and a chart with two vertical axes. Stacked areas on the left axis are multiplications (queries and keys, attention scores). Lines on the right axis are the input bill for the chosen models.
- **Bottom section, "What a new message costs":** warm against cold for one message appended to the current context.

## Controls

- Context length slider: steps through `STOPS`.
- Close-up / To scale toggle. Past 12 tokens the page switches to To scale by itself.
- Cold cache and warm cache: two independent toggles, both may be off (`state.mode` is `cold`, `warm`, `both` or `none`).
- Settings: heads per layer and layers, which multiply the multiplication counts (not the bill).
- Model buttons: toggle each model's bill line.
- Left and right arrow keys step the context. In the close-up, the right arrow plays an animation that fills in the new token's cells.

## The numbers

- Cold, whole context of n tokens: queries and keys `2 * n * 768 * 64`, attention scores `n * n * 64`.
- Warm, newest token only: queries and keys `2 * 768 * 64`, attention scores `n * 64`.
- Both are equal at n = 1,536.
- Bill, cold: every token billed at the cache-write rate. Bill, warm: n - 1 tokens at the cache-read rate plus 1 token written.
- Prices are in the `MODELS` array, in US dollars per million tokens, checked on 16 November 2026. `tier` and `mult` model long-prompt pricing: Claude Haiku 5.5 bills five times the rate above 100,000 tokens, OpenAI twice above 272,000.
- The cache-write prices for GPT-6 Luna and GPT-6.1 Terra are derived from OpenAI's stated rule (1.25 times input), not read from a price table.
- The bottom section uses its own `PRICE` constant (Claude Sonnet 5.5 only) and ignores the model buttons.

## Code map

- `state`: all UI state. `render()` redraws everything from it; call it after any change.
- `renderCells()`: close-up figure. `drawScale(n)`: to-scale figure.
- `drawChart()` and `drawBill()`: the chart. `chartTo(xm)` eases the axes; `cur` holds the displayed scales (`xm`, `yl`, `yr`) and `LEVELS` the horizontal zoom steps.
- `addToken()`: the close-up fill animation. `renderMsg()`: bottom section.
- Colours and fonts are CSS custom properties in `:root`, with dark-theme overrides under `prefers-color-scheme` and `[data-theme="dark"]`.

## Things to know before changing it

- The page was built by many small requests, so some CSS is left over from removed parts (for example `.tiles` variants, `.below`, `.band`).
- The two vertical axes are independent, so where a line crosses an area means nothing. This was a deliberate request.
- While marks rise from or sink to "nothing shown", they are drawn at a share of their final height and not on the axis scale; see `ya` in `drawChart()`.
- Simplifications the page no longer states in text: the cold count includes the masked half of the attention grid, the purple shades in the close-up are illustrative, and Value, the MLP and the output projection are not counted.
- Tested in Chrome at 780, 904 and 1,280 pixels wide. The dark theme was only checked in one screenshot.
- The page is also published as a Claude artifact. Editing this file does not update that copy.
