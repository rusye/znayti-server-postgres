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
    context("Given no addresses", () => {
      ["street", "city", "state", "zipcode", "longitude", "latitude"].forEach(
        field => {
          const newAddress = {
            ...testAddresses[0]
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
          ...testAddresses[0]
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
          ...testAddresses[0]
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

      it("Responds with 400 'state' is too long", () => {
        const newAddress = {
          ...testAddresses[0],
          state: "ORRR"
        };

        return supertest(app)
          .post("/api/addresses/")
          .send(newAddress)
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(400, {
            error: {
              message:
                "'state' is too long, must be an abbreviation of state, ex Oregon would be OR"
            }
          });
      });

      ["-181", "181"].forEach(value => {
        const newAddress = {
          ...testAddresses[0],
          longitude: value
        };

        it("Responds with 400 'longitude' is out of range", () => {
          return supertest(app)
            .post("/api/addresses/")
            .send(newAddress)
            .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
            .expect(400, {
              error: {
                message:
                  "'longitude' is out of range, must be between -180 and 180"
              }
            });
        });
      });

      ["-91", "91"].forEach(value => {
        const newAddress = {
          ...testAddresses[0],
          latitude: value
        };

        it("Responds with 400 'latitude' is out of range", () => {
          return supertest(app)
            .post("/api/addresses/")
            .send(newAddress)
            .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
            .expect(400, {
              error: {
                message:
                  "'latitude' is out of range, must be between -90 and 90"
              }
            });
        });
      });

      it("Add's a new address to the store", () => {
        const expectedAddress = {
          ...testAddresses[0]
        };

        return supertest(app)
          .post("/api/addresses/")
          .send(testAddresses[0])
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(201)
          .expect(res => {
            expectedAddress.id = res.body.id;
            expect(res.body).to.eql(expectedAddress);
          });
      });

      it("Removes XSS attack content from response", () => {
        const {
          maliciousAddress,
          expectedMaliciousAddress
        } = fixtures.makeMaliciousBusiness();

        return supertest(app)
          .post("/api/addresses/")
          .send(maliciousAddress)
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(201)
          .expect(res => {
            expectedMaliciousAddress.id = res.body.id;
            expect(res.body).to.eql(expectedMaliciousAddress);
          });
      });
    });

    context("Given there are addresses in the database", () => {
      beforeEach("Insert addresses", () => {
        return db.into("address").insert(testAddresses);
      });

      it("Responds with 400 address already exists", () => {
        return supertest(app)
          .post("/api/addresses/")
          .send(testAddresses[0])
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(400, {
            error: {
              message: "address already exists"
            }
          });
      });

      it("Add's a new address to the store", () => {
        const newAddress = {
          street: "456 Main St.",
          city: "Portland",
          state: "OR",
          zipcode: "97236",
          longitude: -122.6786924,
          latitude: 45.5117539
        };

        return supertest(app)
          .post("/api/addresses/")
          .send(newAddress)
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(201)
          .expect(res => {
            newAddress.id = res.body.id;
            newAddress.suite ? undefined : (newAddress.suite = null);
            expect(res.body).to.eql(newAddress);
          });
      });
    });
  });

  describe("GET /api/addresses/:id", () => {
    context("Given no address", () => {
      it("Responds with 404 when the address doesn't exist", () => {
        return supertest(app)
          .get("/api/addresses/1")
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(404, { error: { message: "Address Not Found" } });
      });
    });
  });
});
