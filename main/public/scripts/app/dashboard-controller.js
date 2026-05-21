import { SENSOR_DEFINITIONS } from '../shared/sensor-definitions.js';

const POWER_LED_COLORS = Object.freeze({
  ON: '#ff0000',
  OFF: '#110000'
});

const POWER_BULB_FILLS = Object.freeze({
  ON: '#d90429',
  OFF: '#3b0508'
});

const POWER_LED_SECONDARY_COLORS = Object.freeze({
  ON: '#ff6b6b',
  OFF: '#3a0508'
});

function normalizeToggleStatus(status) {
  return typeof status === 'string' ? status.replaceAll('"', '').trim().toUpperCase() : '';
}

function toDisposer(candidate) {
  return typeof candidate === 'function' ? candidate : () => {};
}

export function createDashboardController({
  document = globalThis.document,
  authView,
  gaugeManager,
  sensorRepository,
  sensorDefinitions = SENSOR_DEFINITIONS,
  showMessage = () => {}
} = {}) {
  if (!authView || !gaugeManager || !sensorRepository) {
    throw new Error('DashboardController requiere authView, gaugeManager y sensorRepository.');
  }

  let unsubscribeBag = [];
  let domDisposers = [];
  let powerStateRequestId = 0;

  const setPowerIndicator = (status) => {
    const normalizedStatus = normalizeToggleStatus(status);
    const indicator = document?.querySelector?.('[data-power-indicator]');
    const secondaryIndicator = document?.querySelector?.('[data-power-indicator-secondary]');
    const bulb = document?.querySelector?.('[data-power-bulb]');
    const visual = document?.querySelector?.('.power-visual');

    if (indicator) {
      indicator.setAttribute('stop-color', POWER_LED_COLORS[normalizedStatus] ?? POWER_LED_COLORS.OFF);
    }

    if (secondaryIndicator) {
      secondaryIndicator.setAttribute('stop-color', POWER_LED_SECONDARY_COLORS[normalizedStatus] ?? POWER_LED_SECONDARY_COLORS.OFF);
    }

    if (bulb) {
      bulb.setAttribute('fill', POWER_BULB_FILLS[normalizedStatus] ?? POWER_BULB_FILLS.OFF);
    }

    if (visual) {
      visual.setAttribute('data-power-state', normalizedStatus || 'PENDING');
    }
  };

  const setPowerButtonsState = (status) => {
    ['ON', 'OFF'].forEach((buttonStatus) => {
      const button = document?.querySelector?.(`[data-toggle-status="${buttonStatus}"]`);
      if (!button) {
        return;
      }

      const isActive = buttonStatus === status;
      button.setAttribute('data-active', String(isActive));
      button.setAttribute('aria-pressed', String(isActive));
    });
  };

  const syncPowerUi = (status) => {
    const normalizedStatus = normalizeToggleStatus(status);
    setPowerIndicator(normalizedStatus);
    setPowerButtonsState(normalizedStatus);
  };

  const clearSubscriptions = () => {
    unsubscribeBag.forEach((dispose) => dispose());
    unsubscribeBag = [];
  };

  const clearDomBindings = () => {
    domDisposers.forEach((dispose) => dispose());
    domDisposers = [];
  };

  const bindPowerButton = (uid, status) => {
    const button = document?.querySelector?.(`[data-toggle-status="${status}"]`);
    if (!button) {
      return;
    }

    const onClick = async (event) => {
      event.preventDefault();

      try {
        await sensorRepository.setToggleStatus(uid, status);
        syncPowerUi(status);
      } catch (error) {
        showMessage(error?.message ?? 'No se pudo actualizar la etapa de potencia.', 'error');
      }
    };

    button.addEventListener('click', onClick);
    domDisposers.push(() => button.removeEventListener('click', onClick));
  };

  return {
    start(user) {
      powerStateRequestId += 1;
      const currentRequestId = powerStateRequestId;

      clearSubscriptions();
      clearDomBindings();
      authView.render(user);
      gaugeManager.renderAllFallback?.();

      if (!user?.uid) {
        syncPowerUi('OFF');
        return;
      }

      bindPowerButton(user.uid, 'ON');
      bindPowerButton(user.uid, 'OFF');

      syncPowerUi('');

      sensorRepository.getToggleStatus?.(user.uid)
        .then((status) => {
          if (currentRequestId !== powerStateRequestId) {
            return;
          }

          syncPowerUi(status);
        })
        .catch((error) => {
          if (currentRequestId !== powerStateRequestId) {
            return;
          }

          showMessage(error?.message ?? 'No se pudo leer el estado inicial de la etapa de potencia.', 'error');
        });

      unsubscribeBag.push(
        toDisposer(
          sensorRepository.subscribeToggleStatus?.(user.uid, (status) => {
            syncPowerUi(status);
          })
        )
      );

      unsubscribeBag.push(
        ...sensorDefinitions.map(({ key }) =>
          toDisposer(
            sensorRepository.subscribe(user.uid, key, (reading) => {
              gaugeManager.render(key, reading);
            })
          )
        )
      );
    },

    dispose() {
      powerStateRequestId += 1;
      clearSubscriptions();
      clearDomBindings();
      authView.render(null);
      gaugeManager.renderAllFallback?.();
      syncPowerUi('OFF');
    }
  };
}
