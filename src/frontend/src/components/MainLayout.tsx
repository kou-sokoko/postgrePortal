import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  ThemeProvider,
  CssBaseline,
  Divider,
  AppBar,
  Toolbar,
  Tabs,
  Tab,
  IconButton,
  TextField,
} from '@mui/material';
import StorageIcon from '@mui/icons-material/Storage';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import theme from './theme';
import ConnectionPanel from './ConnectionPanel';
import DatabaseSelector from './DatabaseSelector';
import ObjectTree from './ObjectTree';
import CreateDatabaseModal from './CreateDatabaseModal';
import CreateSchemaModal from './CreateSchemaModal';
import CreateTableModal from './CreateTableModal';
import TableStructureModal from './TableStructureModal';
import QueryEditor from './QueryEditor';
import ResultTable from './ResultTable';
import ResizableSplitter from './ResizableSplitter';
import useResizable from '../hooks/useResizable';
import { useDatabases } from '../hooks/useDatabases';
import { useDatabaseOperations } from '../hooks/useDatabaseOperations';
import { useSchemaOperations } from '../hooks/useSchemaOperations';
import { useTableOperations } from '../hooks/useTableOperations';
import { useQueryExecution } from '../hooks/useQueryExecution';
import type { ConnectionInfo } from '../types/api';
import type { DatabaseFormData } from '../types/database';
import type { SchemaFormData } from '../types/schema';
import type { ColumnInfo, IndexInfo } from '../types/table';
import type { QueryResult } from '../types/query';

interface QueryTab {
  id: string;
  name: string;
  sql: string;
  queryResult: QueryResult | null;
  isHistoryMode: boolean;
}

interface TabLabelProps {
  tab: QueryTab;
  isActive: boolean;
  canClose: boolean;
  onRename: (id: string, name: string) => void;
  onClose: (id: string) => void;
}

const TabLabel: React.FC<TabLabelProps> = ({ tab, isActive, canClose, onRename, onClose }) => {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(tab.name);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditValue(tab.name);
    setEditing(true);
  };

  const commitRename = () => {
    const trimmed = editValue.trim();
    onRename(tab.id, trimmed !== '' ? trimmed : tab.name);
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitRename();
    if (e.key === 'Escape') setEditing(false);
    e.stopPropagation();
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, maxWidth: 180 }}>
      {editing ? (
        <TextField
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitRename}
          onKeyDown={handleKeyDown}
          autoFocus
          size="small"
          variant="standard"
          onClick={(e) => e.stopPropagation()}
          sx={{
            width: 110,
            '& .MuiInputBase-input': {
              fontSize: '0.8rem',
              py: 0,
            },
          }}
        />
      ) : (
        <Typography
          onDoubleClick={handleDoubleClick}
          sx={{
            fontSize: '0.82rem',
            fontWeight: isActive ? 600 : 400,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: canClose ? 110 : 140,
            cursor: 'text',
            userSelect: 'none',
          }}
        >
          {tab.name}
        </Typography>
      )}
      {canClose && (
        <CloseIcon
          onClick={(e) => {
            e.stopPropagation();
            onClose(tab.id);
          }}
          sx={{
            fontSize: 14,
            color: 'text.secondary',
            flexShrink: 0,
            borderRadius: '50%',
            '&:hover': { color: 'text.primary', backgroundColor: 'action.hover' },
            cursor: 'pointer',
          }}
        />
      )}
    </Box>
  );
};

let tabCounter = 1;

const createTab = (): QueryTab => ({
  id: `tab-${Date.now()}-${tabCounter}`,
  name: `クエリ${tabCounter++}`,
  sql: '',
  queryResult: null,
  isHistoryMode: false,
});

