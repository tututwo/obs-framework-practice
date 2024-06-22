---
theme: glacier
title: NYT Rent dashboard # toc: false
---

<script src="https://cdn.tailwindcss.com"></script>

```js
import * as topojson from "npm:topojson-client";
const mapTopoJSON = FileAttachment("data/merged_borders-topo.json")
  .json()
  .then((border) => {
    return topojson.feature(
      border,
      border.objects[Object.keys(border.objects)[0]]
    );
  });

const meta = FileAttachment("data/meta.json").json();
```

```js
const selectedMetric = Inputs.select(
  Object.keys(meta["areaLastMonth"]["Astoria"]),
  { value: "changeRentTrend", label: "Selected Rent Metric" }
);

const selectedMetricValue = Generators.input(selectedMetric);
```

<!-- https://github.com/CartoDB/basemap-styles?tab=readme-ov-file -->

```js
import { tile as d3Tile } from "npm:d3-tile";
const map = (width, height) => {
  const svg = d3
    .create("svg")
    .attr("viewBox", [0, 0, width, height])
    .attr("width", width)
    .attr("height", height)
    .attr("style", "max-width: 100%; height: auto;");

  const projection = d3.geoMercator().fitSize([width, height], mapTopoJSON);
  const path = d3.geoPath().projection(projection);

  // Basemap
  const tile = d3Tile()
    .size([width, height])
    .scale(projection.scale() * 2 * Math.PI)
    .translate(projection([0, 0]));

  const tiles = tile();
  svg
    .append("g")
    .attr("class", "tiles")
    .selectAll("image")
    .data(tiles)
    .enter()
    .append("image")
    .attr(
      "xlink:href",
      (d) =>
        `https://cartodb-basemaps-a.global.ssl.fastly.net/light_nolabels/${d[2]}/${d[0]}/${d[1]}.png`
    )
    .attr("x", (d) => (d[0] + tiles.translate[0]) * tiles.scale)
    .attr("y", (d) => (d[1] + tiles.translate[1]) * tiles.scale)
    .attr("width", tiles.scale)
    .attr("height", tiles.scale);

  // Overlay SVG choropleth
  svg
    .selectAll("path")
    .data(mapTopoJSON.features)
    .join("path")
    .attr("class", "vector")
    .attr("d", path)
    .style("fill", (d) => {
      let value =
        meta["areaLastMonth"][d.properties["Neighborhood"]][
          selectedMetricValue
        ];
      let color = value === null ? "transparent" : colorScale(value);
      return color;
    })
    .style("stroke", "white")
    .style("stroke-width", 3)
      .on("mouseover", function (event, d) {
      this.dispatchEvent(new CustomEvent("hoveredNeighborhood", { detail: d.properties["Neighborhood"], bubbles: true }));
    })
    .on("click", function (event, d) {
      this.dispatchEvent(new CustomEvent("clickedNeighborhood", { detail: d.properties["Neighborhood"], bubbles: true }));
    });

  return svg.node();
};
```

```js
// Reactively get the hovered neighborhood
const hoveredNeighborhood = Generators.observe(notify => {
  const updateHover = (event) => notify(event.detail);
  document.addEventListener("hoveredNeighborhood", updateHover);
  return () => document.removeEventListener("hoveredNeighborhood", updateHover);
});

// Reactively get the clicked neighborhood
const clickedNeighborhood = Generators.observe(notify => {
  const updateClick = (event) => notify(event.detail);
  document.addEventListener("clickedNeighborhood", updateClick);
  return () => document.removeEventListener("clickedNeighborhood", updateClick);
});
```

```js
console.log(hoveredNeighborhood);
```

```js
// clickedNeighborhood;
```

```js
const colorDomain = d3.extent(
  Object.values(meta["areaLastMonth"])
    .map((d) => d[selectedMetricValue])
    .filter((tp) => tp !== null)
);
```

```js
const colorScale = d3
  .scaleQuantile()
  .domain(colorDomain)
  .range(["#4CCEEE", "#5A8DE9", "#8D51CF", "#FB6192"]);
```

<header>
  <div
    class="text-center mt-[40px] text-[1.125rem] max-w-[550px] mx-auto leading-5 font-bold"
  >
    Manhattan, Brooklyn and Queens real estate at a glance for the quarter ended
    June 30
  </div>
  <div class="factsModule">
    <div class="factsModule">
      <div class="singleFact" data-key="highestSale" data-format="dollarShort">
        <h4>$56M</h4>
        <p
          class="text-center font-[500] text-[.8rem] mt-2 mx-auto mb-6 indent-0"
        >
          Highest priced sale
        </p>
      </div>
      <div class="singleFact" data-key="trend" data-format="dollar">
        <h4>$800,000</h4>
        <p
          class="text-center font-[500] text-[.8rem] mt-2 mx-auto mb-6 indent-0"
        >
          Median home price
        </p>
      </div>
      <div class="singleFact" data-key="changeTrend" data-format="percent">
        <h4>+4.6%</h4>
        <p
          class="text-center font-[500] text-[.8rem] mt-2 mx-auto mb-6 indent-0"
        >
          Change in price from last year
        </p>
      </div>
    </div>
  </div>
</header>

<!--!-- -- -- -- -- -- --  Chart-- -- -- -- -- -- -- --  -->
<!--!-- -- -- -- -- -- --  Chart-- -- -- -- -- -- -- --  -->
<!--!-- -- -- -- -- -- --  Chart-- -- -- -- -- -- -- --  -->
<section class='h-screen'>
<!-- Input -->
<div>
${selectedMetric}
</div>

<!-- Legend -->
<div></div>

<!-- Explanation -->
<div></div>

<!-- Bot Line Charts -->
<div class='h-full'>
  ${resize((width, height) => {
    return map(width, height)
  })}
</div>

</section>

<style>
  .factsModule {
    --color-gray-200: #efefef;
    --color-green-100: #f0f7f5;
    --color-green-800: #07593b;
    quotes: "“" "”" "‘" "’";
    text-rendering: optimizeLegibility;
    line-height: 1.558;
    color: #000;
    font-size: 1.125rem;
    -webkit-font-smoothing: antialiased;
    padding: 0;
    display: block;
    position: relative;
    overflow: hidden;
    max-width: 840px;
    margin: 0px auto 45px auto;
    font-family: "BWHaasDingbat", "BWHaasText", "Helvetica Neue", Helvetica,
      Arial, sans-serif;
    text-align: center;
  }
  .singleFact {
    quotes: "“" "”" "‘" "’";
    text-rendering: optimizeLegibility;
    line-height: 1.558;
    color: #000;
    font-size: 1.125rem;
    -webkit-font-smoothing: antialiased;
    font-family: "BWHaasDingbat", "BWHaasText", "Helvetica Neue", Helvetica,
      Arial, sans-serif;
    text-align: center;
    padding: 0;
    position: relative;
    display: block;
    float: left;
    width: 30%;
    margin: 0px 10px;
  }

  h4 {
    quotes: "“" "”" "‘" "’";
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    font-family: "BWHaasDingbat", "BWHaasText", "Helvetica Neue", Helvetica,
      Arial, sans-serif;
    text-align: center;
    padding: 0;
    margin: 32px 0 0 0;
    font-weight: 400;
    font-size: 40px;
    line-height: 1.75rem;
    color: #8317b2;
    margin-bottom: 12px;
    margin-top: 25px;
  }
</style>
