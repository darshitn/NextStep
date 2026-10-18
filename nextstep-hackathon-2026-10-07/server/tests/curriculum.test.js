import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { RAW_CURRICULUM_DATA } from '../data/curriculum/index.js';
import { validateCurriculumDataset, getPublishedCurriculum } from '../src/services/curriculumRegistry.js';

describe('Stage 1 — Curriculum Foundation & Registry Validation', () => {
  it('validates the full 12-topic curriculum dataset with zero schema or referential errors', () => {
    const report = validateCurriculumDataset(RAW_CURRICULUM_DATA);
    assert.equal(report.valid, true, `Expected valid curriculum, got errors: ${report.errors.join('; ')}`);
    assert.equal(report.counts.publishedTopics, 12);
    assert.equal(report.counts.publishedLessons, 48);
    assert.equal(report.counts.publishedExercises, 18);
    assert.equal(report.counts.publishedPracticeProblems, 120);
    assert.ok(report.counts.excludedDraftOrUnreviewedCount >= 1);
  });

  it('excludes draft and unreviewed items from getPublishedCurriculum()', () => {
    const published = getPublishedCurriculum(RAW_CURRICULUM_DATA);
    const allPublishedStatuses = [
      ...published.topics,
      ...published.lessons,
      ...published.exercises,
      ...published.practiceProblems
    ];
    for (const item of allPublishedStatuses) {
      assert.equal(item.reviewStatus, 'published', `Item ${item.id} leaked with status ${item.reviewStatus}`);
      assert.equal('reviewRecord' in item, false, `Internal reviewRecord should be stripped from public item ${item.id}`);
    }
    assert.equal(
      published.practiceProblems.some((p) => p.id === 'prac_arrays_draft_99'),
      false,
      'Draft practice problem prac_arrays_draft_99 must never appear in published curriculum'
    );
  });

  it('rejects any curriculum ID that collides with starter mission IDs m01-m12', () => {
    const mutated = structuredClone(RAW_CURRICULUM_DATA);
    mutated.topics[0].id = 'm01';
    const report = validateCurriculumDataset(mutated);
    assert.equal(report.valid, false);
    assert.ok(report.errors.some((e) => e.includes('m01')));
  });

  it('detects cycles in topic prerequisite graphs', () => {
    const mutated = structuredClone(RAW_CURRICULUM_DATA);
    mutated.prerequisiteEdges.push({
      fromTopicId: 'topic_hashing',
      toTopicId: 'topic_arrays',
      rationale: 'Artificial cycle for unit test verification.'
    });
    const report = validateCurriculumDataset(mutated);
    assert.equal(report.valid, false);
    assert.ok(report.errors.some((e) => e.toLowerCase().includes('cycle')));
  });

  it('rejects exercises whose trace steps have 0 or multiple correct choices', () => {
    const mutated = structuredClone(RAW_CURRICULUM_DATA);
    mutated.exercises[0].primaryVariant.steps[0].choices.forEach((c) => {
      c.isCorrect = true;
    });
    const report = validateCurriculumDataset(mutated);
    assert.equal(report.valid, false);
    assert.ok(report.errors.some((e) => e.includes('must have exactly 1 correct choice')));
  });

  it('rejects duplicate external practice URLs among published items', () => {
    const mutated = structuredClone(RAW_CURRICULUM_DATA);
    mutated.practiceProblems[1].url = mutated.practiceProblems[0].url;
    const report = validateCurriculumDataset(mutated);
    assert.equal(report.valid, false);
    assert.ok(report.errors.some((e) => e.includes('Duplicate published practice problem URL')));
  });
});
