// // The builder object lets you chain methods like this:
/* urlForImage(myImage)
  .width(300)       // set width
  .height(300)      // set height
  .blur(50)         // add blur effect
  .format('webp')   // convert to webp format
  .url()            // finally get the actual URL string

  // Each method call returns the builder object itself, 
  // allowing you to keep adding more transformations

  */
import imageUrlBuilder from "@sanity/image-url";
import { client } from "./sanity";

// Initialize the builder object with the Sanity client
const builder = imageUrlBuilder(client);

// Define the type of the source to be more specific
interface ImageSource {
  _id: string;
  // add any other properties that your image object should have
}

export function urlForImage(source: any) {
  return builder.image(source).auto("format").fit("max");
}
