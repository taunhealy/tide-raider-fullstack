export interface Favorite {
  id: string;
  title: string;
  videoLink: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    name: string | null;
    bio: string | null;
    id: string;
    image: string | null;
  };
}
