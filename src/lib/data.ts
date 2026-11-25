import { IMG } from "@/lib/images";

export type StudentStatus = "On Track" | "Needs Attention" | "Good";
export interface Student {
  id: string;
  name: string;
  form: number;
  className: string;
  photo?: string;
  status: StudentStatus;
  grade: number;
  subjects: { name: string; score: number }[];
  attendance: { present: number; absent: number; late: number };
  behaviour: { merits: number; demerits: number; notes: string[] };
  remarks: { id: string; text: string; done: boolean }[];
  guardian: { name: string; phone: string };
}

export type ComplaintStatus = "Pending" | "In Progress" | "Resolved";
export interface Complaint {
  id: string;
  student: string;
  form: string;
  issue: string;
  description: string;
  status: ComplaintStatus;
  createdAt: string; // ISO
  source: "teacher" | "parent";
  reportedBy?: string;
  reportNo?: string;
  updates: { title: string; note?: string; at: string }[];
}

export interface TeacherNotification {
  id: string;
  kind: "report" | "complaint" | "system" | "welcome";
  title: string;
  at: string;
  read: boolean;
}

export interface Child {
  id: string;
  name: string;
  className: string;
  school: string;
  photo?: string;
  cardBalance: number;
  dailyLimit: number;
  spentToday: number;
  checkIn: string;
  lastSeen: string;
}

export type TxKind = "topup" | "canteen" | "transfer" | "fees" | "shop";
export interface Transaction {
  id: string;
  kind: TxKind;
  title: string;
  subtitle: string;
  amount: number; // positive = credit to parent wallet, negative = debit
  at: string;
}

export interface Invoice {
  id: string;
  childId: string;
  title: string;
  dueLabel: string;
  amount: number;
  paid: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  tag: string;
  calories: number;
  price: number;
  photo: string;
  category: "healthy" | "bento" | "main";
  allergens: ("peanut" | "lactose")[];
  dietApproved: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  at: string;
  card?: "alya-balance";
}

const d = (s: string) => new Date(s).toISOString();

const subjectsFor = (base: number) => [
  { name: "Mathematics", score: Math.min(99, base + 3) },
  { name: "Science", score: base },
  { name: "English", score: Math.max(40, base - 3) },
  { name: "Bahasa Melayu", score: Math.min(99, base + 1) },
  { name: "Sejarah", score: Math.max(40, base - 5) },
];

const mk = (
  id: string,
  name: string,
  form: number,
  className: string,
  status: StudentStatus,
  grade: number,
  photo?: string,
): Student => ({
  id,
  name,
  form,
  className,
  status,
  grade,
  ...(photo ? { photo } : {}),
  subjects:
    id === "ahmad-danial"
      ? [
          { name: "Mathematics", score: 88 },
          { name: "Science", score: 85 },
          { name: "English", score: 82 },
          { name: "Bahasa Melayu", score: 87 },
          { name: "Sejarah", score: 84 },
        ]
      : subjectsFor(Math.round(grade)),
  attendance: {
    present: status === "Needs Attention" ? 52 : 60,
    absent: status === "Needs Attention" ? 6 : 1,
    late: status === "Needs Attention" ? 4 : 1,
  },
  behaviour: {
    merits: status === "Needs Attention" ? 2 : 8,
    demerits: status === "Needs Attention" ? 3 : 0,
    notes:
      status === "Needs Attention"
        ? ["Late to class twice this week", "Homework incomplete for Science"]
        : ["Helpful to classmates", "Active in class discussions"],
  },
  remarks: [{ id: `${id}-r1`, text: "Keep up the good work!", done: true }],
  guardian: {
    name: `Pn. Ibu ${name.split(" ")[0]}`,
    phone: `+60 12-345 ${String(1000 + (id.length * 137) % 9000)}`,
  },
});

export const seedStudents: Student[] = [
  mk("ahmad-danial", "Ahmad Danial", 4, "Form 4 Bestari", "On Track", 85, IMG.ahmad),
  mk("nur-aina", "Nur Aina", 4, "Form 4 Bestari", "On Track", 83.5, IMG.aina),
  mk("tan-wei-ling", "Tan Wei Ling", 4, "Form 4 Bestari", "Needs Attention", 61.2, IMG.weiling),
  mk("muhammad-aqil", "Muhammad Aqil", 4, "Form 4 Bestari", "On Track", 79.4, IMG.aqil),
  mk("siti-nurhaliza", "Siti Nurhaliza", 4, "Form 4 Bestari", "Good", 90.1, IMG.siti),
  mk("lim-jia-wen", "Lim Jia Wen", 4, "Form 4 Bestari", "Good", 88.6, IMG.jiawen),
  mk("hafiz-rahman", "Hafiz Rahman", 1, "Form 1 Amanah", "On Track", 76.0),
  mk("chloe-tan", "Chloe Tan", 1, "Form 1 Amanah", "Good", 89.3),
  mk("arjun-kumar", "Arjun Kumar", 2, "Form 2 Cemerlang", "Needs Attention", 58.7),
  mk("nurul-izzah", "Nurul Izzah", 2, "Form 2 Cemerlang", "On Track", 81.2),
  mk("daniel-wong", "Daniel Wong", 3, "Form 3 Dedikasi", "Good", 91.4),
  mk("aisyah-humaira", "Aisyah Humaira", 3, "Form 3 Dedikasi", "On Track", 77.8),
  mk("irfan-hakim", "Irfan Hakim", 5, "Form 5 Gemilang", "On Track", 80.5),
];

