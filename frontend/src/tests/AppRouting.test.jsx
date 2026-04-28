import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, test, expect, vi } from 'vitest';
import Login from '../pages/Login';

// Mock for localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
vi.stubGlobal('localStorage', localStorageMock);

// Mock the fetch API globally since Login uses it
global.fetch = vi.fn();

describe('Application Routing', () => {
  test('navigates and renders the Login page at /login', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
          {/* can be added more routes here */}
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('CoffeeShop')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });

  test('renders a 404 or empty page for unknown routes', () => {
    render(
      <MemoryRouter initialEntries={['/unknown-route-123']}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<div>404 Not Found</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/404 Not Found/i)).toBeInTheDocument();
  });
});