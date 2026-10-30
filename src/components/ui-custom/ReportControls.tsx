import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FileText, Download, FileJson } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface ReportControlsProps {
  onExportPdf: () => void;
  onExportTxt: () => void;
  variant?: 'outline' | 'default' | 'ghost';
  className?: string;
}

export function ReportControls({ onExportPdf, onExportTxt, variant = 'outline', className = '' }: ReportControlsProps) {
  const { t } = useLanguage();

  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} className="gap-2 border-red-600/30 text-red-600 hover:bg-red-600/10">
            <Download className="w-4 h-4" />
            {t('nav.export')}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-background border-border">
          <DropdownMenuItem onClick={onExportPdf} className="cursor-pointer gap-2">
            <FileText className="w-4 h-4 text-red-600" />
            {t('nav.export_pdf')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onExportTxt} className="cursor-pointer gap-2">
            <FileJson className="w-4 h-4 text-blue-600" />
            {t('nav.export_txt')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
