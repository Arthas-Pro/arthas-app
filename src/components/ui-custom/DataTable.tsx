import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Column<T> {
  key: string;
  header: string | React.ReactNode;
  render?: (item: T) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  itemsPerPage?: number;
  emptyMessage?: string;
  renderSubRow?: (item: T) => React.ReactNode;
}

function DataTableRow<T>({ 
  item, 
  columns, 
  keyExtractor, 
  onRowClick, 
  renderSubRow 
}: { 
  item: T; 
  columns: Column<T>[]; 
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  renderSubRow?: (item: T) => React.ReactNode;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const key = keyExtractor(item);
  const hasSubRow = !!renderSubRow;

  return (
    <React.Fragment>
      <TableRow
        onClick={() => {
          if (hasSubRow) setIsExpanded(!isExpanded);
          onRowClick?.(item);
        }}
        className={cn(
          (onRowClick || hasSubRow) && 'cursor-pointer hover:bg-muted/50 transition-colors',
          isExpanded && 'bg-muted/30'
        )}
      >
        {columns?.map((column, idx) => (
          <TableCell key={`${key}-${column.key}`}>
            <div className="flex items-center gap-2">
              {idx === 0 && hasSubRow && (
                <div 
                  className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-muted transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                  }}
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-primary" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              )}
              {column.render 
                ? column.render(item) 
                : (item as Record<string, unknown>)[column.key] as React.ReactNode
              }
            </div>
          </TableCell>
        ))}
      </TableRow>
      {isExpanded && hasSubRow && (
        <TableRow className="bg-muted/10 border-l-4 border-l-primary/50">
          <TableCell colSpan={columns.length} className="p-0">
            <div className="animate-in slide-in-from-top-1 duration-200">
              {renderSubRow(item)}
            </div>
          </TableCell>
        </TableRow>
      )}
    </React.Fragment>
  );
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  itemsPerPage = 10,
  emptyMessage = 'Nenhum registro encontrado',
  renderSubRow
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = data.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns?.map((column) => (
                <TableHead 
                  key={column.key} 
                  style={{ width: column.width }}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData?.map((item) => (
              <DataTableRow
                key={keyExtractor(item)}
                item={item}
                columns={columns}
                keyExtractor={keyExtractor}
                onRowClick={onRowClick}
                renderSubRow={renderSubRow}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, data.length)} de {data.length} registros
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
