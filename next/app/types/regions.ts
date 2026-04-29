import type { Region, Beach } from "@/app/types/beaches";

export interface UserSearch {
  id: string;
  region?: Region;
  beach?: Beach;
  createdAt: string;
}
