import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { players, events, results, users, sports, sportDisciplines, ageCategories } from "../db/schema";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const db = drizzle(client);

// ─── Players ─────────────────────────────────────────────────────────────────
const PLAYERS = [
  { fullName: "Kasun Perera",       employeeId: "BOC10011", branch: "Head Office",       sport: "Athletics",          gender: "M", joinedYear: 2015, dob: "1990-03-12" },
  { fullName: "Nimal Fernando",     employeeId: "BOC10022", branch: "Kandy",              sport: "Athletics,Swimming", gender: "M", joinedYear: 2017, dob: "1992-07-25" },
  { fullName: "Chamara Silva",      employeeId: "BOC10033", branch: "Colombo Fort",       sport: "Athletics",          gender: "M", joinedYear: 2016, dob: "1991-11-08" },
  { fullName: "Ruwan Jayasinghe",   employeeId: "BOC10044", branch: "Galle",              sport: "Athletics,Cricket",  gender: "M", joinedYear: 2018, dob: "1993-05-30" },
  { fullName: "Anil Wickramasinghe",employeeId: "BOC10055", branch: "Negombo",            sport: "Athletics",          gender: "M", joinedYear: 2014, dob: "1989-09-14" },
  { fullName: "Dilshan Rathnayake", employeeId: "BOC10066", branch: "Kurunegala",         sport: "Badminton,Athletics",gender: "M", joinedYear: 2019, dob: "1995-01-22" },
  { fullName: "Priya Mendis",       employeeId: "BOC10077", branch: "Head Office",        sport: "Athletics",          gender: "F", joinedYear: 2016, dob: "1993-08-17" },
  { fullName: "Sandya Kumari",      employeeId: "BOC10088", branch: "Kandy",              sport: "Athletics,Swimming", gender: "F", joinedYear: 2017, dob: "1994-04-03" },
  { fullName: "Malika Senanayake",  employeeId: "BOC10099", branch: "Colombo Fort",       sport: "Athletics",          gender: "F", joinedYear: 2015, dob: "1991-12-29" },
  { fullName: "Thilini Rajapaksa",  employeeId: "BOC10100", branch: "Matara",             sport: "Athletics,Badminton",gender: "F", joinedYear: 2020, dob: "1997-06-11" },
  { fullName: "Saman Bandara",      employeeId: "BOC10111", branch: "Anuradhapura",       sport: "Athletics",          gender: "M", joinedYear: 2013, dob: "1988-02-19" },
  { fullName: "Roshan Gunawardena", employeeId: "BOC10122", branch: "Ratnapura",          sport: "Athletics,Football", gender: "M", joinedYear: 2018, dob: "1994-10-07" },
];

// ─── Events ───────────────────────────────────────────────────────────────────
const EVENTS = [
  { name: "BOC Inter-Province Athletic Meet 2023", type: "inter_province",  date: "2023-04-15", location: "Sugathadasa Stadium, Colombo" },
  { name: "Nationalized Services Meet 2023",        type: "nationalized",    date: "2023-08-22", location: "Mahinda Rajapaksa Stadium, Hambantota" },
  { name: "Athletics Coaching Camp 2023",           type: "coaching_camp",   date: "2023-11-10", location: "Diyagama, Homagama" },
  { name: "BOC Inter-Province Athletic Meet 2024", type: "inter_province",  date: "2024-04-20", location: "Sugathadasa Stadium, Colombo" },
  { name: "Nationalized Services Meet 2024",        type: "nationalized",    date: "2024-09-14", location: "Sugathadasa Stadium, Colombo" },
  { name: "International Athletics Tour 2024",      type: "international",   date: "2024-07-05", location: "Colombo" },
  { name: "BOC Inter-Province Athletic Meet 2025", type: "inter_province",  date: "2025-03-28", location: "Sugathadasa Stadium, Colombo" },
  { name: "Local Athletic Championship 2025",       type: "local",           date: "2025-01-18", location: "Reid Avenue Grounds, Colombo" },
];

// ─── Disciplines per sport ────────────────────────────────────────────────────
const DISCIPLINES: Record<string, string[]> = {
  Athletics:       ["100m", "200m", "400m", "800m", "1500m", "5000m", "10000m", "110m Hurdles", "400m Hurdles", "3000m Steeplechase", "Long Jump", "Triple Jump", "High Jump", "Pole Vault", "Shot Put", "Discus Throw", "Hammer Throw", "Javelin Throw", "4x100m Relay", "4x400m Relay"],
  Swimming:        ["50m Freestyle", "100m Freestyle", "200m Freestyle", "400m Freestyle", "100m Backstroke", "200m Backstroke", "100m Breaststroke", "200m Breaststroke", "100m Butterfly", "200m Butterfly", "200m Individual Medley", "400m Individual Medley"],
  Badminton:       ["Men's Singles", "Women's Singles", "Men's Doubles", "Women's Doubles", "Mixed Doubles"],
  Cricket:         ["T20", "One Day", "Test"],
  Football:        ["11-a-side", "Futsal"],
  Volleyball:      ["Indoor", "Beach"],
  Basketball:      ["5-a-side", "3-a-side"],
  "Table Tennis":  ["Men's Singles", "Women's Singles", "Men's Doubles", "Women's Doubles", "Mixed Doubles"],
  Carrom:          ["Men's Singles", "Women's Singles", "Men's Doubles", "Mixed Doubles"],
  Chess:           ["Standard", "Rapid", "Blitz"],
};

