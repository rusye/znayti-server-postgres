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

      it("It responds with a 200 and an address that matches the city, street, and zipcode", () => {
        const addressToFind = testAddresses.find(
          address => address.suite === undefined
        );

        const { street, city, zipcode } = addressToFind;

        const queryString = Object.entries({ street, city, zipcode })
          .map(([key, value]) => {
            return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
          })
          .join("&");

        addressToFind.suite = null;

        return supertest(app)
          .get(`/api/addresses/?${queryString}`)
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(200, [addressToFind]);
      });
    });

    context("Given an XSS attack on address", () => {
      const {
        maliciousAddress,
        expectedMaliciousAddress
      } = fixtures.makeMaliciousBusiness();

      context("Removes XSS content from results", () => {
        before("Insert a malicious address", () => {
          return db.into("address").insert([maliciousAddress]);
        });

        it("It returns 200 and empty array when trying to find XSS attack address in db", () => {
          const { street, city, zipcode, suite } = maliciousAddress;

          const queryString = Object.entries({ street, city, zipcode, suite })
            .map(([key, value]) => {
              return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
            })
            .join("&");

          return supertest(app)
            .get(`/api/addresses/?${queryString}`)
            .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
            .expect(200, []);
        });
      });

      context("It removes XSS content from query", () => {
        before("Insert a malicious address", () => {
          return db.into("address").insert([expectedMaliciousAddress]);
        });

        it("Removes SQL scripting attack from query inputs", () => {
          const { street, city, zipcode, suite } = maliciousAddress;

          const queryString = Object.entries({ street, city, zipcode, suite })
            .map(([key, value]) => {
              return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
            })
            .join("&");

          return supertest(app)
            .get(`/api/addresses/?${queryString}`)
            .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
            .expect(200, [expectedMaliciousAddress]);
        });
      });
    });
  });

  describe("POST /api/addresses", () => {
    ["street", "city", "state", "zipcode", "longitude", "latitude"].forEach(
      field => {
        const newAddress = {
          street: "123 Main St.",
          city: "Portland",
          state: "OR",
          zipcode: "97236",
          longitude: -122.6786824,
          latitude: 45.5187539
        };

        it(`Responds with 400 missing '${field}' if not supplied`, () => {
          delete newAddress[field];

          return supertest(app)
            .post("/api/addresses/")
            .send(newAddress)
            .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
            .expect(400, { error: { message: `'${field}' is required` } });
        });
      }
    );

    context("Zipcode validation", () => {
      const newAddress = {
        street: "123 Main St.",
        city: "Portland",
        state: "OR",
        zipcode: "97236",
        longitude: -122.6786824,
        latitude: 45.5187539
      };

      it("Responds with 400 zipcode is too short", () => {
        newAddress.zipcode = newAddress.zipcode.slice(0, -1);

        return supertest(app)
          .post("/api/addresses/")
          .send(newAddress)
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(400, {
            error: {
              message: "zipcode is too short, must have a length of 5 digits"
            }
          });
      });

      it("Responds with 400 zipcode must be numeric", () => {
        newAddress.zipcode = "asdfg";

        return supertest(app)
          .post("/api/addresses/")
          .send(newAddress)
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(400, {
            error: {
              message: "request param zipcode must be numeric"
            }
          });
      });

      it("Responds with 400 zipcode is too long", () => {
        newAddress.zipcode += "5";

        return supertest(app)
          .post("/api/addresses/")
          .send(newAddress)
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(400, {
            error: {
              message: "zipcode is too long, must have a length of 5 digits"
            }
          });
      });
    });

    ["street", "city", "suite"].forEach(field => {
      const newAddress = {
        street: "123 Main St.",
        city: "Portland",
        suite: "303",
        state: "OR",
        zipcode: "97236",
        longitude: -122.6786824,
        latitude: 45.5187539
      };

      it(`Responds with 400 '${field}' is too long`, () => {
        newAddress[field] = "x".repeat(51);

        return supertest(app)
          .post("/api/addresses/")
          .send(newAddress)
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(400, {
            error: {
              message: `'${field}' is too long, must be max length of 50 for city and street and 10 for suite`
            }
          });
      });
    });
  });
});
