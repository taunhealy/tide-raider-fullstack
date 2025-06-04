// Temporary mock data until we have a real API
const mockBlogPosts = [
  {
    id: "1",
    title: "Top Surf Spots in Cape Town",
    excerpt: "Discover the best places to catch waves in the Mother City...",
    date: "2024-03-15",
    author: "Surf Expert",
    imageUrl: "/images/blog/cape-town-surf.jpg",
  },
  {
    id: "2",
    title: "Beginner's Guide to Wave Types",
    excerpt: "Understanding different wave formations and how to ride them...",
    date: "2024-03-10",
    author: "Wave Master",
    imageUrl: "/images/blog/wave-types.jpg",
  },
];

export async function getBlogPosts() {
  // TODO: Replace with actual API call when available
  return mockBlogPosts;
}
