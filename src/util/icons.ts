import {
  mdiGestureTap,
  mdiLightbulb,
  mdiMemory,
  mdiThermometer,
  mdiToggleSwitch,
  mdiWindowShutter,
} from "@mdi/js";

export const moduleIconForType = (typeName = ""): string => {
  const type = typeName.toUpperCase();
  if (/PIR|TS\b|TEMP|METEO/.test(type)) {
    return mdiThermometer;
  }
  if (/1BL|2BL|2BLE|BLIND/.test(type)) {
    return mdiWindowShutter;
  }
  if (/RY|RELAY/.test(type)) {
    return mdiToggleSwitch;
  }
  if (/DM|4DC|DALI|DIM/.test(type)) {
    return mdiLightbulb;
  }
  if (/GP|PB|IN\b|EL|8P|6P|4P/.test(type)) {
    return mdiGestureTap;
  }
  return mdiMemory;
};
