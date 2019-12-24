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

  describe("GET /api/businesses", () => {
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
          })
          .then(() => {
            return db.into("hours").insert(testInserts.testHours());
          });
      });

      const findObject = (testArray, id) => {
        return testArray().filter(obj => obj.id === id);
      };

      const testBusinessesSerilize = business => ({
        ...findObject(testInserts.testAddresses, business.address_id)[0],
        ...findObject(testInserts.testCategories, business.category_id)[0],
        ...business,
        review_count: 0,
        average_rating: null,
        deleted_on: null,
        hours: findObject(testInserts.testHours, business.id),
        a_id: business.address_id,
        c_id: business.category_id
      });

      const expectedBusinessesResult = testInserts
        .testBusinesses()
        .filter(business => business.id !== 3)
        .map(testBusinessesSerilize);

      it("It responds with a 200 and businesses within a 10 miles radius", () => {
        return supertest(app)
          .get(
            "/api/businesses/?long=-122.674396&lat=45.545708&rad=10&input=Portland, OR"
          )
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(200, expectedBusinessesResult);
      });
    });
  });
});
