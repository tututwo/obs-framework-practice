---
theme: glacier
title: NYT Rent dashboard # toc: false
---

<script src="https://cdn.tailwindcss.com"></script>

```js
import * as topojson from "npm:topojson-client";
const mapTopoJSON = await FileAttachment("data/merged_borders-topo.json")
  .json()
  .then((border) => {
    return topojson.feature(border, border.objects[Object.keys(border.objects)[0]])
  });
```

```js
const map = (width, height) => {
  const svg = d3
    .create("svg")
    .attr("viewBox", [0, 0, width, height])
    .attr("width", width)
    .attr("height", height)
    .attr("style", "max-width: 100%; height: auto;");

  const projection = d3.geoMercator().fitSize([width, height], mapTopoJSON);
  const path = d3.geoPath().projection(projection);
  svg
    .selectAll("path")
    .data(mapTopoJSON.features)
    .join("path")
    .attr("class", "vector")
    .attr("d", path)
    .style("fill", "steelblue") // Apply styles to make the paths visible
    .style("stroke", "white")
    .style("stroke-width", 0.5);
  return svg.node();
};
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
<div></div>

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
