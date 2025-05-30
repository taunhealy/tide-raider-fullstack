import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'postTemplate',
  title: 'Post Template',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Template Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
      options: {
        list: [
          // Hardcoded template types
          {title: 'Travel Guide', value: 'travelGuide'},
          {title: 'Surf Spot Review', value: 'surfSpotReview'},
          {title: 'News Article', value: 'newsArticle'},
        ],
      },
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{type: 'postCategory'}],
      validation: (Rule) => Rule.required(),
    }),
  ],
})
