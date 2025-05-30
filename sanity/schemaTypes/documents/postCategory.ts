export default {
    name: 'postCategory',
    title: 'Post Category',
    type: 'document',
    fields: [
      {
        name: 'title',
        title: 'Category Title',
        type: 'string',
        validation: (Rule: any) => Rule.required()
      },
      {
        name: 'slug',
        title: 'Slug',
        type: 'slug',
        options: {
          source: 'title',
          maxLength: 96
        },
        validation: (Rule: any) => Rule.required()
      },
      {
        name: 'description',
        title: 'Description',
        type: 'text'
      },
      {
        name: 'order',
        title: 'Display Order',
        type: 'number',
        validation: (Rule: any) => Rule.required()
      }
    ]
  } 