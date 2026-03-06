export type Registration = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  program: string;
  date: string;
  status: "Pending" | "Confirmed" | "Waitlist";
};

export type Program = {
  id: string;
  name: string;
  startDate: string;
  duration: string;
  facilitator: string;
  seats: number;
  status: "Open" | "Filling" | "Closed";
};

export type Feedback = {
  id: string;
  name: string;
  program: string;
  rating: number;
  message: string;
  date: string;
};

export const STORAGE_KEYS = {
  registrations: "admin_registrations",
  programs: "admin_programs",
  feedbacks: "admin_feedbacks",
};

export const DEFAULT_REGISTRATIONS: Registration[] = [
  {
    id: "reg-1",
    fullName: "Aanya Gupta",
    email: "aanya@email.com",
    phone: "+91 90000 11111",
    program: "Sunrise breath circle",
    date: "Mar 11",
    status: "Confirmed",
  },
  {
    id: "reg-2",
    fullName: "Karan Mehta",
    email: "karan@email.com",
    phone: "+91 90000 22222",
    program: "Flow & restore",
    date: "Mar 13",
    status: "Pending",
  },
  {
    id: "reg-3",
    fullName: "Isha Patel",
    email: "isha@email.com",
    phone: "+91 90000 33333",
    program: "Happiness Program",
    date: "Apr 03",
    status: "Waitlist",
  },
];

export const DEFAULT_PROGRAMS: Program[] = [
  {
    id: "prog-1",
    name: "Sunrise breath circle",
    startDate: "Mar 11",
    duration: "30 min",
    facilitator: "Ravi Menon",
    seats: 24,
    status: "Open",
  },
  {
    id: "prog-2",
    name: "Flow & restore",
    startDate: "Mar 13",
    duration: "45 min",
    facilitator: "Neha Rao",
    seats: 18,
    status: "Filling",
  },
  {
    id: "prog-3",
    name: "Happiness Program",
    startDate: "Apr 03",
    duration: "3 days",
    facilitator: "Team A",
    seats: 40,
    status: "Open",
  },
];

export const DEFAULT_FEEDBACK: Feedback[] = [
  {
    id: "fb-1",
    name: "Meera Joshi",
    program: "Weekend reset",
    rating: 5,
    message: "Felt grounded and light after the session.",
    date: "Mar 02",
  },
  {
    id: "fb-2",
    name: "David Chen",
    program: "Sound bath immersion",
    rating: 4,
    message: "Really calming. Loved the pacing and guidance.",
    date: "Mar 04",
  },
  {
    id: "fb-3",
    name: "Sanya Kapoor",
    program: "Flow & restore",
    rating: 5,
    message: "Great balance of movement and rest.",
    date: "Mar 05",
  },
];
