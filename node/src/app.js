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
import fips_raw from "./fips.csv";
import Handlebars from "handlebars";
import commaNumber from "comma-number";
import popupSnippet from "./popup.snippet";

const id = "health10-15-24"
const sel = "#" + id
const script_id = "script_" + id
const script_sel = "#" + script_id
const url_base = document.querySelector(script_sel).src.replace(/js\/app(\.min)*\.js/g,"")
var projection = d3_geoAlbersUsa();
var pathGenerator = d3_geoPath(projection);
var colors = cbpp_colorgen("#f5f7f0", "#336348", 8);
var fips = key_by_first(fips_raw)

Handlebars.registerHelper("dollar", function(n) {
  return "$" + commaNumber(Math.round(n));
})

Handlebars.registerHelper("commaNumber", function(n) {
  return commaNumber(Math.round(n))
})

Handlebars.registerHelper("percent", function(n) {
  return Math.round(n*100) + "%";
});

function loadTypekit() {
  return new Promise((resolve, reject) => {
    var resolved = false;
    function resolveOnce() {
      if (!resolved) {resolve()}
    }
    var tpscript = document.createElement("script");
    tpscript.setAttribute("src", "//use.typekit.net/bwe8bid.js");
    tpscript.onload = function() {
      Typekit.load({
        active:resolveOnce()
      });
    }
    document.body.appendChild(tpscript);
    setTimeout(resolveOnce, 1000);
  });
}

const popupMaker = Handlebars.compile(popupSnippet);

Promise.all([
  new Promise((resolve) => {document.addEventListener("DOMContentLoaded", resolve)}),
  axios.get(url_base + "topojson/cd_topojson.json"),
  axios.get(url_base + "data.csv"),
  loadTypekit()
]).then((d) => {
  var geojson = feature(d[1].data, d[1].data.objects.districts);
  var {data, headers} = parse_csv(d[2].data);
  merge_csv(geojson, data, headers);
  var {svg, zoomer} = create_svg(sel + " .map-wrap");

  create_controls(sel, zoomer);
  var { bins } = draw_districts(svg, geojson, data);
  var { legend } = create_legend(sel + " .map-wrap", bins);
})

function key_by_first(d) {
  var r = {};
  d.forEach((row) => {
    if (row[0]!=="") {
      r[row[0]] = row[1];
    }
  });
  return r;
}

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
  props.state_name = fips[props.STATEFP*1];
  props.full_district_name = props.state_name + " " + props.NAMELSAD;
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
  var buttons = document.createElement("div");
  buttons.classList.add("buttons");
  var zoom_in = document.createElement("button");
  zoom_in.innerText = "Zoom In";
  buttons.append(zoom_in);
  var zoom_out = document.createElement("button");
  zoom_out.innerText = "Zoom Out";
  buttons.append(zoom_out);
  zoom_in.addEventListener("click", (e) => {zoomer.zoomIn()});
  zoom_out.addEventListener("click", (e) => {zoomer.zoomOut()});
  var reset = document.createElement("button");;
  reset.innerText = "Reset";
  buttons.append(reset);
  reset.addEventListener("click", (e) => {
    zoomer.resetZoom()
    zoomer.resetPan();
  });
  document.querySelector(sel + " .svg-wrap").appendChild(buttons);

}

function adjustStrokeWidth(z) {
  d3_select(sel).selectAll("svg path").each(function() {
    d3_select(this).attr("stroke-width", 0.2/z);
  });
}

