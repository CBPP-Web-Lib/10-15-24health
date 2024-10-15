/*const topojson = require("topojson-server");
const topojson_client = require("topojson-client");
const toposimplify = require("topojson-simplify");*/
const topojson = require("topojson")
const fs = require("fs")
const files = fs.readdirSync("./geojson");
var merged = [];
/*files.forEach((file) => {
  var content = JSON.parse(fs.readFileSync("./geojson/" + file, "utf-8"));
  //convert_high(content, "../html/topojson/" + file);
  merged = add_low(content, merged);
});*/

var merged_geojson = JSON.parse(fs.readFileSync("./geojson/cb_2023_us_cd118_500k.json", "utf-8"));

merged_geojson.features = merged_geojson.features.filter(function(feature) {
  if (feature.properties.STATEFP*1 <= 56) {return true;}
  return false;
})


var merged_topo = topojson.topology({districts: merged_geojson})
merged_topo = topojson.presimplify(merged_topo);
merged_topo = topojson.simplify(merged_topo, 0.0001);
merged_topo = topojson.quantize(merged_topo, 1e08);
fs.writeFileSync("../html/topojson/cd_topojson.json", JSON.stringify(merged_topo), "utf-8");


function add_low(geojson, merged) {
  var { features } = geojson;
  merged = merged.concat(features);
  return merged;
}

function convert_high(geojson, dest) {
  var topo = topojson.topology({districts: geojson});
  topo = toposimplify.presimplify(topo);
  topo = toposimplify.simplify(topo, 0.01);
  topo = topojson_client.quantize(topo, 1e6);
  fs.writeFileSync(dest, JSON.stringify(topo), "utf-8");
}