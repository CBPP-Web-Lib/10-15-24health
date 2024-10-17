import {merge} from "topojson"

/**
 * Group districts by state and 
 * merge into state objects to draw
 * state borders
 */
function merge_states_from_districts(topo) {
  var state_objs = {};
  var r = {
    "type": "FeatureCollection",
    "features": []
  }
  topo.objects.districts.geometries.forEach((district) => {
    var state = district.properties.STATEFP;
    if (typeof(state_objs[state]) === "undefined") {
      state_objs[state] = [];
    }
    state_objs[state].push(district);
  })
  Object.keys(state_objs).forEach((state_fips) => {
    var state_districts = state_objs[state_fips];
    var state_geo = merge(topo, state_districts);
    state_geo.properties = {"STATEFP": state_fips};
    r.features.push(state_geo);
  })
  return r;
}

export { merge_states_from_districts }