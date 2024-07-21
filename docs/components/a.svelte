<div class="grid grid-cols-3 grid-rows-4 gap-4">
  <div class="card col-start-1 row-start-1">${frmCard(30, pmms)}</div>
  <div class="card col-start-1 row-start-2">${frmCard(15, pmms)}</div>
  <div class="col-span-2 row-span-2 col-start-2 row-start-1">
    ${resize((width, height) => {
      return Plot.plot({
        width,
        height,
        color,
        y: { grid: true },
        marks: [
          Plot.lineY(
            tidy.filter((d) => startEnd[0] <= d.date),
            {
              x: "date",
              y: "rate",
              stroke: "type",
              curve: "step",
              markerEnd: true,
            }
          ),
        ],
      });
    })}
  </div>

  <div class="col-span-3 row-span-3 col-start-1 row-start-3">
    ${resize((width, height) => {
      return Plot.plot({
        width,
        y: { grid: true, label: "rate (%)" },
        color,
        marks: [
          Plot.ruleY([0]),
          Plot.lineY(tidy, { x: "date", y: "rate", stroke: "type", tip: true }),
          (index, scales, channels, dimensions, context) => {
            const x1 = dimensions.marginLeft;
            const y1 = 0;
            const x2 = dimensions.width - dimensions.marginRight;
            const y2 = dimensions.height;
            const brushed = (event) => {
              if (!event.sourceEvent) return;

              let { selection } = event;
              if (!selection) {
                const r = 10;
                let [px] = d3.pointer(event, context.ownerSVGElement);
              }
            };
            return svg`<rect x="120" width="100" height="100" rx="15" />`;
          },
        ],
      });
    })}
    }
  </div>
</div>