// ─── Results: [playerIndex, eventIndex, place, bestAthlete, meetRecord, sport?, discipline?, ageCategory?] ─
type ResultRow = [number, number, "1"|"2"|"3"|"participated", boolean, boolean, string?, string?, string?];

const RESULTS: ResultRow[] = [
  // 2023 Inter-Province
  [0, 0, "1", true,  true,  "Athletics", "100m",       "Open"   ],
  [1, 0, "2", false, false, "Athletics", "100m",       "Open"   ],
  [2, 0, "3", false, false, "Athletics", "200m",       "Open"   ],
  [3, 0, "participated", false, false, "Athletics", "Long Jump", "Open"],
  [4, 0, "participated", false, false, "Athletics", "400m",     "Novices"],
  [6, 0, "1", true,  false, "Athletics", "100m",       "Open"   ],
  [7, 0, "2", false, false, "Athletics", "200m",       "Novices"],
  [8, 0, "3", false, false, "Athletics", "400m",       "Open"   ],

  // 2023 Nationalized
  [0, 1, "1", true,  false, "Athletics", "100m",       "Open"   ],
  [2, 1, "2", false, false, "Athletics", "200m",       "Open"   ],
  [4, 1, "3", false, true,  "Athletics", "Shot Put",   "Masters 40+"],
  [1, 1, "participated", false, false, "Swimming", "100m Freestyle", "Open"],
  [6, 1, "1", false, false, "Athletics", "100m",       "Open"   ],
  [8, 1, "2", false, false, "Athletics", "200m",       "Novices"],

  // 2023 Coaching Camp
  [0, 2, "participated", false, false, "Athletics"],
  [1, 2, "participated", false, false, "Athletics"],
  [5, 2, "participated", false, false, "Badminton"],
  [6, 2, "participated", false, false, "Athletics"],
  [7, 2, "participated", false, false, "Athletics"],

  // 2024 Inter-Province
  [0, 3, "2", false, false, "Athletics", "200m",       "Open"   ],
  [1, 3, "1", true,  true,  "Athletics", "100m",       "Open"   ],
  [2, 3, "3", false, false, "Athletics", "400m",       "Open"   ],
  [5, 3, "participated", false, false, "Badminton", "Men's Singles"],
  [10, 3, "participated", false, false, "Athletics", "Long Jump", "Masters 50+"],
  [6, 3, "1", true,  false, "Athletics", "100m",       "Open"   ],
  [9, 3, "2", false, false, "Athletics", "200m",       "Novices"],
  [7, 3, "3", false, false, "Athletics", "400m",       "Open"   ],

  // 2024 Nationalized
  [0, 4, "1", false, false, "Athletics", "100m",       "Open"   ],
  [1, 4, "1", true,  false, "Swimming",  "100m Freestyle", "Open"],
  [3, 4, "2", false, false, "Athletics", "Long Jump",  "Open"   ],
  [11, 4, "3", false, false, "Athletics", "Javelin Throw", "Masters 40+"],
  [6, 4, "2", false, true,  "Athletics", "200m",       "Open"   ],
  [7, 4, "1", true,  false, "Athletics", "100m",       "Open"   ],

  // 2024 International Tour
  [0, 5, "participated", false, false, "Athletics", "100m"],
  [1, 5, "participated", false, false, "Athletics", "100m"],
  [6, 5, "participated", false, false, "Athletics", "200m"],
  [7, 5, "participated", false, false, "Athletics", "400m"],

  // 2025 Inter-Province
  [1, 6, "1", true,  false, "Athletics", "100m",       "Open"   ],
  [0, 6, "2", false, false, "Athletics", "200m",       "Open"   ],
  [5, 6, "3", false, false, "Badminton", "Men's Singles"],
  [3, 6, "participated", false, false, "Athletics", "Long Jump", "Open"],
  [7, 6, "1", true,  true,  "Athletics", "100m",       "Open"   ],
  [6, 6, "2", false, false, "Athletics", "200m",       "Novices"],
  [9, 6, "3", false, false, "Athletics", "400m",       "Open"   ],

  // 2025 Local
  [0, 7, "1", false, false, "Athletics", "100m",       "Open"   ],
  [2, 7, "2", false, false, "Athletics", "200m",       "Open"   ],
  [4, 7, "3", false, false, "Athletics", "Shot Put",   "Masters 40+"],
  [10, 7, "participated", false, false, "Athletics"],
  [11, 7, "participated", false, false, "Athletics", "Javelin Throw", "Masters 40+"],
  [6, 7, "1", false, false, "Athletics", "100m",       "Open"   ],
  [8, 7, "2", false, false, "Athletics", "200m",       "Novices"],
];

