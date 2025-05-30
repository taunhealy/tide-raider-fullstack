export default {
  name: 'landingPage',
  title: 'Landing Page',
  type: 'document',
  fields: [
    {
      name: 'heroHeading',
      title: 'Hero Heading',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'heroSubheading',
      title: 'Hero Subheading',
      type: 'string',
    },
    {
      name: 'heroImage',
      title: 'Hero Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'heroAlertImage',
      title: 'Hero Alert Product Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      description: 'Product image for Alerts to display in the hero section',
    },
    {
      name: 'heroLogBookImage',
      title: 'Hero Log Book Product Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      description: 'Product image for Log Book to display in the hero section',
    },
    {
      name: 'featuredPosts',
      title: 'Featured Blog Posts',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'post'}],
        },
      ],
    },
    {
      name: 'seo',
      title: 'SEO Settings',
      type: 'object',
      fields: [
        {
          name: 'metaTitle',
          title: 'Meta Title',
          type: 'string',
        },
        {
          name: 'metaDescription',
          title: 'Meta Description',
          type: 'text',
        },
        {
          name: 'shareImage',
          title: 'Share Image',
          type: 'image',
        },
      ],
    },
    {
      name: 'heroFooterImage',
      title: 'Hero Footer Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      validation: (Rule: any) => Rule.required(),
    },
  ],
}