function create_svg(sel) {
  document.querySelector(sel).innerHTML = "<div class='svg-wrap'></div>";
  var svg = d3_select(sel + " .svg-wrap").append("svg")
    .attr("viewBox", "20 0 860 500");
  var popup_wrap = d3_select(sel + " .svg-wrap").append("div")
    .attr("class","popup-wrap");
  var zoomer = svgPanZoom(sel + " svg", {
    onZoom: adjustStrokeWidth,
    zoomScaleSensitivity: 0.4,
    minZoom: 1,
    maxZoom: 50
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
    .each(function(d) {
      if (d.properties.cd_avg_savings) {
        this.classList.add("has-data");
      }
    })
    .on("touchend", function(e, data) {
      if (!data.properties.cd_enroll) {return;}
      var popup_html = popupMaker(data.properties);
      set_popup_text(popup_html);
      show_popup();
      position_popup(e.changedTouches[0])
      document.querySelectorAll(sel + " .hover-active").forEach((el) => {
        el.classList.remove("hover-active");
      })
      this.classList.add("hover-active");
      return true;
    })
    .on("mouseenter", function(e, data) {
      hide_popup()
      if (!data.properties.cd_enroll) {return;}
      var popup_html = popupMaker(data.properties);
      set_popup_text(popup_html);
      //window.requestAnimationFrame(show_popup);
      show_popup();
      this.classList.add("hover-active");

    })
    .on("mousemove", (e, data) => {
      position_popup(e)
    })
    .on("mouseleave", function(e, data) {
      hide_popup()
      this.classList.remove("hover-active");
    })
  document.body.addEventListener("touchend", function(e) {
    var parents = [];
    parents.push(e.target);
    var target = e.target;
    while (target.parentNode) {
      parents.push(target.parentNode);
      target = target.parentNode;
    }
    var in_path = false;
    var in_popup = false;
    parents.forEach((el) => {
      if (el.tagName === "path") {
        if (el.classList.contains("district")) {
          in_path = true;
        }
      }
      if (el.tagName === "div") {
        if (el.classList.contains("popup")) {
          in_popup = true;
        }
      }
    });
    if (!in_path && !in_popup) {
      hide_popup();
      document.querySelectorAll(sel + " .hover-active").forEach((el) => {
        el.classList.remove("hover-active");
      })
    }
    console.log(parents);
  });
  return { bins }
}

function set_popup_text(html) {
  document.querySelector(sel + " .popup-wrap").innerHTML = html;
}

function hide_popup() {
  document.querySelector(sel + " .popup-wrap").classList.remove("visible");
}

function show_popup() {
  document.querySelector(sel + " .popup-wrap").classList.add("visible");
}

function position_popup(e) {
  var {clientX, clientY} = e;
  var popup = document.querySelector(sel + " .popup-wrap");
  popup.style.top = (clientY + 20) + "px"
  popup.style.left = clientX + "px";
  var px = clientX / window.innerWidth;
  if (popup.querySelector(".popup")) {
    popup.querySelector(".popup").style.left = (-px*200) + "px";
  }
}

function create_legend(el, bins) {
  var legend = document.createElement("div");
  legend.classList.add("legend");
  document.querySelector(el).prepend(legend)
  bins.forEach((bin, i) => {
    if (i === bins.length - 1) {return;}
    legend.appendChild(create_bin(bin, colors[i]))
  })
  legend.appendChild(create_final_label(bins[bins.length - 1]))
  return { legend }
}

function create_bin(bin, color) {
  var box = document.createElement("div");
  box.classList.add("box");
  d3_select(box).append("svg")
    .attr("viewBox", "0 0 10 10")
    .attr("preserveAspectRatio","none")
    .append("rect")
      .attr("x", -1)
      .attr("y", -1)
      .attr("width", 12)
      .attr("height", 12)
      .attr("fill", color)
      .attr("stroke-width", 0)
  var label = document.createElement("div");
  label.classList.add("label");
  label.innerHTML = "<div>$" + bin + "</div>";
  box.appendChild(label);
  return box;
    
}

function create_final_label(n) {
  var box = document.createElement("div");
  box.classList.add("fake-box");
  var label = document.createElement("div");
  label.classList.add("label");
  label.innerHTML = "<div>$" + n + "</div>";
  box.appendChild(label);
  return box;
}