export type ProgramTag = string;

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
  venue?: string;
  mapUrl?: string;
  imageUrl?: string;
  summary: string;
  description: string;
  highlights: string[];
  facilitator: string;
  seats: number;
  status: ProgramStatus;
};

export type NotificationStatus = "Active" | "Archived";

export type NotificationRecord = {
  id: string;
  title: string;
  message: string;
  link?: string;
  status: NotificationStatus;
  createdAt?: string;
  updatedAt?: string;
};

export type CategoryRecord = {
  id: string;
  title: string;
  tag: ProgramTag;
  imageUrl?: string;
  iconName?: string;
  order: number;
  createdAt?: string;
  updatedAt?: string;
};

export type HeroSlideStatus = "Active" | "Archived";

export type HeroSlideRecord = {
  id: string;
  imageUrl: string;
  link?: string;
  order: number;
  status: HeroSlideStatus;
  createdAt?: string;
  updatedAt?: string;
};

export type LibraryKind = "hero" | "cta" | "suggestion" | "article" | "quick";

export type LibraryTone = "sleep" | "anxiety" | "morning" | "relief";

export type LibraryRecord = {
  id: string;
  kind: LibraryKind;
  title: string;
  description: string;
  eyebrow?: string;
  tag?: string;
  time?: string;
  tone?: LibraryTone;
  buttonLabel?: string;
  order: number;
  createdAt?: string;
  updatedAt?: string;
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
  avatarUrl: string;
  phone: string;
  address: string;
  dob: string;
  settings: ProfileSettings;
  createdAt?: string;
  updatedAt?: string;
};
