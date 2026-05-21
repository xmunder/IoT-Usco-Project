const HUMIDITY_SECTORS = [
  { color: '#00ff00', lo: 0, hi: 50 },
  { color: '#ff0000', lo: 50, hi: 100 }
];

const TEMPERATURE_SECTORS = [
  { color: '#00ff00', lo: 0, hi: 50 },
  { color: '#ff0000', lo: 50, hi: 120 }
];

const DISTANCE_SECTORS = [
  { color: '#00ff00', lo: 0, hi: 50 },
  { color: '#ff0000', lo: 50, hi: 100 }
];

const AIR_QUALITY_SECTORS = [
  { color: '#00ff00', lo: 0, hi: 100 },
  { color: '#ff0000', lo: 100, hi: 1500 }
];

export const SENSOR_DEFINITIONS = Object.freeze([
  {
    key: 'temperature',
    title: 'Temperatura',
    unit: '°C',
    valueSelector: '[data-sensor-value="temperature"]',
    gaugeId: 'gauge-temperature',
    min: 0,
    max: 120,
    decimals: 2,
    fallbackText: '--',
    fallbackValue: 0,
    customSectors: TEMPERATURE_SECTORS
  },
  {
    key: 'humidity',
    title: 'Humedad',
    unit: '%',
    valueSelector: '[data-sensor-value="humidity"]',
    gaugeId: 'gauge-humidity',
    min: 0,
    max: 100,
    decimals: 2,
    fallbackText: '--',
    fallbackValue: 0,
    customSectors: HUMIDITY_SECTORS
  },
  {
    key: 'distance',
    title: 'Distancia',
    unit: 'CM',
    valueSelector: '[data-sensor-value="distance"]',
    gaugeId: 'gauge-distance',
    min: 0,
    max: 100,
    decimals: 2,
    fallbackText: '--',
    fallbackValue: 0,
    customSectors: DISTANCE_SECTORS
  },
  {
    key: 'co2',
    title: 'CO2 en el aire',
    unit: 'PPM',
    valueSelector: '[data-sensor-value="co2"]',
    gaugeId: 'gauge-co2',
    min: 0,
    max: 1500,
    decimals: 2,
    fallbackText: '--',
    fallbackValue: 0,
    customSectors: AIR_QUALITY_SECTORS
  },
  {
    key: 'alcohol',
    title: 'Alcohol en el aire',
    unit: 'PPM',
    valueSelector: '[data-sensor-value="alcohol"]',
    gaugeId: 'gauge-alcohol',
    min: 0,
    max: 300,
    decimals: 2,
    fallbackText: '--',
    fallbackValue: 0,
    customSectors: [
      { color: '#00ff00', lo: 0, hi: 100 },
      { color: '#ff0000', lo: 100, hi: 300 }
    ]
  },
  {
    key: 'co',
    title: 'CO en el aire',
    unit: 'PPM',
    valueSelector: '[data-sensor-value="co"]',
    gaugeId: 'gauge-co',
    min: 0,
    max: 300,
    decimals: 2,
    fallbackText: '--',
    fallbackValue: 0,
    customSectors: [
      { color: '#00ff00', lo: 0, hi: 100 },
      { color: '#ff0000', lo: 100, hi: 300 }
    ]
  }
]);

const SENSOR_MAP = new Map(SENSOR_DEFINITIONS.map((definition) => [definition.key, definition]));

export function getSensorDefinition(sensorKey) {
  return SENSOR_MAP.get(sensorKey);
}
