---
theme: glacier
title: Shared Tooltip Line Charts
toc: false
---

<script src="https://cdn.tailwindcss.com"></script>

```js
const data1 = FileAttachment("data/carroll-gardens.csv").csv({
  typed: true,
});
const data2 = FileAttachment("data/long-island-city.csv").csv({
  typed: true,
});
const data3 = FileAttachment("data/soho-little-italy-nolita.csv").csv({
  typed: true,
});
```

```js
const tooltipState = Mutable({
  date: null,
  x: null,
});

function createLineChart(
  data,
  {
    width,
    height,
    margin = {
      top: 20,
      right: 30,
      bottom: 30,
      left: 40,
    },
  },
  color,
  yLabel,
  yMax
) {
  const svg = d3
    .create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("class", "line-chart");

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
  


  const overlay = svg.append("rect")
    .attr("class", "overlay")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "none")
    .attr("pointer-events", "all");

  overlay
    .on("mousemove", function(event) {
      const [xm, ym] = d3.pointer(event, this);
      const date = x.invert(xm);
      tooltipState.value = { date, x: xm, y: ym };

      console.log
    })
    .on("mouseleave", () => {
      tooltipState.value = { date: null, x: null, y: null };
    });
  return svg.node();
}
```

```js
function updateAllTooltips(charts, data) {
  const { date, x, y } = tooltipState;
  if (!date) {
    charts.forEach(chart => d3.select(chart).select("g[display]").attr("display", "none"));
    return;
  }

  charts.forEach((chart, i) => {
    const svg = d3.select(chart);
    const width = +svg.attr("width");
    const height = +svg.attr("height");
    const margin = { top: 20, right: 30, bottom: 30, left: 40 };

    const xScale = d3.scaleUtc()
      .domain(d3.extent(data[i], d => d.date))
      .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data[i], d => d.value)])
      .nice()
      .range([height - margin.bottom, margin.top]);

    const bisect = d3.bisector(d => d.date).left;
    const index = bisect(data[i], date);
    const d = data[i][index];

    if (d) {
      const tooltip = svg.select("g[display]");
      tooltip
        .attr("transform", `translate(${xScale(d.date)},${yScale(d.value)})`)
        .attr("display", null);
      
      tooltip.select("text").text(d.value.toFixed(2));
    }
  });
}
```

<section class="flex flex-col h-[1000px]">
  <div class="card h-1/3">${resize((width, height) => createLineChart(data1, {width, height}, d3.scaleOrdinal().domain(["value1", "value2", "value3"]).range(["#1f77b4", "#ff7f0e", "#2ca02c"]), "Y Axis Label", d3.max(data1, d => d.value)))}</div>
  <div class="card h-1/3">${resize((width, height) => createLineChart(data2, {width, height}, d3.scaleOrdinal().domain(["value1", "value2", "value3"]).range(["#1f77b4", "#ff7f0e", "#2ca02c"]), "Y Axis Label", d3.max(data2, d => d.value)))}</div>
  <div class="card h-1/3">${resize((width, height) => createLineChart(data3, {width, height}, d3.scaleOrdinal().domain(["value1", "value2", "value3"]).range(["#1f77b4", "#ff7f0e", "#2ca02c"]), "Y Axis Label", d3.max(data3, d => d.value)))}</div>
</section>

```js
const charts = d3.selectAll('.line-chart').nodes();
  const allData = [data1, data2, data3];

  // This function will be called whenever tooltipState changes
  function update() {
    updateAllTooltips(charts, allData);
  }

  // Use Observable's reactive capabilities
  tooltipState.value;
  update();


  // Return a function that updates the tooltips
  
```
