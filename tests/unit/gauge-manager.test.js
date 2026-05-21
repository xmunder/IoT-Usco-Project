import { describe, expect, jest, test } from '@jest/globals';

import { createGaugeManager } from '../../main/public/scripts/ui/gauge-manager.js';

describe('createGaugeManager', () => {
  test('renders fallback text and gauge value for null readings', () => {
    document.body.innerHTML = `
      <sl-card class="sensor-card">
        <span data-sensor-value="temperature"></span>
        <div id="gauge-temperature"></div>
      </sl-card>
    `;

    const refresh = jest.fn();
    const manager = createGaugeManager({
      document,
      definitions: [
        {
          key: 'temperature',
          valueSelector: '[data-sensor-value="temperature"]',
          gaugeId: 'gauge-temperature',
          min: 0,
          max: 120,
          decimals: 2,
          fallbackText: '--',
          fallbackValue: 0,
          title: 'Temperatura',
          customSectors: []
        }
      ],
      gaugeFactory: () => ({ refresh })
    });

    manager.render('temperature', null);

    expect(document.querySelector('[data-sensor-value="temperature"]').textContent).toBe('--');
    expect(refresh).toHaveBeenCalledWith(0);
  });

  test('renders numeric readings safely', () => {
    document.body.innerHTML = `
      <sl-card class="sensor-card">
        <span data-sensor-value="co2"></span>
        <div id="gauge-co2"></div>
      </sl-card>
    `;

    const refresh = jest.fn();
    const manager = createGaugeManager({
      document,
      definitions: [
        {
          key: 'co2',
          valueSelector: '[data-sensor-value="co2"]',
          gaugeId: 'gauge-co2',
          min: 0,
          max: 1500,
          decimals: 2,
          fallbackText: '--',
          fallbackValue: 0,
          title: 'CO2',
          customSectors: []
        }
      ],
      gaugeFactory: () => ({ refresh })
    });

    manager.render('co2', '456.789');

    expect(document.querySelector('[data-sensor-value="co2"]').textContent).toBe('456.79');
    expect(refresh).toHaveBeenCalledWith(456.789);
  });

  test('delays gauge creation while container stays hidden', () => {
    document.body.innerHTML = `
      <sl-card hidden>
        <span data-sensor-value="humidity"></span>
        <div id="gauge-humidity"></div>
      </sl-card>
    `;

    const gaugeFactory = jest.fn(() => ({ refresh: jest.fn() }));
    const manager = createGaugeManager({
      document,
      definitions: [
        {
          key: 'humidity',
          valueSelector: '[data-sensor-value="humidity"]',
          gaugeId: 'gauge-humidity',
          min: 0,
          max: 100,
          decimals: 2,
          fallbackText: '--',
          fallbackValue: 0,
          title: 'Humedad',
          customSectors: []
        }
      ],
      gaugeFactory
    });

    manager.render('humidity', null);
    expect(gaugeFactory).not.toHaveBeenCalled();

    document.querySelector('sl-card').hidden = false;
    manager.render('humidity', 55);

    expect(gaugeFactory).toHaveBeenCalledTimes(1);
  });

  test('keeps JustGage rendering in sl-card light DOM', () => {
    document.body.innerHTML = `
      <sl-card class="sensor-card">
        <span data-sensor-value="distance"></span>
        <div id="gauge-distance"></div>
      </sl-card>
    `;

    const refresh = jest.fn();
    const gaugeFactory = jest.fn(() => ({ refresh }));
    const manager = createGaugeManager({
      document,
      definitions: [
        {
          key: 'distance',
          valueSelector: '[data-sensor-value="distance"]',
          gaugeId: 'gauge-distance',
          min: 0,
          max: 100,
          decimals: 2,
          fallbackText: '--',
          fallbackValue: 0,
          title: 'Distancia',
          customSectors: []
        }
      ],
      gaugeFactory
    });

    manager.render('distance', 18.2);

    expect(gaugeFactory).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'gauge-distance', title: 'Distancia' })
    );
    expect(refresh).toHaveBeenCalledWith(18.2);
  });
});
