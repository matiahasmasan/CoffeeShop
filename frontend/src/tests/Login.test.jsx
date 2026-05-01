import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Login from '../pages/Login';

const mockNavigate = vi.fn();

// Mock because Login uses useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate, 
  };
});

// Mock for localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
vi.stubGlobal('localStorage', localStorageMock);

// Mock the global fetch function
global.fetch = vi.fn();

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders the title and form correctly', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    // Verify if elements exist on the screen
    expect(screen.getByText('CoffeeShop')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });

  test('calls the API and logs in successfully', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        succes: true, 
        success: true,
        token: 'fake-jwt-token',
        user: { id: 1, email: 'test@test.com', role_id: 2 } 
      }),
    });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'parola123' } });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    // Assert: Verify asynchronous actions
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/login'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'test@test.com', password: 'parola123' }),
        })
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'fake-jwt-token');
      expect(mockNavigate).toHaveBeenCalled();
    });
  });

  test('displays an error when credentials are invalid', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Incorrect username or password.' }),
    });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'gresit@test.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'gresita' } });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(screen.getByText(/incorrect username or password/i)).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
