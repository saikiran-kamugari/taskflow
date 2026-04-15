import { describe, it, expect } from 'vitest';
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS, TASK_STATUS_ORDER } from '@/types';

describe('Type constants', () => {
  it('has all 5 task statuses', () => {
    expect(TASK_STATUS_ORDER).toHaveLength(5);
    expect(TASK_STATUS_ORDER).toContain('backlog');
    expect(TASK_STATUS_ORDER).toContain('done');
  });

  it('has labels for every status', () => {
    TASK_STATUS_ORDER.forEach((status) => {
      expect(TASK_STATUS_LABELS[status]).toBeDefined();
      expect(typeof TASK_STATUS_LABELS[status]).toBe('string');
    });
  });

  it('has labels for every priority', () => {
    const priorities = ['low', 'medium', 'high', 'urgent'] as const;
    priorities.forEach((p) => {
      expect(TASK_PRIORITY_LABELS[p]).toBeDefined();
    });
  });

  it('status order starts with backlog and ends with done', () => {
    expect(TASK_STATUS_ORDER[0]).toBe('backlog');
    expect(TASK_STATUS_ORDER[TASK_STATUS_ORDER.length - 1]).toBe('done');
  });
});
