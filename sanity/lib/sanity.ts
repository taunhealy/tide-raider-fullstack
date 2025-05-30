import {createClient} from '@sanity/client'

export const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET,
  apiVersion: '2024-06-19',
  useCdn: false,
  token: process.env.SANITY_WRITE_TOKEN
})