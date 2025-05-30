export interface SurfCamp {
  id: string;
  name: string;
  location: string;
  imageUrl: string;
  websiteUrl: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  subscriptionId?: string;
  googleAdsCampaignId?: string;
}
