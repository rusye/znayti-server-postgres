function visualIdGeneration(name, lat, long) {
  name = name.toLowerCase().replace(/ /g, "-") + "-";
  lat = lat.toString(8).slice(-3);
  long = long.toString(8).slice(-3);
  return name + lat + long;
}

module.exports = { visualIdGeneration };
