const { isWebUri } = require("valid-url");
const logger = require("../logger");

const NO_ERRORS = null;

function getBusinessValidationError(business, HTTPMethod) {
  const { google_place, telephone } = business;

  if (HTTPMethod === "POST") {
    for (const field of [
      "visual_id",
      "business_name",
      "category_id",
      "address_id",
      "google_place",
      "telephone"
    ]) {
      if (!business[field]) {
        logger.error(`${field} is required`);
        return {
          error: { message: `'${field}' is required` }
        };
      }
    }
  }

  if (HTTPMethod === "PATCH") {
    const numberOfValues = Object.values(business).filter(Boolean).length;
    if (numberOfValues === 0) {
      logger.error("Invalid update without required fields");
      return {
        error: {
          message:
            "Request body must contain either 'business_name', 'contact_name', 'category_id', 'address_id', 'google_place' or 'telephone'"
        }
      };
    }
  }

  const isTelephone = tel => {
    const phoneRegex = /^[0-9]{10,10}$/;
    return !phoneRegex.test(tel) ? false : true;
  };

  if (google_place && !isWebUri(google_place)) {
    logger.error(`Invalid url '${google_place}' supplied`);
    return {
      error: {
        message: "'google_place' must be a valid URL"
      }
    };
  }

  if (telephone && !isTelephone(telephone)) {
    logger.error(`Invalid telephone format '${telephone}' supplied`);
    return {
      error: {
        message: "'telephone' must be in this format: '1234567890'"
      }
    };
  }

  return NO_ERRORS;
}

module.exports = {
  getBusinessValidationError
};
