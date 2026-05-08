import React from 'react';
import { Box } from '@mui/material';
import DragHandleIcon from '@mui/icons-material/DragHandle';

interface ResizableSplitterProps {
  /** useResizableフックからのmousedownハンドラー */
  onMouseDown: (e: React.MouseEvent) => void;
  /** ドラッグ中かどうか */
  isDragging: boolean;
}

/**
 * クエリエディタと結果テーブルの間に配置する水平スプリッターバー。
 * 上下にドラッグしてパネルのサイズを変更できる。
 */
const ResizableSplitter: React.FC<ResizableSplitterProps> = ({
  onMouseDown,
  isDragging,
}) => {
  return (
    <Box
      data-testid="resizable-splitter"
      onMouseDown={onMouseDown}
      style={{
        cursor: 'ns-resize',
        backgroundColor: isDragging ? '#bbdefb' : '#e0e0e0',
      }}
      sx={{
        height: 6,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderTop: '1px solid',
        borderBottom: '1px solid',
        borderColor: isDragging ? '#64b5f6' : '#d0d0d0',
        transition: isDragging ? 'none' : 'background-color 0.2s',
        position: 'relative',
        zIndex: 10,
        '&:hover': {
          backgroundColor: '#bbdefb',
          borderColor: '#64b5f6',
        },
        '&:hover .splitter-handle': {
          opacity: 1,
          color: '#1976d2',
        },
      }}
    >
      <DragHandleIcon
        className="splitter-handle"
        sx={{
          fontSize: 16,
          color: isDragging ? '#1976d2' : '#9e9e9e',
          opacity: isDragging ? 1 : 0.6,
          transition: 'opacity 0.2s, color 0.2s',
          pointerEvents: 'none',
        }}
      />
    </Box>
  );
};

export default ResizableSplitter;