export const seedComplaints: Complaint[] = [
  {
    id: "p1",
    student: "Aliman Hakim",
    form: "Form 2 Cemerlang",
    issue: "Bullying",
    description: "My son told me older students took his pocket money near the canteen twice this week.",
    status: "Pending",
    createdAt: d("2025-11-22T08:10:00+08:00"),
    source: "parent",
    reportedBy: "Puan Sarah",
    reportNo: "ADN-2025-0012",
    updates: [{ title: "Report Submitted", at: d("2025-11-22T08:10:00+08:00") }],
  },
  {
    id: "p2",
    student: "Alya Sofea",
    form: "Form 1 Amanah",
    issue: "Fighting",
    description: "Alya came home with a scratch after a fight broke out during recess.",
    status: "In Progress",
    createdAt: d("2025-11-19T16:40:00+08:00"),
    source: "parent",
    reportedBy: "Encik Rahman",
    reportNo: "ADN-2025-0009",
    updates: [
      { title: "Report Submitted", at: d("2025-11-19T16:40:00+08:00") },
      { title: "In Progress", note: "Speaking with students involved.", at: d("2025-11-20T09:00:00+08:00") },
    ],
  },
  {
    id: "c1",
    student: "Nur Aina",
    form: "Form 4 Bestari",
    issue: "Bullying",
    description: "Student reported bullying by classmates.",
    status: "Pending",
    createdAt: d("2025-11-21T09:30:00+08:00"),
    source: "teacher",
    updates: [
      { title: "Complaint Submitted", at: d("2025-11-21T09:30:00+08:00") },
      { title: "Under Review", at: d("2025-11-21T10:00:00+08:00") },
    ],
  },
  {
    id: "c2",
    student: "Ahmad Danial",
    form: "Form 4 Bestari",
    issue: "Missing book",
    description: "Student's Science textbook went missing after PE class.",
    status: "In Progress",
    createdAt: d("2025-11-20T11:15:00+08:00"),
    source: "teacher",
    updates: [
      { title: "Complaint Submitted", at: d("2025-11-20T11:15:00+08:00") },
      { title: "In Progress", note: "Checking lost & found.", at: d("2025-11-20T14:00:00+08:00") },
    ],
  },
  {
    id: "c3",
    student: "Siti Nurhaliza",
    form: "Form 4 Bestari",
    issue: "Late submission",
    description: "Assignment submitted 3 days after the deadline.",
    status: "Resolved",
    createdAt: d("2025-11-18T08:40:00+08:00"),
    source: "teacher",
    updates: [
      { title: "Complaint Submitted", at: d("2025-11-18T08:40:00+08:00") },
      {
        title: "Resolved",
        note: "Parent informed, extension granted.",
        at: d("2025-11-18T16:00:00+08:00"),
      },
    ],
  },
  {
    id: "c4",
    student: "Lim Jia Wen",
    form: "Form 4 Bestari",
    issue: "Disrespect",
    description: "Reported disrespectful behaviour towards a prefect.",
    status: "Pending",
    createdAt: d("2025-11-17T13:20:00+08:00"),
    source: "teacher",
    updates: [{ title: "Complaint Submitted", at: d("2025-11-17T13:20:00+08:00") }],
  },
];

export const seedTeacherNotifications: TeacherNotification[] = [
  {
    id: "n1",
    kind: "report",
    title: "New report available",
    at: d("2025-11-21T09:00:00+08:00"),
    read: false,
  },
  {
    id: "n2",
    kind: "complaint",
    title: "Complaint updated",
    at: d("2025-11-20T16:30:00+08:00"),
    read: false,
  },
  {
    id: "n3",
    kind: "system",
    title: "System maintenance",
    at: d("2025-11-19T10:00:00+08:00"),
    read: true,
  },
  {
    id: "n4",
    kind: "welcome",
    title: "Welcome to Skowla",
    at: d("2025-11-18T08:00:00+08:00"),
    read: true,
  },
];

export const seedChildren: Child[] = [
  {
    id: "aliman",
    name: "Aliman Danial",
    className: "Tingkatan 3 Amanah",
    school: "SMK Seri Bintang",
    photo: IMG.aliman,
    cardBalance: 24,
    dailyLimit: 6,
    spentToday: 2.4,
    checkIn: "07:14 AM",
    lastSeen: "Sekolah 07:30 AM",
  },
  {
    id: "alya",
    name: "Alya Natasha",
    className: "Tingkatan 1 Ibnu",
    school: "SK Seri Bintang",
    photo: IMG.alya,
    cardBalance: 18.5,
    dailyLimit: 4.5,
    spentToday: 1.5,
    checkIn: "07:20 AM",
    lastSeen: "Sekolah 09:20 AM",
  },
];

