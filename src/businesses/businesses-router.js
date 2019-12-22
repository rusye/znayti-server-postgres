"use strict";

const express = require("express");

const BusinessesService = require("./businesses-service");

const businessesRouter = express.Router();

businessesRouter
  .route("/")

  .get((req, res, next) => {
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
