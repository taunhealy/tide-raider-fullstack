export default {
  name: 'postTag',
  title: 'Post Tag',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Tag Title',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'category',
      title: 'Parent Category',
      type: 'reference',
      to: [{type: 'postCategory'}],
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
    },
  ],
}
