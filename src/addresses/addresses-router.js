"use strict";

const express = require("express");

const AddressesService = require("./addresses-service");

const addressesRouter = express.Router();

addressesRouter.route("/").get((req, res, next) => {
  if (!req.query.zipcode) {
    return res
      .status(400)
      .json({ error: { message: "Missing zipcode in request params" } });
  }

  AddressesService.getAllAddresses(req.app.get("db"))
    .then(addresses => {
      res.json(addresses);
    })
    .catch(next);
});

module.exports = addressesRouter;
