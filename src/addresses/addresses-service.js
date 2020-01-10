const AddressesService = {
  getAddresses(knex) {
    return knex.select("*").from("address");
  }
};

module.exports = AddressesService;
