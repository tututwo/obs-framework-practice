---
theme: glacier
title: Primary Morgage # toc: false
---

<script src="https://cdn.tailwindcss.com"></script>

```js
const color = d3
  .scaleOrdinal()
  .domain(["30Y FRM", "15Y FRM"])
  .range(["#1f77b4", "#ff7f0e"]);
```

```js
import { Mutable } from "npm:@observablehq/stdlib";
const defaultStartEnd = [pmms.at(-53).date, pmms.at(-1).date];
const startEnd = Mutable(defaultStartEnd);
const setStartEnd = (se) => (startEnd.value = se ?? defaultStartEnd);
const getStartEnd = () => startEnd.value;

// const setXDomain = (v) => (updatedXDomain.value = v);
```

```js
function createLineChart(
  data,
  { width, height, margin = { top: 20, right: 30, bottom: 30, left: 40 } }
) {
  const svg = d3.create("svg").attr("width", width).attr("height", height);

  const x = d3
    .scaleUtc()
    .domain(d3.extent(data, (d) => d.date))
    .range([margin.left, width - margin.right]);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.rate)])
    .nice()
    .range([height - margin.bottom, margin.top]);

  const line = d3
    .line()
    .defined((d) => !isNaN(d.rate))
    .x((d) => x(d.date))
    .y((d) => y(d.rate));

  svg
    .append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x));

  svg
    .append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(null, "%"));

  const types = d3.group(data, (d) => d.type);

  const path = svg
    .append("g")
    .attr("fill", "none")
    .attr("stroke-width", 1.5)
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .selectAll("path")
    .data(types)
    .join("path")
    .attr("stroke", ([key]) => color(key))
    .attr("d", ([, values]) => line(values));

  function updateLineChart(data) {
    x.domain(d3.extent(data, (d) => d.date));
    svg
      .selectAll("g.x-axis")
      .transition()
      .duration(750)
      .call(d3.axisBottom(x));
    
    const types = d3.group(data, (d) => d.type);
    path
      .data(types)
      .join("path")
      .attr("stroke", ([key]) => color(key))
      .transition()
      .duration(750)
      .attr("d", ([, values]) => line(values));
  }

  return Object.assign(svg.node(), { update: updateLineChart });
}
```

```js
function createBrushableChart(
  data,
  { width, height, margin = { top: 20, right: 30, bottom: 30, left: 40 } }
) {
  const svg = d3.create("svg").attr("width", width).attr("height", height);

  const x = d3
    .scaleUtc()
    .domain(d3.extent(data, (d) => d.date))
    .range([margin.left, width - margin.right]);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.rate)])
    .nice()
    .range([height - margin.bottom, margin.top]);

  const line = d3
    .line()
    .defined((d) => !isNaN(d.rate))
    .x((d) => x(d.date))
    .y((d) => y(d.rate));

  svg
    .append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x));

  svg
    .append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(null, "%"));

  const types = d3.group(data, (d) => d.type);

  svg
    .append("g")
    .attr("fill", "none")
    .attr("stroke-width", 1.5)
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .selectAll("path")
    .data(types)
    .join("path")
    .attr("stroke", ([key]) => color(key))
    .attr("d", ([, values]) => line(values));

  const brush = d3.brushX()
    .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]])
    .on("brush", brushed);

  svg.append("g").call(brush);

  function brushed(event) {
    if (!event.selection) return;
    const [x0, x1] = event.selection.map(x.invert);
    setStartEnd([x0, x1]);
  }

  return svg.node();
}
```

```js
const pmms = FileAttachment("data/pmms.csv").csv({ typed: true });

const tidy = pmms.then((pmms) =>
  pmms.flatMap(({ date, pmms30, pmms15 }) => [
    { date, rate: pmms30, type: "30Y FRM" },
    { date, rate: pmms15, type: "15Y FRM" },
  ])
);
```

<!--! Big Step/Line Chart -->
<section class="flex flex-col h-[100vh]">
  <div class="card h-1/2">
    ${resize((width, height) => {
      const chart = createLineChart(tidy.filter(d => startEnd[0] <= d.date && d.date < startEnd[1]), {width, height});
      return chart;
    })}
  </div>
  <div class="card h-1/2">
    ${resize((width, height) => createBrushableChart(tidy, {width, height}))}
  </div>
</section>
