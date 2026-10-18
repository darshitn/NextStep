import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getPublishedCurriculum } from '../src/services/curriculumRegistry.js';
import { calculateWorkspaceStudyPlan } from '../src/services/scheduler.js';

describe('R2 Regression — Study Planner Prerequisite Topological Order', () => {
  const curriculum = getPublishedCurriculum();
  const availability = { mon: 90, tue: 90, wed: 90, thu: 90, fri: 90, sat: 90, sun: 90 };

  it('guarantees all prerequisite lessons strictly precede their dependent practice problem for all 120 practice entries', () => {
    assert.equal(curriculum.practiceProblems.length, 120);

    for (const prac of curriculum.practiceProblems) {
      const plan = calculateWorkspaceStudyPlan({
        startDate: '2026-10-18',
        availability,
        selectedItemIds: [prac.id],
        curriculum,
        studyWorkspace: { lessonProgress: {}, exerciseAttempts: {}, practiceAttempts: {} }
      });

      const itemIds = plan.selectedItemIds;
      const pracIndex = itemIds.indexOf(prac.id);
      assert.ok(pracIndex >= 0, `Practice problem ${prac.id} should be scheduled in plan`);

      for (const linkedLessonId of prac.lessonIds || []) {
        const lessonIndex = itemIds.indexOf(linkedLessonId);
        assert.ok(
          lessonIndex >= 0,
          `Linked lesson ${linkedLessonId} for ${prac.id} must be present in selectedItemIds`
        );
        assert.ok(
          lessonIndex < pracIndex,
          `Prerequisite lesson ${linkedLessonId} (index ${lessonIndex}) must strictly precede practice problem ${prac.id} (index ${pracIndex})`
        );
      }
    }
  });

  it('corrects the 6 reproduction violations specifically identified in independent review', () => {
    const identifiedViolations = [
      { pracId: 'prac_sliding_window_05', requiredLesson: 'les_sliding_window_03' },
      { pracId: 'prac_sliding_window_06', requiredLesson: 'les_sliding_window_03' },
      { pracId: 'prac_linked_lists_07', requiredLesson: 'les_linked_lists_03' },
      { pracId: 'prac_stacks_queues_09', requiredLesson: 'les_stacks_queues_03' },
      { pracId: 'prac_recursion_backtracking_03', requiredLesson: 'les_recursion_backtracking_02' },
      { pracId: 'prac_recursion_backtracking_05', requiredLesson: 'les_recursion_backtracking_03' }
    ];

    for (const { pracId, requiredLesson } of identifiedViolations) {
      const plan = calculateWorkspaceStudyPlan({
        startDate: '2026-10-18',
        availability,
        selectedItemIds: [pracId],
        curriculum,
        studyWorkspace: { lessonProgress: {}, exerciseAttempts: {}, practiceAttempts: {} }
      });

      const itemIds = plan.selectedItemIds;
      const pracIndex = itemIds.indexOf(pracId);
      const lessonIndex = itemIds.indexOf(requiredLesson);

      assert.ok(lessonIndex >= 0, `${requiredLesson} must be scheduled for ${pracId}`);
      assert.ok(
        lessonIndex < pracIndex,
        `Expected ${requiredLesson} (idx ${lessonIndex}) < ${pracId} (idx ${pracIndex})`
      );
    }
  });

  it('handles multiple shared dependencies and produces a stable topological sequence', () => {
    const plan = calculateWorkspaceStudyPlan({
      startDate: '2026-10-18',
      availability,
      selectedItemIds: ['prac_sliding_window_05', 'prac_sliding_window_02', 'prac_arrays_01'],
      curriculum,
      studyWorkspace: { lessonProgress: {}, exerciseAttempts: {}, practiceAttempts: {} }
    });

    const itemIds = plan.selectedItemIds;
    // prac_arrays_01 depends on les_arrays_01, les_arrays_02
    assert.ok(itemIds.indexOf('les_arrays_01') < itemIds.indexOf('prac_arrays_01'));
    // prac_sliding_window_05 depends on les_sliding_window_01 and les_sliding_window_03
    assert.ok(itemIds.indexOf('les_sliding_window_01') < itemIds.indexOf('prac_sliding_window_05'));
    assert.ok(itemIds.indexOf('les_sliding_window_03') < itemIds.indexOf('prac_sliding_window_05'));
  });

  it('produces identical deterministic order regardless of input selection shuffle', () => {
    const inputOrder1 = ['prac_sliding_window_05', 'les_arrays_01', 'prac_arrays_01'];
    const inputOrder2 = ['les_arrays_01', 'prac_arrays_01', 'prac_sliding_window_05'];

    const plan1 = calculateWorkspaceStudyPlan({
      startDate: '2026-10-18',
      availability,
      selectedItemIds: inputOrder1,
      curriculum,
      studyWorkspace: { lessonProgress: {}, exerciseAttempts: {}, practiceAttempts: {} }
    });

    const plan2 = calculateWorkspaceStudyPlan({
      startDate: '2026-10-18',
      availability,
      selectedItemIds: inputOrder2,
      curriculum,
      studyWorkspace: { lessonProgress: {}, exerciseAttempts: {}, practiceAttempts: {} }
    });

    assert.deepEqual(plan1.selectedItemIds, plan2.selectedItemIds);
  });

  it('excludes already completed lessons from study plan while preserving prerequisite order', () => {
    const plan = calculateWorkspaceStudyPlan({
      startDate: '2026-10-18',
      availability,
      selectedItemIds: ['prac_sliding_window_05'],
      curriculum,
      studyWorkspace: {
        lessonProgress: {
          les_arrays_01: { status: 'completed' },
          les_arrays_02: { status: 'completed' },
          les_hashing_01: { status: 'completed' }
        },
        exerciseAttempts: {},
        practiceAttempts: {}
      }
    });

    const itemIds = plan.selectedItemIds;
    // Completed lessons should not appear in plan
    assert.equal(itemIds.includes('les_arrays_01'), false);
    assert.equal(itemIds.includes('les_arrays_02'), false);
    assert.equal(itemIds.includes('les_hashing_01'), false);

    // Uncompleted prerequisites must still appear and precede prac_sliding_window_05
    assert.ok(itemIds.indexOf('les_sliding_window_03') >= 0);
    assert.ok(itemIds.indexOf('les_sliding_window_03') < itemIds.indexOf('prac_sliding_window_05'));
  });

  it('ensures exercises strictly follow their attached lesson', () => {
    const plan = calculateWorkspaceStudyPlan({
      startDate: '2026-10-18',
      availability,
      selectedItemIds: ['ex_arrays_01', 'ex_hashing_01'],
      curriculum,
      studyWorkspace: { lessonProgress: {}, exerciseAttempts: {}, practiceAttempts: {} }
    });

    const itemIds = plan.selectedItemIds;
    assert.ok(itemIds.indexOf('les_arrays_01') < itemIds.indexOf('ex_arrays_01'));
    assert.ok(itemIds.indexOf('les_hashing_01') < itemIds.indexOf('ex_hashing_01'));
  });
});
