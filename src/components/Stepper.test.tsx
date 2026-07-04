import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Stepper } from './Stepper';

describe('Stepper', () => {
  it('increments by the given step without float noise', () => {
    const onChange = vi.fn();
    render(<Stepper value={20} step={2.5} label="Weight" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Increase Weight' }));
    expect(onChange).toHaveBeenCalledWith(22.5);
  });

  it('clamps at min and disables the decrease button there', () => {
    const onChange = vi.fn();
    render(<Stepper value={0} min={0} label="Reps" onChange={onChange} />);
    const dec = screen.getByRole('button', { name: 'Decrease Reps' }) as HTMLButtonElement;
    expect(dec.disabled).toBe(true);
  });

  it('clamps at max', () => {
    const onChange = vi.fn();
    render(<Stepper value={9} max={10} step={2.5} label="Sets" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Increase Sets' }));
    expect(onChange).toHaveBeenCalledWith(10);
  });
});
