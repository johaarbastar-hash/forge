import { fireEvent, render, screen, waitForElementToBeRemoved } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Button } from './Button';
import { ToastProvider, useToast } from './Toast';

function Trigger() {
  const { showToast } = useToast();
  return <Button onClick={() => showToast('Meal saved', 'success')}>Save</Button>;
}

describe('Toast', () => {
  it('shows a toast when triggered and dismisses on demand', async () => {
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('Meal saved')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }));
    // the exit animation keeps the node mounted briefly
    await waitForElementToBeRemoved(() => screen.queryByText('Meal saved'), { timeout: 3000 });
  });

  it('throws when useToast is used outside the provider', () => {
    expect(() => render(<Trigger />)).toThrowError(/within <ToastProvider>/);
  });
});