function calculateMarks(type: string, place: string, bestAthlete: boolean, meetRecord: boolean): number {
  let marks = 0;
  if (type === "inter_province") {
    marks += 3;
    if (place === "1") marks += 3;
    else if (place === "2") marks += 2;
    else if (place === "3") marks += 1;
  } else if (type === "nationalized") {
    marks += 5;
    if (place === "1") marks += 5;
    else if (place === "2") marks += 3;
    else if (place === "3") marks += 1;
  } else {
    marks += 5;
  }
  if (bestAthlete) marks += 3;
  if (meetRecord) marks += 2;
  return marks;
}

async function seed() {
  console.log("🌱 Seeding sample data...\n");

  // Clear existing data (FK order: results → events → players, disciplines → sports → age_categories)
  await db.delete(results);
  await db.delete(events);
  await db.delete(players);
  await db.delete(sportDisciplines);
  await db.delete(sports);
  await db.delete(ageCategories);

  // Sports + disciplines
  const INITIAL_SPORTS = Object.keys(DISCIPLINES);
  const sportIdByName: Record<string, string> = {};
  for (const name of INITIAL_SPORTS) {
    const id = randomUUID();
    sportIdByName[name] = id;
    await db.insert(sports).values({ id, name, active: true });
  }
  console.log(`✅ ${INITIAL_SPORTS.length} sports`);

  let disciplineCount = 0;
  for (const [sportName, names] of Object.entries(DISCIPLINES)) {
    const sportId = sportIdByName[sportName];
    for (const name of names) {
      await db.insert(sportDisciplines).values({ id: randomUUID(), sportId, name, active: true });
      disciplineCount++;
    }
  }
  console.log(`✅ ${disciplineCount} disciplines`);

  // Age categories
  const AGE_CATEGORY_NAMES = [
    "Open",
    "Novices",
    "Sub Masters",
    "Masters 40+",
    "Masters 45+",
    "Masters 50+",
    "Masters 55+",
    "Masters 60+",
  ];
  for (let i = 0; i < AGE_CATEGORY_NAMES.length; i++) {
    await db.insert(ageCategories).values({ id: randomUUID(), name: AGE_CATEGORY_NAMES[i], sortOrder: i, active: true });
  }
  console.log(`✅ ${AGE_CATEGORY_NAMES.length} age categories`);

  // Admin user
  const hash = await bcrypt.hash("ChangeMe123!", 12);
  await db.insert(users).values({ id: randomUUID(), username: "admin", passwordHash: hash, fullName: "System Administrator", role: "admin", active: true }).onConflictDoNothing();
  console.log("✅ Admin user (admin / ChangeMe123!)");

  // Players
  const playerIds: string[] = [];
  for (const p of PLAYERS) {
    const id = randomUUID();
    playerIds.push(id);
    await db.insert(players).values({
      id, fullName: p.fullName, employeeId: p.employeeId, branch: p.branch,
      sport: p.sport, gender: p.gender as "M"|"F",
      joinedYear: p.joinedYear, dateOfBirth: p.dob, active: true,
    });
  }
  console.log(`✅ ${PLAYERS.length} players`);

  // Events
  const eventIds: string[] = [];
  for (const e of EVENTS) {
    const id = randomUUID();
    eventIds.push(id);
    await db.insert(events).values({
      id, name: e.name, type: e.type as any,
      eventDate: e.date, year: parseInt(e.date.split("-")[0]),
      location: e.location, locked: false,
    });
  }
  console.log(`✅ ${EVENTS.length} events`);

  // Results
  let count = 0;
  for (const [pi, ei, place, bestAthlete, meetRecord, sport, discipline, ageCategory] of RESULTS) {
    const eventType = EVENTS[ei].type;
    const marks = calculateMarks(eventType, place, bestAthlete, meetRecord);
    await db.insert(results).values({
      id: randomUUID(),
      playerId: playerIds[pi],
      eventId: eventIds[ei],
      place, bestAthlete, meetRecord,
      sport: sport ?? null,
      discipline: discipline ?? null,
      ageCategory: ageCategory ?? null,
      gender: PLAYERS[pi].gender as "M" | "F",
      marksAwarded: marks,
    });
    count++;
  }
  console.log(`✅ ${count} results`);

  console.log("\n🎉 Sample data seeded! Log in at http://localhost:3000/login");
  console.log("   Username: admin  |  Password: ChangeMe123!");
  process.exit(0);
}

seed().catch((err) => { console.error("Seed failed:", err); process.exit(1); });
