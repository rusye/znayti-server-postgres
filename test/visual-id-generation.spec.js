const { visualIdGeneration } = require("../src/visual-id-generation");

describe("Visual ID Generator", () => {
  ["business_name", "latitude", "longitude"].forEach((field) => {
    const newVisualIdInputs = {
      business_name: "Visual Id Test",
      latitude: 45.51875,
      longitude: -122.67824,
    };

    it(`It should throw an error '${field}' is required`, () => {
      delete newVisualIdInputs[field];

      expect(visualIdGeneration(newVisualIdInputs)).to.eql({
        error: { message: `'${field}' is required` },
      });
    });
  });

  it("Should respond with the correct visual id generated", () => {
    const newVisualIdInputs = {
      business_name: "Visual Id Test 2",
      latitude: 45.51899,
      longitude: -122.67864,
    };

    expect(visualIdGeneration(newVisualIdInputs)).to.equal(
      "visual-id-test-2-157075"
    );
  });
});
