import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import Recorder from '../Recorder';

test('renders microphone button', () => {
  render(<Recorder onText={vi.fn()} />);
  expect(screen.getByLabelText(/start recording/i)).toBeInTheDocument();
});
