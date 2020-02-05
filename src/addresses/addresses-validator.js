const logger = require("../logger");

const NO_ERRORS = null;

function addressValidationError(newAddress) {
  const { zipcode, longitude, latitude } = newAddress;

  for (const field of [
    "street",
    "city",
    "state",
    "zipcode",
    "longitude",
    "latitude"
  ]) {
    if (!newAddress[field]) {
      logger.error(`${field} is required`);
      return {
        error: { message: `'${field}' is required` }
      };
    }
  }

  if (zipcode.length < 5 || zipcode.length > 5) {
    return {
      error: {
        message: `zipcode is too ${
          zipcode.length < 5 ? "short" : "long"
        }, must have a length of 5 digits`
      }
    };
  }

  if (isNaN(zipcode)) {
    return {
      error: {
        message: "request param zipcode must be numeric"
      }
    };
  }

  for (const field of ["street", "city"]) {
    if (newAddress[field].length > 50) {
      logger.error(`${field} is too long`);
      return {
        error: {
          message: `'${field}' is too long, must be max length of 50 for city and street and 10 for suite`
        }
      };
    }
  }

  if (newAddress.suite && newAddress.suite.length > 10) {
    logger.error("'suite' is too long");
    return {
      error: {
        message:
          "'suite' is too long, must be max length of 50 for city and street and 10 for suite"
      }
    };
  }

  if (newAddress.state.length > 2) {
    logger.error("'state' is too long");
    return {
      error: {
        message:
          "'state' is too long, must be an abbreviation of state, ex Oregon would be OR"
      }
    };
  }

  if (longitude < -180 || longitude > 180) {
    logger.error("'longitude' is out of range");
    return {
      error: {
        message: "'longitude' is out of range, must be between -180 and 180"
      }
    };
  }

  if (latitude < -90 || latitude > 90) {
    logger.error("'latitude' is out of range");
    return {
      error: {
        message: "'latitude' is out of range, must be between -90 and 90"
      }
    };
  }

  return NO_ERRORS;
}

module.exports = {
  addressValidationError
};
