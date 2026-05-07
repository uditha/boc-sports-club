export type EventType =
  | "inter_province"
  | "nationalized"
  | "coaching_camp"
  | "local"
  | "international";

export type Place = "1" | "2" | "3" | "participated";

export function calculateMarks(
  eventType: EventType,
  place: Place,
  bestAthlete: boolean,
  meetRecord: boolean
): number {
  let marks = 0;

  if (eventType === "inter_province") {
    marks += 3; // participation base
    if (place === "1") marks += 3;
    else if (place === "2") marks += 2;
    else if (place === "3") marks += 1;
  } else if (eventType === "nationalized") {
    marks += 5; // participation base
    if (place === "1") marks += 5;
    else if (place === "2") marks += 3;
    else if (place === "3") marks += 1;
  } else {
    // coaching_camp, local, international = flat 5
    marks += 5;
  }

  if (bestAthlete) marks += 3;
  if (meetRecord) marks += 2;

  return marks;
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  inter_province: "Inter-Province BOC Meet",
  nationalized: "Nationalized Services Meet",
  coaching_camp: "Coaching Camp",
  local: "Local Event",
  international: "International Event",
};

export const PLACE_LABELS: Record<Place, string> = {
  "1": "1st Place",
  "2": "2nd Place",
  "3": "3rd Place",
  participated: "Participated",
};
