---
theme: glacier
title: Primary Morgage # toc: false
---

<script src="https://cdn.tailwindcss.com"></script>

```js
import { Mutable } from "npm:@observablehq/stdlib";
let updatedXDomain = Mutable([
    // "2017-02-01T16:29:02.813Z",
    // "2024-06-13T00:00:00.000Z"
]);

const setXDomain = (v) => (updatedXDomain.value = v);
```

```js
const chart = (width, height, brushable = false) => {
  // Declare the chart dimensions and margins.

  const marginTop = 20;
  const marginRight = 30;
  const marginBottom = 30;
  const marginLeft = 40;
  const xKey = "date";
  const yKey = "pmms30";
  // Declare the x (horizontal position) scale.
  let xDomain = brushable ? d3.extent(pmms, (d) => d[xKey]) : updatedXDomain;
  console.log(updatedXDomain.value);
  const x = d3.scaleUtc(xDomain, [marginLeft, width - marginRight]);

  // Declare the y (vertical position) scale.
  const y = d3.scaleLinear(
    [0, d3.max(pmms, (d) => d[yKey])],
    [height - marginBottom, marginTop]
  );

  // Declare the line generator.
  const line = d3
    .line()
    .x((d) => x(d[xKey]))
    .y((d) => y(d[yKey]));

  // Create the SVG container.
  const svg = d3
    .create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

  // Add the x-axis.
  svg
    .append("g")
    .attr("transform", `translate(0,${height - marginBottom})`)
    .call(
      d3
        .axisBottom(x)
        .ticks(width / 80)
        .tickSizeOuter(0)
    );

  // Add the y-axis, remove the domain line, add grid lines and a label.
  svg
    .append("g")
    .attr("transform", `translate(${marginLeft},0)`)
    .call(d3.axisLeft(y).ticks(height / 40))
    .call((g) => g.select(".domain").remove())
    .call((g) =>
      g
        .selectAll(".tick line")
        .clone()
        .attr("x2", width - marginLeft - marginRight)
        .attr("stroke-opacity", 0.1)
    )
    .call((g) =>
      g
        .append("text")
        .attr("x", -marginLeft)
        .attr("y", 10)
        .attr("fill", "currentColor")
        .attr("text-anchor", "start")
        .text("↑ Daily close ($)")
    );

  // Append a path for the line.
  svg
    .append("path")
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 1.5)
    .attr("d", line(pmms));

  // brush
  if (brushable) {
    const brush = d3
      .brushX()
      .extent([
        [marginLeft, 0.5],
        [width - marginRight, height - marginBottom + 0.5],
      ])
      .on("brush", brushed)
      .on("end", brushended);
    const defaultSelection = [
      x(d3.utcYear.offset(x.domain()[1], -1)),
      x.range()[1],
    ];
    // what is this for?
    const gb = svg.append("g").call(brush).call(brush.move, defaultSelection);

    function brushed({ selection }) {
      if (selection) {
        svg.property("value", selection.map(x.invert, x).map(d3.utcDay.round));

        //? what is input
        svg.dispatch("input");

        setXDomain(selection.map(x.invert));
      }
    }

    function brushended({ selection }) {
      if (!selection) {
        gb.call(brush.move, defaultSelection);
      }
    }
  }

  return svg.node();
};
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

```js

```

<section class="grid grid-cols-3 grid-rows-4 gap-4">
  <div class="card bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
    <!-- Title and Rate -->
    <div class="text-blue-500 text-lg font-semibold">30-year fixed-rate</div>
    <div class="text-gray-900 text-5xl font-bold mt-1">7.22%</div>
    <!-- Changes -->
    <div class="mt-4">
      <div class="flex justify-between text-sm text-gray-600">
        <div>1-week change</div>
        <div class="flex items-center">
          <span class="text-green-500">+0.05%</span>
          <svg
            class="w-4 h-4 text-green-500 ml-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            ><path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 12l5-5L20 15"
            ></path></svg>
        </div>
      </div>
      <div class="flex justify-between text-sm text-gray-600 mt-1">
        <div>1-year change</div>
        <div class="flex items-center">
          <span class="text-green-500">+0.83%</span>
          <svg
            class="w-4 h-4 text-green-500 ml-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            ><path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 12l5-5L20 15"
            ></path></svg>
        </div>
      </div>
    </div>
  <!-- Averages -->
    <div class="mt-4">
      <div class="flex justify-between text-sm text-gray-600">
        <div>4-week average</div>
        <div class="text-gray-900">7.09%</div>
      </div>
      <div class="flex justify-between text-sm text-gray-600 mt-1">
        <div>52-week average</div>
        <div class="text-gray-900">6.97%</div>
      </div>
    </div>
   <!-- Range Bar -->
    <div class="mt-6">
      <div class="text-gray-500 text-sm">52-week range</div>
      <div class="relative mt-2">
        <div class="h-1 bg-gray-300 relative flex justify-between">
          <div class="bg-gray-700 h-full w-0.5" style="left: 20%;"></div>
          <div class="bg-gray-700 h-full w-0.5" style="left: 40%;"></div>
          <div class="bg-gray-700 h-full w-0.5" style="left: 60%;"></div>
          <div class="bg-gray-700 h-full w-0.5" style="left: 80%;"></div>
          <div class="bg-blue-500 h-full w-0.5 absolute left-2/3"></div>
        </div>
        <div class="absolute top-2 left-0 text-xs text-gray-600">6.35%</div>
        <div class="absolute top-2 right-0 text-xs text-gray-600">7.79%</div>
      </div>
    </div>
  </div>

  <div class="card col-start-1 row-start-2">2</div>
  <div class="card col-span-3 row-span-3 col-start-1 row-start-3">${resize((width,height)=> {
    return chart(width,height,true)
  })}</div>
  <div class="card col-span-2 row-span-2 col-start-2 row-start-1">${resize((width,height)=> {
    return chart(width,height)
  })}</div>
</section>
