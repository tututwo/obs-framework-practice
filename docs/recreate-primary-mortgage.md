# Primary mortgage market survey - D3

<script src="https://cdn.tailwindcss.com"></script>

```js
const pmms = FileAttachment("data/pmms.csv").csv({
  typed: true,
});

const tidy = pmms.then((pmms) =>
  pmms.flatMap(({ date, pmms30, pmms15 }) => [
    {
      date,
      rate: pmms30,
      type: "30Y FRM",
    },
    {
      date,
      rate: pmms15,
      type: "15Y FRM",
    },
  ])
);
```

```js
const color = Plot.scale({
  color: {
    domain: ["30Y FRM", "15Y FRM"],
  },
});
const colorLegend = (y) =>
  html`<span style="border-bottom: solid 2px ${color.apply(`${y}Y FRM`)};"
    >${y}-year fixed-rate</span
  >`;
```

```js
const defaultStartEnd = [pmms.at(-53).date, pmms.at(-1).date];
const startEnd = Mutable(defaultStartEnd);
```

```js
function formatStringToID(inputString) {
  // Split the string into date and percentage parts
  let [datePart, percentPart] = inputString.split("- ");

  // Format the date part: replace slashes with dashes
  let formattedDate = datePart.replace(/\//g, "-");

  // Format the percentage part: replace '%' with '-percent'
  let formattedPercent = percentPart.replace("%", "-percent");

  // Combine and return the formatted ID
  return `${formattedDate}-${formattedPercent}`;
}

function tickLineChart(width, height, data, key, stroke, xRange) {
  const margin = { top: 0, right: 10, bottom: 10, left: 10 };
  const svg = d3
    .create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("class", "line-chart");
  // Define scales
  const xScale = d3
    .scaleLinear()
    .domain(xRange)
    .range([margin.left, width - margin.right]);

  // Draw ticks
  svg
    .selectAll(".tick")
    .data(pmms.slice(-52))
    .enter()
    .append("line")
    .attr("class", "tick")
    .attr("x1", (d) => xScale(d[key]))
    .attr("x2", (d) => xScale(d[key]))
    .attr("y1", height / 2 - 10)
    .attr("y2", height / 2 + 10)
    .attr("stroke", stroke);

  // Draw the black tick for the latest value
  svg
    .append("line")
    .attr("x1", xScale(pmms[pmms.length - 1][key]))
    .attr("x2", xScale(pmms[pmms.length - 1][key]))
    .attr("y1", height / 2 - 10)
    .attr("y2", height / 2 + 10)
    .attr("stroke", "black")
    .attr("stroke-width", 2);

  // Create tooltip
  // const tooltip = d3
  //   .select("body")
  //   .append("div")
  //   .attr("class", "tooltip")
  //   .style("position", "absolute")
  //   .style("background", "#fff")
  //   .style("border", "1px solid #ccc")
  //   .style("padding", "5px")
  //   .style("pointer-events", "none")
  //   .style("opacity", 0);

  // Add tooltip functionality
  // svg
  //   .selectAll(".tick")
  //   .attr("id", (d) =>
  //     formatStringToID(`${d.date?.toLocaleDateString("en-us")}- ${d[key]}%`)
  //   )
  //   .on("mouseover", function (event, d) {
  //     tooltip.transition().duration(200).style("opacity", 0.9);
  //     tooltip
  //       .html(`${d.date.toLocaleDateString("en-US")}: ${d[key]}%`)
  //       .style("left", event.pageX + 5 + "px")
  //       .style("top", event.pageY - 28 + "px");
  //   })
  //   .on("mouseout", function (d) {
  //     tooltip.transition().duration(500).style("opacity", 0);
  //   });
  return svg.node();
}
```

```js
function frmCard(y, pmms) {
  const key = `pmms${y}`;
  const diff1 = pmms.at(-1)[key] - pmms.at(-2)[key];
  const diffY = pmms.at(-1)[key] - pmms.at(-53)[key];
  const range = d3.extent(pmms.slice(-52), (d) => d[key]);
  const stroke = color.apply(`${y}Y FRM`);

  return html.fragment`
  
  <div class="h-[30px]">${resize((width, height) => {
    return tickLineChart(width, height, pmms, key, stroke, range);
  })}</div>
  
 `;
}
```

```js
// function tooltipCreator(tooltipData) {
//   const [hoveredX,hoveredY, data] = tooltipData

//   return html`
//     <div class="absolute" style=${transform:${hoveredX}px, ${hoveredY}px}>${data.date||""}</div>
//   `
// }
```

```js
const hoveredXGenerator = Generators.observe((change) => {
  const updatePosition = (event, data) => {
    change([event.pageX, event.pageY, data]);
  };

  const attachListeners = () => {
    return new Promise((resolve) => {
      const checkAndAttach = () => {
        const allLineCharts = d3.selectAll(".tick");
        // wait until all line charts are loaded
        // you can use settimeout too
        // Use a small delay to ensure SVG elements are created
        // setTimeout(() => {
        //   const allLineCharts = document.querySelectorAll('.line-chart');
        //   allLineCharts.forEach(chart => {
        //     chart.addEventListener('pointermove', updatePosition);
        //   });
        // }, 100);
        if (!allLineCharts.empty()) {
          allLineCharts.on("pointermove", (event, d) => {
            console.log(event)
            return updatePosition(event, d);
          });
          resolve();
        } else {
          requestAnimationFrame(checkAndAttach);
        }
      };
      checkAndAttach();
    });
  };

  attachListeners().then(() => {
    change([0, 0]); // Initial value
  });

  return () => {
    d3.selectAll(".line-chart").on("pointermove", null);
  };
});
```

```js
console.log(hoveredXGenerator);
```

```js
const tooltipCreator = function (tooltipData) {
  const [hoveredX, hoveredY, data] = tooltipData;
  return html`
    <div
      class="absolute t-0 l-0"
      style="transform: translate(${hoveredX}px, ${hoveredY}px);"
    >
      ${data.date||''}
    </div>
  `;
};
```

<div class="grid grid-cols-3 grid-rows-4 gap-4">
  <div class="card col-start-1 row-start-1 relative">
    ${frmCard(30, pmms)} ${tooltipCreator(hoveredXGenerator)}
  </div>
  <div class="card col-start-1 row-start-2 relative">
    ${frmCard(15, pmms)} ${tooltipCreator(hoveredXGenerator)}
  </div>
  <div class="col-span-2 row-span-2 col-start-2 row-start-1">
    ${resize((width, height) => {})}
  </div>

  <div class="col-span-3 row-span-3 col-start-1 row-start-3">
    ${resize((width) => {})}
  </div>
</div>
