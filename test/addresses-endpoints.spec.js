const knex = require("knex");
const app = require("../src/app");

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

    context("Zipcode validation", () => {
      it("Responds with 200 and an empty list", () => {
        return supertest(app)
          .get("/api/addresses/?zipcode=97236")
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(200, []);
      });

      it("Responds with 400 zipcode is too short", () => {
        return supertest(app)
          .get("/api/addresses/?zipcode=1")
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(400, {
            error: {
              message:
                "request param zipcode is too short, must have a length of 5 digits"
            }
          });
      });

      it("Responds with 400 zipcode is too long", () => {
        return supertest(app)
          .get("/api/addresses/?zipcode=166666")
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(400, {
            error: {
              message:
                "request param zipcode is too long, must have a length of 5 digits"
            }
          });
      });

      it("Responds with 400 zipcode must be numeric", () => {
        return supertest(app)
          .get("/api/addresses/?zipcode=asdfg")
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(400, {
            error: {
              message: "request param zipcode must be numeric"
            }
          });
      });
    });

    context("Given no addresses in a certain zipcode", () => {
      it("It responds with 400 missing zipcode if not supplied", () => {
        return supertest(app)
          .get("/api/addresses/")
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(400, {
            error: {
              message: "Missing zipcode in request params"
            }
          });
      });
    });
  });
});
