import { StoryCategory } from "../lib/constants";
import { Beach } from "./beaches";

export type StoryBeach = {
  id: string;
  name: string;
  region: string;
  country: string;
  continent: string;
};

export interface Story {
  id: string;
  userId: string;
  title: string;
  beach?: StoryBeach;
  date: string;
  details: string;
  link?: string;
  category: StoryCategory;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
  customBeach?: string;
}
