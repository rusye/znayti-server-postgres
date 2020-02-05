const AddressesService = {
  getAllAddresses(knex, zipcode, city, street, suite = null) {
    return knex
      .select("*")
      .from("address")
      .where({ zipcode, city, street, suite });
  },
  insertAddress(knex, newAddress) {
    return knex
      .insert(newAddress)
      .into("address")
      .returning("*")
      .then(rows => {
        return rows[0];
      });
  },
  getById(knex, id) {
    return knex
      .select("*")
      .from("address")
      .where({ id })
      .first();
  }
};

module.exports = AddressesService;
