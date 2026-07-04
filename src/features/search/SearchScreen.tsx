import { EmptyState } from '../../components/EmptyState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { IconSearch } from '../../components/icons';

export function SearchScreen() {
  return (
    <div className="flex flex-col gap-4">
      <ScreenHeader title="Search" subtitle="Foods, meals, exercises and days" back />
      <EmptyState
        icon={<IconSearch size={24} />}
        title="Nothing to search yet"
        body="Once your food and exercise database is set up, find anything here — even a date like “12 Jul”."
      />
    </div>
  );
}
