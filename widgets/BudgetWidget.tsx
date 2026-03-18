'use widget';

import { Text, VStack, HStack, Gauge, Spacer } from '@expo/ui/swift-ui';

interface BudgetWidgetProps {
  todaySpent: number;
  budget: number;
  topCategories: { name: string; amount: number }[];
}

export default function BudgetWidget(
  props: BudgetWidgetProps,
  { widgetFamily }: { widgetFamily: string },
) {
  const { todaySpent = 0, budget = 2500, topCategories = [] } = props;
  const ratio = budget > 0 ? Math.min(todaySpent / budget, 1) : 0;
  const remaining = Math.max(budget - todaySpent, 0);
  const isOver = todaySpent > budget;

  if (widgetFamily === 'systemSmall') {
    return (
      <VStack spacing={8}>
        <HStack>
          <Text font="caption" foregroundStyle="secondary">
            Koin
          </Text>
          <Spacer />
          <Text font="caption" foregroundStyle="secondary">
            Today
          </Text>
        </HStack>
        <Text font="title" fontWeight="bold" foregroundStyle={isOver ? 'red' : 'primary'}>
          {`\u20B9${Math.round(todaySpent).toLocaleString('en-IN')}`}
        </Text>
        <Gauge value={ratio}>
          <Text font="caption2">{`${Math.round(ratio * 100)}%`}</Text>
        </Gauge>
        <Text font="caption2" foregroundStyle="secondary">
          {isOver
            ? `Over by \u20B9${Math.round(todaySpent - budget).toLocaleString('en-IN')}`
            : `\u20B9${Math.round(remaining).toLocaleString('en-IN')} left`}
        </Text>
      </VStack>
    );
  }

  // systemMedium
  return (
    <VStack spacing={6}>
      <HStack>
        <Text font="headline" fontWeight="bold">
          {`Today's Budget`}
        </Text>
        <Spacer />
        <Text font="subheadline" foregroundStyle={isOver ? 'red' : 'primary'}>
          {`\u20B9${Math.round(todaySpent).toLocaleString('en-IN')}/\u20B9${Math.round(budget).toLocaleString('en-IN')}`}
        </Text>
      </HStack>
      <Gauge value={ratio} />
      {topCategories.length > 0 && (
        <HStack spacing={12}>
          {topCategories.slice(0, 3).map((cat, i) => (
            <Text key={i} font="caption" foregroundStyle="secondary">
              {`${cat.name} \u20B9${Math.round(cat.amount)}`}
            </Text>
          ))}
        </HStack>
      )}
    </VStack>
  );
}
