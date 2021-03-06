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

  const {
    testCategories,
    testAddresses,
    testBusinesses,
    testHours,
    testBusinessesSerilize,
    expectedCategoryCount
  } = fixtures.makeZnaytiArrays();

  const distinctArrayCount = array => {
    let distinctCount = {};

    for (let i = 0; i < array.length; i++) {
      distinctCount[array[i].category_name] =
        (distinctCount[array[i].category_name] || 0) + 1;
    }

    const distinctCountArray = [];

    Object.keys(distinctCount).map(key => {
      const newObj = {};
      newObj[key] = distinctCount[key];
      return distinctCountArray.push(newObj);
    });

    return distinctCountArray;
  };

  const testInsertions = () => {
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
  };

  describe("GET /api/businesses", () => {
    context("Given no businesses", () => {
      it("Responds with 200 and an empty list", () => {
        return supertest(app)
          .get(
            "/api/businesses/?long=-122.674396&lat=45.545708&rad=10&input=Portland, OR"
          )
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(200, [[], []]);
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
      beforeEach("insert categories, addresses, hours, and businesses", () => {
        return testInsertions();
      });

      const expectedBusinessesResult = [
        testBusinesses
          .filter(business => business.id !== 3)
          .map(testBusinessesSerilize),
        expectedCategoryCount
      ];

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
        expectedMaliciousCategory,
        expectedMaliciousAddress,
        expectedMaliciousBusiness
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

      const expectedBusiness = [
        {
          ...expectedMaliciousCategory,
          ...expectedMaliciousAddress,
          ...expectedMaliciousBusiness,
          c_id: maliciousBusiness.category_id,
          a_id: maliciousBusiness.address_id,
          hours: [null]
        }
      ];

      it("Removes XSS attack content", () => {
        return supertest(app)
          .get(
            "/api/businesses/?long=-122.674396&lat=45.545708&rad=50&input=Portland, OR"
          )
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(200, [
            expectedBusiness,
            distinctArrayCount(expectedBusiness)
          ]);
      });
    });
  });

  describe("POST /api/businesses", () => {
    [
      "visual_id",
      "business_name",
      "category_id",
      "address_id",
      "google_place",
      "telephone"
    ].forEach(field => {
      const newBusiness = {
        id: 1,
        visual_id: "new-business-1-123456",
        business_name: "New Business 1",
        category_id: 1,
        address_id: 2,
        google_place: "Some Google Place 123",
        telephone: "1234567890",
        contact_name: "Bob"
      };

      it(`Responds with 400 missing '${field}' if not supplied`, () => {
        delete newBusiness[field];

        return supertest(app)
          .post("/api/businesses/")
          .send(newBusiness)
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(400, { error: { message: `'${field}' is required` } });
      });
    });

    it("Responds with 400 invalid 'url' if not a valid url", () => {
      const wrongGooglePlace = {
        ...testBusinesses[0],
        google_place: "htp:/somebadplace.ce"
      };

      return supertest(app)
        .post("/api/businesses/")
        .send(wrongGooglePlace)
        .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
        .expect(400, {
          error: { message: "'google_place' must be a valid URL" }
        });
    });

    it("Responds with 400 invalid 'telephone' if the telephone format isn't correct", () => {
      const wrongTelephone = {
        ...testBusinesses[0],
        telephone: "123-456-7890"
      };

      return supertest(app)
        .post("/api/businesses/")
        .send(wrongTelephone)
        .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
        .expect(400, {
          error: { message: "'telephone' must be in this format: '1234567890'" }
        });
    });

    it("Add's a new business to the store", () => {
      const expectedBusinessesResult = {
        ...testBusinesses[0],
        average_rating: null,
        deleted_on: null,
        review_count: 0,
        ...(testBusinesses[0].contact_name
          ? { contact_name: testBusinesses[0].contact_name }
          : { contact_name: null })
      };

      return db
        .into("category")
        .insert(testCategories)
        .then(() => {
          return db.into("address").insert(testAddresses);
        })
        .then(() =>
          supertest(app)
            .post("/api/businesses/")
            .send(testBusinesses[0])
            .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
            .expect(201)
            .expect(res => {
              expectedBusinessesResult.id = res.body.id;
              expect(res.body).to.eql(expectedBusinessesResult);
            })
        );
    });

    it("Removes XSS attack content from response", () => {
      const {
        maliciousBusiness,
        expectedMaliciousBusiness
      } = fixtures.makeMaliciousBusiness();

      return db
        .into("category")
        .insert(testCategories)
        .then(() => {
          return db.into("address").insert(testAddresses);
        })
        .then(() =>
          supertest(app)
            .post("/api/businesses/")
            .send(maliciousBusiness)
            .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
            .expect(201)
            .expect(res => {
              expectedMaliciousBusiness.id = res.body.id;
              expect(res.body).to.eql(expectedMaliciousBusiness);
            })
        );
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
      beforeEach("insert categories, addresses, hours, and businesses", () => {
        return testInsertions();
      });

      it("Responds with 200 and the specified business", () => {
        const business_visual_id = testBusinesses[1].visual_id;

        const expectedBusinessesResult = testBusinesses
          .filter(business => business.visual_id === business_visual_id)
          .map(testBusinessesSerilize);

        return supertest(app)
          .get(`/api/businesses/${business_visual_id}`)
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(200, expectedBusinessesResult[0]);
      });
    });
  });

  describe("PATCH /api/businesses/:id", () => {
    context("Given no business", () => {
      it("Responds with 404 when the business doesn't exist", () => {
        return supertest(app)
          .get("/api/businesses/some-business-564658")
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(404, { error: { message: "Business Not Found" } });
      });
    });

    context("Given there are businesses in the database", () => {
      beforeEach("insert categories, addresses, hours, and businesses", () => {
        return testInsertions();
      });

      it("Responds with 400 when no required fields are supplied", () => {
        const businessToUpdate = testBusinesses[1].visual_id;

        return supertest(app)
          .patch(`/api/businesses/${businessToUpdate}`)
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .send({ irrelevantField: "foo" })
          .expect(400, {
            error: {
              message:
                "Request body must contain either 'business_name', 'contact_name', 'category_id', 'address_id', 'google_place' or 'telephone'"
            }
          });
      });

      it("Responds with 400 invalid 'url' if not a valid url", () => {
        const businessToUpdate = testBusinesses[1].visual_id;

        const wrongGooglePlace = {
          google_place: "htp:/somebadplace.ce"
        };

        return supertest(app)
          .patch(`/api/businesses/${businessToUpdate}`)
          .send(wrongGooglePlace)
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(400, {
            error: { message: "'google_place' must be a valid URL" }
          });
      });

      it("Responds with 400 invalid 'telephone' if the telephone format isn't correct", () => {
        const businessToUpdate = testBusinesses[1].visual_id;

        const wrongTelephone = {
          telephone: "123-456-7890"
        };

        return supertest(app)
          .patch(`/api/businesses/${businessToUpdate}`)
          .send(wrongTelephone)
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(400, {
            error: {
              message: "'telephone' must be in this format: '1234567890'"
            }
          });
      });

      it("Responds with 204 and updates the business", () => {
        const businessToUpdate = testBusinesses[1].visual_id;

        const updatedBusiness = {
          business_name: "Updated Business 1",
          category_id: 2,
          address_id: 3,
          google_place: "https://maps.google.com/?cid=89996",
          telephone: "0987654321",
          contact_name: "John Doe"
        };

        const businessBeforeUpdate = testBusinesses
          .filter(business => business.visual_id === businessToUpdate)
          .map(testBusinessesSerilize);

        const expectedBusiness = {
          ...businessBeforeUpdate[0],
          ...updatedBusiness,
          ...testAddresses.filter(
            address => address.id === updatedBusiness.address_id
          )[0],
          a_id: updatedBusiness.address_id,
          c_id: updatedBusiness.category_id,
          id: businessBeforeUpdate[0].id
        };

        return supertest(app)
          .patch(`/api/businesses/${businessToUpdate}`)
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .send(updatedBusiness)
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/businesses/${businessToUpdate}`)
              .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
              .expect(expectedBusiness)
          );
      });

      it("Responds with 204 when updating only a subset of fields", () => {
        const businessToUpdate = testBusinesses[1].visual_id;

        const updatedBusiness = {
          google_place: "https://maps.google.com/?cid=89996"
        };

        const businessBeforeUpdate = testBusinesses
          .filter(business => business.visual_id === businessToUpdate)
          .map(testBusinessesSerilize);

        const expectedBusiness = {
          ...businessBeforeUpdate[0],
          ...updatedBusiness
        };

        return supertest(app)
          .patch(`/api/businesses/${businessToUpdate}`)
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .send({
            ...updatedBusiness,
            visual_id: "Shound not be in GET",
            fieldToIgnore: "Shound not be in GET"
          })
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/businesses/${businessToUpdate}`)
              .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
              .expect(expectedBusiness)
          );
      });
    });
  });

  describe("DELETE api/businesses/:id", () => {
    context("Given no business", () => {
      it("Responds with 404 when the business doesn't exist", () => {
        return supertest(app)
          .delete("/api/businesses/some-business-564658")
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(404, { error: { message: "Business Not Found" } });
      });
    });

    context("Given there are businesses in the database", () => {
      beforeEach("insert categories, addresses, hours, and businesses", () => {
        return testInsertions();
      });

      it("Removes the business by visual_id from the database", () => {
        const business_visual_id = testBusinesses[1].visual_id;

        const expectedBusinessesResult = testBusinesses
          .filter(
            business =>
              business.visual_id !== business_visual_id && business.id !== 3
          )
          .map(testBusinessesSerilize);

        return supertest(app)
          .delete(`/api/businesses/${business_visual_id}`)
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(204)
          .then(() =>
            supertest(app)
              .get(`/api/businesses/${business_visual_id}`)
              .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
              .expect(404, { error: { message: "Business Not Found" } })
          )
          .then(() =>
            supertest(app)
              .get(
                "/api/businesses/?long=-122.674396&lat=45.545708&rad=10&input=Portland, OR"
              )
              .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
              .expect(200, [
                expectedBusinessesResult,
                distinctArrayCount(expectedBusinessesResult)
              ])
          );
      });
    });
  });
});
