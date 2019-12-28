function makeZnaytiArrays() {
  const testCategories = [
    {
      id: 1,
      category_name: "Auto"
    },
    {
      id: 2,
      category_name: "Bakery"
    }
  ];

  const testAddresses = [
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

  const testBusinesses = [
    {
      id: 1,
      visual_id: "new-business-1-123456",
      business_name: "New Business 1",
      category_id: 1,
      address_id: 2,
      google_place: "Some Google Place 123",
      telephone: "1234567890",
      contact_name: "Bob"
    },
    {
      id: 2,
      visual_id: "new-business-2-789012",
      business_name: "New Business 2",
      category_id: 2,
      address_id: 1,
      google_place: "Some Google Place 456",
      telephone: "1234567890",
      contact_name: "Joe"
    },
    {
      id: 3,
      visual_id: "new-business-1-345678",
      business_name: "New Business 3",
      category_id: 2,
      address_id: 3,
      google_place: "Some Google Place 789",
      telephone: "1234567890",
      contact_name: "Joe"
    }
  ];

  const testHours = [
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

  const findObject = (testArray, id) => {
    return testArray.filter(obj => obj.id === id);
  };

  const testBusinessesSerilize = business => ({
    ...findObject(testAddresses, business.address_id)[0],
    ...findObject(testCategories, business.category_id)[0],
    ...business,
    review_count: 0,
    average_rating: null,
    deleted_on: null,
    hours: findObject(testHours, business.id),
    a_id: business.address_id,
    c_id: business.category_id
  });

  return {
    testCategories,
    testAddresses,
    testBusinesses,
    testHours,
    testBusinessesSerilize
  };
}

function makeMaliciousBusiness() {
  const maliciousCategory = {
    id: 1,
    category_name: `Bad Category <script>alert("xss");</script>`
  };
  const maliciousAddress = {
    id: 1,
    street: '123 Main St. <script>alert("xss");</script>',
    suite: "101",
    city: 'Portland <script>alert("xss");</script>',
    state: "OR",
    zipcode: "97236",
    longitude: -122.6786824,
    latitude: 45.5187539
  };
  const maliciousBusiness = {
    id: 1,
    visual_id: "new-business-1-123456",
    business_name: 'New Business 1 <script>alert("xss");</script>',
    category_id: 1,
    address_id: 1,
    google_place: "Some Google Place 123",
    telephone: "1234567890",
    contact_name: 'Bob <script>alert("xss");</script>'
  };
  const expectedBusiness = {
    category_name: 'Bad Category &lt;script&gt;alert("xss");&lt;/script&gt;',
    c_id: maliciousBusiness.category_id,
    ...maliciousAddress,
    street: '123 Main St. &lt;script&gt;alert("xss");&lt;/script&gt;',
    city: 'Portland &lt;script&gt;alert("xss");&lt;/script&gt;',
    a_id: maliciousBusiness.address_id,
    ...maliciousBusiness,
    business_name: 'New Business 1 &lt;script&gt;alert("xss");&lt;/script&gt;',
    contact_name: 'Bob &lt;script&gt;alert("xss");&lt;/script&gt;',
    review_count: 0,
    average_rating: null,
    deleted_on: null,
    hours: [null]
  };

  return {
    maliciousCategory,
    maliciousAddress,
    maliciousBusiness,
    expectedBusiness
  };
}

module.exports = { makeZnaytiArrays, makeMaliciousBusiness };
