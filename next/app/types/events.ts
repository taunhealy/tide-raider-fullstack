export type Event = {
  id: string; // evnets unique idenitifier (UUID/cuid)
  userId: string; // user id of the event creator
  title: string; // title of the event
  description: string; // description of the event
  country: string; // country of the event
  region: string; // region of the event
  startTime: Date; // start time of the event
  link?: string;
  createdAt: Date;
};
