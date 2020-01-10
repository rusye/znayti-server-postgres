"use strict";

const express = require("express");

const AddressesService = require("./addresses-service");

const addressesRouter = express.Router();

addressesRouter.route("/").get((req, res, next) => {
  AddressesService.getAddresses(req.app.get("db"))
    .then(addresses => {
      res.json(addresses);
    })
    .catch(next);
});

module.exports = addressesRouter;
