
const { client } = require('./next/app/lib/sanity');
const { groq } = require('next-sanity');

async function run() {
  try {
    const data = await client.fetch(groq`*[_type == "dashboard"][0] {
      heroImage {
        image { ..., asset-> },
        alt
      }
    }`);
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(err);
  }
}

run();
