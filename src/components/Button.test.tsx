import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Button } from './Button';

describe('Button', () => {
  it('fires onClick and defaults to type="button"', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Log a meal</Button>);
    const btn = screen.getByRole('button', { name: 'Log a meal' }) as HTMLButtonElement;
    expect(btn.type).toBe('button');
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not fire when disabled', () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Save
      </Button>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onClick).not.toHaveBeenCalled();
  });
});
