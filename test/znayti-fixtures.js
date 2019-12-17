const makeZnaytiArrays = {
  testCategories() {
    return [
      {
        id: 1,
        category_name: "Auto"
      },
      {
        id: 2,
        category_name: "Bakery"
      }
    ];
  },
  testAddresses() {
    return [
      {
        id: 1,
        street: "123 Main St.",
        suite: 101,
        city: "Portland",
        state: "OR",
        zipcode: 97236,
        longitude: 45.0,
        latitude: 122.0
      },
      {
        id: 2,
        street: "456 Main St.",
        suite: 202,
        city: "Gresham",
        state: "OR",
        zipcode: 97030,
        longitude: 46.0,
        latitude: 123.0
      }
    ];
  },
  testBusinesses() {
    return [
      {
        id: 1,
        visual_id: "Some stuff 123",
        business_name: "New Business 1",
        category_id: 1,
        address_id: 2,
        google_place: "Some Google Place 123",
        telephone: "1234567890",
        contact_name: "Bob"
      },
      {
        id: 2,
        visual_id: "Some stuff 456",
        business_name: "New Business 2",
        category_id: 2,
        address_id: 1,
        google_place: "Some Google Place 456",
        telephone: "1234567890",
        contact_name: "Joe"
      }
    ];
  }
};

module.exports = makeZnaytiArrays;
