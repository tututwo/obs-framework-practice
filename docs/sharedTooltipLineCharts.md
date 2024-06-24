---
theme: glacier
title: Shared Tooltip Line Charts
toc: false
---

<script src="https://cdn.tailwindcss.com"></script>

```js
const data1 = FileAttachment("data/carroll-gardens.csv").csv({ typed: true });
const data2 = FileAttachment("data/long-island-city.csv").csv({ typed: true });
const data3 = FileAttachment("data/soho-little-italy-nolita.csv").csv({
  typed: true,
});
```

```js
const tooltipState = Mutable(null);
const setTooltipState = (tooltip) => (tooltipState.value = tooltip);
```

```js
function createLineChart(
  data,
  { width, height, margin = { top: 20, right: 30, bottom: 30, left: 40 } },
  color,
  yLabel,
  yMax,
  updateTooltip
) {
  const svg = d3.create("svg").attr("width", width).attr("height", height);

  const x = d3
    .scaleUtc()
    .domain(d3.extent(data, (d) => d.date))
    .range([margin.left, width - margin.right]);

  const y = d3
    .scaleLinear()
    .domain([0, yMax])
    .nice()
    .range([height - margin.bottom, margin.top]);

  const line = d3
    .line()
    .defined((d) => !isNaN(d.value))
    .x((d) => x(d.date))
    .y((d) => y(d.value));

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

  const tooltip = svg.append("g").attr("display", "none");

  tooltip.append("circle").attr("r", 4.5);

  tooltip.append("text").attr("text-anchor", "middle").attr("y", -10);

  svg.on("mousemove", function (event) {
    const [xm] = d3.pointer(event);
    const date = x.invert(xm);
    setTooltipState({ date, x: xm });
    updateTooltip(data, date, xm, y, tooltip);
  });

  return svg.node();
}
```

```js
function updateTooltip(data, date, xm, y, tooltip) {
  const closestData = data.reduce((a, b) =>
    Math.abs(b.date - date) < Math.abs(a.date - date) ? b : a
  );
  tooltip.attr("transform", `translate(${xm},${y(closestData.value)})`);
  tooltip.select("text").text(closestData.value);
  tooltip.attr("display", null);
}
```

<section class="flex flex-col h-[1000px]">
  <div class="card h-1/3">${resize((width, height) => {
    const chart1 = createLineChart(data1, {width, height}, d3.scaleOrdinal().domain(["value1", "value2", "value3"]).range(["#1f77b4", "#ff7f0e", "#2ca02c"]), "Y Axis Label", d3.max(data1, d => d.value), updateTooltip);
    return chart1;
  })}</div>
  <div class="card h-1/3">${resize((width, height) => {
    const chart2 = createLineChart(data2, {width, height}, d3.scaleOrdinal().domain(["value1", "value2", "value3"]).range(["#1f77b4", "#ff7f0e", "#2ca02c"]), "Y Axis Label", d3.max(data2, d => d.value), updateTooltip);
    return chart2;
  })}</div>
  <div class="card h-1/3">${resize((width, height) => {
    const chart3 = createLineChart(data3, {width, height}, d3.scaleOrdinal().domain(["value1", "value2", "value3"]).range(["#1f77b4", "#ff7f0e", "#2ca02c"]), "Y Axis Label", d3.max(data3, d => d.value), updateTooltip);
    return chart3;
  })}</div>
</section>
