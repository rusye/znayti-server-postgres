const logger = require("./logger");

function visualIdGeneration(inputs) {
  let { business_name, latitude, longitude } = inputs;

  for (const field of ["business_name", "latitude", "longitude"]) {
    if (!inputs[field]) {
      logger.error(`${field} is required`);
      return {
        error: { message: `'${field}' is required` },
      };
    }
  }

  business_name = business_name.toLowerCase().replace(/ /g, "-") + "-";
  latitude = latitude.toString(8).slice(-3);
  longitude = longitude.toString(8).slice(-3);

  return business_name + latitude + longitude;
}

module.exports = { visualIdGeneration };
