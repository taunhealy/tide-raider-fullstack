import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'trip',
  title: 'Trip',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'country',
      title: 'Country',
      type: 'string',
      validation: (Rule) => Rule.required().error('Country is required'),
    }),
    defineField({
      name: 'region',
      title: 'Region',
      type: 'string',
      description: 'State/Province/Administrative region',
    }),
    defineField({
      name: 'destination',
      title: 'Display Destination',
      type: 'string',
      description: 'Auto-generated from country + region',
      readOnly: true,
      initialValue: ({country, region}) => [region, country].filter(Boolean).join(', '),
    }),
    defineField({
      name: 'idealMonth',
      title: 'Ideal Month To Travel',
      type: 'string',
      options: {
        list: [
          {title: 'January', value: 'January'},
          {title: 'February', value: 'February'},
          {title: 'March', value: 'March'},
          {title: 'April', value: 'April'},
          {title: 'May', value: 'May'},
          {title: 'June', value: 'June'},
          {title: 'July', value: 'July'},
          {title: 'August', value: 'August'},
          {title: 'September', value: 'September'},
          {title: 'October', value: 'October'},
          {title: 'November', value: 'November'},
          {title: 'December', value: 'December'},
        ],
        layout: 'dropdown',
      },
    }),
    defineField({
      name: 'travelInsurance',
      title: 'Travel Insurance',
      type: 'object',
      fields: [
        {
          name: 'documentRequired',
          title: 'Insurance Document Required',
          type: 'boolean',
        },
        {
          name: 'documentType',
          title: 'MedVac Required',
          type: 'boolean',
        },
      ],
    }),
    defineField({
      name: 'days',
      title: 'Days',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'day',
          fields: [
            {
              name: 'dayNumber',
              title: 'Day Number',
              type: 'number',
              validation: (Rule) => Rule.required().min(1),
            },
            {
              name: 'activities',
              title: 'Activities',
              type: 'array',
              of: [
                {
                  type: 'object',
                  name: 'activity',
                  fields: [
                    {
                      name: 'title',
                      title: 'Title',
                      type: 'string',
                      validation: (Rule) => Rule.required(),
                    },
                    {
                      name: 'duration',
                      title: 'Duration',
                      type: 'string',
                      validation: (Rule) => Rule.required(),
                    },
                    {
                      name: 'price',
                      title: 'Price (ZAR)',
                      type: 'number',
                      validation: (Rule) => Rule.min(0),
                    },
                    {
                      name: 'transport',
                      title: 'Transport',
                      type: 'string',
                    },
                    {
                      name: 'bookingURL',
                      title: 'Booking URL',
                      type: 'url',
                    },
                  ],
                },
              ],
            },
            {
              name: 'stay',
              title: 'Stay',
              type: 'object',
              fields: [
                {
                  name: 'title',
                  title: 'Title',
                  type: 'string',
                  validation: (Rule) => Rule.required(),
                },
                {
                  name: 'price',
                  title: 'Price',
                  type: 'number',
                  validation: (Rule) => Rule.min(0),
                },
                {
                  name: 'bookingURL',
                  title: 'Booking URL',
                  type: 'url',
                },
                {
                  name: 'includes',
                  title: 'Includes',
                  type: 'array',
                  of: [{type: 'string'}],
                },
                {
                  name: 'notes',
                  title: 'Notes',
                  type: 'text',
                  description: 'Special payment requirements or other important information',
                },
              ],
            },
            {
              name: 'rental',
              title: 'Rentals',
              type: 'array',
              of: [
                {
                  type: 'object',
                  name: 'rentalItem',
                  fields: [
                    {
                      name: 'title',
                      title: 'Title',
                      type: 'string',
                      validation: (Rule) => Rule.required(),
                    },
                    {
                      name: 'price',
                      title: 'Price',
                      type: 'number',
                      validation: (Rule) => Rule.min(0),
                    },
                    {
                      name: 'bookingURL',
                      title: 'Booking URL',
                      type: 'url',
                    },
                    {
                      name: 'includes',
                      title: 'Includes',
                      type: 'array',
                      of: [{type: 'string'}],
                    },
                    {
                      name: 'notes',
                      title: 'Notes',
                      type: 'text',
                      description: 'Special payment requirements or other important information',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'destination',
    },
  },
})
