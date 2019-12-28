"use strict";

const express = require("express");
const xss = require("xss");
const logger = require("../logger");

const BusinessesService = require("./businesses-service");

const businessesRouter = express.Router();

const serializeBusiness = business => ({
  ...business,
  category_name: xss(business.category_name),
  street: xss(business.street),
  city: xss(business.city),
  business_name: xss(business.business_name),
  contact_name: xss(business.contact_name)
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
  });

module.exports = businessesRouter;
