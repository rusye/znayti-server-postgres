"use strict";

const express = require("express");
const xss = require("xss");

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

module.exports = businessesRouter;
