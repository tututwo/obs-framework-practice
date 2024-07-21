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
    // .on("mouseover", function (event, d) {
    //   this.dispatchEvent(
    //     new CustomEvent("hoveredNeighborhood", {
    //       detail: d.properties["Neighborhood"],
    //       bubbles: true,
    //     })
    //   );
    // })
    .on("click", function (event, d) {
      this.dispatchEvent(
        new CustomEvent("clickedNeighborhood", {
          detail: d.properties["Neighborhood"],
          bubbles: true,
        })
      );
    });

  return svg.node();
};
```

```js
// Reactively get the hovered neighborhood

const hoveredNeighborhood = Generators.observe((notify) => {
  const updateHover = (event) => notify(event.detail);
  document.addEventListener("hoveredNeighborhood", updateHover);
  return () => document.removeEventListener("hoveredNeighborhood", updateHover);
});

const clicked = [];

// Reactively get the clicked neighborhood
// const clickedNeighborhood = Generators.observe((notify) => {
//   const updateClick = (event) => notify(clicked.push(event.detail));
//   document.addEventListener("clickedNeighborhood", updateClick);
//   return () => document.removeEventListener("clickedNeighborhood", updateClick);
// });
// Reactively manage the array of clicked neighborhoods
const clickedNeighborhoods = Generators.observe((notify) => {
  let neighborhoods = [];
  const updateClick = (event) => {
    const neighborhood = event.detail;
    const index = neighborhoods.indexOf(neighborhood);
    if (index === -1) {
      neighborhoods.push(neighborhood);
    } else {
      neighborhoods.splice(index, 1);
    }
    notify([...neighborhoods]); // Notify with a new array reference
  };
  document.addEventListener("clickedNeighborhood", updateClick);
  return () => document.removeEventListener("clickedNeighborhood", updateClick);
});
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

```js
const areaList = () => {
  console.log(clickedNeighborhoods);
  return clickedNeighborhoods.map(
    (neighbhor, i) =>
      html`<span style="color: ${colorScale.range()[i]}">${neighbhor}</span>`
  );
};
```

```js
const data1 = FileAttachment("data/carroll-gardens.csv").csv({ typed: true });
const data2 = FileAttachment("data/long-island-city.csv").csv({ typed: true });
const data3 = FileAttachment("data/soho-little-italy-nolita.csv").csv({
  typed: true,
});
```

```js
const createChart = (data, xKey, yKey, color) => {
  return (width, height) => {
    const svg = d3
      .create("svg")
      .attr("viewBox", [0, 0, width, height])
      .attr("width", width)
      .attr("height", height)
      .attr("style", "max-width: 100%; height: auto;");

    const x = d3
      .scaleTime()
      .domain(d3.extent(data, (d) => d[xKey]))
      .range([0, width]);

    const y = d3
      .scaleLinear()
      .domain(d3.extent(data, (d) => d[yKey]))
      .range([height, 0]);

    const line = d3
      .line()
      .x((d) => x(d[xKey]))
      .y((d) => y(d[yKey]));

    svg
      .append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", 1.5)
      .attr("d", line);

    const tooltipLine = svg
      .append("line")
      .attr("stroke", "gray")
      .attr("y1", 0)
      .attr("y2", height)
      .style("opacity", 0);

    svg.on("mousemove", function (event) {
      const mouse = d3.pointer(event);
      const date = x.invert(mouse[0]);
      document.dispatchEvent(new CustomEvent("hoveredDate", { detail: date }));
    });

    return svg.node();
  };
};
```

```js
const hoveredDate = Generators.observe((notify) => {
  const updateHover = (event) => notify(event.detail);
  document.addEventListener("hoveredDate", updateHover);
  return () => document.removeEventListener("hoveredDate", updateHover);
});
```

```js
const updateTooltip = (chart, date, yKey) => {
  const { svg, tooltipLine, x, y, data } = chart;
  const bisect = d3.bisector((d) => d.date).left;
  const index = bisect(data, date, 1);
  const d0 = data[index - 1];
  const d1 = data[index];
  const d = date - d0.date > d1.date - date ? d1 : d0;

  tooltipLine.attr("x1", x(d.date)).attr("x2", x(d.date)).style("opacity", 1);

  svg.selectAll(".tooltip").remove();
  svg
    .append("text")
    .attr("class", "tooltip")
    .attr("x", x(d.date))
    .attr("y", y(d[yKey]) - 10)
    .text(`Value: ${d[yKey]}`);
};
```

```js
const xKey = "yyyymm";
const yKey = "count";
// const chart1 = createChart(data1, width, height, "yyyymm", "count", "red");
// const chart2 = createChart(data2, width, height, "yyyymm", "count", "coral");
// const chart3 = createChart(data3, width, height, "yyyymm", "count", "tomato");
```

```js
const chart1 = resize((width, height) =>
  createChart(data1, "yyyymm", "count", "steelblue")(width, height)
);
const chart2 = resize((width, height) =>
  createChart(data2, "yyyymm", "count", "cyan")(width, height)
);
const chart3 = resize((width, height) =>
  createChart(data3, "yyyymm", "count", "tomato")(width, height)
);
```

```js
view(hoveredDate); // Trigger reactivity
{
  console.log(hoveredDate);
  updateTooltip(chart1, hoveredDate);
  updateTooltip(chart2, hoveredDate);
  updateTooltip(chart3, hoveredDate);
}
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

<section>
  <div class='area-list'>
    ${areaList()}
  </div>

  <div class='h-full flex'>
    <div class='h-full flex-1'>
      ${chart1}
    </div>
    <div class='h-full flex-1'>
      ${chart2}
    </div>
    <div class='h-full flex-1'>
    ${chart3}
    </div>
  </div>
  </section>

```js
function slugify(s) {
  return s.toLowerCase().replace(/\W+/g, "-");
}
```

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

.area-list {
--color-gray-200: #EFEFEF;
--color-green-100: #F0F7F5;
--color-green-800: #07593B;
quotes: "“" "”" "‘" "’";
text-rendering: optimizeLegibility;
line-height: 1.558;
color: #000;
font-family: "BWHaasDingbat","BWHaasText","Helvetica Neue",Helvetica,Arial,sans-serif;
-webkit-font-smoothing: antialiased;
margin: 0;
padding: 0;
font-weight: 700;
font-size: 1.875rem;
margin-top: 25px;
}

span {
--color-gray-200: #EFEFEF;
--color-green-100: #F0F7F5;
--color-green-800: #07593B;
quotes: "“" "”" "‘" "’";
text-rendering: optimizeLegibility;
line-height: 1.558;
font-family: "BWHaasDingbat","BWHaasText","Helvetica Neue",Helvetica,Arial,sans-serif;
-webkit-font-smoothing: antialiased;
font-weight: 700;
font-size: 1.875rem;
margin: 0;
padding: 0;
cursor: pointer;
transition: .2s;

}
</style>
