export const video = {
  name: 'video',
  title: 'Video',
  type: 'object',
  fields: [
    {
      name: 'videoType',
      title: 'Video Platform',
      type: 'string',
      options: {
        list: [
          {title: 'YouTube', value: 'youtube'},
          {title: 'Vimeo', value: 'vimeo'},
        ],
      },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'videoUrl',
      title: 'Video URL',
      type: 'url',
      description: 'Enter the full video URL (e.g., https://www.youtube.com/watch?v=...)',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'title',
      title: 'Video Title',
      type: 'string',
    },
    {
      name: 'description',
      title: 'Video Description',
      type: 'text',
      rows: 3,
    },
  ],
}
