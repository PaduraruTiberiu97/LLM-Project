import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import ChatWindow from '../ChatWindow';

vi.mock('@/lib/user', () => ({
  getUserId: () => 'test-user'
}));

beforeEach(() => {
  global.fetch = vi.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
  ) as any;
});

test('renders prompt when no messages', () => {
  render(<ChatWindow />);
  expect(screen.getByText(/What can I help you with\?/i)).toBeInTheDocument();
});
