const knex = require("knex");
const app = require("../src/app");
const fixtures = require("./znayti-fixtures");

describe("Addresses Endpoints", () => {
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

  const { testAddresses } = fixtures.makeZnaytiArrays();

  describe("GET /api/addresses", () => {
    context("Given no addresses in the database", () => {
      const requiredParams = ["zipcode", "city", "street"];

      requiredParams.forEach(param => {
        const newParams = {
          zipcode: "97236",
          city: "Portland",
          street: "123 main st."
        };
        delete newParams[param];

        const queryString = Object.entries(newParams)
          .map(([key, value]) => {
            return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
          })
          .join("&");

        it(`Responds with 400 missing ${param} if not supplied`, () => {
          return supertest(app)
            .get(`/api/addresses/?${queryString}`)
            .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
            .expect(400, {
              error: { message: `Missing "${param}" in request params` }
            });
        });
      });

      it("Responds with 200 and an empty list", () => {
        return supertest(app)
          .get("/api/addresses/?zipcode=97236&city=Portland&street=123 main st")
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(200, []);
      });
    });

    context("Given there are addresses in the database", () => {
      beforeEach("Insert addresses", () => {
        return db.into("address").insert(testAddresses);
      });

      it("It responds with a 200 and addresses with a certain zipcode", () => {
        const zipcodeToSearch = "97236";

        const expectedAddressesResult = testAddresses.filter(
          address => address.zipcode === zipcodeToSearch
        );
        return supertest(app)
          .get(`/api/addresses/?zipcode=${zipcodeToSearch}`)
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(200, expectedAddressesResult);
      });
    });

    context("Given an XSS attack on address", () => {
      const {
        maliciousAddress,
        expectedMaliciousAddress
      } = fixtures.makeMaliciousBusiness();

      beforeEach("Insert a malicious address", () => {
        return db.into("address").insert([maliciousAddress]);
      });

      const zipcodeToSearch = "97236";

      const expectedAddressResult = [{ ...expectedMaliciousAddress }];

      it("Removes XSS attack content", () => {
        return supertest(app)
          .get(`/api/addresses/?zipcode=${zipcodeToSearch}`)
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(200, expectedAddressResult);
      });
    });
  });
});
