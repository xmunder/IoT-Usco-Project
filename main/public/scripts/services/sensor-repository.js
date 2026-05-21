const ROOT_PATH = 'UsersData';
const VALID_TOGGLE_STATES = new Set(['ON', 'OFF']);

export function buildSensorPath(uid, sensorKey) {
  return `${ROOT_PATH}/${uid}/${sensorKey}`;
}

export function buildToggleStatusPath(uid) {
  return `${ROOT_PATH}/${uid}/toggleStatus/status`;
}

export function createSensorRepository(client) {
  if (!client?.subscribe || !client?.set || !client?.get) {
    throw new Error('Se requiere un cliente Firebase compatible para SensorRepository.');
  }

  return {
    subscribe(uid, sensorKey, onReading) {
      if (!uid) {
        throw new Error('UID requerido para suscribirse a sensores.');
      }

      return client.subscribe(buildSensorPath(uid, sensorKey), onReading);
    },

    subscribeToggleStatus(uid, onStatusChange) {
      if (!uid) {
        throw new Error('UID requerido para suscribirse a toggleStatus.');
      }

      return client.subscribe(buildToggleStatusPath(uid), onStatusChange);
    },

    async getToggleStatus(uid) {
      if (!uid) {
        throw new Error('UID requerido para leer toggleStatus.');
      }

      return client.get(buildToggleStatusPath(uid));
    },

    async setToggleStatus(uid, status) {
      if (!uid) {
        throw new Error('UID requerido para actualizar toggleStatus.');
      }

      if (!VALID_TOGGLE_STATES.has(status)) {
        throw new Error('Toggle status inválido. Usá ON u OFF.');
      }

      await client.set(buildToggleStatusPath(uid), status);
    }
  };
}
