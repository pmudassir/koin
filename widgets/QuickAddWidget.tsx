'use widget';

import { Text, VStack } from '@expo/ui/swift-ui';

interface QuickAddWidgetProps {
  todaySpent: number;
}

export default function QuickAddWidget(props: QuickAddWidgetProps) {
  const { todaySpent = 0 } = props;

  return (
    <VStack>
      <Text font="caption2">
        {`\u20B9${Math.round(todaySpent)}`}
      </Text>
      <Text font="caption2" foregroundStyle="secondary">
        today
      </Text>
    </VStack>
  );
}
