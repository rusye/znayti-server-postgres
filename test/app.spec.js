const app = require("../src/app");

describe("App", () => {
  it("Responds with 401 Unauthorized for GET /", () => {
    return supertest(app)
      .get("/")
      .set("Authorization", `Bearer someFakeString`)
      .expect(401, { error: "Unauthorized request" });
  });

  it('Responds with 200 containing "Hello, world!" for GET /', () => {
    return supertest(app)
      .get("/")
      .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
      .expect(200, "Hello, boilerplate!");
  });
});
