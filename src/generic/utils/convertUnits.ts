import { Unit } from "@/common/stores/useUserSettingsStore";

export const convertUnits = (value: number, unitFrom: Unit, unitTo: Unit) =>
{
  if (unitFrom === unitTo) return value;

  const valueInMeters = value / getUnitConversionFactor(unitFrom);
  return valueInMeters * getUnitConversionFactor(unitTo);
};

const getUnitConversionFactor = (unit: Unit): number =>
{
  switch (unit)
  {
    case Unit.CENTIMETERS:
      return 100; // 1 m = 100 cm
    case Unit.METERS:
      return 1; // base unit
    case Unit.FEET:
      return 3.28084; // 1 m = 3.28084 ft
    case Unit.INCHES:
      return 39.3701; // 1 m = 39.3701 in
    default:
      throw new Error(`Unit ${unit} not recognized`);
  }
};
