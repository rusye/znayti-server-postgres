const BusinessesService = {
  getAllBusinesses(knex) {
    return knex.select("*").from("business");
  }
};

module.exports = BusinessesService;
