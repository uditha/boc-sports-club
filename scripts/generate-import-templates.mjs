import * as XLSX from "xlsx";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..");

// ── Shared helpers ─────────────────────────────────────────────────────────

const PURPLE = "A05AFF";
const TEAL   = "1BCFB4";
const GREY   = "F5F0FF";
const YELLOW = "FFF9C4";

function headerStyle(bgColor = PURPLE) {
  return {
    fill: { fgColor: { rgb: bgColor } },
    font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: { bottom: { style: "thin", color: { rgb: "CCCCCC" } } },
  };
}

function sampleStyle() {
  return {
    fill: { fgColor: { rgb: GREY } },
    font: { color: { rgb: "6B6B7B" }, italic: true, sz: 10 },
    alignment: { horizontal: "left", vertical: "center" },
  };
}

function optionalHeaderStyle() {
  return {
    fill: { fgColor: { rgb: "D4BBFF" } },
    font: { bold: true, color: { rgb: "5A2D9C" }, sz: 11 },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: { bottom: { style: "thin", color: { rgb: "CCCCCC" } } },
  };
}

// ── 1. Players Template ────────────────────────────────────────────────────

function buildPlayersTemplate() {
  const wb = XLSX.utils.book_new();

  // Instructions sheet
  const instr = XLSX.utils.aoa_to_sheet([
    ["BOC Sports Society — Players Import Template"],
    [""],
    ["HOW TO FILL THIS FILE"],
    [""],
    ["1. Fill in the PLAYERS sheet. Do NOT change column headers."],
    ["2. Each row = one player."],
    ["3. employee_id must be UNIQUE across all players (e.g. BOC001)."],
    ["   This ID is used to link players to their results — keep it consistent."],
    ["4. gender: use  M  for Male,  F  for Female."],
    ["5. sport: use the exact sport name (e.g. Athletics, Swimming, Badminton)."],
    ["   For multiple sports separate with a comma:  Athletics, Swimming"],
    ["6. date_of_birth: format YYYY-MM-DD  (e.g. 1990-05-14)"],
    ["7. joined_year: 4-digit year (e.g. 2018)"],
    ["8. Delete the sample row before uploading."],
    [""],
    ["FIELD REFERENCE"],
    ["full_name       — Player's full legal name"],
    ["employee_id     — Unique BOC employee ID  ← critical, used to link results"],
    ["branch          — Branch name (e.g. Colombo, Kandy, Galle, Head Office)"],
    ["sport           — Sport(s) played. Comma-separate if multiple."],
    ["gender          — M or F"],
    ["date_of_birth   — YYYY-MM-DD  (e.g. 1992-08-23)"],
    ["joined_year     — Year first joined BOC sports (4 digits)"],
  ]);

  instr["A1"].s = { font: { bold: true, sz: 14, color: { rgb: PURPLE } } };
  instr["A3"].s = { font: { bold: true, sz: 11 } };
  instr["A16"].s = { font: { bold: true, sz: 11 } };
  instr["!cols"] = [{ wch: 75 }];

  XLSX.utils.book_append_sheet(wb, instr, "Instructions");

  // Players data sheet
  const headers = [
    "full_name",
    "employee_id",
    "branch",
    "sport",
    "gender",
    "date_of_birth",
    "joined_year",
  ];

  const samples = [
    ["Kamal Perera",    "BOC001", "Colombo",      "Athletics",           "M", "1990-05-14", "2015"],
    ["Nimali Fernando", "BOC002", "Kandy",         "Athletics, Swimming", "F", "1995-08-22", "2018"],
    ["Ruwan Silva",     "BOC003", "Head Office",   "Badminton",           "M", "1988-11-03", "2012"],
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...samples]);

  const hStyle = headerStyle(PURPLE);
  headers.forEach((_, i) => {
    const ref = XLSX.utils.encode_cell({ r: 0, c: i });
    ws[ref].s = hStyle;
  });

  const sStyle = sampleStyle();
  samples.forEach((row, ri) => {
    row.forEach((_, ci) => {
      const ref = XLSX.utils.encode_cell({ r: ri + 1, c: ci });
      ws[ref].s = sStyle;
    });
  });

  ws["!cols"] = [
    { wch: 28 }, // full_name
    { wch: 14 }, // employee_id
    { wch: 20 }, // branch
    { wch: 24 }, // sport
    { wch: 8 },  // gender
    { wch: 14 }, // date_of_birth
    { wch: 12 }, // joined_year
  ];
  ws["!rows"] = [{ hpt: 22 }, { hpt: 18 }, { hpt: 18 }, { hpt: 18 }];

  XLSX.utils.book_append_sheet(wb, ws, "Players");

  XLSX.writeFile(wb, join(OUT_DIR, "BOC_Players_Import_Template.xlsx"), { bookSST: false, type: "buffer", cellStyles: true });
  console.log("✅  BOC_Players_Import_Template.xlsx created");
}

