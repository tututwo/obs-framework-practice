/* globals d3 */

/*
 * Main.js
 *
 * Install browserify dependencies with `npm install --save <package name>`
 * e.g. `npm install --save d3
 *
 */
import { default as mapComponent } from "./modules/map";
import { default as linesComponent } from "./modules/lines";
import defaults from "lodash-es/defaults";
import each from "lodash-es/each";
import filter from "lodash-es/filter";
import findIndex from "lodash-es/findIndex";
import { default as pluck } from "lodash-es/map";
import * as borscht from "@soup/borscht";

import select from "./modules/components-select";
import "./modules/terminalLinks";

borscht.terminal();
borscht.localize();

/* Map */
var dataSrc = "/graphics/property-prices-data-nyc/v1";

var dispatcher = d3.dispatch("dataSelected", "indexSelected");

var map = mapComponent();
var lines = linesComponent();

// needs to match css
var colorSpread = 4;
var colors = d3
  .range(colorSpread)
  .map((i) => `q${i}-${colorSpread}`)
  .reverse();
var colorScale = d3.scaleQuantile().range(colors);

var formats = {
  dollar: d3.format("$,.0f"),
  dollarShort: d3.format("$,.2s"),
  percent: d3.format("+.1%"),
  percentShort: d3.format(".1%"),
  count: d3.format(",.0f"),
  countLong: d3.format(",.1f"),
};
var parsers = {
  yyyymm: d3.timeParse("%Y-%m"),
};

var dataTypes = [
  {
    key: "repeatSalePrice",
    secondaryKey: "changeRepeatTrend",
    colorScale: colorScale.copy(),
    metricFormat: (d) => (d === null ? "NA" : formats.dollar(d)),
    secondaryMetricFormat: (d) => (d === null ? "" : formats.percent(d)),
    title: "Median resale price",
    button: "Median resale price",
  },
  {
    key: "trend",
    secondaryKey: "changeTrend",
    colorScale: colorScale.copy(),
    metricFormat: (d) => (d === null ? "NA" : formats.dollar(d)),
    secondaryMetricFormat: (d) => (d === null ? "" : formats.percent(d)),
    title: "Median sale price, all homes",
    button: "Median sale price, all homes",
  },
  {
    key: "changeRepeatTrend",
    colorScale: colorScale.copy(),
    metricFormat: (d) => (d === null ? "NA" : formats.percent(d)),
    title: "Change in price from last year for resales",
    button: "Price change, resales (%)",
  },
  {
    key: "changeTrend",
    colorScale: colorScale.copy(),
    metricFormat: (d) => (d === null ? "NA" : formats.percent(d)),
    title: "Change in price from last year for all homes",
    button: "Price change, all homes (%)",
  },
  {
    key: "daysOnMarket",
    colorScale: colorScale.copy(),
    metricFormat: (d) =>
      d === null ? "NA" : `${formats.countLong(d)} ${pluralize(d, "day")}`,
    title: "Median time on market",
    button: "Median days on market",
  },
  {
    key: "count",
    colorScale: colorScale.copy(),
    metricFormat: (d) =>
      d === null ? "NA" : `${formats.count(d)} ${pluralize(d, "home")}`,
    title: "Sales count for all homes",
    button: "Sales count, all homes",
  },
  {
    key: "repeatCount",
    colorScale: colorScale.copy(),
    metricFormat: (d) =>
      d === null ? "NA" : `${formats.count(d)} ${pluralize(d, "home")}`,
    title: "Sales count for resales",
    button: "Sales count, resales",
  },
  {
    key: "rent",
    secondaryKey: "changeRentTrend",
    colorScale: colorScale.copy(),
    metricFormat: (d) => (d === null ? "NA" : formats.dollar(d)),
    secondaryMetricFormat: (d) => (d === null ? "" : formats.percent(d)),
    title: "Median rent",
    button: "Median asking rent",
  },
  {
    key: "changeRentTrend",
    colorScale: colorScale.copy(),
    metricFormat: (d) => (d === null ? "NA" : formats.percent(d)),
    title: "Change in rent from last year",
    button: "Rent change (%)",
  },
  {
    key: "rentCount",
    colorScale: colorScale.copy(),
    metricFormat: (d) =>
      d === null ? "NA" : `${formats.count(d)} ${pluralize(d, "home")}`,
    title: "Rental count",
    button: "Rental count",
  },
  {
    key: "tippingPoint",
    colorScale: colorScale.copy(),
    metricFormat: (d) => {
      if (d === null) return "NA";
      if (d < 1)
        return `${formats.countLong(d * 12)} ${pluralize(
          parseFloat((d * 12).toFixed(1)),
          "month"
        )}`;
      return `${formats.countLong(d)} ${pluralize(d, "year")}`;
    },
    title: "Tipping point",
    button: "Tipping point",
  },
  {
    key: "ratio",
    colorScale: colorScale.copy(),
    metricFormat: (d) => (d === null ? "NA" : formats.percent(d)),
    title: "Listing discount",
    button: "Listing discount",
  },
  {
    key: "priceCut",
    colorScale: colorScale.copy(),
    metricFormat: (d) => (d === null ? "NA" : formats.percentShort(d)),
    title: "Share of sales listings with price cuts",
    button: "Share of sales listings with price cuts",
  },
  {
    key: "rentalPriceCut",
    colorScale: colorScale.copy(),
    metricFormat: (d) => (d === null ? "NA" : formats.percentShort(d)),
    title: "Share of rentals discounted",
    button: "Share of rentals discounted",
  },
];

var dataTypeSelect = select("dataType")
  .text((d) => d.button)
  .on("change", swapMapBy)
  .selected(dataTypes[7]); // Starting value for dropdown
