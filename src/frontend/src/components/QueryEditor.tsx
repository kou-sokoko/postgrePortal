import React, { useState, useCallback } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  InputAdornment,
  Chip,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import HistoryIcon from '@mui/icons-material/History';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';

interface TableDragData {
  schemaName: string;
  tableName: string;
}

interface QueryEditorProps {
  sql: string;
  onSqlChange: (sql: string) => void;
  onExecute: (sql: string, limit: number) => void;
  onShowHistory: () => void;
  affectedRows: number | null;
  height?: number;
  onDropTable?: (schemaName: string, tableName: string) => void;
}

const QueryEditor: React.FC<QueryEditorProps> = ({ sql, onSqlChange, onExecute, onShowHistory, affectedRows, height, onDropTable }) => {
  const [limit, setLimit] = useState('100');
  const [prevLimit, setPrevLimit] = useState('100');
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('application/x-table-drag')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const raw = e.dataTransfer.getData('application/x-table-drag');
      if (!raw) return;
      try {
        const data: TableDragData = JSON.parse(raw);
        if (onDropTable) {
          onDropTable(data.schemaName, data.tableName);
        }
      } catch {
        // Invalid drag data - ignore
      }
    },
    [onDropTable]
  );

  const handleLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setLimit('');
      return;
    }
    const num = Number(value);
    if (Number.isNaN(num) || num < 0 || !Number.isInteger(num)) {
      setLimit(prevLimit);
      return;
    }
    setPrevLimit(value);
    setLimit(value);
  };

  const handleLimitBlur = () => {
    if (limit === '') {
      setLimit('100');
      setPrevLimit('100');
    }
  };

  const handleExecute = () => {
    const effectiveLimit = limit === '' ? 100 : Number(limit);
    onExecute(sql, effectiveLimit);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderBottom: '1px solid',
        borderColor: 'divider',
        borderRadius: 0,
        ...(height !== undefined
          ? { height, display: 'flex', flexDirection: 'column', overflow: 'hidden' }
          : {}),
      }}
    >
      <Box
        data-testid="sql-editor-container"
        sx={{
          mb: 1.5,
          ...(height !== undefined
            ? { flex: 1, minHeight: 0, overflow: 'auto' }
            : { maxHeight: '144px', overflow: 'auto', border: '1px solid rgba(0,0,0,0.23)', borderRadius: 1 }),
        }}
      >
        <TextField
          multiline
          fullWidth
          placeholder="SELECT * FROM table_name;"
          value={sql}
          onChange={(e) => onSqlChange(e.target.value)}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          data-testid="sql-input"
          variant={height !== undefined ? 'outlined' : 'standard'}
          slotProps={{
            input: {
              inputProps: {
                style: { resize: 'none' as const },
              },
            },
          }}
          sx={{
            ...(height !== undefined
              ? { height: '100%', '& .MuiInputBase-root': { height: '100%' }, '& .MuiInputBase-input': { height: '100% !important', overflow: 'auto !important' } }
              : {}),
            '& .MuiOutlinedInput-root': {
              fontFamily: '"Fira Code", "Consolas", "Monaco", monospace',
              fontSize: '0.85rem',
              lineHeight: 1.6,
              backgroundColor: '#fafafa',
              ...(height !== undefined ? { alignItems: 'flex-start' } : {}),
            },
            '& .MuiInput-root': {
              fontFamily: '"Fira Code", "Consolas", "Monaco", monospace',
              fontSize: '0.85rem',
              lineHeight: 1.6,
              backgroundColor: '#fafafa',
              padding: '8.5px 14px',
              '&::before, &::after': { display: 'none' },
            },
            ...(height !== undefined
              ? {
                  '& fieldset': { border: 'none' },
                }
              : {}),
          }}
        />
      </Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          gap: 1.5,
        }}
      >
        <TextField
          label="件数"
          value={limit}
          onChange={handleLimitChange}
          onBlur={handleLimitBlur}
          data-testid="limit-input"
          sx={{
            width: 120,
            '& .MuiOutlinedInput-root': {
              fontFamily: 'monospace',
            },
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start" sx={{ color: 'text.secondary' }}>
                  #
                </InputAdornment>
              ),
            },
          }}
        />
        <Button
          variant="contained"
          color="primary"
          startIcon={<PlayArrowIcon />}
          onClick={handleExecute}
          data-testid="execute-button"
          sx={{
            px: 3,
            py: 0.8,
            fontWeight: 700,
            fontSize: '0.9rem',
            background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          }}
        >
          実行
        </Button>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<HistoryIcon />}
          onClick={onShowHistory}
          data-testid="show-history-button"
          sx={{
            px: 3,
            py: 0.8,
            fontWeight: 700,
            fontSize: '0.9rem',
          }}
        >
          履歴を表示
        </Button>
        {affectedRows !== null && (
          <Chip
            icon={<CheckCircleOutlineIcon sx={{ fontSize: 16 }} />}
            label={`${affectedRows} 行が影響を受けました`}
            size="small"
            color="success"
            variant="outlined"
            sx={{ fontWeight: 500 }}
          />
        )}
      </Box>
    </Paper>
  );
};

export default QueryEditor;
