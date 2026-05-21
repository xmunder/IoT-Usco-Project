import { SENSOR_DEFINITIONS, getSensorDefinition } from '../shared/sensor-definitions.js';

function createDefaultGauge(options) {
  if (typeof globalThis.JustGage !== 'function') {
    throw new Error('JustGage no está disponible. Verificá que raphael y justgage carguen antes de main.js.');
  }

  return new globalThis.JustGage(options);
}

function parseNumericReading(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : null;
  }

  return null;
}

export function formatReading(value, fallbackText = '--', decimals = 2) {
  const numericValue = parseNumericReading(value);
  return numericValue === null ? fallbackText : numericValue.toFixed(decimals);
}

export function getGaugeReading(value, fallbackValue = 0) {
  const numericValue = parseNumericReading(value);
  return numericValue === null ? fallbackValue : numericValue;
}

export function createGaugeManager({
  document = globalThis.document,
  definitions = SENSOR_DEFINITIONS,
  gaugeFactory = createDefaultGauge
} = {}) {
  if (!document) {
    throw new Error('Document requerido para crear GaugeManager.');
  }

  const gauges = new Map();

  function ensureGauge(definition) {
    if (gauges.has(definition.key)) {
      return gauges.get(definition.key);
    }

    const gaugeElement = document.getElementById(definition.gaugeId);
    if (!gaugeElement) {
      return null;
    }

    if (gaugeElement.closest('[hidden]')) {
      return null;
    }

    const gauge = gaugeFactory({
      id: definition.gaugeId,
      pointer: true,
      min: definition.min,
      max: definition.max,
      decimals: definition.decimals,
      title: definition.title,
      customSectors: definition.customSectors
    });

    gauges.set(definition.key, gauge);
    return gauge;
  }

  return {
    render(sensorKey, reading) {
      const definition = getSensorDefinition(sensorKey) ?? definitions.find((item) => item.key === sensorKey);

      if (!definition) {
        throw new Error(`Sensor desconocido: ${sensorKey}`);
      }

      const valueElement = document.querySelector(definition.valueSelector);
      if (valueElement) {
        valueElement.textContent = formatReading(reading, definition.fallbackText, definition.decimals);
      }

      ensureGauge(definition)?.refresh(getGaugeReading(reading, definition.fallbackValue));
    },

    renderAllFallback() {
      definitions.forEach((definition) => {
        this.render(definition.key, null);
      });
    }
  };
}
