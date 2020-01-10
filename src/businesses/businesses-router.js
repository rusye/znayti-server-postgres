"use strict";

const express = require("express");
const path = require("path");
const xss = require("xss");
const logger = require("../logger");
const bodyParser = express.json();
const { isWebUri } = require("valid-url");

const BusinessesService = require("./businesses-service");

const businessesRouter = express.Router();

const serializeBusiness = business => ({
  ...business,
  ...(business.category_name
    ? { category_name: xss(business.category_name) }
    : null),
  ...(business.street ? { street: xss(business.street) } : null),
  ...(business.city ? { city: xss(business.city) } : null),
  ...(business.business_name
    ? { business_name: xss(business.business_name) }
    : null),
  ...(business.contact_name
    ? { contact_name: xss(business.contact_name) }
    : null)
});

businessesRouter
  .route("/")

  .get((req, res, next) => {
    if (req.query.rad > 50) {
      return res.status(400).json({
        error: { message: `Radius '${req.query.rad}' is greater than 50` }
      });
    }

    for (const param of ["long", "lat", "rad"]) {
      if (!req.query[param]) {
        return res
          .status(400)
          .json({ error: { message: `Missing '${param}' in request params` } });
      }
    }

    BusinessesService.getAllBusinesses(
      req.app.get("db"),
      req.query.lat,
      req.query.long,
      req.query.rad
    )
      .then(businesses => {
        res.json(businesses.map(serializeBusiness));
      })
      .catch(next);
  })

  .post(bodyParser, (req, res, next) => {
    const {
      visual_id,
      business_name,
      contact_name,
      category_id,
      address_id,
      google_place,
      telephone
    } = req.body;

    const newBusiness = {
      visual_id,
      business_name,
      contact_name,
      category_id,
      address_id,
      google_place,
      telephone
    };

    for (const field of [
      "visual_id",
      "business_name",
      "category_id",
      "address_id",
      "google_place",
      "telephone"
    ]) {
      if (!newBusiness[field]) {
        logger.error(`${field} is required`);
        return res.status(400).send({
          error: { message: `'${field}' is required` }
        });
      }
    }

    if (!isWebUri(google_place)) {
      logger.error(`Invalid url '${google_place}' supplied`);
      return res.status(400).send({
        error: {
          message: "'google_place' must be a valid URL"
        }
      });
    }

    const isTelephone = tel => {
      const phoneRegex = /^[0-9]{10,10}$/;
      return !phoneRegex.test(tel) ? false : true;
    };

    if (!isTelephone(telephone)) {
      logger.error(`Invalid telephone format '${telephone}' supplied`);
      return res.status(400).send({
        error: {
          message: "'telephone' must be in this format: '1234567890'"
        }
      });
    }

    BusinessesService.insertBusiness(req.app.get("db"), newBusiness)
      .then(business => {
        logger.info(`Business with id ${business.id} created.`);
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `${business.id}`))
          .json(serializeBusiness(business));
      })
      .catch(next);
  });

businessesRouter
  .route("/:business_visual_id")

  .all((req, res, next) => {
    const { business_visual_id } = req.params;
    BusinessesService.getById(req.app.get("db"), business_visual_id)
      .then(business => {
        if (!business) {
          logger.error(`Business with id ${business_visual_id} not found.`);
          return res.status(404).json({
            error: { message: "Business Not Found" }
          });
        }

        res.business = business;
        next();
      })
      .catch(next);
  })

  .get((req, res) => {
    res.json(serializeBusiness(res.business));
  })

  .patch(bodyParser, (req, res, next) => {
    const {
      business_name,
      contact_name,
      category_id,
      address_id,
      google_place,
      telephone
    } = req.body;

    const businessToUpdate = {
      business_name,
      contact_name,
      category_id,
      address_id,
      google_place,
      telephone
    };

    const numberOfValues = Object.values(businessToUpdate).filter(Boolean)
      .length;
    if (numberOfValues === 0) {
      logger.error("Invalid update without required fields");
      return res.status(400).json({
        error: {
          message:
            "Request body must contain either 'business_name', 'contact_name', 'category_id', 'address_id', 'google_place' or 'telephone'"
        }
      });
    }

    if (google_place && !isWebUri(google_place)) {
      logger.error(`Invalid url '${google_place}' supplied`);
      return res.status(400).send({
        error: {
          message: "'google_place' must be a valid URL"
        }
      });
    }

    const isTelephone = tel => {
      const phoneRegex = /^[0-9]{10,10}$/;
      return !phoneRegex.test(tel) ? false : true;
    };

    if (telephone && !isTelephone(telephone)) {
      logger.error(`Invalid telephone format '${telephone}' supplied`);
      return res.status(400).send({
        error: {
          message: "'telephone' must be in this format: '1234567890'"
        }
      });
    }

    BusinessesService.updateBusiness(
      req.app.get("db"),
      req.params.business_visual_id,
      businessToUpdate
    )
      .then(numRowsAffected => {
        res.status(204).end();
      })
      .catch(next);
  })

  .delete((req, res, next) => {
    const { business_visual_id } = req.params;
    BusinessesService.deleteBusiness(req.app.get("db"), business_visual_id)
      .then(deleted => {
        logger.info(`Business with visual_id ${business_visual_id} deleted.`);
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = businessesRouter;
