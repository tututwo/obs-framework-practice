---
theme: glacier
title: Brushable Lines
---
<script src="https://cdn.tailwindcss.com"></script>

```js
const pmms = FileAttachment("data/pmms.csv").csv({ typed: true });

const tidy = pmms.then((pmms) =>
  pmms.flatMap(({ date, pmms30, pmms15 }) => [
    { date, rate: pmms30, type: "30Y FRM" },
    { date, rate: pmms15, type: "15Y FRM" },
  ])
);
```

```js
const color = Plot.scale({ color: { domain: ["30Y FRM", "15Y FRM"] } });
const colorLegend = (y) =>
  html`<span style="border-bottom: solid 2px ${color.apply(`${y}Y FRM`)};"
    >${y}-year fixed-rate</span
  >`;
```

```js
const defaultStartEnd = [pmms.at(-53).date, pmms.at(-1).date];
const startEnd = Mutable(defaultStartEnd);
const setStartEnd = (se) => (startEnd.value = se ?? defaultStartEnd);
const getStartEnd = () => startEnd.value;
```

<section class="flex flex-col h-[1000px]">
    <div class="card h-1/2">
    ${resize((width, height) =>
      Plot.plot({
        width,
        height,
        y: {grid: true, label: "rate (%)"},
        color,
        marks: [
          Plot.lineY(tidy.filter((d) => startEnd[0] <= d.date && d.date < startEnd[1]), {x: "date", y: "rate", stroke: "type", curve: "step", tip: true, markerEnd: true})
        ]
      })
    )}
    </div>
    <div class="card h-1/2">
    ${resize((width,height) =>
      Plot.plot({
        width,
        y: {grid: true, label: "rate (%)"},
        color,
        marks: [
          Plot.ruleY([0]),
          Plot.lineY(tidy, {x: "date", y: "rate", stroke: "type", tip: true}),
          (index, scales, channels, dimensions, context) => {
            const x1 = dimensions.marginLeft;
            const y1 = 0;
            const x2 = dimensions.width - dimensions.marginRight;
            const y2 = dimensions.height;
            const brushed = (event) => {
              if (!event.sourceEvent) return;
              let {selection} = event;
              if (!selection) {
                const r = 10; // radius of point-based selection
                let [px] = d3.pointer(event, context.ownerSVGElement);
                px = Math.max(x1 + r, Math.min(x2 - r, px));
                selection = [px - r, px + r];
                g.call(brush.move, selection);
              }
              setStartEnd(selection.map(scales.x.invert));
            };
            const pointerdowned = (event) => {
              const pointerleave = new PointerEvent("pointerleave", {bubbles: true, pointerType: "mouse"});
              event.target.dispatchEvent(pointerleave);
            };
            const brush = d3.brushX().extent([[x1, y1], [x2, y2]]).on("brush end", brushed);
            const g = d3.create("svg:g").call(brush);
            g.call(brush.move, getStartEnd().map(scales.x));
            g.on("pointerdown", pointerdowned);
            return g.node();
          }
        ]
      })
    )}
  </div>
</section>
