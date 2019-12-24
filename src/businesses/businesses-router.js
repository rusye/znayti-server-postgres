"use strict";

const express = require("express");

const BusinessesService = require("./businesses-service");

const businessesRouter = express.Router();

businessesRouter
  .route("/")

  .get((req, res, next) => {
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
        res.json(businesses);
      })
      .catch(next);
  });

module.exports = businessesRouter;
