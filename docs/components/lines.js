import defaults from 'lodash-es/defaults'
import flatten from 'lodash-es/flatten'
import map from 'lodash-es/map'
import { lineChunked } from 'd3-line-chunked'

export default function () {

  var margin = {top: 20, right: 45, bottom: 20, left: 0}
  var hoverBuffer = 10

  function lines (el, opts) {
    if (!opts.dispatcher) console.warn('Pass a d3.dispatch(\'dataSelected\') to the line chart if you want it be controlled elsewhere')
    var dispatcher = opts.dispatcher || {on: function () {}, call: function () {}}
    var options = defaults(opts, {dataKey: 'trend'})

    var container = el.html('')
    if (options.title) {
      container.append('h2').text(options.title)
    }

    var defaultData = opts.defaultData || []
    var colorOffset = opts.colorOffset || 0

    var selected

    var containerSize = container.node().getBoundingClientRect()
    var computedSize = window.getComputedStyle(container.node())
    var width = containerSize.width - parseInt(computedSize.paddingLeft) - parseInt(computedSize.paddingRight) - margin.left - margin.right
    var height = 200 - margin.top - margin.bottom

    var x = d3.scaleTime()
        .range([0, width])

    var y = options.yScale || d3.scaleLinear()
    y.range([height, 0])

    var xAxis = d3.axisBottom()
        .scale(x)
        .ticks(0)

    var yAxis = d3.axisRight()
        .scale(y)
        .ticks(options.yValues ? 0 : 4)
        .tickFormat(options.yFormat)
        .tickValues(options.yValues)

    var line = lineChunked()
        .x(d => x(d.date))
        .y(d => y(d[options.dataKey]))
        .defined(d => !Object.is(d[options.dataKey], NaN))

    if (options.curve) {
      line.curve(options.curve)
    }

    container.append('div')
        .style('width', '1px')
        .style('height', height + margin.top + margin.bottom + 'px')

    var svg = container.append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
      .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`)

    var tooltip = container.append('div')
        .attr('class', 'tooltip')

    var yAxisG = svg.append('g')
        .attr('class', 'y axis')
        .attr('transform', `translate(${width}, 0)`)
    var xAxisG = svg.append('g')
        .attr('class', 'x axis')
        .attr('transform', `translate(0, ${height})`)
        .attr('transform', 'translate(0,' + (height + 15) + ')') // top padding on x-axis line

    var lines = svg.append('g')
        .attr('class', 'lines')
    var pointFocus = svg.append('g')
        .attr('class', 'point-focus')

    svg.append('rect')
        .attr('class', 'mousemove-box')
        .attr('x', -hoverBuffer)
        .attr('y', 0)
        .attr('width', width + hoverBuffer * 2)
        .attr('height', height)
        .attr('fill', 'transparent')
        .on('mouseout', unsetStartIndex)
        .on('mousemove', function () {
          var mouseX = d3.mouse(this)[0]
          setStartIndex(d3.bisect(options.dates, x.invert(mouseX)) - 1)
        })

    dispatcher.on(`dataSelected.${Math.random()}`, draw)
    draw({})

    dispatcher.on(`indexSelected.${Math.random()}`, hover)

    function draw (_) {
      if (_) {
        selected = defaultData.concat(_)
      }

      lines.selectAll('g').remove() // TODO: enter/merge instead?

      if (!selected || !selected.length) return

      x.domain(d3.extent(options.dates))
      xAxisG.call(xAxis)
      xAxisG.selectAll('text')
          .data(x.domain())
        .enter().append('text')
          .attr('transform', d => `translate(${x(d)},0)`)
          .attr('y', 12)
          .attr('x', 0.5)
          .attr('dy', '0.71em')
          .attr('text-anchor', (d, i) => i > 0 ? 'end' : 'start')
          .text(d => d3.timeFormat('%Y')(d))

      var allData = flatten(selected.map(function (data) {
        return (!data.properties || !data.properties.historical) ? null
          : data.properties.historical.map(values => values[options.dataKey])
      }))
      var yMax = d3.max(allData)
      var yMin = d3.min(allData)

      y.domain([Math.min(yMin, options.yMin || 0), yMax || 0])
      yAxisG.call(yAxis)
      yAxisG.selectAll('line')
          .attr('x1', 0)
          .attr('x2', -width)

      // right-align y-axis labels
      yAxisG.selectAll('text')
        .attr('text-anchor', 'end')
        .attr('x', 50)

      yAxisG.selectAll('.tick')
        .style('opacity', d => (d >= y.domain()[0]) && (d <= y.domain()[1]) ? 1 : 0)

      lines.selectAll('g')
          .data(selected.map(getProperties).filter(d => d))
        .enter().append('g')
          .attr('class', (d, i) => `area-${i + colorOffset}`)
          .call(line)
    }

    function hover (index) {
      pointFocus.selectAll('circle').remove() // TODO: enter/merge instead?
      tooltip.classed('visible', false)

      if (!selected || !selected.length) return

      if (index >= 0 && selected.length) {
        if (typeof options.onHover === 'function') {
          // console.log('hover', index)
          options.onHover(index)
          draw()
        }
        pointFocus
            .style('display', 'block')
          .selectAll('circle')
            .data(selected.map(getProperties))
          .enter().append('circle')
            .attr('class', (d, i) => `area-${i + colorOffset}`)
          .filter(d => !Object.is(getValueAtIndex(d, index), NaN))
            .attr('r', 4)
            .attr('cx', x(options.dates[index]))
            .attr('cy', d => y(getValueAtIndex(d, index)))

        var tooltipXFormat = options.tooltipXFormat || function (d) { return d }
        var tooltipYFormat = options.tooltipYFormat || function (d) { return d }

        var maxVal = d3.max(map(selected.map(getProperties), d => getValueAtIndex(d, index)))
        var tooltipBottom = height - y(maxVal) + margin.top + margin.bottom
        if (Object.is(tooltipBottom, NaN)) {
          tooltipBottom = margin.top + margin.bottom
        }

        tooltip
            .html(function (d, i) {
              return '' +
                  selected.map(function (d) {
                    return `<div class="metric area-${selected.indexOf(d) + colorOffset}">${tooltipYFormat(getValueAtIndex(getProperties(d), index, options.tooltipKey))}</div>`
                  }).join(' ') +
                  '<div class="date">' + tooltipXFormat(options.dates[index]) + '</div>'
            })
            .classed('visible', true)
            .style('bottom', tooltipBottom + 'px')
            .style('left', x(options.dates[index]) + margin.left + 'px')

        // dispatcher.call('dataSelected', null, d3.selectAll(selected.areas).data())
      } else {
        pointFocus.style('display', 'none')
        tooltip.classed('visible', false)

        if (typeof options.onHover === 'function') {
          // console.log('hover', index)
          options.onHover(0)
          draw()
        }
      }
    }

    function setStartIndex (index) {
      dispatcher.call('indexSelected', null, index)
    }

    function unsetStartIndex () {
      dispatcher.call('indexSelected')
    }

    function getProperties (data) {
      return data.properties ? data.properties.historical : []
    }

    function getValueAtIndex (d, index, keyOverride) {
      var key = keyOverride || options.dataKey
      return d.length <= 0 || !d[index] ? NaN : d[index][key]
    }

    function resized () {
      containerSize = container.node().getBoundingClientRect()
      computedSize = window.getComputedStyle(container.node())
      width = containerSize.width - parseInt(computedSize.paddingLeft) - parseInt(computedSize.paddingRight) - margin.left - margin.right

      container.select('svg').attr('width', width + margin.left + margin.right)
      container.select('.mousemove-box').attr('width', width + hoverBuffer * 2)
      x.range([0, width])
      xAxisG.call(xAxis)
      xAxisG.selectAll('text')
          .data(x.domain())
        .merge(xAxisG.selectAll('text'))
          .attr('transform', d => `translate(${x(d)},0)`)
      yAxisG
          .attr('transform', `translate(${width}, 0)`)
        .selectAll('line')
          .attr('x2', -width)
      lines.selectAll('g').call(line)
    }

    window.addEventListener('resize', resized)
  }

  return lines
}
