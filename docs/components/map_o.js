/* globals d3 */
import { tile as d3Tile } from "d3-tile";
import isMobile from "./isMobile";

export default function () {
  var pi = Math.PI;
  var tau = 2 * pi;
  var tileSize = 256;
  var maxSelected = 4;

  var options;
  var dispatcher;
  var bounds = [];

  var projection = d3.geoMercator();
  var path = d3.geoPath().projection(projection);
  var tile = d3Tile();
  var zoom = d3.zoom();

  var selected = {
    areas: [],
    mapBy: {
      colorScale: (d) => d,
      metricFormat: (d) => d,
    },
  };

  function map(el, opts) {
    options = opts;
    options.container = el;

    if (!options.dispatcher)
      console.warn(
        "Pass a d3.dispatch('dataSelected') to the map if you want it to control historical line charts"
      );
    dispatcher = options.dispatcher || { call: function () {} };

    options.zoom = options.zoom || 19;
    options.minZoom = options.minZoom || 18;
    options.maxZoom = options.maxZoom || 25;

    projection.scale(1 / tau).translate([0, 0]);
    zoom
      .scaleExtent([1 << options.minZoom, 1 << options.maxZoom])
      .on("zoom", zoomed);

    var center = projection(opts.center.reverse());
    var container = el;

    var containerSize = container.node().getBoundingClientRect();
    var width = containerSize.width;
    var height = containerSize.height;
    options.width = width;
    options.height = height;

    tile.size([width, height]);

    var svg = container
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    var tooltip = container.append("div").attr("class", "tooltip");

    svg
      .selectAll("g")
      .data(opts.layers)
      .enter()
      .append("g")
      .attr("id", (d) => d.id)
      .attr("class", (d) => (d.class ? "layer " + d.class : "layer"))
      .style("pointer-events", (d) => d.events || "initial")
      .each(function (layer) {
        if (layer.type === "vector") {
          bounds.push(
            d3
              .geoPath()
              .projection(projection)
              .bounds({ type: "FeatureCollection", features: layer.data })
          );

          d3.select(this)
            .selectAll("path")
            .data(layer.data)
            .enter()
            .append("path")
            .attr("class", "vector")
            .on("mousemove", function (d) {
              if (isMobile()) return;

              var c = d3.mouse(container.node());
              var tooltipOffset = 15;
              var metric =
                typeof d.properties === "undefined"
                  ? "NA"
                  : selected.mapBy.metricFormat(
                      d.properties[selected.mapBy.key]
                    );
              var secondaryMetric =
                typeof d.properties === "undefined" ||
                !selected.mapBy.secondaryMetricFormat ||
                !selected.mapBy.secondaryKey
                  ? ""
                  : selected.mapBy.secondaryMetricFormat(
                      d.properties[selected.mapBy.secondaryKey]
                    );

              tooltip
                .attr("class", `tooltip visible ${d.quantile}`)
                .style("left", c[0] + "px")
                .style(
                  "top",
                  c[1] - tooltipOffset + "px"
                ).html(`<div class="metric">${metric} <span class="secondary-metric">${secondaryMetric}</span></div>
<div class="area">${d.id}</div>
<div class="title">${selected.mapBy.title}</div>`);
            })
            .on("mouseout", function (d) {
              tooltip.attr("class", "tooltip");

              moveSelectedToTop();
            })
            .on("mouseover", function () {
              this.parentNode.appendChild(this);
            })
            .on("click", changeSelected);
        }
      });

    bounds = bounds.reduce(function (a, b) {
      if (a && b) {
        return [
          [Math.min(a[0][0], b[0][0]), Math.min(a[0][1], b[0][1])],
          [Math.max(a[1][0], b[1][0]), Math.max(a[1][1], b[1][1])],
        ];
      }
    });

    svg
      .call(zoom)
      .on("wheel.zoom", null)
      .on("dblclick.zoom", null)
      .call(
        zoom.transform,
        d3.zoomIdentity
          .translate(width / 2, height / 2)
          .scale(
            1 <<
              Math.max(options.minZoom, Math.min(options.maxZoom, options.zoom))
          )
          .translate(-center[0], -center[1])
      );

    if (isMobile()) {
      // removes mouse/touch events that mess with mobile scrolling
      svg.on(".zoom", null);
    }

    container.call(addControls);
    container.call(addLegend);
    container.call(addText, options.attribution, { class: "attribution" });
    updateAreaList();
  }

  function zoomed() {
    var transform = d3.event
      ? d3.event.transform
      : d3.zoomTransform(options.container.select("svg").node());
    var transformedBounds = bounds.map((d) => d.map((e) => -e * transform.k));

    var xMin = transformedBounds[0][0];
    var xMax = options.width + transformedBounds[1][0];
    var yMin = transformedBounds[0][1];
    var yMax = options.height + transformedBounds[1][1];
    if (transform.x >= xMin || transform.x <= xMax) {
      transform.x =
        xMin - xMax < 0
          ? Math.min(Math.max(xMin, transform.x), xMax)
          : Math.max(Math.min(xMin, transform.x), xMax);
    }
    if (transform.y >= yMin || transform.y <= yMax) {
      transform.y =
        yMin - yMax < 0
          ? Math.min(Math.max(yMin, transform.y), yMax)
          : Math.max(Math.min(yMin, transform.y), yMax);
    }

    projection.scale(transform.k / tau).translate([transform.x, transform.y]);

    var tiles = tile.scale(transform.k).translate([transform.x, transform.y])();

    options.container.selectAll(".vector").attr("d", path).each(setColor);
    options.container
      .selectAll(".layer")
      .filter((d) => d.type === "raster")
      .each(function (layer) {
        var base = d3
          .select(this)
          .attr("transform", stringify(tiles.scale, tiles.translate))
          .selectAll("image")
          .data(tiles, (d) => d);
        base.exit().remove();
        base
          .enter()
          .append("image")
          .attr("class", "img")
          .attr("xlink:href", tileUrl(layer.url))
          .attr("x", (d) => d.tx)
          .attr("y", (d) => d.ty)
          .attr("width", tileSize)
          .attr("height", tileSize)
          .style("display", (d) =>
            !layer.minZoom || d.z >= layer.minZoom ? "block" : "none"
          );
      });

    map.redraw();
  }

  function resized() {
    var container = options.container;

    options.width = container.node().getBoundingClientRect().width;
    options.height = +container.select("svg").attr("height");

    container.select("svg").attr("width", options.width);
    tile.size([options.width, options.height]);

    zoomed();
  }

  function addControls(el) {
    el.append("div")
      .attr("class", "controls")
      .selectAll("div")
      .data(["in", "out"])
      .enter()
      .append("div")
      .attr("class", (d) => `zoom zoom-${d}`)
      .on("click", function (d) {
        var scaleChange = d === "in" ? 1 : -1; // amount to zoom by
        el.select("svg").call(zoom.scaleBy, Math.pow(2, scaleChange));
      });
  }

  function addText(el, text, opts) {
    el.append(opts.tag || "h6")
      .attr("class", opts.class)
      .html(text);
  }

  function addLegend(el) {
    var legend = el.select(".legend");

    var scale = selected.mapBy.colorScale;
    var format = selected.mapBy.metricFormat;

    var className = "legend";
    className += isQuantileScale(scale) ? " quantile-legend" : "";

    if (legend.size() > 0) {
      legend.html("");
    } else {
      legend = el.append("div").attr("class", className);
    }

    // labels
    if (!isQuantileScale(scale)) {
      legend
        .selectAll(".label")
        .data(
          isContinuousScale(scale) ? scale.domain : d3.extent(scale.domain())
        )
        .enter()
        .append("span", "span:last-child")
        .attr("class", "label")
        .text((d) => format(d));
    }

    // swatches
    if (isContinuousScale(scale)) {
      var width = 50;
      legend
        .insert("canvas", "span:last-child")
        .attr("width", width)
        .attr("height", 1)
        .style("width", width + "px")
        .each(function (d) {
          var context = this.getContext("2d");
          var image = context.createImageData(width, 1);

          var domain = scale.domain();
          var domainSize = domain[1] - domain[0];
          for (var i = 0, j = -1, c; i < width; ++i) {
            var index = (domainSize / width) * i + domain[0];
            c = d3.rgb(scale.color(index));
            image.data[++j] = c.r;
            image.data[++j] = c.g;
            image.data[++j] = c.b;
            image.data[++j] = 255 * 0.7; // opacity should match css
          }
          context.putImageData(image, 0, 0);
        });
      // } else if (isQuantileScale(scale)) {
    } else {
      legend
        .selectAll(".swatch")
        .data(scale.range())
        .enter()
        .insert("div", "span:last-child")
        .attr("class", (d) => `swatch ${d}`);
    }

    // quantile labels
    if (isQuantileScale(scale)) {
      var quantiles = scale
        .quantiles()
        .map((d) => `< ${format(d)}`)
        .concat([`≥ ${format(scale.quantiles()[2])}`]);

      legend
        .selectAll(".swatch")
        .append("span")
        .attr("class", "label")
        .text((d, i) => quantiles[i]);
    }
  }

  function setColor(d) {
    var path = d3
      .select(this)
      .attr("class", "vector") // clear previous quantile
      .style("fill", ""); // clear previous fill

    if (isContinuousScale(selected.mapBy.colorScale)) {
      var color =
        typeof d.properties === "undefined"
          ? ""
          : d.properties[selected.mapBy.key] === null
          ? ""
          : selected.mapBy.colorScale.color(d.properties[selected.mapBy.key]);
      path.style("fill", color);
    } else {
      var className =
        typeof d.properties === "undefined"
          ? ""
          : d.properties[selected.mapBy.key] === null
          ? ""
          : selected.mapBy.colorScale(d.properties[selected.mapBy.key]);
      d.quantile = className;
      path.classed(className, true);
    }
  }

  function isContinuousScale(scale) {
    return typeof scale === "object";
  }

  function isQuantileScale(scale) {
    return scale.domain().length > 2;
  }

  function changeSelected(d, i, paths) {
    if (!d3.select(this).classed("selected")) {
      d3.selectAll(paths).classed("selected", false);

      if (selected.areas.length >= maxSelected) {
        selected.areas.pop();
      }
      selected.areas.push(this);

      d3.selectAll(selected.areas).classed("selected", true);
    } else {
      d3.select(this).classed("selected", false);

      selected.areas = selected.areas.filter((d) => !d.isEqualNode(this));
    }
    moveSelectedToTop();
    updateAreaList();
  }

  function moveSelectedToTop() {
    d3.selectAll(selected.areas).raise();
  }

  function updateAreaList() {
    options.container.select(".area-list").remove();
    var areaList = options.container.append("div").attr("class", "area-list");

    var areaNames = areaList
      .selectAll("span")
      .data([`${options.areaName} median`].concat(getSelected()));

    areaNames
      .enter()
      .append("span")
      .attr("class", (d, i) => "area-" + i)
      .merge(areaNames)
      .text((d) => d)
      .on("click", (d) => {
        map.setSelected([d]);
        updateAreaList();
      });

    areaNames.exit().remove();

    dispatcher.call("dataSelected", null, d3.selectAll(selected.areas).data());
  }

  function getSelected() {
    return d3
      .selectAll(selected.areas)
      .data()
      .map((d) => d.id);
  }

  // Expects an array of strings that are the ids of selected neighborhoods
  // Optional second param is a container to narrow down the possible selected areas
  map.setSelected = function (_, container) {
    container = container || options.container;
    container
      .selectAll("path")
      .filter((d) => _.includes(d.id))
      .sort((a, b) => _.indexOf(a.id) - _.indexOf(b.id))
      .dispatch("click");
  };

  map.clearSelected = function () {
    // console.log(selected.areas.length)
    selected.areas = [];
    options.container.selectAll("path").classed("selected", false);
    updateAreaList();
  };

  map.mapBy = function (_) {
    return arguments.length ? ((selected.mapBy = _), map) : selected.mapBy;
  };

  map.redraw = function () {
    if (options) {
      options.container.selectAll("path").each(setColor);
      d3.selectAll(selected.areas).classed("selected", true);

      addLegend(options.container);
    }

    return map;
  };

  function stringify(scale, translate) {
    var k = scale / tileSize;
    var r = scale % 1 ? Number : Math.round;
    return (
      "translate(" +
      r(translate[0] * scale) +
      "," +
      r(translate[1] * scale) +
      ") scale(" +
      k +
      ")"
    );
  }

  function tileUrl(url) {
    return function (d) {
      return url
        .replace("{z}", d.z)
        .replace("{x}", d.x)
        .replace("{y}", d.y)
        .replace("{s}", ["a", "b", "c"][(Math.random() * 3) | 0]);
    };
  }

  window.addEventListener("resize", resized);

  return map;
}
