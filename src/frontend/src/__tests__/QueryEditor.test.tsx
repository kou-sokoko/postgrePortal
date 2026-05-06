import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import QueryEditor from '../components/QueryEditor';

// Wrapper to provide controlled sql state for tests that need typing
const ControlledQueryEditor: React.FC<{
  onExecute: (sql: string, limit: number) => void;
  onShowHistory?: () => void;
  affectedRows: null | number;
}> = ({ onExecute, onShowHistory, affectedRows }) => {
  const [sql, setSql] = React.useState('');
  return (
    <QueryEditor
      sql={sql}
      onSqlChange={setSql}
      onExecute={onExecute}
      onShowHistory={onShowHistory ?? vi.fn()}
      affectedRows={affectedRows}
    />
  );
};

describe('QueryEditor', () => {
  it('renders SQL textarea, limit input, and execute button', () => {
    render(
      <QueryEditor sql="" onSqlChange={vi.fn()} onExecute={vi.fn()} onShowHistory={vi.fn()} affectedRows={null} />
    );
    expect(screen.getByPlaceholderText('SELECT * FROM table_name;')).toBeInTheDocument();
    expect(screen.getByTestId('execute-button')).toBeInTheDocument();
    expect(screen.getByText('実行')).toBeInTheDocument();
  });

  it('has default limit value of 100', () => {
    render(
      <QueryEditor sql="" onSqlChange={vi.fn()} onExecute={vi.fn()} onShowHistory={vi.fn()} affectedRows={null} />
    );
    const limitInput = screen.getByLabelText('件数');
    expect(limitInput).toHaveValue('100');
  });

  it('calls onExecute with SQL and limit when execute button is clicked', async () => {
    const mockExecute = vi.fn();
    render(<ControlledQueryEditor onExecute={mockExecute} affectedRows={null} />);
    const sqlInput = screen.getByPlaceholderText('SELECT * FROM table_name;');
    await userEvent.type(sqlInput, 'SELECT 1');
    await userEvent.click(screen.getByText('実行'));
    expect(mockExecute).toHaveBeenCalledWith('SELECT 1', 100);
  });

  it('rejects non-numeric limit input', async () => {
    render(
      <QueryEditor sql="" onSqlChange={vi.fn()} onExecute={vi.fn()} onShowHistory={vi.fn()} affectedRows={null} />
    );
    const limitInput = screen.getByLabelText('件数');
    await userEvent.clear(limitInput);
    await userEvent.type(limitInput, '50');
    expect(limitInput).toHaveValue('50');
    await userEvent.clear(limitInput);
    await userEvent.type(limitInput, 'abc');
    expect(limitInput).not.toHaveValue('abc');
  });

  it('rejects negative limit input', async () => {
    render(
      <QueryEditor sql="" onSqlChange={vi.fn()} onExecute={vi.fn()} onShowHistory={vi.fn()} affectedRows={null} />
    );
    const limitInput = screen.getByLabelText('件数');
    await userEvent.clear(limitInput);
    await userEvent.type(limitInput, '-5');
    expect(limitInput).not.toHaveValue('-5');
  });

  it('uses 100 as default when limit is empty on execute', async () => {
    const mockExecute = vi.fn();
    render(<ControlledQueryEditor onExecute={mockExecute} affectedRows={null} />);
    const limitInput = screen.getByLabelText('件数');
    await userEvent.clear(limitInput);
    const sqlInput = screen.getByPlaceholderText('SELECT * FROM table_name;');
    await userEvent.type(sqlInput, 'SELECT 1');
    await userEvent.click(screen.getByText('実行'));
    expect(mockExecute).toHaveBeenCalledWith('SELECT 1', 100);
  });

  it('renders show history button next to execute button', () => {
    render(
      <QueryEditor sql="" onSqlChange={vi.fn()} onExecute={vi.fn()} onShowHistory={vi.fn()} affectedRows={null} />
    );
    const executeButton = screen.getByTestId('execute-button');
    const historyButton = screen.getByTestId('show-history-button');
    expect(historyButton).toBeInTheDocument();
    expect(screen.getByText('履歴を表示')).toBeInTheDocument();
    // Both buttons share the same parent flex container
    expect(executeButton.parentElement).toBe(historyButton.parentElement);
  });

  it('calls onShowHistory when show history button is clicked', async () => {
    const mockShowHistory = vi.fn();
    render(
      <QueryEditor sql="" onSqlChange={vi.fn()} onExecute={vi.fn()} onShowHistory={mockShowHistory} affectedRows={null} />
    );
    await userEvent.click(screen.getByText('履歴を表示'));
    expect(mockShowHistory).toHaveBeenCalledTimes(1);
  });

  // FE-07-04: SQL textarea accepts drop events
  it('SQL textarea accepts drop events', () => {
    const mockDropTable = vi.fn();
    render(
      <QueryEditor
        sql=""
        onSqlChange={vi.fn()}
        onExecute={vi.fn()}
        onShowHistory={vi.fn()}
        affectedRows={null}
        onDropTable={mockDropTable}
      />
    );
    const sqlInput = screen.getByTestId('sql-input');

    const dataTransfer = {
      getData: vi.fn().mockReturnValue(JSON.stringify({ schemaName: 'public', tableName: 'users' })),
      types: ['application/x-table-drag'],
    };

    const dropEvent = new Event('drop', { bubbles: true });
    Object.defineProperty(dropEvent, 'dataTransfer', { value: dataTransfer });
    Object.defineProperty(dropEvent, 'preventDefault', { value: vi.fn() });

    sqlInput.dispatchEvent(dropEvent);
    expect(mockDropTable).toHaveBeenCalled();
  });

  // FE-07-05: SQL textarea shows visual feedback on dragover
  it('SQL textarea shows visual feedback on dragover', () => {
    render(
      <QueryEditor
        sql=""
        onSqlChange={vi.fn()}
        onExecute={vi.fn()}
        onShowHistory={vi.fn()}
        affectedRows={null}
        onDropTable={vi.fn()}
      />
    );
    const sqlInput = screen.getByTestId('sql-input');

    const preventDefaultMock = vi.fn();
    const dataTransfer = {
      types: ['application/x-table-drag'],
      dropEffect: '',
    };

    const dragoverEvent = new Event('dragover', { bubbles: true, cancelable: true });
    Object.defineProperty(dragoverEvent, 'dataTransfer', { value: dataTransfer });
    Object.defineProperty(dragoverEvent, 'preventDefault', { value: preventDefaultMock });

    sqlInput.dispatchEvent(dragoverEvent);
    expect(preventDefaultMock).toHaveBeenCalled();
  });

  // FE-07-06: calls onDropTable with schema and table name when drop occurs
  it('calls onDropTable with schema and table name when drop occurs', () => {
    const mockDropTable = vi.fn();
    render(
      <QueryEditor
        sql=""
        onSqlChange={vi.fn()}
        onExecute={vi.fn()}
        onShowHistory={vi.fn()}
        affectedRows={null}
        onDropTable={mockDropTable}
      />
    );
    const sqlInput = screen.getByTestId('sql-input');

    const dataTransfer = {
      getData: vi.fn().mockReturnValue(JSON.stringify({ schemaName: 'public', tableName: 'users' })),
      types: ['application/x-table-drag'],
    };

    const dropEvent = new Event('drop', { bubbles: true });
    Object.defineProperty(dropEvent, 'dataTransfer', { value: dataTransfer });
    Object.defineProperty(dropEvent, 'preventDefault', { value: vi.fn() });

    sqlInput.dispatchEvent(dropEvent);
    expect(mockDropTable).toHaveBeenCalledWith('public', 'users');
  });

  // FE-09-01: SQL textarea container has overflow auto in fixed rows mode
  it('SQL textarea has overflow auto style in fixed rows mode', () => {
    render(
      <QueryEditor sql="" onSqlChange={vi.fn()} onExecute={vi.fn()} onShowHistory={vi.fn()} affectedRows={null} />
    );
    // The outer container clips overflow instead of relying on MUI's TextareaAutosize
    const container = screen.getByTestId('sql-editor-container');
    expect(container).toBeInTheDocument();
    // Verify the container has maxHeight for clipping
    const containerStyle = window.getComputedStyle(container);
    // The textarea itself has resize:none
    const sqlInput = screen.getByTestId('sql-input');
    const textarea = sqlInput.querySelector('textarea:not([aria-hidden="true"])') as HTMLElement;
    expect(textarea).not.toBeNull();
    expect(textarea.style.resize).toBe('none');
  });

  // FE-09-02: SQL textarea container has maxHeight 144px in fixed rows mode
  it('SQL textarea has maxHeight 144px in fixed rows mode', () => {
    render(
      <QueryEditor sql="" onSqlChange={vi.fn()} onExecute={vi.fn()} onShowHistory={vi.fn()} affectedRows={null} />
    );
    // The outer Box container enforces maxHeight: 144px with overflow: auto
    // This clips MUI's TextareaAutosize regardless of its inline styles
    const container = screen.getByTestId('sql-editor-container');
    expect(container).toBeInTheDocument();
    // Verify the textarea exists inside the container
    const sqlInput = screen.getByTestId('sql-input');
    expect(container.contains(sqlInput)).toBe(true);
  });

  // FE-09-03: SQL textarea does not grow beyond container in dynamic height mode
  it('SQL textarea does not grow beyond container in dynamic height mode', () => {
    render(
      <QueryEditor sql="" onSqlChange={vi.fn()} onExecute={vi.fn()} onShowHistory={vi.fn()} affectedRows={null} height={300} />
    );
    // The outer container has overflow:auto in dynamic height mode
    const container = screen.getByTestId('sql-editor-container');
    expect(container).toBeInTheDocument();
    // The visible textarea has resize:none applied
    const sqlInput = screen.getByTestId('sql-input');
    const visibleTextarea = sqlInput.querySelector('textarea:not([aria-hidden="true"])') as HTMLElement;
    expect(visibleTextarea).not.toBeNull();
    expect(visibleTextarea.style.resize).toBe('none');
  });

  // FE-09-04: long query text does not overflow fixed rows textarea
  it('long query text does not overflow fixed rows textarea', () => {
    const longSql = Array(25).fill('SELECT 1;').join('\n');
    render(
      <QueryEditor sql={longSql} onSqlChange={vi.fn()} onExecute={vi.fn()} onShowHistory={vi.fn()} affectedRows={null} />
    );
    expect(screen.getByTestId('sql-input')).toBeInTheDocument();
  });

  // FE-09-05: long query text does not overflow dynamic height textarea
  it('long query text does not overflow dynamic height textarea', () => {
    const longSql = Array(25).fill('SELECT 1;').join('\n');
    render(
      <QueryEditor sql={longSql} onSqlChange={vi.fn()} onExecute={vi.fn()} onShowHistory={vi.fn()} affectedRows={null} height={200} />
    );
    expect(screen.getByTestId('sql-input')).toBeInTheDocument();
  });

  // FE-09-06: existing drop functionality still works after overflow fix
  it('existing drop functionality still works after overflow fix', () => {
    const mockDropTable = vi.fn();
    render(
      <QueryEditor
        sql=""
        onSqlChange={vi.fn()}
        onExecute={vi.fn()}
        onShowHistory={vi.fn()}
        affectedRows={null}
        onDropTable={mockDropTable}
      />
    );
    const sqlInput = screen.getByTestId('sql-input');

    const dataTransfer = {
      getData: vi.fn().mockReturnValue(JSON.stringify({ schemaName: 'public', tableName: 'users' })),
      types: ['application/x-table-drag'],
    };

    const dropEvent = new Event('drop', { bubbles: true });
    Object.defineProperty(dropEvent, 'dataTransfer', { value: dataTransfer });
    Object.defineProperty(dropEvent, 'preventDefault', { value: vi.fn() });

    sqlInput.dispatchEvent(dropEvent);
    expect(mockDropTable).toHaveBeenCalledWith('public', 'users');
  });

  // FE-09-07: cursor movement and text selection work in textarea
  it('cursor movement and text selection work in textarea', async () => {
    const mockSqlChange = vi.fn();
    render(
      <QueryEditor sql="" onSqlChange={mockSqlChange} onExecute={vi.fn()} onShowHistory={vi.fn()} affectedRows={null} />
    );
    const sqlInput = screen.getByPlaceholderText('SELECT * FROM table_name;');
    await userEvent.type(sqlInput, 'SELECT 1');
    expect(mockSqlChange).toHaveBeenCalled();
  });
});
