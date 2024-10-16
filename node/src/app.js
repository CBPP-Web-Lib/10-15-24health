import "core-js/stable";
import "regenerator-runtime/runtime";
import "./style.scss";
import { select as d3_select, svg } from "d3";
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
import { loadTypekit } from "./load_typekit";
import { parse_csv } from "./parse_csv";

/**
 * Initial setup tasks
 */
const id = "health10-15-24"
const sel = "#" + id
const script_id = "script_" + id
const script_sel = "#" + script_id

/*Gets the correct base URL regardless of whether we're on the test apps.cbpp.org page or the real cbpp.org page*/
const url_base = document.querySelector(script_sel).src.replace(/js\/app(\.min)*\.js/g,"")
const projection = d3_geoAlbersUsa();
const pathGenerator = d3_geoPath(projection);
const colors = cbpp_colorgen("#fcf8f2", "#ba0f26", 8, null, true);
const fips = key_by_first(fips_raw)
Handlebars.registerHelper("dollar", function(n) {
  return "$" + commaNumber(Math.round(n));
})
Handlebars.registerHelper("commaNumber", function(n) {
  return commaNumber(Math.round(n))
})
Handlebars.registerHelper("percent", function(n) {
  return Math.round(n*100) + "%";
});
const popupMaker = Handlebars.compile(popupSnippet);

/**
 * Download the required files and wait for document ready
 */
Promise.all([
  new Promise((resolve) => {document.addEventListener("DOMContentLoaded", resolve)}),
  axios.get(url_base + "topojson/cd_topojson.json"),
  axios.get(url_base + "topojson/state_topojson.json"),
  axios.get(url_base + "data.csv"),
  loadTypekit()
]).then((d) => {

  /*Convert the downloaded topojson files to GeoJSON*/
  var geojson = feature(d[1].data, d[1].data.objects.districts);
  var state_geojson = feature(d[2].data, d[2].data.objects.districts);

  /*Parse the data CSV*/
  var {data, headers} = parse_csv(d[3].data);

  /*Merge it into the GeoJSON data*/
  merge_csv(geojson, data, headers);

  /*Create the SVG and the zoom controller*/
  var {svg, zoomer} = create_svg(sel + " .map-wrap");

  /*Create the zoom buttons*/
  create_controls(sel, zoomer);

  /*Draw the map!*/
  var { bins } = draw_districts(svg, geojson, data);

  /*Overlay states*/
  draw_states(svg, state_geojson);

  /*Draw the legend*/
  var { legend } = create_legend(sel + " .map-wrap", bins);
})

/**
 * Merges CSV data row into GeoJSON feature property object
 */
function merge_properties(props, data, headers) {
  data.forEach((item, j) => {
    if (j >= 2) {
      props[headers[j]] = item;
    }
  })
  props.state_name = fips[props.STATEFP*1];
  props.full_district_name = props.state_name + " " + props.NAMELSAD;
}

/**
 * Merges all CSV data into the GeoJSON object
 */
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

/**
 * Make the buttons and attach handlers
 */
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

/**
 * Runs whenever map is zoomed in or out - we want the district border width
 * to be independent of zoom level, so adjust accordingly
 */
function adjustStrokeWidth(z) {
  d3_select(sel).selectAll("svg path.district").each(function() {
    d3_select(this).attr("stroke-width", 0.2/z);
  });
  d3_select(sel).selectAll("svg path.state").each(function() {
    d3_select(this).attr("stroke-width", 0.6/z);
  });
}

/**
 * Create SVG and zoomer controller
 */
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
  return {svg, zoomer, popup_wrap};
}

/**
 * Determine ideal bin thresholds for data property,
 * assuming we want an equal number of districts
 * in each bin
 */
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

/**
 * Draw states (purely decorative)
 */
function draw_states(svg, geojson) {
  var states = svg.select(".svg-pan-zoom_viewport").selectAll("path.state")
    .data(geojson.features);
  states
    .enter()
    .append("path")
    .attr("fill", "none")
    .attr("stroke", "#000")
    .attr("stroke-width", 0.6)
    .attr("class","state")
    .merge(states)
    .attr("d", pathGenerator)
}

/**
 * Draw the map! Use standard d3 enter/merge/exit pattern
 */
function draw_districts(svg, geojson) {
  var districts = svg.select(".svg-pan-zoom_viewport").selectAll("path.district")
    .data(geojson.features);
  var bins = binData(geojson.features, "cd_avg_savings", 8);
  districts
    .enter()
    .append("path")
    .attr("stroke", "#fff")
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
      /*mobile/touch devices only. Attaching to touchend
      seems to cause less conflicts with the pan/zoom library*/

      /*Don't do anything for districts with no data*/
      if (!data.properties.cd_enroll) {return;}

      var popup_html = popupMaker(data.properties);
      set_popup_text(popup_html);
      show_popup();
      position_popup(e.changedTouches[0])

      /*Remove any active hover classes*/
      document.querySelectorAll(sel + " .hover-active").forEach((el) => {
        el.classList.remove("hover-active");
      })

      /*Add hover class to this path*/
      this.classList.add("hover-active");
      return true;
    })
    .on("mouseenter", function(e, data) {
      /*Devices with a mouse only*/
      hide_popup()

      /*Don't do anything for districts with no data*/
      if (!data.properties.cd_enroll) {return;}
      var popup_html = popupMaker(data.properties);
      set_popup_text(popup_html);
      show_popup();

      /*Add hover class to this path*/
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
    /*Mobile/touch devices only. Attach this handler to the whole
    document and determine if we've clicked outside a relevant target*/

    /*Get list of target and all parents*/
    var parents = [];
    parents.push(e.target);
    var target = e.target;
    while (target.parentNode) {
      parents.push(target.parentNode);
      target = target.parentNode;
    }
    var in_path = false;
    var in_popup = false;

    /*If list has a district path or a popup, note that*/
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

    /*If we're not in a district path or a popup, the user
    has touched outside and we can hide any active popup*/
    if (!in_path && !in_popup) {
      hide_popup();
      document.querySelectorAll(sel + " .hover-active").forEach((el) => {
        el.classList.remove("hover-active");
      })
    }
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

/**
 * Position popup; it uses fixed positioning so use clientX, clientY
 */
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

/**
 * Create legend
 */
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

/**
 * Use SVG rects (CSS background-color doesn't print) 
 */
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

/*Last label at the end; more labels than boxes*/
function create_final_label(n) {
  var box = document.createElement("div");
  box.classList.add("fake-box");
  var label = document.createElement("div");
  label.classList.add("label");
  label.innerHTML = "<div>$" + n + "</div>";
  box.appendChild(label);
  return box;
}

function key_by_first(d) {
  var r = {};
  d.forEach((row) => {
    if (row[0]!=="") {
      r[row[0]] = row[1];
    }
  });
  return r;
}