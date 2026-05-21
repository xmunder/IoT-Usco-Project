import { describe, expect, test } from '@jest/globals';

import { SENSOR_DEFINITIONS, getSensorDefinition } from '../../main/public/scripts/shared/sensor-definitions.js';

describe('SENSOR_DEFINITIONS', () => {
  test('contains the six dashboard sensors with unique selectors and gauges', () => {
    const keys = SENSOR_DEFINITIONS.map((definition) => definition.key);
    const selectors = SENSOR_DEFINITIONS.map((definition) => definition.valueSelector);
    const gaugeIds = SENSOR_DEFINITIONS.map((definition) => definition.gaugeId);

    expect(keys).toEqual(['temperature', 'humidity', 'distance', 'co2', 'alcohol', 'co']);
    expect(new Set(selectors).size).toBe(selectors.length);
    expect(new Set(gaugeIds).size).toBe(gaugeIds.length);
  });

  test('returns the definition metadata by sensor key', () => {
    expect(getSensorDefinition('temperature')).toMatchObject({
      key: 'temperature',
      gaugeId: 'gauge-temperature',
      fallbackText: '--'
    });
  });
});
