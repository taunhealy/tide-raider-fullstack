import { groq } from "next-sanity";

const postFields = groq`
  _id,
  title,
  "slug": slug.current,
  mainImage {
    ...,
    asset->
  },
  publishedAt,
  description,
  countries,
  categories[]-> {
    title,
    "slug": slug.current
  }
`;

// Simple query to test connection and see all documents
export const homePageQuery = groq`*[_type == "homepage"] | order(_createdAt desc)[0] {
  _id,
  _type,
  hero {
    heroImageTitle,
    description,
    image,
    imagePhotographer,
    heroAboutImage,
    aboutHeading,
    aboutDescription,
    viewAppHeading,
    viewAppImage,
    aboutImage
  },
  about {
    aboutHeading,
    aboutDescription1,
    aboutDescription1Image,
    aboutDescription2,
    aboutDescription2Image
  },
  blog {
    heading,
    "posts": *[_type == "post"] | order(publishedAt desc) [0...3] {
      _id,
      title,
      "slug": slug.current,
      mainImage,
      publishedAt,
      description,
      categories[]-> {
        _id,
        title
      }
    }
  },
  heroImage {
    image,
    title,
    imagePhotographer
  },
}`;

// Add this with the other query exports
export const pricingQuery = groq`
  *[_type == "pricing"][0] {
    title,
    subtitle,
    "pricingImage": pricingImage.asset->url,
    price,
    priceSubtext,
    features
  }
`;

// Main blog listing query
export const blogListingQuery = groq`{
  "posts": *[_type == "post"] | order(publishedAt desc) {
    _id,
    title,
    "slug": slug.current,
    mainImage {
      ...,
      asset->
    },
    publishedAt,
    description,
    categories[]-> {
      title,
      "slug": slug.current
    },
    "trip": trip->{
      title,
      country,
      region,
      destination
    }
  },
  "categories": *[_type == "postCategory"] | order(order asc) {
    title,
    "slug": slug.current
  }
}`;

// Single post query - use $slug as a parameter
export const postQuery = groq`*[_type == "post" && defined(slug.current) && slug.current == $slug][0]{
  ${postFields},
  "slug": slug.current,
  countries,
  "content": content[]{
    ...,
    content[]{
      ...,
    },
    videoLink,
    sectionImages[]{
      ...,
    },
    sectionVideos[]{
      ...,
      video{
        ...,
      }
    }
  },
  "trip": *[_type == "trip" && _id == ^.trip._ref][0]{
    title,
    country,
    region,
    destination,
    "days": days[]{
      dayNumber,
      activities[]{
        title,
        duration,
        price,
        transport,
        bookingURL
      },
      stay{
        title,
        price,
        bookingURL
      },
      includes[]
    }
  },
  "relatedPosts": *[_type == "post" && slug.current != $slug][0...3] {
    ${postFields}
  },
  sidebarWidgets[] {
    _type,
    _key,
    title,
    order,
    ...select(
      _type == 'weatherWidget' => { region },
      _type == 'surfSpotsWidget' => { region },
      _type == 'relatedPostsWidget' => { numberOfPosts },
      _type == 'locationMapWidget' => { region },
      _type == 'categoryListWidget' => { showPostCount, displayStyle },
      _type == 'tagCloudWidget' => { maxTags, showTagCount },
      _type == 'flightSearchWidget' => { destinationCode },
      _type == 'unsplashGridWidget' => { searchTerm }
    )
  }
}`;

// Featured posts query
export const featuredPostsQuery = groq`*[_type == "post"] | order(publishedAt desc)[0...3] {
  ${postFields}
}`;

// Related posts query
export const relatedPostsQuery = groq`*[_type == "post" && 
  count((categories[]->_id)[@ in $categories]) > 0 && 
  _id != $currentPostId
] | order(publishedAt desc)[0...3] {
  ${postFields}
}`;

// Posts by category query
export const postsByCategoryQuery = groq`*[_type == "post" && $categoryId in categories[]._ref] {
  ${postFields}
}`;

// Query for sidebar widgets data
export const sidebarWidgetsQuery = groq`
{
  "relatedPosts": *[_type == "post" && references(*[_type == "postCategory" && references(^.categories[]._ref)]._id)] | order(publishedAt desc)[0...5] {
    title,
    slug,
    mainImage,
    publishedAt,
    description,
    categories[]-> {
      title,
      slug
    }
  },
  "categories": *[_type == "postCategory"] | order(order asc) {
    title,
    slug,
    "postCount": count(*[_type == "post" && references(^._id)])
  },
  "tags": *[_type == "postTag"] {
    title,
    slug,
    "postCount": count(*[_type == "post" && references(^._id)]),
    "lastUsed": *[_type == "post" && references(^._id)] | order(publishedAt desc)[0].publishedAt
  }
}`;

// Add this with the other query exports
export const landingPageQuery = groq`
  *[_type == "landingPage"][0] {
    heroHeading,
    heroSubheading,
    heroImage {
      asset->,
      alt,
      "dimensions": asset->metadata.dimensions,
      overlayText
    },
    heroFooterImage {
      asset->,
      alt,
      "dimensions": asset->metadata.dimensions,
      overlayText
    },
    "blog": {
      "posts": *[_type == "post"] | order(publishedAt desc) [0...3] {
        _id,
        title,
        "slug": slug.current,
        mainImage{
          ...,
          asset->
        },
        publishedAt,
        description,
        categories[]-> {
          _id,
          title,
          "slug": slug.current
        },
        "trip": trip->{
          country,
          region
        }
      },
      "allCategories": *[_type == "postCategory"] {
        _id,
        title,
        "slug": slug.current
      }
    }
  }
`;

export const tripQuery = groq`*[_type == "trip" && slug.current == $slug][0]{
  title,
  destination,
  "days": days[]{
    dayNumber,
    activities[]{
      title,
      duration,
      price,
      transport,
      bookingURL
    },
    stay{
      title,
      price,
      bookingURL
    },
    includes[]
  },
  idealMonth
}`;

export const profilePageQuery = groq`*[_type == "profile"][0] {
  heroImage {
    image {
      asset->
    },
    alt
  }
}`;

// Add this new query for the sidebar specifically
export const blogSidebarQuery = groq`{
  "posts": *[_type == "post"] | order(publishedAt desc) {
    _id,
    title,
    "slug": slug.current,
    mainImage,
    description,
    publishedAt,
    "trip": trip->{
      country,
      region
    }
  }
}`;

// Query for posts by category slug
export const postsByCategorySlugQuery = groq`
*[_type == "post" && references(*[_type == "postCategory" && slug.current == $categorySlug]._id)] {
  _id,
  title,
  "slug": slug.current,
  mainImage {
    ...,
    asset->
  },
  publishedAt,
  description,
  categories[]-> {
    title,
    "slug": slug.current
  },
  "trip": trip->{
    title,
    country,
    region,
    destination
  }
} | order(publishedAt desc)
`;
