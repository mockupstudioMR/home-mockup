import type { ComponentType } from "react";
import type { ScreenId } from "../routes";
import { Brief, Place, Rooms, StartRoom, StateOfPlace, WhoAreYou, Why } from "./Step1";
import { Activities, Existing, Fixed, Priorities, Step3Summary } from "./Step3";
import { Layouts, Measure, RoomInput, Step4Summary } from "./Step4";
import { Anchor, Shops, Step5Summary } from "./Step5";
import { Lighting, Palette, Step6Summary, Step7Summary } from "./Step67";
import { Step8Summary, WallDetail, Walls } from "./Step8";
import { BuyList, Final, Sizes, Step9Summary, Todo } from "./Step910";
import { Adjust, Analyzing, Matches, Moodboard, Preview, Step2Summary, Upload, Vision } from "./Step2";

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
  "S2-Preview": Preview,
  "S2-Adjust": Adjust,
  "S2-Summary": Step2Summary,
  "S3-Activities": Activities,
  "S3-Priorities": Priorities,
  "S3-Existing": Existing,
  "S3-Fixed": Fixed,
  "S3-Summary": Step3Summary,
  "S4-Input": RoomInput,
  "S4-Measure": Measure,
  "S4-Layouts": Layouts,
  "S4-Summary": Step4Summary,
  "S5-Shops": Shops,
  "S5-Anchor": Anchor,
  "S5-Summary": Step5Summary,
  "S6-Palette": Palette,
  "S6-Summary": Step6Summary,
  "S7-Lighting": Lighting,
  "S7-Summary": Step7Summary,
  "S8-Walls": Walls,
  "S8-WallDetail": WallDetail,
  "S8-Summary": Step8Summary,
  "S9-BuyList": BuyList,
  "S9-Sizes": Sizes,
  "S9-Todo": Todo,
  "S9-Summary": Step9Summary,
  "S10-Final": Final,
};