export const seedTransactions: Transaction[] = [
  {
    id: "t1",
    kind: "topup",
    title: "Top Up via Maybank FPX",
    subtitle: "Berjaya",
    amount: 100,
    at: d("2026-07-28T11:30:00+08:00"),
  },
  {
    id: "t2",
    kind: "canteen",
    title: "Canteen Pre-Order",
    subtitle: "Aliman • Nasi Ayam Panggang",
    amount: -6.5,
    at: d("2026-07-28T09:00:00+08:00"),
  },
  {
    id: "t3",
    kind: "transfer",
    title: "Pocket Money Allowance: Alya",
    subtitle: "Pemindahan ke kad",
    amount: -10,
    at: d("2026-07-27T07:00:00+08:00"),
  },
  {
    id: "t4",
    kind: "canteen",
    title: "Kantin Sekolah",
    subtitle: "Alya • Sandwich Telur Mayo",
    amount: -4,
    at: d("2026-07-26T10:10:00+08:00"),
  },
  {
    id: "t5",
    kind: "topup",
    title: "Top Up via DuitNow QR",
    subtitle: "Berjaya",
    amount: 50,
    at: d("2026-07-24T20:15:00+08:00"),
  },
];

export const seedInvoices: Invoice[] = [
  {
    id: "i1",
    childId: "aliman",
    title: "Sumbangan PIBG Sesi 2026",
    dueLabel: "Tarikh: 1 Feb 2026",
    amount: 80,
    paid: false,
  },
  {
    id: "i2",
    childId: "aliman",
    title: "Program Kecemerlangan Tingkatan 3",
    dueLabel: "Tingkatan 3 Amanah",
    amount: 40,
    paid: false,
  },
  {
    id: "i3",
    childId: "alya",
    title: "Sumbangan PIBG Sesi 2026",
    dueLabel: "Tarikh: 1 Feb 2026",
    amount: 50,
    paid: false,
  },
  {
    id: "i4",
    childId: "alya",
    title: "Lawatan Sambil Belajar Zoo Negara",
    dueLabel: "Tarikh: 15 Ogos 2026",
    amount: 25,
    paid: true,
  },
];

export const menuItems: MenuItem[] = [
  {
    id: "m1",
    name: "Nasi Ayam Panggang",
    tag: "Set Utama",
    calories: 520,
    price: 6.5,
    photo: IMG.nasi,
    category: "main",
    allergens: [],
    dietApproved: true,
  },
  {
    id: "m2",
    name: "Sandwich Telur Mayo & Salad",
    tag: "Healthy Set",
    calories: 310,
    price: 4,
    photo: IMG.sandwich,
    category: "healthy",
    allergens: ["lactose"],
    dietApproved: true,
  },
  {
    id: "m3",
    name: "Mee Sup Ayam Canteen",
    tag: "Set Utama",
    calories: 430,
    price: 5.5,
    photo: IMG.meesup,
    category: "main",
    allergens: [],
    dietApproved: true,
  },
  {
    id: "m4",
    name: "Susu Coklat & Buah Potong",
    tag: "Healthy Set",
    calories: 260,
    price: 2.5,
    photo: IMG.susu,
    category: "healthy",
    allergens: ["lactose"],
    dietApproved: true,
  },
  {
    id: "m5",
    name: "Bento Nasi Lemak",
    tag: "Bento Box",
    calories: 640,
    price: 5,
    photo: IMG.bento1,
    category: "bento",
    allergens: ["peanut"],
    dietApproved: false,
  },
  {
    id: "m6",
    name: "Bento Ayam Teriyaki",
    tag: "Bento Box",
    calories: 560,
    price: 7,
    photo: IMG.bento2,
    category: "bento",
    allergens: [],
    dietApproved: true,
  },
];

export const seedChat: ChatMessage[] = [
  {
    id: "w1",
    role: "assistant",
    content:
      "Hai! Saya Skowla, pembantu pintar sekolah anak anda. Ada apa-apa masalah yang boleh saya bantu tentang urusan anak-anak hari ini?",
    at: d("2026-07-28T10:30:00+08:00"),
  },
  {
    id: "w2",
    role: "user",
    content: "Berapa baki duit belanja Alya sekarang dan apa yang dia beli di kantin tadi?",
    at: d("2026-07-28T10:36:00+08:00"),
  },
  {
    id: "w3",
    role: "assistant",
    content:
      "Baik Puan Sarah, ini maklumat dompet & transaksi terkini untuk Nur Alya Natasha (Tingkatan 1 Ibnu). Tadi dia membeli Sandwich Telur Mayo (RM 4.00) di kantin.",
    at: d("2026-07-28T10:36:30+08:00"),
    card: "alya-balance",
  },
];