// ── 2. Results Template ────────────────────────────────────────────────────

function buildResultsTemplate() {
  const wb = XLSX.utils.book_new();

  // Instructions sheet
  const instr = XLSX.utils.aoa_to_sheet([
    ["BOC Sports Society — Results Import Template"],
    [""],
    ["HOW TO FILL THIS FILE"],
    [""],
    ["1. Fill in the RESULTS sheet. Do NOT change column headers."],
    ["2. Each row = ONE player's result in ONE discipline of ONE event."],
    ["   If a player competed in 3 events, add 3 rows."],
    ["   If a player competed in 2 disciplines at the same event, add 2 rows."],
    ["3. player_employee_id must match the employee_id from the Players file exactly."],
    ["4. Columns in LIGHT PURPLE are optional — leave blank if not applicable."],
    ["5. Delete the sample rows before uploading."],
    [""],
    ["REQUIRED FIELDS"],
    ["event_name          — Full name of the event (e.g. BOC Inter-Province Meet 2023)"],
    ["event_type          — See allowed values below"],
    ["event_date          — YYYY-MM-DD"],
    ["player_employee_id  — Must match employee_id in Players file"],
    ["gender              — M or F  (gender category for this result)"],
    ["place               — 1 / 2 / 3 / participated"],
    [""],
    ["OPTIONAL FIELDS (light purple columns)"],
    ["event_location      — Venue (e.g. Sugathadasa Stadium)"],
    ["sport               — Sport for this result (e.g. Athletics). Defaults to player's sport."],
    ["discipline          — Specific event (e.g. 100m Sprint, Long Jump, Shot Put)"],
    ["age_category        — Age group (e.g. Open, U23, Masters, Veterans)"],
    ["performance         — Result value (e.g. 11.52s, 6.45m, 14.20m)"],
    ["best_athlete        — yes or no  (default: no)"],
    ["meet_record         — yes or no  (default: no)"],
    [""],
    ["ALLOWED VALUES FOR event_type"],
    ["   inter_province    — Inter-Province BOC Athletic Meet"],
    ["   nationalized      — Nationalized Services Meet"],
    ["   coaching_camp     — Coaching Camp"],
    ["   local             — Local Event"],
    ["   international     — International Event"],
    [""],
    ["ALLOWED VALUES FOR place"],
    ["   1                 — 1st Place"],
    ["   2                 — 2nd Place"],
    ["   3                 — 3rd Place"],
    ["   participated      — Participated (no placement)"],
    [""],
    ["MARKS REFERENCE"],
    ["Inter-Province:  participation=3, 1st=+3, 2nd=+2, 3rd=+1"],
    ["Nationalized:    participation=5, 1st=+5, 2nd=+3, 3rd=+1"],
    ["Other events:    flat 5 marks for participation"],
    ["Best Athlete:    +3 marks on top"],
    ["Meet Record:     +2 marks on top"],
  ]);

  instr["A1"].s = { font: { bold: true, sz: 14, color: { rgb: TEAL } } };
  instr["A3"].s = { font: { bold: true, sz: 11 } };
  instr["A13"].s = { font: { bold: true, sz: 11 } };
  instr["A21"].s = { font: { bold: true, sz: 11 } };
  instr["A29"].s = { font: { bold: true, sz: 11 } };
  instr["A37"].s = { font: { bold: true, sz: 11 } };
  instr["A43"].s = { font: { bold: true, sz: 11 } };
  instr["!cols"] = [{ wch: 80 }];

  XLSX.utils.book_append_sheet(wb, instr, "Instructions");

  // Results data sheet
  // Required columns (purple header), Optional columns (light purple header)
  const requiredCols = [
    "event_name",
    "event_type",
    "event_date",
    "player_employee_id",
    "gender",
    "place",
  ];
  const optionalCols = [
    "event_location",
    "sport",
    "discipline",
    "age_category",
    "performance",
    "best_athlete",
    "meet_record",
  ];
  const headers = [...requiredCols, ...optionalCols];

  const samples = [
    // player in 100m sprint, inter-province, 1st place
    [
      "BOC Inter-Province Meet 2023", "inter_province", "2023-09-10",
      "BOC001", "M", "1",
      "Sugathadasa Stadium", "Athletics", "100m Sprint", "Open", "10.85s", "no", "no",
    ],
    // same player in Long Jump at same event
    [
      "BOC Inter-Province Meet 2023", "inter_province", "2023-09-10",
      "BOC001", "M", "2",
      "Sugathadasa Stadium", "Athletics", "Long Jump", "Open", "6.45m", "no", "no",
    ],
    // female player, nationalized meet, best athlete
    [
      "Nationalized Services Meet 2023", "nationalized", "2023-10-15",
      "BOC002", "F", "1",
      "Kandy", "Athletics", "400m", "Open", "58.30s", "yes", "no",
    ],
    // coaching camp — just participation, no discipline needed
    [
      "Athletics Coaching Camp 2023", "coaching_camp", "2023-07-05",
      "BOC003", "M", "participated",
      "Colombo", "", "", "", "", "no", "no",
    ],
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...samples]);

  // Required headers — purple
  const hStyle = headerStyle(TEAL);
  requiredCols.forEach((_, i) => {
    const ref = XLSX.utils.encode_cell({ r: 0, c: i });
    ws[ref].s = hStyle;
  });

  // Optional headers — light purple
  const optStyle = optionalHeaderStyle();
  optionalCols.forEach((_, i) => {
    const ref = XLSX.utils.encode_cell({ r: 0, c: requiredCols.length + i });
    ws[ref].s = optStyle;
  });

  // Sample rows — grey italic
  const sStyle = sampleStyle();
  samples.forEach((row, ri) => {
    row.forEach((_, ci) => {
      const ref = XLSX.utils.encode_cell({ r: ri + 1, c: ci });
      ws[ref].s = sStyle;
    });
  });

  ws["!cols"] = [
    { wch: 36 }, // event_name
    { wch: 16 }, // event_type
    { wch: 13 }, // event_date
    { wch: 20 }, // player_employee_id
    { wch: 8 },  // gender
    { wch: 14 }, // place
    { wch: 22 }, // event_location  (optional)
    { wch: 16 }, // sport           (optional)
    { wch: 20 }, // discipline      (optional)
    { wch: 14 }, // age_category    (optional)
    { wch: 14 }, // performance     (optional)
    { wch: 13 }, // best_athlete    (optional)
    { wch: 13 }, // meet_record     (optional)
  ];
  ws["!rows"] = [{ hpt: 22 }, ...samples.map(() => ({ hpt: 18 }))];

  XLSX.utils.book_append_sheet(wb, ws, "Results");

  XLSX.writeFile(wb, join(OUT_DIR, "BOC_Results_Import_Template.xlsx"), { bookSST: false, type: "buffer", cellStyles: true });
  console.log("✅  BOC_Results_Import_Template.xlsx created");
}

// ── Run ────────────────────────────────────────────────────────────────────
buildPlayersTemplate();
buildResultsTemplate();
console.log("\nDone. Both files saved to the boc-sports/ folder.");
