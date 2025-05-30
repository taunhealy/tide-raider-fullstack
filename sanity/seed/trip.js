import {client} from '../lib/sanity'

const tripData = {
  _type: 'trip',
  title: '14-Day Surf Adventure at Madagascar Surf Resort',
  destination: 'Madagascar Surf Resort, Befasy',
  travelInsurance: {
    documentRequired: true,
    documentType: true,
  },
  days: [
    {
      _key: 'day1',
      dayNumber: 1,
      activities: [
        {
          title: 'Arrival at Antananarivo',
          duration: 'Full Day',
          price: 0,
          transport: 'Flight to Tulear',
          bookingURL: 'https://www.madagascarsurfresort.com',
        },
      ],
      stay: {
        title: 'Madagascar Surf Resort',
        price: 75,
        bookingURL: 'https://www.madagascarsurfresort.com',
        includes: ['All meals', 'Accommodation', 'Private boat access'],
        notes: 'Check-in at the resort and relax.',
      },
      rental: [
        {
          title: '4x4 Rental',
          price: 1050, // 75 Euro per day for 14 days
          bookingURL: 'https://www.madagascarsurfresort.com',
          includes: ['Full insurance', 'Unlimited mileage'],
          notes: 'Pick up at Tulear Airport.',
        },
      ],
    },
    // Repeat for days 2 to 14 with appropriate activities and stays
    {
      _key: 'day2',
      dayNumber: 2,
      activities: [
        {
          title: 'Surfing at Outer Reef',
          duration: 'Full Day',
          price: 0,
          transport: 'Private boat transfer',
          bookingURL: 'https://www.madagascarsurfresort.com',
        },
      ],
      stay: {
        title: 'Madagascar Surf Resort',
        price: 75,
        bookingURL: 'https://www.madagascarsurfresort.com',
        includes: ['All meals', 'Accommodation', 'Private boat access'],
        notes: 'Enjoy uncrowded waves.',
      },
      rental: [
        {
          title: '4x4 Rental',
          price: 1050,
          bookingURL: 'https://www.madagascarsurfresort.com',
          includes: ['Full insurance', 'Unlimited mileage'],
          notes: 'Pick up at Tulear Airport.',
        },
      ],
    },
    // Add similar entries for days 3 to 14
    {
      _key: 'day14',
      dayNumber: 14,
      activities: [
        {
          title: 'Departure from Tulear',
          duration: 'Full Day',
          price: 0,
          transport: 'Flight to Antananarivo',
          bookingURL: 'https://www.madagascarsurfresort.com',
        },
      ],
      stay: {
        title: 'Madagascar Surf Resort',
        price: 75,
        bookingURL: 'https://www.madagascarsurfresort.com',
        includes: ['All meals', 'Accommodation', 'Private boat access'],
        notes: 'Check-out and transfer to the airport.',
      },
      rental: [
        {
          title: '4x4 Rental',
          price: 1050,
          bookingURL: 'https://www.madagascarsurfresort.com',
          includes: ['Full insurance', 'Unlimited mileage'],
          notes: 'Return the vehicle at the airport.',
        },
      ],
    },
  ],
}

client
  .create(tripData)
  .then((res) => {
    console.log(`Trip created, document ID: ${res._id}`)
  })
  .catch((err) => {
    console.error('Create trip failed: ', err.message)
  })
