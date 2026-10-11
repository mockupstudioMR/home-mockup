import type { ComponentType } from "react";
import type { ScreenId } from "../routes";
import { Brief, Place, Rooms, StartRoom, StateOfPlace, WhoAreYou, Why } from "./Step1";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- screens take an optional route param
export const SCREEN_COMPONENTS: Partial<Record<ScreenId, ComponentType<any>>> = {
  Main: WhoAreYou,
  "S1-Why": Why,
  "S1-Place": Place,
  "S1-Rooms": Rooms,
  "S1-Start": StartRoom,
  "S1-State": StateOfPlace,
  "S1-Summary": Brief,
};
