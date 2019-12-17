const knex = require("knex");
const app = require("../src/app");
const testInserts = require("./znayti-fixtures");

describe("Businesses Endpoints", () => {
  let db;

  before("make knex instance", () => {
    db = knex({
      client: "pg",
      connection: process.env.TEST_DATABASE_URL
    });
    app.set("db", db);
  });

  before("clean the table", () =>
    db.raw("TRUNCATE category, business, site_user, address, hours, review")
  );

  afterEach("cleanup", () =>
    db.raw("TRUNCATE category, business, site_user, address, hours, review")
  );

  after("disconnect from db", () => db.destroy());

  describe.only("GET /api/businesses", () => {
    context("Given no businesses", () => {
      it("Responds with 200 and an empty list", () => {
        return supertest(app)
          .get("/api/businesses")
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(200, []);
      });
    });

    context("Given there are businesses in the database", () => {
      beforeEach("insert categories, addresses, hours, and businesses", () => {
        return db
          .into("category")
          .insert(testInserts.testCategories())
          .then(() => {
            return db.into("address").insert(testInserts.testAddresses());
          })
          .then(() => {
            return db.into("business").insert(testInserts.testBusinesses());
          });
      });

      const testBusinessesSerilize = businesses => ({
        ...businesses,
        review_count: 0,
        average_rating: null,
        deleted_on: null
      });

      const expectedBusinessesResult = testInserts
        .testBusinesses()
        .map(testBusinessesSerilize);

      it("Gets businesses from the database", () => {
        return supertest(app)
          .get("/api/businesses")
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(200, expectedBusinessesResult);
      });
    });
  });
});
