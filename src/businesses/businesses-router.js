"use strict";

const express = require("express");
const path = require("path");
const xss = require("xss");
const logger = require("../logger");
const bodyParser = express.json();

const BusinessesService = require("./businesses-service");
const { businessValidationError } = require("./businesses-validator");

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
        let distinctCount = {};

        for (let i = 0; i < businesses.length; i++) {
          distinctCount[businesses[i].category_name] =
            (distinctCount[businesses[i].category_name] || 0) + 1;
        }

        const distinctCountArray = [];

        Object.keys(distinctCount).map(key => {
          const newObj = {};
          newObj[xss(key)] = distinctCount[key];
          return distinctCountArray.push(newObj);
        });

        res.json([businesses.map(serializeBusiness), distinctCountArray]);
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

    const error = businessValidationError(newBusiness, "POST");

    if (error) return res.status(400).send(error);

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

    const error = businessValidationError(businessToUpdate, "PATCH");

    if (error) return res.status(400).send(error);

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
