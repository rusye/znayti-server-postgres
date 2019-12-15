"use strict";

const express = require("express");

const BusinessesService = require("./businesses-service");

const businessesRouter = express.Router();

businessesRouter
  .route("/")

  .get((req, res, next) => {
    BusinessesService.getAllBusinesses(req.app.get("db"))
      .then(businesses => {
        res.json(businesses);
      })
      .catch(next);
  });

module.exports = businessesRouter;
