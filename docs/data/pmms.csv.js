// import {csvFormat} from "d3-dsv";
// import {csv} from "d3-fetch";
// import {utcParse} from "d3-time-format";
import * as d3 from "d3"
const parseDate = d3.utcParse("%m/%d/%Y");

process.stdout.write(
  d3.csvFormat(
    (await d3.csv("https://www.freddiemac.com/pmms/docs/PMMS_history.csv")).map(({date, pmms30, pmms15}) => ({
      date: parseDate(date),
      pmms30,
      pmms15
    }))
  )
);