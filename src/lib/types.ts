export type ProgramTag = "Breathwork" | "Meditation" | "Yoga" | "Sound" | "Retreat";

export type ProgramStatus = "Open" | "Filling" | "Closed";

export type ProgramRecord = {
  id: string;
  slug: string;
  title: string;
  date: string;
  day: string;
  time: string;
  duration: string;
  tag: ProgramTag;
  location: string;
  summary: string;
  description: string;
  highlights: string[];
  facilitator: string;
  seats: number;
  status: ProgramStatus;
};

export type RegistrationStatus = "Pending" | "Confirmed" | "Waitlist";

export type RegistrationRecord = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address?: string;
  dob?: string;
  message?: string;
  aolExperience?: string;
  programSlug?: string;
  programTitle?: string;
  programDate?: string;
  programDay?: string;
  programTime?: string;
  programDuration?: string;
  programTag?: ProgramTag;
  status: RegistrationStatus;
  userId?: string;
  createdAt?: string;
};

export type FeedbackType = "journal" | "experience";

export type FeedbackRecord = {
  id: string;
  type: FeedbackType;
  name?: string;
  program?: string;
  rating?: number;
  prompt?: string;
  message: string;
  userId?: string;
  createdAt?: string;
};

export type ProfileSettings = {
  emailUpdates: boolean;
  smsReminders: boolean;
  weeklyDigest: boolean;
};

export type ProfileRecord = {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  dob: string;
  settings: ProfileSettings;
  createdAt?: string;
  updatedAt?: string;
};
