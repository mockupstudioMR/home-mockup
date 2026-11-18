import { ShowroomHandoff } from "./ShowroomHandoff";
import type { ComponentType } from "react";
import type { ScreenId } from "../routes";
import { Brief, Place, Rooms, StartRoom, StateOfPlace, WhoAreYou, Why } from "./Step1";
import { Activities, Existing, Fixed, Step3Summary } from "./Step3";
import { Layouts, Measure, RoomInput, Step4Summary } from "./Step4";
import { Anchor, Shops, Step5Summary } from "./Step5";
import { WallShowroom, YourWalls } from "./Step5Walls";
import { BuyList, Sizes, Step9Summary, Todo } from "./Step910";
import { Analyzing, Matches, Moodboard, Step2Summary, Upload, Vision } from "./Step2";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- screens take an optional route param
export const SCREEN_COMPONENTS: Partial<Record<ScreenId, ComponentType<any>>> = {
  Main: WhoAreYou,
  "S1-Why": Why,
  "S1-Place": Place,
  "S1-Rooms": Rooms,
  "S1-Start": StartRoom,
  "S1-State": StateOfPlace,
  "S1-Summary": Brief,
  "S2-Vision": Vision,
  "S2-Upload": Upload,
  "S2-Analyzing": Analyzing,
  "S2-Matches": Matches,
  "S2-Moodboard": Moodboard,
  "S2-Summary": Step2Summary,
  "S3-Activities": Activities,
  "S3-Existing": Existing,
  "S3-Fixed": Fixed,
  "S3-Summary": Step3Summary,
  "S4-Input": RoomInput,
  "S4-Measure": Measure,
  "S4-Layouts": Layouts,
  "S4-Summary": Step4Summary,
  "S4-Showroom": ShowroomHandoff,
  "S5-Walls": YourWalls,
  "S5-Wall": WallShowroom,
  "S5-Shops": Shops,
  "S5-Anchor": Anchor,
  "S5-Summary": Step5Summary,
  "S9-BuyList": BuyList,
  "S9-Sizes": Sizes,
  "S9-Todo": Todo,
  "S9-Summary": Step9Summary,
};
