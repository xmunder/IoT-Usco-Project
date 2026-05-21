import { describe, expect, jest, test } from '@jest/globals';

import { createDashboardController } from '../../main/public/scripts/app/dashboard-controller.js';

describe('createDashboardController', () => {
  test('cleans up listeners on re-auth and binds power controls', async () => {
    document.body.innerHTML = `
      <button data-toggle-status="ON" type="button">ON</button>
      <button data-toggle-status="OFF" type="button">OFF</button>
      <div class="power-visual" data-power-state="OFF">
        <svg><defs><linearGradient><stop data-power-indicator stop-color="#110000"></stop><stop data-power-indicator-secondary stop-color="#3a0508"></stop></linearGradient></defs><circle data-power-bulb fill="#3b0508"></circle></svg>
      </div>
    `;

    const authView = { render: jest.fn() };
    const gaugeManager = { render: jest.fn(), renderAllFallback: jest.fn() };
    const unsubscribeByKey = {};
    const repository = {
      subscribe: jest.fn((uid, sensorKey, onReading) => {
        unsubscribeByKey[`${uid}:${sensorKey}`] = { unsubscribe: jest.fn(), onReading };
        return unsubscribeByKey[`${uid}:${sensorKey}`].unsubscribe;
      }),
      getToggleStatus: jest.fn().mockResolvedValue('ON'),
      subscribeToggleStatus: jest.fn((uid, onReading) => {
        unsubscribeByKey[`${uid}:toggleStatus`] = { unsubscribe: jest.fn(), onReading };
        return unsubscribeByKey[`${uid}:toggleStatus`].unsubscribe;
      }),
      setToggleStatus: jest.fn().mockResolvedValue(undefined)
    };
    const controller = createDashboardController({
      document,
      authView,
      gaugeManager,
      sensorRepository: repository,
      sensorDefinitions: [
        { key: 'temperature' },
        { key: 'humidity' }
      ]
    });

    controller.start({ uid: 'user-1' });
    await Promise.resolve();
    await Promise.resolve();

    expect(repository.getToggleStatus).toHaveBeenCalledWith('user-1');
    expect(document.querySelector('.power-visual').getAttribute('data-power-state')).toBe('ON');
    expect(document.querySelector('[data-power-bulb]').getAttribute('fill')).toBe('#d90429');

    unsubscribeByKey['user-1:temperature'].onReading(21.5);
    expect(gaugeManager.render).toHaveBeenCalledWith('temperature', 21.5);

    document.querySelector('[data-toggle-status="ON"]').click();
    await Promise.resolve();

    expect(repository.setToggleStatus).toHaveBeenCalledWith('user-1', 'ON');
    expect(document.querySelector('[data-power-indicator]').getAttribute('stop-color')).toBe('#ff0000');
    expect(document.querySelector('[data-power-indicator-secondary]').getAttribute('stop-color')).toBe('#ff6b6b');
    expect(document.querySelector('[data-power-bulb]').getAttribute('fill')).toBe('#d90429');
    expect(document.querySelector('.power-visual').getAttribute('data-power-state')).toBe('ON');
    expect(document.querySelector('[data-toggle-status="ON"]').getAttribute('data-active')).toBe('true');
    expect(document.querySelector('[data-toggle-status="OFF"]').getAttribute('data-active')).toBe('false');

    unsubscribeByKey['user-1:toggleStatus'].onReading('OFF');
    expect(document.querySelector('[data-power-indicator]').getAttribute('stop-color')).toBe('#110000');
    expect(document.querySelector('[data-power-bulb]').getAttribute('fill')).toBe('#3b0508');
    expect(document.querySelector('.power-visual').getAttribute('data-power-state')).toBe('OFF');

    unsubscribeByKey['user-1:toggleStatus'].onReading('ON');
    expect(document.querySelector('[data-power-indicator]').getAttribute('stop-color')).toBe('#ff0000');
    expect(document.querySelector('[data-toggle-status="ON"]').getAttribute('aria-pressed')).toBe('true');

    controller.start({ uid: 'user-2' });

    expect(unsubscribeByKey['user-1:temperature'].unsubscribe).toHaveBeenCalled();
    expect(unsubscribeByKey['user-1:humidity'].unsubscribe).toHaveBeenCalled();
    expect(unsubscribeByKey['user-1:toggleStatus'].unsubscribe).toHaveBeenCalled();

    controller.dispose();
    document.querySelector('[data-toggle-status="OFF"]').click();
    await Promise.resolve();

    expect(authView.render).toHaveBeenLastCalledWith(null);
    expect(gaugeManager.renderAllFallback).toHaveBeenCalled();
    expect(repository.setToggleStatus).toHaveBeenCalledTimes(1);
    expect(document.querySelector('[data-toggle-status="OFF"]').getAttribute('data-active')).toBe('true');
  });
});
