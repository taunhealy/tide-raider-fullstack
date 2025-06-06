import {defineType, defineField} from 'sanity'

// Reusable region field definition
const regionField = defineField({
  name: 'region',
  title: 'Region',
  type: 'string',
  options: {
    list: [
      {title: 'Eastern Cape', value: 'Eastern Cape'},
      {title: 'Western Cape', value: 'Western Cape'},
      {title: 'Northern Cape', value: 'Northern Cape'},
      {title: 'KwaZulu-Natal', value: 'KwaZulu-Natal'},
      {title: 'Bali', value: 'Bali'},
      {title: 'New South Wales', value: 'New South Wales'},
      {title: 'Queensland', value: 'Queensland'},
      {title: 'Victoria', value: 'Victoria'},
      {title: 'South Australia', value: 'South Australia'},
      {title: 'Western Australia', value: 'Western Australia'},
      {title: 'Tasmania', value: 'Tasmania'},
      {title: 'Luanda', value: 'Luanda'},
      {title: 'Namibe', value: 'Namibe'},
      {title: 'Benguela', value: 'Benguela'},
      {title: 'Jakarta', value: 'Jakarta'},
      {title: 'Lombok', value: 'Lombok'},
      {title: 'Mentawais', value: 'Mentawais'},
      {title: 'Java', value: 'Java'},
      {title: 'Sumatra', value: 'Sumatra'},
      {title: 'Madagascar', value: 'Madagascar'},
      {title: 'Mozambique', value: 'Mozambique'},
      {title: 'Liberia', value: 'Liberia'},
      {title: 'Senegal', value: 'Senegal'},
      {title: 'Morocco', value: 'Morocco'},
      {title: 'Oahu', value: 'Oahu'},
      {title: 'California', value: 'California'},
      {title: 'Florida', value: 'Florida'},
      {title: 'Maine', value: 'Maine'},
    ],
  },
  validation: (Rule) => Rule.required(),
})

// Related Posts Widget
export const relatedPostsWidget = defineType({
  name: 'relatedPostsWidget',
  title: 'Related Posts Widget',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Widget Title',
      type: 'string',
      initialValue: 'Related Posts',
    }),
    defineField({
      name: 'numberOfPosts',
      title: 'Number of Posts to Show',
      type: 'number',
      initialValue: 3,
      validation: (Rule) => Rule.min(1).max(10),
    }),
    defineField({
      name: 'criteria',
      title: 'Match Criteria',
      type: 'array',
      of: [
        {
          type: 'string',
          options: {
            list: [
              {title: 'Same Category', value: 'category'},
              {title: 'Same Tags', value: 'tags'},
              {title: 'Same Location', value: 'location'},
            ],
          },
        },
      ],
      validation: (Rule) => Rule.required().min(1),
    }),
  ],
})

// Location Map Widget
export const locationMapWidget = defineType({
  name: 'locationMapWidget',
  title: 'Location Map Widget',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Widget Title',
      type: 'string',
      initialValue: 'Location',
    }),
    regionField,
    defineField({
      name: 'mapStyle',
      title: 'Map Style',
      type: 'string',
      options: {
        list: [
          {title: 'Standard', value: 'standard'},
          {title: 'Satellite', value: 'satellite'},
          {title: 'Terrain', value: 'terrain'},
        ],
      },
      initialValue: 'standard',
    }),
    defineField({
      name: 'showNearbyBeaches',
      title: 'Show Nearby Beaches',
      type: 'boolean',
      initialValue: true,
    }),
  ],
})

// Category List Widget
export const categoryListWidget = defineType({
  name: 'categoryListWidget',
  title: 'Category List Widget',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Widget Title',
      type: 'string',
      initialValue: 'Categories',
    }),
    defineField({
      name: 'displayStyle',
      title: 'Display Style',
      type: 'string',
      options: {
        list: [
          {title: 'List', value: 'list'},
          {title: 'Grid', value: 'grid'},
          {title: 'Dropdown', value: 'dropdown'},
        ],
      },
      initialValue: 'list',
    }),
    defineField({
      name: 'showPostCount',
      title: 'Show Post Count',
      type: 'boolean',
      initialValue: true,
    }),
  ],
})

// Tag Cloud Widget
export const tagCloudWidget = defineType({
  name: 'tagCloudWidget',
  title: 'Tag Cloud Widget',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Widget Title',
      type: 'string',
      initialValue: 'Tags',
    }),
    defineField({
      name: 'maxTags',
      title: 'Maximum Number of Tags',
      type: 'number',
      initialValue: 20,
      validation: (Rule) => Rule.min(1).max(50),
    }),
    defineField({
      name: 'orderBy',
      title: 'Order By',
      type: 'string',
      options: {
        list: [
          {title: 'Popularity', value: 'popularity'},
          {title: 'Alphabetical', value: 'alphabetical'},
          {title: 'Recent', value: 'recent'},
        ],
      },
      initialValue: 'popularity',
    }),
    defineField({
      name: 'showTagCount',
      title: 'Show Tag Count',
      type: 'boolean',
      initialValue: true,
    }),
  ],
})

// Weather Widget
export const weatherWidget = defineType({
  name: 'weatherWidget',
  title: 'Weather Widget',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Widget Title',
      type: 'string',
      initialValue: 'Local Weather',
    }),
    regionField,
    defineField({
      name: 'order',
      type: 'number',
      title: 'Order',
      initialValue: 1,
    }),
  ],
})

// Travel Widget (Kiwi Flights)
export const travelWidget = defineType({
  name: 'travelWidget',
  title: 'Travel Widget',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Widget Title',
      type: 'string',
      initialValue: 'Find Flights',
    }),
    defineField({
      name: 'destinationCode',
      title: 'Destination Airport Code',
      type: 'string',
      description: 'Enter the IATA code for the destination airport (e.g., TNR for Antananarivo)',
      validation: (Rule) => Rule.required().length(3).uppercase(),
    }),
    defineField({
      name: 'order',
      type: 'number',
      title: 'Order',
      initialValue: 1,
    }),
  ],
})

// Surf Spots Widget
export const surfSpotsWidget = defineType({
  name: 'surfSpotsWidget',
  title: 'Surf Spots Widget',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Widget Title',
      type: 'string',
      initialValue: 'Local Surf Spots',
    }),
    regionField,
    defineField({
      name: 'order',
      type: 'number',
      title: 'Order',
      initialValue: 1,
    }),
  ],
})

export const flightSearchWidget = defineType({
  name: 'flightSearchWidget',
  title: 'Flight Search Widget',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Widget Title',
      type: 'string',
      initialValue: 'Find Flights',
    }),
    defineField({
      name: 'destinationCode',
      title: 'Destination Airport Code',
      type: 'string',
      description: 'Enter the IATA code for the destination airport (e.g., CPT for Cape Town)',
      validation: (Rule) => Rule.required().length(3).uppercase(),
    }),
  ],
})

export const unsplashGridWidget = defineType({
  name: 'unsplashGridWidget',
  title: 'Photo Gallery Widget',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Widget Title',
      type: 'string',
      initialValue: 'Photo Gallery',
    }),
    defineField({
      name: 'images',
      title: 'Gallery Images',
      type: 'array',
      of: [
        {
          type: 'image',
          options: {
            source: 'unsplash',
          },
        },
      ],
      validation: (Rule) => Rule.max(8),
    }),
    defineField({
      name: 'order',
      type: 'number',
      title: 'Order',
      initialValue: 1,
    }),
  ],
})
