import {defineType, defineField} from 'sanity'
import {PlayIcon} from '@sanity/icons'

export const youTube = defineType({
  name: 'youtube',
  type: 'object',
  title: 'YouTube Embed',
  icon: PlayIcon,
  fields: [
    defineField({
      name: 'url',
      type: 'url',
      title: 'YouTube video URL',
    }),
    defineField({
      name: 'title',
      type: 'string',
      title: 'Title',
    }),
  ],
})
