import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ResizableSplitter from '../components/ResizableSplitter';

describe('ResizableSplitter', () => {
  // FE-11-12
  it('renders without errors', () => {
    const { container } = render(
      <ResizableSplitter onMouseDown={vi.fn()} isDragging={false} />
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  // FE-11-13
  it('has ns-resize cursor style', () => {
    const { container } = render(
      <ResizableSplitter onMouseDown={vi.fn()} isDragging={false} />
    );
    const splitter = container.firstChild as HTMLElement;
    expect(splitter.style.cursor).toBe('ns-resize');
  });

  // FE-11-14
  it('calls onMouseDown when mouse is pressed', () => {
    const mockFn = vi.fn();
    const { container } = render(
      <ResizableSplitter onMouseDown={mockFn} isDragging={false} />
    );
    const splitter = container.firstChild as HTMLElement;
    fireEvent.mouseDown(splitter);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  // FE-11-15
  it('applies dragging background color when isDragging is true', () => {
    const { container } = render(
      <ResizableSplitter onMouseDown={vi.fn()} isDragging={true} />
    );
    const splitter = container.firstChild as HTMLElement;
    // jsdomがhex値をrgbに正規化するため、rgb値で検証
    expect(splitter.style.backgroundColor).toBe('rgb(187, 222, 251)');
  });

  // FE-11-16
  it('applies default background color when isDragging is false', () => {
    const { container } = render(
      <ResizableSplitter onMouseDown={vi.fn()} isDragging={false} />
    );
    const splitter = container.firstChild as HTMLElement;
    // jsdomがhex値をrgbに正規化するため、rgb値で検証
    expect(splitter.style.backgroundColor).toBe('rgb(224, 224, 224)');
  });

  // FE-11-17
  it('renders DragHandle icon', () => {
    const { container } = render(
      <ResizableSplitter onMouseDown={vi.fn()} isDragging={false} />
    );
    const svgElement = container.querySelector('svg');
    expect(svgElement).toBeInTheDocument();
  });
});
