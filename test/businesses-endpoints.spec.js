const { expect } = require("chai");
const knex = require("knex");
const app = require("../src/app");

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
  });
});
