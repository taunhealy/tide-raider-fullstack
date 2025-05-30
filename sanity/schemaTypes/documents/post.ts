import {defineType, defineField} from 'sanity'
import {RegionReferenceInput} from '../../components/RegionReferenceInput'
import {BeachSearchInput} from '../../components/BeachSearchInput'

export default defineType({
  name: 'post',
  title: 'Blog Post',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
      },
      validation: (Rule) => Rule.required(),
    }),
    // Main Image
    defineField({
      name: 'mainImage',
      title: 'Main Image',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    // Content (Rich Text)
    defineField({
      name: 'content',
      title: 'Content',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'section',
          title: 'Content Section',
          fields: [
            {
              name: 'sectionHeading',
              title: 'Section Heading',
              type: 'string',
              description: 'Optional heading for this section',
            },
            {
              name: 'content',
              title: 'Section Content',
              type: 'array',
              of: [
                {
                  type: 'block',
                  styles: [
                    {title: 'Normal', value: 'normal'},
                    {title: 'H1', value: 'h1'},
                    {title: 'H2', value: 'h2'},
                    {title: 'H3', value: 'h3'},
                    {title: 'Quote', value: 'blockquote'},
                  ],
                  marks: {
                    decorators: [
                      {title: 'Strong', value: 'strong'},
                      {title: 'Emphasis', value: 'em'},
                      {
                        title: '🎨 Primary Brand Color',
                        value: 'brandColor1',
                      },
                      {
                        title: '🎨 Secondary Brand Color',
                        value: 'brandColor2',
                      },
                      {
                        title: '🎨 Tertiary Brand Color',
                        value: 'brandColor3',
                      },
                      {
                        title: 'Inline H3',
                        value: 'inlineH3',
                        icon: () => 'H3',
                      },
                    ],
                    annotations: [
                      {
                        title: 'URL',
                        name: 'link',
                        type: 'object',
                        fields: [
                          {
                            title: 'URL',
                            name: 'href',
                            type: 'url',
                          },
                        ],
                      },
                    ],
                  },
                },
                {
                  type: 'object',
                  name: 'beachMediaGrid',
                  title: 'Beach Media Grid',
                  fields: [
                    {
                      name: 'beachReference',
                      title: 'Beach',
                      type: 'object',
                      fields: [
                        {
                          name: 'beachId',
                          title: 'Beach ID',
                          type: 'string',
                          description: 'The unique identifier for the beach',
                          validation: (Rule) => Rule.required(),
                        },
                        {
                          name: 'beachName',
                          title: 'Beach Name',
                          type: 'string',
                          description: 'The name of the beach',
                          validation: (Rule) => Rule.required(),
                        },
                        {
                          name: 'region',
                          title: 'Region',
                          type: 'string',
                          description: 'The region where the beach is located',
                        },
                        {
                          name: 'country',
                          title: 'Country',
                          type: 'string',
                          description: 'The country where the beach is located',
                        },
                      ],
                      components: {
                        input: BeachSearchInput,
                      },
                    },
                    {
                      name: 'title',
                      title: 'Grid Title',
                      type: 'string',
                      description: 'Optional title for this media grid',
                    },
                    {
                      name: 'description',
                      title: 'Grid Description',
                      type: 'text',
                      description: 'Optional description to display above the media grid',
                      rows: 2,
                    },
                  ],
                  preview: {
                    select: {
                      beachName: 'beachReference.beachName',
                      region: 'beachReference.region',
                      title: 'title',
                    },
                    prepare({beachName, region, title}) {
                      return {
                        title:
                          title || (beachName ? `Media Grid: ${beachName}` : 'Beach Media Grid'),
                        subtitle: region ? `${region}` : 'Select a beach',
                        media: () => '🏄‍♂️',
                      }
                    },
                  },
                },
              ],
            },
            {
              name: 'videoLink',
              title: 'Video Link',
              type: 'url',
              description: 'Optional link to a video',
            },
            {
              name: 'sectionImages',
              title: 'Section Images',
              type: 'array',
              of: [
                {
                  type: 'object',
                  name: 'sectionImage',
                  fields: [
                    {
                      name: 'uploadedImage',
                      title: 'Uploaded Image',
                      type: 'image',
                      options: {
                        hotspot: true,
                      },
                      fields: [
                        {
                          name: 'alt',
                          type: 'string',
                          title: 'Alternative text',
                        },
                        {
                          name: 'caption',
                          type: 'string',
                          title: 'Caption',
                        },
                      ],
                    },
                    {
                      name: 'layout',
                      title: 'Image Layout',
                      type: 'string',
                      options: {
                        list: [
                          {title: 'Full Width', value: 'full'},
                          {title: 'Half Width', value: 'half'},
                          {title: 'Quarter Width', value: 'quarter'},
                        ],
                      },
                    },
                  ],
                },
              ],
              validation: (Rule) => Rule.max(4),
            },
            {
              name: 'sectionVideos',
              title: 'Section Videos',
              type: 'array',
              of: [
                {
                  type: 'object',
                  name: 'sectionVideo',
                  fields: [
                    {
                      name: 'video',
                      title: 'Video',
                      type: 'video',
                    },
                    {
                      name: 'layout',
                      title: 'Video Layout',
                      type: 'string',
                      options: {
                        list: [
                          {title: 'Full Width', value: 'full'},
                          {title: 'Half Width', value: 'half'},
                        ],
                      },
                    },
                  ],
                },
              ],
              validation: (Rule) => Rule.max(2),
            },
          ],
        },
      ],
    }),
    // Template reference
    defineField({
      name: 'template',
      title: 'Post Template',
      type: 'reference',
      to: [{type: 'postTemplate'}],
    }),
    // Categories (high-level classification)
    defineField({
      name: 'categories',
      title: 'Categories',
      type: 'array',
      of: [{type: 'reference', to: {type: 'postCategory'}}],
      validation: (Rule) => Rule.required(),
    }),
    // Tags (specific topics)
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{type: 'reference', to: {type: 'postTag'}}],
    }),

    // Publication date
    defineField({
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
    }),
    // Description/Excerpt
    defineField({
      name: 'description',
      title: 'Description',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [{title: 'Normal', value: 'normal'}],
          lists: [],
          marks: {
            decorators: [
              {title: 'Strong', value: 'strong'},
              {title: 'Emphasis', value: 'em'},
            ],
          },
        },
      ],
    }),
    // Sidebar widgets
    defineField({
      name: 'sidebarWidgets',
      title: 'Sidebar Widgets',
      type: 'array',
      of: [
        {type: 'weatherWidget'},
        {type: 'surfSpotsWidget'},
        {type: 'relatedPostsWidget'},
        {type: 'locationMapWidget'},
        {type: 'categoryListWidget'},
        {type: 'tagCloudWidget'},
        {type: 'flightSearchWidget'},
        {type: 'unsplashGridWidget'},
      ],
      validation: (Rule) => Rule.unique().warning('Each widget type should be unique'),
    }),
    defineField({
      name: 'trip',
      title: 'Trip',
      type: 'reference',
      to: [{type: 'trip'}],
    }),
    // Region reference
    defineField({
      name: 'countries',
      title: 'Related Countries',
      description: 'Associate this post with specific countries',
      type: 'array',
      of: [{type: 'string'}],
      components: {
        input: RegionReferenceInput as any,
      },
    }),
  ],
  preview: {
    select: {
      title: 'title',
      media: 'mainImage',
    },
  },
})
