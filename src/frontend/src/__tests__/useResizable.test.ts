import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import useResizable from '../hooks/useResizable';

describe('useResizable', () => {
  // FE-11-01
  it('returns initial ratio of 0.3 by default', () => {
    const { result } = renderHook(() => useResizable());
    expect(result.current.ratio).toBe(0.3);
  });

  // FE-11-02
  it('returns custom initial ratio', () => {
    const { result } = renderHook(() => useResizable({ initialRatio: 0.5 }));
    expect(result.current.ratio).toBe(0.5);
  });

  // FE-11-03
  it('isDragging is false initially', () => {
    const { result } = renderHook(() => useResizable());
    expect(result.current.isDragging).toBe(false);
  });

  // FE-11-04
  it('isDragging becomes true after onMouseDown', () => {
    const { result } = renderHook(() => useResizable());

    act(() => {
      result.current.splitterProps.onMouseDown({
        clientY: 100,
        preventDefault: () => {},
      } as React.MouseEvent);
    });

    expect(result.current.isDragging).toBe(true);
  });

  // FE-11-05
  it('isDragging becomes false after mouseup', () => {
    const { result } = renderHook(() => useResizable());

    act(() => {
      result.current.splitterProps.onMouseDown({
        clientY: 100,
        preventDefault: () => {},
      } as React.MouseEvent);
    });

    expect(result.current.isDragging).toBe(true);

    act(() => {
      document.dispatchEvent(new MouseEvent('mouseup'));
    });

    expect(result.current.isDragging).toBe(false);
  });

  // FE-11-06
  it('ratio changes on mousemove during drag', () => {
    const { result } = renderHook(() => useResizable());

    // コンテナの高さをシミュレートするためにcontainerRefを設定
    const container = document.createElement('div');
    Object.defineProperty(container, 'getBoundingClientRect', {
      value: () => ({
        height: 400,
        top: 0,
        left: 0,
        bottom: 400,
        right: 800,
        width: 800,
        x: 0,
        y: 0,
        toJSON: () => {},
      }),
    });

    // containerRefにDOM要素を設定
    Object.defineProperty(result.current.containerRef, 'current', {
      value: container,
      writable: true,
    });

    act(() => {
      result.current.splitterProps.onMouseDown({
        clientY: 100,
        preventDefault: () => {},
      } as React.MouseEvent);
    });

    act(() => {
      document.dispatchEvent(
        new MouseEvent('mousemove', { clientY: 200 })
      );
    });

    // ratioがドラッグ量に応じて変化する（0.3より大きくなる）
    expect(result.current.ratio).toBeGreaterThan(0.3);
  });

  // FE-11-07
  it('ratio is clamped by minTopHeight', () => {
    const { result } = renderHook(() =>
      useResizable({ minTopHeight: 72, minBottomHeight: 120, splitterHeight: 6 })
    );

    const container = document.createElement('div');
    Object.defineProperty(container, 'getBoundingClientRect', {
      value: () => ({
        height: 400,
        top: 0,
        left: 0,
        bottom: 400,
        right: 800,
        width: 800,
        x: 0,
        y: 0,
        toJSON: () => {},
      }),
    });

    Object.defineProperty(result.current.containerRef, 'current', {
      value: container,
      writable: true,
    });

    act(() => {
      result.current.splitterProps.onMouseDown({
        clientY: 200,
        preventDefault: () => {},
      } as React.MouseEvent);
    });

    // 上方向に大きくドラッグして最小値を下回ろうとする
    act(() => {
      document.dispatchEvent(
        new MouseEvent('mousemove', { clientY: 0 })
      );
    });

    const availableHeight = 400 - 6;
    const minTopRatio = 72 / availableHeight;
    expect(result.current.ratio).toBeGreaterThanOrEqual(minTopRatio);
  });

  // FE-11-08
  it('ratio is clamped by minBottomHeight', () => {
    const { result } = renderHook(() =>
      useResizable({ minTopHeight: 72, minBottomHeight: 120, splitterHeight: 6 })
    );

    const container = document.createElement('div');
    Object.defineProperty(container, 'getBoundingClientRect', {
      value: () => ({
        height: 400,
        top: 0,
        left: 0,
        bottom: 400,
        right: 800,
        width: 800,
        x: 0,
        y: 0,
        toJSON: () => {},
      }),
    });

    Object.defineProperty(result.current.containerRef, 'current', {
      value: container,
      writable: true,
    });

    act(() => {
      result.current.splitterProps.onMouseDown({
        clientY: 100,
        preventDefault: () => {},
      } as React.MouseEvent);
    });

    // 下方向に大きくドラッグして最大値を超えようとする
    act(() => {
      document.dispatchEvent(
        new MouseEvent('mousemove', { clientY: 500 })
      );
    });

    const availableHeight = 400 - 6;
    const maxTopRatio = 1 - 120 / availableHeight;
    expect(result.current.ratio).toBeLessThanOrEqual(maxTopRatio);
  });

  // FE-11-09
  it('topHeight and bottomHeight are null before container measurement', () => {
    const { result } = renderHook(() => useResizable());
    expect(result.current.topHeight).toBeNull();
    expect(result.current.bottomHeight).toBeNull();
  });

  // FE-11-10
  it('splitterProps contains onMouseDown handler', () => {
    const { result } = renderHook(() => useResizable());
    expect(typeof result.current.splitterProps.onMouseDown).toBe('function');
  });

  // FE-11-11
  it('containerRef is a RefObject', () => {
    const { result } = renderHook(() => useResizable());
    expect(result.current.containerRef).toHaveProperty('current');
    expect(result.current.containerRef.current).toBeNull();
  });
});
