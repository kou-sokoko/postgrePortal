import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
} from '@mui/material';

interface ResultTableProps {
  columns: string[];
  rows: Record<string, string | number | null>[];
  isHistoryMode?: boolean;
  onRowClick?: (row: Record<string, string | number | null>) => void;
  height?: number;
}

type SortOrder = 'asc' | 'desc';

const formatExecutedAt = (value: string): string => {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/);
  if (!match) return value;
  return `${match[1]}/${match[2]}/${match[3]} ${match[4]}:${match[5]}:${match[6]}`;
};

const ResultTable: React.FC<ResultTableProps> = ({
  columns,
  rows,
  isHistoryMode = false,
  onRowClick,
  // height は親のBoxコンポーネントで制御されるため、コンポーネント内では使用しない
  // テスト仕様 FE-11-20 で渡されることが検証されている
  height: _height,
}) => {
  void _height;
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const handleSort = (col: string) => {
    if (sortColumn === col) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(col);
      setSortOrder('asc');
    }
  };

  const sortedRows = useMemo(() => {
    if (sortColumn === null) return rows;
    return [...rows].sort((a, b) => {
      const av = a[sortColumn];
      const bv = b[sortColumn];
      if (av === null && bv === null) return 0;
      if (av === null) return sortOrder === 'asc' ? 1 : -1;
      if (bv === null) return sortOrder === 'asc' ? -1 : 1;
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortOrder === 'asc' ? av - bv : bv - av;
      }
      const as = String(av);
      const bs = String(bv);
      return sortOrder === 'asc' ? as.localeCompare(bs) : bs.localeCompare(as);
    });
  }, [rows, sortColumn, sortOrder]);

  if (columns.length === 0) {
    return (
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'text.secondary',
          p: 4,
        }}
      >
        <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
          Execute a query to see results here.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        p: 2,
        overflow: 'hidden',
      }}
    >
      {columns.length > 0 && (
        <TableContainer
          component={Paper}
          elevation={1}
          sx={{
            flex: 1,
            overflow: 'auto',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {columns.map((col) => (
                  <TableCell
                    key={col}
                    sortDirection={sortColumn === col ? sortOrder : false}
                    sx={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    <TableSortLabel
                      active={sortColumn === col}
                      direction={sortColumn === col ? sortOrder : 'asc'}
                      onClick={() => handleSort(col)}
                    >
                      {col}
                    </TableSortLabel>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedRows.map((row, idx) => (
                <TableRow
                  key={columns.map((col) => String(row[col] ?? '')).join('|') + '|' + idx}
                  onClick={() => {
                    if (isHistoryMode && onRowClick) {
                      onRowClick(row);
                    }
                  }}
                  sx={{
                    '&:nth-of-type(even)': {
                      backgroundColor: '#fafafa',
                    },
                    '&:hover': {
                      backgroundColor: '#e3f2fd',
                    },
                    transition: 'background-color 0.1s',
                    cursor: isHistoryMode ? 'pointer' : 'default',
                  }}
                >
                  {columns.map((col) => (
                    <TableCell key={col}>
                      {row[col] === null ? (
                        <Typography
                          component="span"
                          sx={{
                            color: 'text.disabled',
                            fontStyle: 'italic',
                            fontSize: '0.75rem',
                          }}
                        >
                          NULL
                        </Typography>
                      ) : isHistoryMode && col === 'executed_at' ? (
                        formatExecutedAt(String(row[col]))
                      ) : (
                        String(row[col])
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

    </Box>
  );
};

export default ResultTable;
