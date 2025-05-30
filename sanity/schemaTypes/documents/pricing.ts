import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'pricing',
  title: 'Pricing Page',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Page Title',
      type: 'string',
      initialValue: 'Simple, transparent pricing'
    }),
    defineField({
      name: 'subtitle',
      title: 'Page Subtitle',
      type: 'string',
      initialValue: 'Get unlimited access to all surf spots and advanced features'
    }),
    defineField({
      name: 'pricingImage',
      title: 'Pricing Hero Image',
      type: 'image',
      options: { hotspot: true },
      description: 'Image displayed next to the pricing card'
    }),
    defineField({
      name: 'price',
      title: 'Price Amount',
      type: 'number',
      initialValue: 150
    }),
    defineField({
      name: 'priceSubtext',
      title: 'Price Subtext',
      type: 'string',
      initialValue: 'one-time payment'
    }),
    defineField({
      name: 'features',
      title: 'Features List',
      type: 'array',
      of: [{type: 'string'}],
      initialValue: [
        'Access to all surf spots',
        'Access to all surf spot details'
      ]
    })
  ]
}) 