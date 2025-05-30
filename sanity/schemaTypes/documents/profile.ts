export default {
  name: 'profile',
  type: 'document',
  title: 'Profile Page',
  fields: [
    {
      name: 'heroImage',
      type: 'object',
      title: 'Hero Image',
      fields: [
        {
          name: 'image',
          type: 'image',
          title: 'Image',
          options: {hotspot: true},
        },
        {
          name: 'alt',
          type: 'string',
          title: 'Alternative Text',
        },
      ],
    },
  ],
}
