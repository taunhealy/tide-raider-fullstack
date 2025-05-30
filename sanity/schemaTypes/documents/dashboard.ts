export default {
    name: 'dashboard',
    type: 'document',
    title: 'Dashboard Page',
    fields: [
      {
        name: 'title',
        type: 'string',
        title: 'Title'
      },
      {
        name: 'heroImage',
        type: 'object',
        title: 'Hero Image',
        fields: [
          {
            name: 'image',
            type: 'image',
            title: 'Image',
            options: { hotspot: true }
          },
          {
            name: 'alt',
            type: 'string',
            title: 'Alternative Text'
          }
        ]
      }
    ]
  }