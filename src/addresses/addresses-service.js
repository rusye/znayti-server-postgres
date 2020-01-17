const AddressesService = {
  getAllAddresses(knex, zipcode, city, street, suite) {
    return knex
      .select("*")
      .from("address")
      .where({ zipcode, city, street, suite });
  }
};

module.exports = AddressesService;
