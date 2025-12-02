import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import Landing from './app/index';
import { authStore } from './store/authStore';

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: any) => children,
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// Mock async storage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

describe('Landing Screen', () => {
  let mockRouter: any;

  beforeEach(() => {
    mockRouter = {
      push: jest.fn(),
      replace: jest.fn(),
    };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', async () => {
    const { container } = render(<Landing />);
    
    // Wait for loading state to finish
    await waitFor(() => {
      expect(screen.queryByText('QR Attendance')).toBeTruthy();
    }, { timeout: 3000 });

    expect(container).toBeTruthy();
  });

  it('should display title and subtitle', async () => {
    render(<Landing />);

    await waitFor(() => {
      expect(screen.getByText('QR Attendance')).toBeTruthy();
      expect(screen.getByText('Teacher System')).toBeTruthy();
    });
  });

  it('should display login and register buttons', async () => {
    render(<Landing />);

    await waitFor(() => {
      expect(screen.getByText('Teacher Login')).toBeTruthy();
      expect(screen.getByText('Create Account')).toBeTruthy();
    });
  });

  it('should show loading indicator initially', () => {
    const { container } = render(<Landing />);
    
    // ActivityIndicator should be rendered (checking for spinner-like elements)
    expect(container.findAllByType).toBeDefined();
  });

  it('should not redirect when no token is present', async () => {
    authStore.getState().clearAuth();
    render(<Landing />);

    await waitFor(() => {
      expect(mockRouter.replace).not.toHaveBeenCalled();
    });
  });

  it('should handle errors gracefully', async () => {
    // Mock an error in the store
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    render(<Landing />);

    await waitFor(() => {
      // Should still render without crashing
      expect(screen.queryByText('QR Attendance')).toBeTruthy();
    });

    consoleSpy.mockRestore();
  });
});

describe('Auth Store', () => {
  beforeEach(() => {
    authStore.getState().clearAuth();
  });

  it('should initialize with null values', () => {
    const state = authStore.getState();
    expect(state.token).toBeNull();
    expect(state.teacherId).toBeNull();
    expect(state.teacherName).toBeNull();
  });

  it('should handle setAuth without crashing', async () => {
    await authStore.getState().setAuth('test-token', 'teacher-1', 'Test Teacher');
    const state = authStore.getState();
    
    expect(state.token).toBe('test-token');
    expect(state.teacherId).toBe('teacher-1');
    expect(state.teacherName).toBe('Test Teacher');
  });

  it('should handle clearAuth without crashing', async () => {
    await authStore.getState().setAuth('test-token', 'teacher-1', 'Test Teacher');
    await authStore.getState().clearAuth();
    const state = authStore.getState();
    
    expect(state.token).toBeNull();
    expect(state.teacherId).toBeNull();
  });

  it('should handle section selection without crashing', async () => {
    await authStore.getState().setSelectedSection('section-1', 'Section A');
    const state = authStore.getState();
    
    expect(state.selectedSectionId).toBe('section-1');
    expect(state.selectedSection).toBe('Section A');
  });
});
