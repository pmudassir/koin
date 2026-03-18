import { addTransaction } from '../storage/transactionStorage';
import {
  getOverdueRecurring,
  updateRecurring,
  advanceNextDueDate,
} from '../storage/recurringStorage';
import { showToast } from '../components/Toast';

/**
 * Process all overdue recurring transactions.
 * Call this on app focus/startup.
 * Returns the number of transactions auto-logged.
 */
export function processRecurringTransactions(): number {
  const overdue = getOverdueRecurring();
  let count = 0;

  for (const recurring of overdue) {
    // Auto-create the transaction
    addTransaction({
      amount: recurring.amount,
      merchant: recurring.merchant,
      category: recurring.category,
      type: recurring.type,
      isAutoDetected: false,
      note: recurring.note
        ? `${recurring.note} (recurring)`
        : `Recurring ${recurring.frequency}`,
    });

    // Advance the due date
    const nextDate = advanceNextDueDate(recurring.nextDueDate, recurring.frequency);
    updateRecurring(recurring.id, { nextDueDate: nextDate });
    count++;
  }

  if (count > 0) {
    const label = count === 1
      ? `Auto-logged: ${overdue[0].merchant} ₹${overdue[0].amount.toLocaleString('en-IN')}`
      : `Auto-logged ${count} recurring transactions`;

    showToast({
      type: 'success',
      title: 'Recurring Transactions',
      message: label,
    });
  }

  return count;
}
