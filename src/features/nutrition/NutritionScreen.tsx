import { EmptyState } from '../../components/EmptyState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { IconUtensils } from '../../components/icons';

export function NutritionScreen() {
  return (
    <div className="flex flex-col gap-4">
      <ScreenHeader title="Nutrition" subtitle="Meals, macros and your food database" />
      <EmptyState
        icon={<IconUtensils size={24} />}
        title="No meals logged today"
        body="Tap the + button and choose Meal to log breakfast, lunch, dinner or a snack."
      />
    </div>
  );
}
