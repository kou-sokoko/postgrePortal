import { useState, useCallback, useRef, useEffect } from 'react';

interface UseResizableOptions {
  /** 上パネルの初期比率（0-1）。デフォルト: 0.3 */
  initialRatio?: number;
  /** 上パネルの最小高さ（px） */
  minTopHeight?: number;
  /** 下パネルの最小高さ（px） */
  minBottomHeight?: number;
  /** スプリッターバーの高さ（px）。デフォルト: 6 */
  splitterHeight?: number;
}

interface UseResizableReturn {
  /** 上パネルの現在の比率（0-1） */
  ratio: number;
  /** ドラッグ中かどうか */
  isDragging: boolean;
  /** コンテナ要素に設定するRef */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** スプリッターバーのマウスハンドラー */
  splitterProps: {
    onMouseDown: (e: React.MouseEvent) => void;
  };
  /** 上パネルの計算済み高さ（px）。初期測定前はnull */
  topHeight: number | null;
  /** 下パネルの計算済み高さ（px）。初期測定前はnull */
  bottomHeight: number | null;
}

const useResizable = (options: UseResizableOptions = {}): UseResizableReturn => {
  const {
    initialRatio = 0.3,
    minTopHeight = 72,
    minBottomHeight = 120,
    splitterHeight = 6,
  } = options;

  const [ratio, setRatio] = useState(initialRatio);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const startYRef = useRef(0);
  const startRatioRef = useRef(ratio);
  const ratioRef = useRef(ratio);

  // ratioRefをratioの最新値と同期
  useEffect(() => {
    ratioRef.current = ratio;
  }, [ratio]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      startYRef.current = e.clientY;
      startRatioRef.current = ratioRef.current;
    },
    []
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const availableHeight = containerRect.height - splitterHeight;
      if (availableHeight <= 0) return;

      const deltaY = e.clientY - startYRef.current;
      const deltaRatio = deltaY / availableHeight;
      let newRatio = startRatioRef.current + deltaRatio;

      // 最小高さによるクランプ
      const minTopRatio = minTopHeight / availableHeight;
      const maxTopRatio = 1 - minBottomHeight / availableHeight;

      newRatio = Math.max(minTopRatio, Math.min(maxTopRatio, newRatio));
      setRatio(newRatio);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    // ドラッグ中のテキスト選択を防止
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'ns-resize';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isDragging, minTopHeight, minBottomHeight, splitterHeight]);

  // ピクセル高さの計算
  const [containerHeight, setContainerHeight] = useState<number | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const topHeight =
    containerHeight !== null
      ? Math.round((containerHeight - splitterHeight) * ratio)
      : null;
  const bottomHeight =
    containerHeight !== null && topHeight !== null
      ? containerHeight - splitterHeight - topHeight
      : null;

  return {
    ratio,
    isDragging,
    containerRef,
    splitterProps: {
      onMouseDown: handleMouseDown,
    },
    topHeight,
    bottomHeight,
  };
};

export default useResizable;