const MainLayout: React.FC = () => {
  const { databases, fetchDatabases, setDatabases } = useDatabases();
  const { createDatabase, deleteDatabase } = useDatabaseOperations();
  const { fetchSchemas, createSchema, deleteSchema } = useSchemaOperations();
  const { fetchTables, createTable, deleteTable, fetchTableStructure } = useTableOperations();
  const { executeQuery, fetchHistory } = useQueryExecution();

  const [selectedDb, setSelectedDb] = useState<string | null>(null);
  const [dbModalOpen, setDbModalOpen] = useState(false);
  const [schemaModalOpen, setSchemaModalOpen] = useState(false);
  const [schemaModalDbName, setSchemaModalDbName] = useState('');
  const [tableModalOpen, setTableModalOpen] = useState(false);
  const [tableModalDbName, setTableModalDbName] = useState('');
  const [tableModalSchemaName, setTableModalSchemaName] = useState('');
  const [structureModalOpen, setStructureModalOpen] = useState(false);
  const [structureTableName, setStructureTableName] = useState('');
  const [structureColumns, setStructureColumns] = useState<ColumnInfo[]>([]);
  const [structureIndexes, setStructureIndexes] = useState<IndexInfo[]>([]);

  const [tabs, setTabs] = useState<QueryTab[]>(() => [createTab()]);
  const [activeTabId, setActiveTabId] = useState<string>(() => tabs[0].id);

  // リサイズバーフック
  const {
    isDragging: isResizing,
    containerRef: resizableContainerRef,
    splitterProps,
    topHeight,
    bottomHeight,
  } = useResizable({
    initialRatio: 0.3,
    minTopHeight: 72,
    minBottomHeight: 120,
    splitterHeight: 6,
  });

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];

  const updateActiveTab = useCallback((patch: Partial<QueryTab>) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTabId ? { ...t, ...patch } : t))
    );
  }, [activeTabId]);

  const connInfoRef = useRef<ConnectionInfo>({
    host: 'localhost',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: '',
  });

  const handleAddTab = () => {
    const newTab = createTab();
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
  };

  const handleCloseTab = (id: string) => {
    setTabs((prev) => {
      const next = prev.filter((t) => t.id !== id);
      if (activeTabId === id) {
        const closedIdx = prev.findIndex((t) => t.id === id);
        const fallback = next[Math.min(closedIdx, next.length - 1)];
        setActiveTabId(fallback.id);
      }
      return next;
    });
  };

  const handleRenameTab = (id: string, name: string) => {
    setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, name } : t)));
  };

  const handleFetch = (connInfo: ConnectionInfo) => {
    connInfoRef.current = connInfo;
    void fetchDatabases(connInfo);
  };

  const handleCreateDatabase = () => {
    setDbModalOpen(true);
  };

  const handleCreateDatabaseSubmit = async (formData: DatabaseFormData) => {
    const success = await createDatabase(connInfoRef.current, formData);
    if (success) {
      setDbModalOpen(false);
      void fetchDatabases(connInfoRef.current);
    }
  };

  const handleSelectDb = (name: string) => {
    setSelectedDb(name);

    // Reset all tabs' content (sql, queryResult, isHistoryMode) on database switch
    setTabs((prev) =>
      prev.map((t) => ({
        ...t,
        sql: '',
        queryResult: null,
        isHistoryMode: false,
      }))
    );

    void fetchSchemas(connInfoRef.current, name).then((schemas) => {
      setDatabases(
        databases.map((db) =>
          db.name === name
            ? { ...db, schemas: schemas.map((s) => ({ name: s, tables: [] })) }
            : db
        )
      );
    });
  };

  const handleEditDatabase = () => {
    if (!selectedDb) return;
    setSchemaModalDbName(selectedDb);
    setSchemaModalOpen(true);
  };

  const handleCreateSchemaSubmit = async (formData: SchemaFormData) => {
    const success = await createSchema(connInfoRef.current, schemaModalDbName, formData);
    if (success) {
      setSchemaModalOpen(false);
      const schemas = await fetchSchemas(connInfoRef.current, schemaModalDbName);
      setDatabases(
        databases.map((db) =>
          db.name === schemaModalDbName
            ? { ...db, schemas: schemas.map((s) => ({ name: s, tables: [] })) }
            : db
        )
      );
    }
  };

  const handleDeleteDatabase = () => {
    if (!selectedDb) return;
    const dbName = selectedDb;
    if (window.confirm(`${dbName}を削除しますか？`)) {
      void deleteDatabase(connInfoRef.current, dbName).then((success) => {
        if (success) {
          void fetchDatabases(connInfoRef.current);
          setSelectedDb(null);
        }
      });
    }
  };

  const handleEditSchema = (schemaName: string) => {
    if (!selectedDb) return;
    setTableModalDbName(selectedDb);
    setTableModalSchemaName(schemaName);
    setTableModalOpen(true);
  };

  const handleCreateTableSubmit = async (ddl: string) => {
    const success = await createTable(connInfoRef.current, tableModalDbName, ddl);
    if (success) {
      setTableModalOpen(false);
      const tables = await fetchTables(connInfoRef.current, tableModalDbName, tableModalSchemaName);
      setDatabases(
        databases.map((db) =>
          db.name === tableModalDbName
            ? {
                ...db,
                schemas: db.schemas.map((s) =>
                  s.name === tableModalSchemaName
                    ? { ...s, tables: tables.map((t) => ({ name: t })) }
                    : s
                ),
              }
            : db
        )
      );
    }
  };

  const handleDeleteSchema = (schemaName: string) => {
    if (!selectedDb) return;
    const dbName = selectedDb;
    if (window.confirm(`${schemaName}を削除しますか？`)) {
      void deleteSchema(connInfoRef.current, dbName, schemaName).then(async (success) => {
        if (success) {
          const schemas = await fetchSchemas(connInfoRef.current, dbName);
          setDatabases(
            databases.map((db) =>
              db.name === dbName
                ? { ...db, schemas: schemas.map((s) => ({ name: s, tables: [] })) }
                : db
            )
          );
        }
      });
    }
  };

  const handleDeleteTable = (schemaName: string, tableName: string) => {
    if (!selectedDb) return;
    const dbName = selectedDb;
    if (window.confirm(`${tableName}を削除しますか？`)) {
      void deleteTable(connInfoRef.current, dbName, schemaName, tableName).then(
        async (success) => {
          if (success) {
            const tables = await fetchTables(connInfoRef.current, dbName, schemaName);
            setDatabases(
              databases.map((db) =>
                db.name === dbName
                  ? {
                      ...db,
                      schemas: db.schemas.map((s) =>
                        s.name === schemaName
                          ? { ...s, tables: tables.map((t) => ({ name: t })) }
                          : s
                      ),
                    }
                  : db
              )
            );
          }
        }
      );
    }
  };

  const handleClickTable = (schemaName: string, tableName: string) => {
    if (!selectedDb) return;
    void fetchTableStructure(connInfoRef.current, selectedDb, schemaName, tableName).then(
      (structure) => {
        if (structure) {
          setStructureTableName(tableName);
          setStructureColumns(structure.columns);
          setStructureIndexes(structure.indexes);
          setStructureModalOpen(true);
        }
      }
    );
  };

  const handleExpandSchema = (schemaName: string) => {
    if (!selectedDb) return;
    const dbName = selectedDb;
    void fetchTables(connInfoRef.current, dbName, schemaName).then((tables) => {
      setDatabases(
        databases.map((db) =>
          db.name === dbName
            ? {
                ...db,
                schemas: db.schemas.map((s) =>
                  s.name === schemaName
                    ? { ...s, tables: tables.map((t) => ({ name: t })) }
                    : s
                ),
              }
            : db
        )
      );
    });
  };

  const handleExecuteQuery = (sql: string, limit: number) => {
    if (!selectedDb) {
      alert('データベースを選択してください');
      return;
    }
    const tabId = activeTabId;
    void executeQuery(connInfoRef.current, selectedDb, sql, limit).then((result) => {
      setTabs((prev) =>
        prev.map((t) => (t.id === tabId ? { ...t, queryResult: result, isHistoryMode: false } : t))
      );
    });
  };

  const handleShowHistory = () => {
    if (!selectedDb) {
      alert('データベースを選択してください');
      return;
    }
    const tabId = activeTabId;
    void fetchHistory(connInfoRef.current, selectedDb).then((result) => {
      if (result) {
        setTabs((prev) =>
          prev.map((t) =>
            t.id === tabId
              ? {
                  ...t,
                  queryResult: { columns: result.columns, rows: result.rows, affected_rows: null },
                  isHistoryMode: true,
                }
              : t
          )
        );
      }
    });
  };

  const handleTableDrop = (schemaName: string, tableName: string) => {
    if (!selectedDb) return;
    void fetchTableStructure(connInfoRef.current, selectedDb, schemaName, tableName).then(
      (structure) => {
        if (structure && structure.columns.length > 0) {
          const columnList = structure.columns
            .map((col) => ` ${col.column_name}`)
            .join(',\n');
          const generatedSql = `select\n${columnList}\nfrom\n ${schemaName}.${tableName}`;
          updateActiveTab({ sql: generatedSql });
        } else if (structure && structure.columns.length === 0) {
          alert('カラム情報が取得できませんでした');
        }
      }
    );
  };

  const handleHistoryRowClick = (row: Record<string, string | number | null>) => {
    const queryText = row['query_text'];
    if (queryText !== null && queryText !== undefined) {
      updateActiveTab({ sql: String(queryText) });
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          backgroundColor: 'background.default',
        }}
      >
        {/* Header */}
        <AppBar
          position="static"
          elevation={0}
          sx={{
            background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
          }}
        >
          <Toolbar variant="dense" sx={{ minHeight: 48 }}>
            <StorageIcon sx={{ mr: 1.5, fontSize: 22 }} />
            <Typography
              variant="h5"
              sx={{
                color: '#fff',
                fontSize: '1.1rem',
                fontWeight: 700,
                letterSpacing: '0.05em',
              }}
            >
              PostgreSQL 管理ポータル
            </Typography>
          </Toolbar>
        </AppBar>

        {/* Main content */}
        <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left pane */}
          <Box
            data-testid="left-pane"
            sx={{
              width: 320,
              minWidth: 280,
              display: 'flex',
              flexDirection: 'column',
              borderRight: '1px solid',
              borderColor: 'divider',
              backgroundColor: '#fff',
            }}
          >
            <ConnectionPanel
              onFetch={handleFetch}
              onCreateDatabase={handleCreateDatabase}
            />
            <Divider />
            <DatabaseSelector
              databases={databases.map((db) => db.name)}
              selectedDb={selectedDb}
              onSelectDb={handleSelectDb}
              onEditDatabase={handleEditDatabase}
              onDeleteDatabase={handleDeleteDatabase}
            />
            <Divider />
            <ObjectTree
              schemas={databases.find((db) => db.name === selectedDb)?.schemas ?? []}
              selectedDb={selectedDb}
              onEditSchema={handleEditSchema}
              onDeleteSchema={handleDeleteSchema}
              onDeleteTable={handleDeleteTable}
              onClickTable={handleClickTable}
              onExpandSchema={handleExpandSchema}
            />
          </Box>

          {/* Right pane */}
          <Box
            data-testid="right-pane"
            ref={resizableContainerRef}
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              backgroundColor: '#fff',
            }}
          >
            {/* Tab bar */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                borderBottom: '1px solid',
                borderColor: 'divider',
                backgroundColor: '#f5f5f5',
                minHeight: 40,
                flexShrink: 0,
              }}
            >
              <IconButton
                onClick={handleAddTab}
                size="small"
                data-testid="add-tab-button"
                sx={{ mx: 0.5, flexShrink: 0 }}
              >
                <AddIcon fontSize="small" />
              </IconButton>
              <Tabs
                value={activeTabId}
                onChange={(_, v: string) => setActiveTabId(v)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  minHeight: 40,
                  flex: 1,
                  '& .MuiTabs-indicator': { height: 2 },
                  '& .MuiTab-root': {
                    minHeight: 40,
                    py: 0,
                    px: 1.5,
                    textTransform: 'none',
                  },
                }}
              >
                {tabs.map((tab) => (
                  <Tab
                    key={tab.id}
                    value={tab.id}
                    label={
                      <TabLabel
                        tab={tab}
                        isActive={tab.id === activeTabId}
                        canClose={tabs.length > 1}
                        onRename={handleRenameTab}
                        onClose={handleCloseTab}
                      />
                    }
                    disableRipple={false}
                  />
                ))}
              </Tabs>
            </Box>

            {/* Active tab content - resizable layout */}
            <Box
              sx={{
                ...(topHeight !== null
                  ? { height: topHeight, flexShrink: 0 }
                  : { flex: '0 0 30%' }),
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <QueryEditor
                sql={activeTab.sql}
                onSqlChange={(sql) => updateActiveTab({ sql })}
                onExecute={handleExecuteQuery}
                onShowHistory={handleShowHistory}
                affectedRows={activeTab.queryResult?.affected_rows ?? null}
                height={topHeight ?? undefined}
                onDropTable={handleTableDrop}
              />
            </Box>

            <ResizableSplitter
              onMouseDown={splitterProps.onMouseDown}
              isDragging={isResizing}
            />

            <Box
              sx={{
                ...(bottomHeight !== null
                  ? { height: bottomHeight, flexShrink: 0 }
                  : { flex: 1 }),
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <ResultTable
                columns={activeTab.queryResult?.columns ?? []}
                rows={activeTab.queryResult?.rows ?? []}
                isHistoryMode={activeTab.isHistoryMode}
                onRowClick={handleHistoryRowClick}
                height={bottomHeight ?? undefined}
              />
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Modals */}
      <CreateDatabaseModal
        open={dbModalOpen}
        onClose={() => setDbModalOpen(false)}
        onCreate={(data) => void handleCreateDatabaseSubmit(data)}
      />
      <CreateSchemaModal
        open={schemaModalOpen}
        onClose={() => setSchemaModalOpen(false)}
        onCreate={(data) => void handleCreateSchemaSubmit(data)}
        databaseName={schemaModalDbName}
      />
      <CreateTableModal
        open={tableModalOpen}
        onClose={() => setTableModalOpen(false)}
        onCreate={(ddl) => void handleCreateTableSubmit(ddl)}
        schemaName={tableModalSchemaName}
      />
      <TableStructureModal
        open={structureModalOpen}
        onClose={() => setStructureModalOpen(false)}
        tableName={structureTableName}
        columns={structureColumns}
        indexes={structureIndexes}
      />
    </ThemeProvider>
  );
};

export default MainLayout;
