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
var alaska_geojson = JSON.parse(fs.readFileSync("./geojson/cb_2023_us_cd118_500k.json", "utf-8"));

var all_states = merged_geojson.features.filter(function(feature) {
  if (feature.properties.STATEFP*1 ==2 ) {return false;}
  if (feature.properties.STATEFP*1 <= 56) {return true;}
  return false;
})

var alaska = merged_geojson.features.filter(function(feature) {
  if (feature.properties.STATEFP*1 == 2) {return true;}
  return false;
})

merged_geojson.features = all_states;
alaska_geojson.features = alaska;

var alaska_topo = topojson.topology({districts: alaska_geojson})
alaska_topo = topojson.presimplify(alaska_topo);
alaska_topo = topojson.simplify(alaska_topo, 0.001);
alaska_topo = topojson.quantize(alaska_topo, 1e05);
var alaska_simplified = topojson.feature(alaska_topo, alaska_topo.objects.districts);
merged_geojson.features = merged_geojson.features.concat(alaska_simplified.features);

var merged_topo = topojson.topology({districts: merged_geojson})
merged_topo = topojson.presimplify(merged_topo);
merged_topo = topojson.simplify(merged_topo, 0.0001);
merged_topo = topojson.quantize(merged_topo, 1e06);

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