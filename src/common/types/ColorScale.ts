import type { ColorScaleGradientNode } from "./ColorScaleGradientNode";

export type ColorScale =
  {
    id: string;
    name: string;
    colorScale: {
      gradient: ColorScaleGradientNode[];
      mirror: boolean;
    }
  }
