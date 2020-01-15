const AddressesService = {
  getAllAddresses(knex, zipcode) {
    return knex
      .select("*")
      .from("address")
      .where({ zipcode });
  }
};

module.exports = AddressesService;
