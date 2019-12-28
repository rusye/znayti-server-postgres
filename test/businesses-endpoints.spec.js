const knex = require("knex");
const app = require("../src/app");
const fixtures = require("./znayti-fixtures");

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
          .get(
            "/api/businesses/?long=-122.674396&lat=45.545708&rad=10&input=Portland, OR"
          )
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(200, []);
      });

      const requiredParams = ["long", "lat", "rad"];

      requiredParams.forEach(param => {
        const newParams = { long: "-122.674396", lat: "45.545708", rad: "10" };
        delete newParams[param];

        const queryString = Object.entries(newParams)
          .map(([key, value]) => {
            return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
          })
          .join("&");

        it(`It responds with 400 missing ${param} if not supplied`, () => {
          return supertest(app)
            .get(`/api/businesses/?${queryString}`)
            .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
            .expect(400, {
              error: { message: `Missing '${param}' in request params` }
            });
        });
      });

      const tooLargeRadius = 51;

      it("It responds with 400 radius is too great", () => {
        return supertest(app)
          .get(
            `/api/businesses/?long=-122.674396&lat=45.545708&rad=${tooLargeRadius}&input=Portland, OR`
          )
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(400, {
            error: { message: `Radius '${tooLargeRadius}' is greater than 50` }
          });
      });
    });

    context("Given there are businesses in the database", () => {
      const {
        testCategories,
        testAddresses,
        testBusinesses,
        testHours,
        testBusinessesSerilize
      } = fixtures.makeZnaytiArrays();

      beforeEach("insert categories, addresses, hours, and businesses", () => {
        return db
          .into("category")
          .insert(testCategories)
          .then(() => {
            return db.into("address").insert(testAddresses);
          })
          .then(() => {
            return db.into("business").insert(testBusinesses);
          })
          .then(() => {
            return db.into("hours").insert(testHours);
          });
      });

      const expectedBusinessesResult = testBusinesses
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

    context("Given an XSS attack on business", () => {
      const {
        maliciousCategory,
        maliciousAddress,
        maliciousBusiness,
        expectedBusiness
      } = fixtures.makeMaliciousBusiness();

      beforeEach(
        "Insert a malicious business and anything associated with it",
        () => {
          return db
            .into("category")
            .insert([maliciousCategory])
            .then(() => {
              return db.into("address").insert([maliciousAddress]);
            })
            .then(() => {
              return db.into("business").insert([maliciousBusiness]);
            });
        }
      );

      it("Removes XSS attack content", () => {
        return supertest(app)
          .get(
            "/api/businesses/?long=-122.674396&lat=45.545708&rad=50&input=Portland, OR"
          )
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(200, [expectedBusiness]);
      });
    });
  });

  describe("GET /api/businesses/:id", () => {
    context("Given no business", () => {
      it("Responds with 404 when the business doesn't exist", () => {
        return supertest(app)
          .get("/api/businesses/some-business-564658")
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(404, { error: { message: "Business Not Found" } });
      });
    });

    context("Given there are businesses in the database", () => {
      const {
        testCategories,
        testAddresses,
        testBusinesses,
        testHours,
        testBusinessesSerilize
      } = fixtures.makeZnaytiArrays();

      beforeEach("insert categories, addresses, hours, and businesses", () => {
        return db
          .into("category")
          .insert(testCategories)
          .then(() => {
            return db.into("address").insert(testAddresses);
          })
          .then(() => {
            return db.into("business").insert(testBusinesses);
          })
          .then(() => {
            return db.into("hours").insert(testHours);
          });
      });

      it("Responds with 200 and the specified business", () => {
        const business_visual_id = "new-business-2-789012";

        const expectedBusinessesResult = testBusinesses
          .filter(business => business.visual_id === business_visual_id)
          .map(testBusinessesSerilize);

        return supertest(app)
          .get("/api/businesses/new-business-2-789012")
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(200, expectedBusinessesResult[0]);
      });
    });
  });
});
