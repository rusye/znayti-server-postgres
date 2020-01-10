const queryString = knex => {
  return knex
    .select(
      "address.*",
      "address.id as a_id",
      "category.*",
      "category.id as c_id",
      "business.*",
      knex.raw("array_agg(row_to_json(hours)) as hours")
    )
    .from("business")
    .whereNull("deleted_on")
    .join("address", "business.address_id", "=", "address.id")
    .join("category", "business.category_id", "=", "category.id")
    .leftJoin("hours", "business.id", "=", "hours.id")
    .groupBy("business.id", "address.id", "category.id")
    .orderBy("business.id");
};

const BusinessesService = {
  getAllBusinesses(knex, lat, long, rad) {
    return queryString(knex).where(
      knex.raw(
        `earth_distance(ll_to_earth(${lat}, ${long}), ll_to_earth(address.latitude, address.longitude)) < ${rad} * 1609.344`
      )
    );
  },
  getById(knex, visual_id) {
    return queryString(knex)
      .where({ visual_id })
      .first();
  },
  insertBusiness(knex, newBusiness) {
    return knex
      .insert(newBusiness)
      .into("business")
      .returning("*")
      .then(rows => {
        return rows[0];
      });
  },
  updateBusiness(knex, visual_id, newBusinessFields) {
    return knex("business")
      .where({ visual_id })
      .update(newBusinessFields);
  },
  deleteBusiness(knex, visual_id) {
    return knex("business")
      .where({ visual_id })
      .update("deleted_on", knex.fn.now());
  }
};

module.exports = BusinessesService;
