import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  it('should have initial null state', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
  });

  it('should set session correctly', () => {
    const session = {
      user: {
        id: '123',
        email: 'test@example.com',
        displayName: 'Test User',
        roles: ['user'],
      },
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    };

    useAuthStore.getState().setSession(session);

    const state = useAuthStore.getState();
    expect(state.user).toEqual(session.user);
    expect(state.accessToken).toBe(session.accessToken);
    expect(state.refreshToken).toBe(session.refreshToken);
  });

  it('should logout correctly', () => {
    const session = {
      user: {
        id: '123',
        email: 'test@example.com',
        displayName: 'Test User',
        roles: ['user'],
      },
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    };

    useAuthStore.getState().setSession(session);
    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
  });

  it('should update user correctly', () => {
    const session = {
      user: {
        id: '123',
        email: 'test@example.com',
        displayName: 'Test User',
        roles: ['user'],
      },
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    };

    useAuthStore.getState().setSession(session);
    useAuthStore.getState().updateUser({ displayName: 'New Name' });

    const state = useAuthStore.getState();
    expect(state.user?.displayName).toBe('New Name');
    expect(state.user?.email).toBe('test@example.com');
  });
});
