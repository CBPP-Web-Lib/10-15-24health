function parse_csv(d) {
  const header_row = 1;
  const data_start = 2;
  d = d.split("\n");
  var r = {};
  d.forEach((row, i) => {
    if (i < data_start) {return;}
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
  return {data: r, headers: d[header_row].split(",")};
}

export { parse_csv }