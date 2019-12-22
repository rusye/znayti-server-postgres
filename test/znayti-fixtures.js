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
        suite: "101",
        city: "Portland",
        state: "OR",
        zipcode: "97236",
        longitude: -122.6786824,
        latitude: 45.5187539
      },
      {
        id: 2,
        street: "456 Main St.",
        suite: "202",
        city: "Gresham",
        state: "OR",
        zipcode: "97030",
        longitude: -122.63518,
        latitude: 45.528383
      },
      {
        id: 3,
        street: "789 Main St.",
        suite: "303",
        city: "The Dalles",
        state: "OR",
        zipcode: "97030",
        longitude: -121.172857,
        latitude: 45.597165
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
      },
      {
        id: 3,
        visual_id: "Some stuff 789",
        business_name: "New Business 3",
        category_id: 2,
        address_id: 1,
        google_place: "Some Google Place 789",
        telephone: "1234567890",
        contact_name: "Joe"
      }
    ];
  },
  testHours() {
    return [
      {
        id: 2,
        day_of_week: "Monday",
        opens: "08:00:00",
        closes: "17:00:00"
      },
      {
        id: 2,
        day_of_week: "Tuesday",
        opens: "08:00:00",
        closes: "17:00:00"
      },
      {
        id: 1,
        day_of_week: "Wednesday",
        opens: "08:00:00",
        closes: "17:00:00"
      },
      {
        id: 1,
        day_of_week: "Thursday",
        opens: "08:00:00",
        closes: "17:00:00"
      },
      {
        id: 3,
        day_of_week: "Friday",
        opens: "08:00:00",
        closes: "17:00:00"
      },
      {
        id: 3,
        day_of_week: "Saturday",
        opens: "08:00:00",
        closes: "17:00:00"
      }
    ];
  }
};

module.exports = makeZnaytiArrays;
