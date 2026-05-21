import { describe, expect, jest, test } from '@jest/globals';

import {
  buildSensorPath,
  buildToggleStatusPath,
  createSensorRepository
} from '../../main/public/scripts/services/sensor-repository.js';

describe('createSensorRepository', () => {
  test('subscribes to uid-scoped sensor paths', () => {
    const unsubscribe = jest.fn();
    const client = {
      subscribe: jest.fn(() => unsubscribe),
      get: jest.fn(),
      set: jest.fn()
    };
    const repository = createSensorRepository(client);
    const callback = jest.fn();

    const result = repository.subscribe('user-1', 'temperature', callback);

    expect(client.subscribe).toHaveBeenCalledWith('UsersData/user-1/temperature', callback);
    expect(result).toBe(unsubscribe);
  });

  test('writes valid toggle states only', async () => {
    const client = {
      subscribe: jest.fn(),
      get: jest.fn().mockResolvedValue('ON'),
      set: jest.fn().mockResolvedValue(undefined)
    };
    const repository = createSensorRepository(client);

    await repository.setToggleStatus('user-1', 'ON');

    const callback = jest.fn();
    repository.subscribeToggleStatus('user-1', callback);
    await expect(repository.getToggleStatus('user-1')).resolves.toBe('ON');

    expect(client.set).toHaveBeenCalledWith('UsersData/user-1/toggleStatus/status', 'ON');
    expect(client.subscribe).toHaveBeenCalledWith('UsersData/user-1/toggleStatus/status', callback);
    expect(client.get).toHaveBeenCalledWith('UsersData/user-1/toggleStatus/status');
    await expect(repository.setToggleStatus('user-1', 'BAD')).rejects.toThrow('Toggle status inválido');
    expect(buildSensorPath('user-1', 'co2')).toBe('UsersData/user-1/co2');
    expect(buildToggleStatusPath('user-1')).toBe('UsersData/user-1/toggleStatus/status');
  });
});
