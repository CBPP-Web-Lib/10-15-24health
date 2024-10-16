const get_shapes = require("cbpp_geojson_from_url")
const fs = require("fs");
//var urls = fs.readFileSync("./urls.csv", "utf-8")
//urls = urls.split("\n");

/*var chain = Promise.resolve();

urls.forEach((url) => {
  chain = chain.then(() => {
    console.log("getting " + url);
    return get_shapes(url);
  })
})*/

get_shapes("https://www2.census.gov/geo/tiger/GENZ2023/shp/cb_2023_us_cd118_5m.zip");
get_shapes("https://www2.census.gov/geo/tiger/GENZ2023/shp/cb_2023_us_state_500k.zip");