d3.select("#data-type").datum(dataTypes).call(dataTypeSelect, true);

var defaultData = [];

d3.queue()
  .defer(d3.json, `${dataSrc}/geo/merged_borders-topo.json`)
  .defer(d3.json, `${dataSrc}/meta.json`)
  .defer(d3.csv, `${dataSrc}/neighborhoods/nyc.csv`, parseData) // TODO: is this the best way to load default data set?
  .await(function (error, neighborhoods, meta, nycData) {
    if (error) throw error;

    each(nycData, calcTrend);
    defaultData.push({
      id: "NYC median",
      properties: {
        historical: nycData,
      },
    });

    mungeMeta(meta);

    d3.selectAll(".singleFact")
      .select("h4")
      .text(function (d) {
        var opts = this.parentNode.dataset;
        var format = formats[opts.format] || ((d) => d);
        return format(meta.areaLastMonth["NYC"][opts.key]);
      });

    neighborhoods = each(
      topojson.feature(neighborhoods, neighborhoods.objects["neighborhoods"])
        .features,
      function (d) {
        d.id = d.properties.Neighbourhood || d.properties.Neighborhood;
        d.properties = meta.areaLastMonth[d.id];
      }
    );

    // only include data in scale domains if it's in the topojson
    var filteredMeta = filter(
      meta.areaLastMonth,
      (d, k) => ~pluck(neighborhoods, "id").indexOf(k)
    );
    each(dataTypes, function (metric) {
      metric.colorScale.domain(
        pluck(filteredMeta, metric.key).filter((d) => d !== null)
      );
    });

    var mapOpts = {
      dispatcher,
      areaName: "NYC",
      center: [40.72228267283148, -73.96270751953126],
      layers: [
        {
          type: "raster",
          url: "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_nolabels/{z}/{x}/{y}.png",
        },
        {
          type: "vector",
          data: neighborhoods,
        },
        {
          type: "raster",
          url: "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_only_labels/{z}/{x}/{y}.png",
          events: "none",
          minZoom: 13,
        },
      ],
      attribution:
        ' <span class="attLeft">Data source: <a href="http://www.streeteasy.com" target="blank">StreetEasy</a></span> &copy; <a href="http://www.openstreetmap.org/copyright" target="blank">OpenStreetMap</a>, &copy; <a href="https://carto.com/attribution" target="blank">CARTO</a>',
    };

    if (window.isTerminal) {
      mapOpts.layers = mapOpts.layers.slice(1, -1);
    }

    d3.select("#map").call(map, mapOpts);
    map.setSelected(window.dvz_startingNeighborhoods);

    var lineOpts = {
      dates: meta.dates,
      dispatcher,
      tooltipXFormat,
      defaultData,
    };

    d3.select("#median-sale-price").call(
      lines,
      defaults(
        {
          title: "Median sale price, resales",
          yFormat: (d) => (d === 0 ? "0" : formats.dollarShort(d)),
          dataKey: "resale",
          tooltipYFormat: (d) => (Object.is(d, NaN) ? "NA" : formats.dollar(d)),
        },
        lineOpts
      )
    );

    d3.select("#sales-volume").call(
      lines,
      defaults(
        {
          title: "Sales count, all homes",
          dataKey: "count",
          yFormat: formats.count,
          tooltipYFormat: (d) =>
            Object.is(d, NaN)
              ? "NA"
              : `${formats.count(d)} ${pluralize(d, "home")}`,
          curve: d3.curveStep,
          defaultData: null,
          colorOffset: defaultData.length,
        },
        lineOpts
      )
    );

    d3.select("#price-change").call(
      lines,
      defaults(
        {
          title: "Price change, resale",
          dataKey: "changeResale",
          yFormat: (d) => (d === 0 ? "0%" : d3.format("+.0%")(d)),
          tooltipYFormat: (d) =>
            Object.is(d, NaN) ? "NA" : formats.percent(d),
        },
        lineOpts
      )
    );
  });

function tooltipXFormat(d) {
  var mon = d.getMonth();

  var q = mon <= 2 ? "Q1 " : mon <= 5 ? "Q2 " : mon <= 8 ? "Q3 " : "Q4 ";

  return `${q} ${d.getFullYear()}`;
}

function mungeMeta(meta) {
  meta.dates = meta.dates.map(parsers.yyyymm);
  meta.dateRange = d3.extent(meta.dates);
}

function swapMapBy(_) {
  map.mapBy(_).redraw();
}

dispatcher.on("dataSelected.historicalData", function (selected) {
  if (!selected || !selected.length) return;

  // load data for each if not already loaded
  each(selected, function (d) {
    if (d.properties && !d.properties.historical) {
      d3.csv(
        `${dataSrc}/neighborhoods/${slugify(d.id)}.csv`,
        parseData,
        function (err, rows) {
          if (err) throw err;

          each(rows, calcTrend);

          d.properties.historical = rows;
          dispatcher.call("dataSelected", null, selected);
        }
      );
    }
  });
});

function parseData(d, i) {
  return {
    count: parseInt(d.count),
    resale: parseInt(d.resale),
    changeResale: parseFloat(d.changeResale),
    trend: parseInt(d.trend),
    date: parsers.yyyymm(d.yyyymm),
  };
}

function calcTrend(d, i, list) {
  var firstNum = findIndex(list, (d) => !isNaN(d.trend));
  var start = firstNum > 0 && firstNum <= i ? list[firstNum] : list[0];

  d.sinceTrend = d.trend / start.trend - 1.0;
}

function slugify(s) {
  return s.toLowerCase().replace(/\W+/g, "-");
}

function pluralize(num, singular, plural) {
  if (num === 1) return singular;
  if (!plural) return `${singular}s`;
  return plural;
}
