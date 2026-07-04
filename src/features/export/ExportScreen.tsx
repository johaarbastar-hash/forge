import { EmptyState } from '../../components/EmptyState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { IconDownload } from '../../components/icons';

export function ExportScreen() {
  return (
    <div className="flex flex-col gap-4">
      <ScreenHeader title="Export" subtitle="Your data, portable" back />
      <EmptyState
        icon={<IconDownload size={24} />}
        title="Nothing to export yet"
        body="Once you have logs, download CSVs per data type, a full JSON backup, or a printable monthly report."
      />
    </div>
  );
}
