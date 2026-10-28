import type { JourneyState } from "../state";

/** Example room sides in metres, used until the person gives real ones. */
export const EX_W = 3.75;
export const EX_L = 4.9;

/** The room's wall A × wall B in metres, and whether those are still example sizes. */
export const roomSize = (s: JourneyState) => ({ w: s.room.widthM ?? EX_W, l: s.room.lengthM ?? EX_L, example: !s.room.confirmed });
