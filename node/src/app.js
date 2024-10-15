import "core-js/stable";
import "regenerator-runtime/runtime";
import "./style.scss";
import { color, select as d3_select, xml } from "d3";
import { geoAlbersUsa as d3_geoAlbersUsa } from "d3";
import { geoPath as d3_geoPath } from "d3";
import {feature} from "topojson"
import axios from "axios"
import svgPanZoom from "svg-pan-zoom";
import cbpp_colorgen from "cbpp_colorgen";

const id = "health10-15-24"
const sel = "#" + id
const script_id = "script_" + id
const script_sel = "#" + script_id
const url_base = document.querySelector(script_sel).src.replace(/js\/app(\.min)*\.js/g,"")
var projection = d3_geoAlbersUsa();
var pathGenerator = d3_geoPath(projection);
var colors = cbpp_colorgen("#f5f7f0", "#336348", 8);

Promise.all([
  new Promise((resolve) => {document.addEventListener("DOMContentLoaded", resolve)}),
  axios.get(url_base + "topojson/cd_topojson.json"),
  axios.get(url_base + "data.csv")
]).then((d) => {
  var geojson = feature(d[1].data, d[1].data.objects.districts);
  var {data, headers} = parse_csv(d[2].data);
  merge_csv(geojson, data, headers);
  var {svg, zoomer} = create_svg(sel);
  create_controls(sel, zoomer);
  draw_districts(svg, geojson, data);
})

function parse_csv(d) {
  d = d.split("\n");
  var r = {};
  d.forEach((row, i) => {
    if (i === 0) {return;}
    row = row.split(",");
    row.forEach((cell, j) => {
      row[j] = cell*1;
    })
    var state = row[0]*1;
    var cd = row[1]*1;
    if (typeof(r[state])==="undefined") {
      r[state] = {};
    }
    r[state][cd] = row;
  });
  return {data: r, headers: d[0].split(",")};
}

function merge_properties(props, data, headers) {
  data.forEach((item, j) => {
    if (j >= 2) {
      props[headers[j]] = item;
    }
  })
}

function merge_csv(geojson, data, headers) {
  geojson.features.forEach((feature) => {
    var state = feature.properties.STATEFP*1;
    var cd = feature.properties.CD118FP*1;
    if (data[state]) {
      if (data[state][cd]) {
        merge_properties(feature.properties, data[state][cd], headers)
      }
    }
  });
}

function create_controls(sel, zoomer) {
  var zoom_in = document.createElement("button");
  zoom_in.innerText = "Zoom In";
  document.querySelector(sel).append(zoom_in);
  var zoom_out = document.createElement("button");
  zoom_out.innerText = "Zoom Out";
  document.querySelector(sel).append(zoom_out);
  zoom_in.addEventListener("click", (e) => {zoomer.zoomIn()});
  zoom_out.addEventListener("click", (e) => {zoomer.zoomOut()});
  var reset = document.createElement("button");;
  reset.innerText = "Reset";
  document.querySelector(sel).append(reset);
  reset.addEventListener("click", (e) => {
    zoomer.resetZoom()
    zoomer.resetPan();
  });

}

function adjustStrokeWidth(z) {
  d3_select(sel).selectAll("svg path").each(function() {
    d3_select(this).attr("stroke-width", 0.2/z);
  });
}

function create_svg(sel) {
  var svg = d3_select(sel).append("svg")
    .attr("viewBox", "0 0 960 500");
  var zoomer = svgPanZoom(sel + " svg", {
    onZoom: adjustStrokeWidth,
    zoomScaleSensitivity: 0.4,
    minZoom: 1
  });
  return {svg, zoomer};
}

function binData(cds, prop, bins) {
  var list = [];
  cds.forEach((feature) => {
    if (feature.properties[prop]) {
      list.push(feature.properties[prop]*1)
    }
  })
  list.sort((a, b) => {return a*1 - b*1});
  var l = list.length;
  var r = [];
  for (var i = 0; i < bins; i++) {
    r.push(list[Math.floor(i/bins*l)])
  }
  r.push(list[l - 1])
  return r;
}

function draw_districts(svg, geojson) {
  var districts = svg.select(".svg-pan-zoom_viewport").selectAll(".path.district")
    .data(geojson.features);
  var bins = binData(geojson.features, "cd_avg_savings", 8);
  districts
    .enter()
    .append("path")
    .attr("fill", "none")
    .attr("stroke", "#000")
    .attr("stroke-width", 0.2)
    .attr("class","district")
    .merge(districts)
    .attr("d", pathGenerator)
    .attr("fill", (d) => {
      if (d.properties.cd_avg_savings) {
        var this_color;
        colors.forEach((color, j) => {
          if (d.properties.cd_avg_savings >= bins[j]) {
            this_color = color;
          }
        })
        return this_color;
      } else {
        return "#ccc";
      }
    })


}