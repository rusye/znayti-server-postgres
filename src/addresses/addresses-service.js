const AddressesService = {
  getAllAddresses(knex) {
    return knex.select("*").from("address");
  }
};

module.exports = AddressesService;
