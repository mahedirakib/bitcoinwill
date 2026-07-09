import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, act } from '@testing-library/react';
import { useFocusTrap } from './useFocusTrap';

interface TrapHostProps {
  onEscape?: () => void;
  enabled?: boolean;
  initialFocus?: string | ((container: HTMLElement) => HTMLElement | null);
  lockScroll?: boolean;
  restoreFocus?: boolean;
  closeOnEscape?: boolean;
}

const TrapHost = ({
  onEscape,
  enabled = true,
  initialFocus,
  lockScroll = true,
  restoreFocus = true,
  closeOnEscape = true,
}: TrapHostProps) => {
  const ref = useFocusTrap<HTMLDivElement>({
    enabled,
    onEscape,
    initialFocus,
    lockScroll,
    restoreFocus,
    closeOnEscape,
  });
  return (
    <div data-testid="outside">
      <button type="button" data-testid="outside-button">Outside</button>
      <div ref={ref} role="dialog" aria-modal="true">
        <button type="button" data-testid="first">First</button>
        <input type="text" data-testid="middle" />
        <button type="button" data-testid="last">Last</button>
      </div>
    </div>
  );
};

describe('useFocusTrap', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      vi.runOnlyPendingTimers();
    });
    vi.useRealTimers();
  });

  it('focuses the first focusable element by default', async () => {
    const { getByTestId } = render(<TrapHost />);
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    expect(document.activeElement).toBe(getByTestId('first'));
  });

  it('focuses a custom selector when provided', async () => {
    const { getByTestId } = render(
      <TrapHost initialFocus="input" />
    );
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    expect(document.activeElement).toBe(getByTestId('middle'));
  });

  it('cycles forward on Tab from the last element', async () => {
    const { getByTestId } = render(<TrapHost />);
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    const last = getByTestId('last') as HTMLElement;
    last.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(getByTestId('first'));
  });

  it('cycles backward on Shift+Tab from the first element', async () => {
    const { getByTestId } = render(<TrapHost />);
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    const first = getByTestId('first') as HTMLElement;
    first.focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(getByTestId('last'));
  });

  it('calls onEscape when Escape is pressed', async () => {
    const onEscape = vi.fn();
    render(<TrapHost onEscape={onEscape} />);
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it('does not call onEscape when closeOnEscape is false', async () => {
    const onEscape = vi.fn();
    render(<TrapHost onEscape={onEscape} closeOnEscape={false} />);
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onEscape).not.toHaveBeenCalled();
  });

  it('locks and restores body scroll', async () => {
    const original = document.body.style.overflow;
    const { unmount } = render(<TrapHost lockScroll={true} restoreFocus={false} />);
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe(original);
  });

  it('does not change body overflow when lockScroll is false', async () => {
    const original = document.body.style.overflow;
    const { unmount } = render(<TrapHost lockScroll={false} restoreFocus={false} />);
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    expect(document.body.style.overflow).toBe(original);
    unmount();
  });

  it('does not attach listeners when enabled is false', async () => {
    const onEscape = vi.fn();
    render(<TrapHost enabled={false} onEscape={onEscape} />);
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onEscape).not.toHaveBeenCalled();
  });

  it('restores focus to the previously focused element on unmount', async () => {
    const outside = document.createElement('button');
    outside.textContent = 'Previously focused';
    document.body.appendChild(outside);
    outside.focus();

    const { unmount } = render(<TrapHost />);
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    unmount();
    expect(document.activeElement).toBe(outside);
    document.body.removeChild(outside);
  });

  it('uses the latest onEscape after a re-render without rebuilding the trap', async () => {
    // Parent re-renders (e.g. a toast appearing) routinely produce a new
    // onEscape function reference. The trap must NOT tear down and rebuild on
    // that identity change (which would steal focus), but Escape must still
    // dispatch to the latest callback.
    const firstEscape = vi.fn();
    const secondEscape = vi.fn();
    const { getByTestId, rerender } = render(<TrapHost onEscape={firstEscape} />);
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    // Move focus off the auto-focused first element to prove it stays put.
    const last = getByTestId('last') as HTMLElement;
    last.focus();
    expect(document.activeElement).toBe(last);

    // Re-render with a brand-new onEscape identity.
    rerender(<TrapHost onEscape={secondEscape} />);
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    // Focus is preserved (trap was not rebuilt) ...
    expect(document.activeElement).toBe(last);
    // ... and Escape reaches the latest callback, not the stale one.
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(firstEscape).not.toHaveBeenCalled();
    expect(secondEscape).toHaveBeenCalledTimes(1);
  });
});
