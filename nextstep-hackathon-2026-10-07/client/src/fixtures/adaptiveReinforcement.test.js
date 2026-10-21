import test from 'node:test';
import assert from 'node:assert/strict';
import {
  deriveAdaptiveReinforcement,
  buildCurriculumSearchIndex,
  deriveExplainableRecommendation
} from '../services/workspace.js';
import curriculumData from './curriculum.json' with { type: 'json' };

const MOCK_CATALOG = {
  curriculum: curriculumData
};

test('AR01: Empty evidence / new student returns empty items and recommends first unlocked lesson', () => {
  const goal = {
    id: 'goal_new',
    studyWorkspace: {}
  };

  const reinforcement = deriveAdaptiveReinforcement(goal, MOCK_CATALOG);
  assert.equal(reinforcement.items.length, 0);
  assert.equal(reinforcement.unresolvedStruggles.length, 0);
  assert.equal(reinforcement.dueReviews.length, 0);
  assert.equal(reinforcement.supportedTraces.length, 0);
  assert.equal(reinforcement.practiceReviews.length, 0);

  assert.ok(reinforcement.recommendedNextStep);
  assert.equal(reinforcement.recommendedNextStep.kind, 'next_unlocked_lesson');
  assert.equal(reinforcement.recommendedNextStep.lessonId, 'les_arrays_01');
  assert.ok(reinforcement.recommendedNextStep.reason.includes('zero unmet prerequisites'));
});

test('AR02: Check-in needs_example on a lesson with an attached exercise links to worked example', () => {
  const goal = {
    id: 'goal_ne_1',
    studyWorkspace: {
      lessonProgress: {
        les_arrays_01: {
          status: 'completed',
          completedAt: '2026-10-19T10:00:00Z',
          checkIn: {
            version: 1,
            confidence: 'needs_example'
          }
        }
      }
    }
  };

  const reinforcement = deriveAdaptiveReinforcement(goal, MOCK_CATALOG);
  assert.ok(reinforcement.items.length >= 1);
  const item = reinforcement.items.find((i) => i.lessonId === 'les_arrays_01');
  assert.ok(item, 'Must find reinforcement item for les_arrays_01');
  assert.equal(item.evidenceType, 'check_in_needs_example');
  assert.equal(item.section, 'example');
  assert.equal(item.exerciseId, 'ex_arrays_01');
  assert.ok(item.reason.includes('worked example'));
  assert.equal(item.isSelfReported, true);
  assert.equal(item.isVerified, false);
});

test('AR03: Check-in needs_example on an exercise-free lesson routes to its own worked example, not an unrelated exercise', () => {
  const goal = {
    id: 'goal_ne_free',
    studyWorkspace: {
      lessonProgress: {
        les_sliding_window_01: {
          status: 'completed',
          completedAt: '2026-10-19T10:00:00Z',
          checkIn: {
            version: 1,
            confidence: 'needs_example'
          }
        }
      }
    }
  };

  const reinforcement = deriveAdaptiveReinforcement(goal, MOCK_CATALOG);
  const item = reinforcement.items.find((i) => i.lessonId === 'les_sliding_window_01');
  assert.ok(item, 'Must find reinforcement for les_sliding_window_01');
  assert.equal(item.targetType, 'lesson');
  assert.equal(item.targetId, 'les_sliding_window_01');
  assert.equal(item.exerciseId, null, 'Must NOT fabricate an attached exercise');
  assert.equal(item.section, 'example');
  assert.ok(item.reason.includes('worked example'));
});

test('AR04: Check-in unsure provides respectful wording and targets concept check', () => {
  const goal = {
    id: 'goal_unsure',
    studyWorkspace: {
      lessonProgress: {
        les_arrays_01: {
          status: 'completed',
          completedAt: '2026-10-19T10:00:00Z',
          checkIn: {
            version: 1,
            confidence: 'unsure'
          }
        }
      }
    }
  };

  const reinforcement = deriveAdaptiveReinforcement(goal, MOCK_CATALOG);
  const item = reinforcement.items.find((i) => i.lessonId === 'les_arrays_01');
  assert.ok(item);
  assert.equal(item.evidenceType, 'check_in_unsure');
  assert.equal(item.section, 'check');
  assert.ok(item.reason.includes('unsure'));
  assert.ok(!item.reason.toLowerCase().includes('incapable'), 'Never labels student incapable');
  assert.ok(!item.reason.toLowerCase().includes('fail'), 'Never uses discouraging labels');
});

test('AR05: Check-in focus invariant targets explanation and formal loop invariant', () => {
  const goal = {
    id: 'goal_foc_inv',
    studyWorkspace: {
      lessonProgress: {
        les_arrays_01: {
          status: 'completed',
          completedAt: '2026-10-19T10:00:00Z',
          checkIn: {
            version: 1,
            focus: 'invariant'
          }
        }
      }
    }
  };

  const reinforcement = deriveAdaptiveReinforcement(goal, MOCK_CATALOG);
  const item = reinforcement.items.find((i) => i.lessonId === 'les_arrays_01');
  assert.ok(item);
  assert.equal(item.evidenceType, 'check_in_focus_invariant');
  assert.equal(item.focusArea, 'invariant');
  assert.equal(item.section, 'explanation');
  assert.ok(item.reason.includes('loop invariant'));
});

test('AR06: Check-in focus update_order targets trace and execution order', () => {
  const goal = {
    id: 'goal_foc_ord',
    studyWorkspace: {
      lessonProgress: {
        les_arrays_01: {
          status: 'completed',
          completedAt: '2026-10-19T10:00:00Z',
          checkIn: {
            version: 1,
            focus: 'update_order'
          }
        }
      }
    }
  };

  const reinforcement = deriveAdaptiveReinforcement(goal, MOCK_CATALOG);
  const item = reinforcement.items.find((i) => i.lessonId === 'les_arrays_01');
  assert.ok(item);
  assert.equal(item.evidenceType, 'check_in_focus_update_order');
  assert.equal(item.focusArea, 'update_order');
  assert.equal(item.section, 'trace');
  assert.ok(item.reason.includes('order'));
});

test('AR07: Check-in focus edge_cases targets alternate input variant and boundary check', () => {
  const goal = {
    id: 'goal_foc_edge',
    studyWorkspace: {
      lessonProgress: {
        les_arrays_01: {
          status: 'completed',
          completedAt: '2026-10-19T10:00:00Z',
          checkIn: {
            version: 1,
            focus: 'edge_cases'
          }
        }
      }
    }
  };

  const reinforcement = deriveAdaptiveReinforcement(goal, MOCK_CATALOG);
  const item = reinforcement.items.find((i) => i.lessonId === 'les_arrays_01');
  assert.ok(item);
  assert.equal(item.evidenceType, 'check_in_focus_edge_cases');
  assert.equal(item.focusArea, 'edge_cases');
  assert.equal(item.variantKey, 'alternate');
  assert.equal(item.section, 'edge');
  assert.ok(item.reason.includes('boundary') || item.reason.includes('edge'));
});

test('AR08: Due recall review identifies due items based on nextReviewDate', () => {
  const goal = {
    id: 'goal_due',
    studyWorkspace: {
      exerciseAttempts: {
        ex_arrays_01: [
          {
            attemptId: 'att_1',
            outcome: 'independent',
            mistakeCount: 0,
            savedAt: '2026-10-10T10:00:00Z',
            nextReviewDate: '2026-10-15'
          }
        ]
      }
    }
  };

  const testNow = new Date('2026-10-20T10:00:00Z');
  const reinforcement = deriveAdaptiveReinforcement(goal, MOCK_CATALOG, testNow);
  assert.equal(reinforcement.dueReviews.length, 1);
  const due = reinforcement.dueReviews[0];
  assert.equal(due.exerciseId, 'ex_arrays_01');
  assert.equal(due.evidenceType, 'due_recall');
  assert.equal(due.isVerified, true);
  assert.ok(due.reason.includes('recall review is due'));
});

test('AR09: Supported trace identifies need for unassisted retry without erasing historical outcome', () => {
  const goal = {
    id: 'goal_supp',
    studyWorkspace: {
      exerciseAttempts: {
        ex_arrays_01: [
          {
            attemptId: 'att_supported',
            outcome: 'with_hint',
            mistakeCount: 1,
            hintsUsed: 1,
            savedAt: '2026-10-18T10:00:00Z',
            nextReviewDate: '2026-10-25' // in the future
          }
        ]
      }
    }
  };

  const testNow = new Date('2026-10-19T10:00:00Z');
  const reinforcement = deriveAdaptiveReinforcement(goal, MOCK_CATALOG, testNow);
  assert.equal(reinforcement.supportedTraces.length, 1);
  const supp = reinforcement.supportedTraces[0];
  assert.equal(supp.exerciseId, 'ex_arrays_01');
  assert.equal(supp.evidenceType, 'supported_trace');
  assert.ok(supp.reason.includes('a hint'));
  assert.ok(supp.reason.includes('unassisted run'));
});

test('AR10: Newer-success resolution: newer independent success resolves older uncertainty', () => {
  const goal = {
    id: 'goal_resolved',
    studyWorkspace: {
      lessonProgress: {
        les_arrays_01: {
          status: 'completed',
          completedAt: '2026-10-18T10:00:00Z',
          checkIn: {
            version: 1,
            confidence: 'needs_example'
          }
        }
      },
      exerciseAttempts: {
        ex_arrays_01: [
          {
            attemptId: 'att_resolved',
            outcome: 'independent',
            mistakeCount: 0,
            savedAt: '2026-10-19T12:00:00Z', // strictly after lesson checkIn
            nextReviewDate: '2026-10-25'
          }
        ]
      }
    }
  };

  const testNow = new Date('2026-10-20T10:00:00Z');
  const reinforcement = deriveAdaptiveReinforcement(goal, MOCK_CATALOG, testNow);
  // Because ex_arrays_01 had a newer independent success, the older needs_example on les_arrays_01 is resolved!
  assert.equal(reinforcement.unresolvedStruggles.length, 0);
  assert.equal(reinforcement.supportedTraces.length, 0);
});

test('AR11: Self-report alone cannot erase evaluated difficulty', () => {
  const goal = {
    id: 'goal_unverified_ready',
    studyWorkspace: {
      exerciseAttempts: {
        ex_arrays_01: [
          {
            attemptId: 'att_hint',
            outcome: 'with_hint',
            mistakeCount: 2,
            hintsUsed: 2,
            savedAt: '2026-10-18T10:00:00Z',
            nextReviewDate: '2026-10-25',
            checkIn: {
              version: 1,
              confidence: 'ready' // self-reported ready, but verified outcome used hints and had 2 mistakes
            }
          }
        ]
      }
    }
  };

  const testNow = new Date('2026-10-19T10:00:00Z');
  const reinforcement = deriveAdaptiveReinforcement(goal, MOCK_CATALOG, testNow);
  // Measured correctness supersedes self-report: supported trace is NOT erased
  assert.equal(reinforcement.supportedTraces.length, 1);
  assert.equal(reinforcement.supportedTraces[0].exerciseId, 'ex_arrays_01');
});

test('AR12: Unknown check-in & focus values are safely ignored without crashing', () => {
  const goal = {
    id: 'goal_unknown_vals',
    studyWorkspace: {
      lessonProgress: {
        les_arrays_01: {
          status: 'completed',
          completedAt: '2026-10-19T10:00:00Z',
          checkIn: {
            version: 1,
            confidence: 'super_confident_ninja',
            focus: 'quantum_entanglement'
          }
        }
      }
    }
  };

  const reinforcement = deriveAdaptiveReinforcement(goal, MOCK_CATALOG);
  assert.doesNotThrow(() => {
    deriveAdaptiveReinforcement(goal, MOCK_CATALOG);
  });
  // Invalid values should not create fake struggles
  assert.equal(reinforcement.unresolvedStruggles.length, 0);
});

test('AR13: External practice disclosure clearly marks isSelfReported: true', () => {
  const goal = {
    id: 'goal_prac',
    studyWorkspace: {
      practiceAttempts: {
        prac_arrays_01: [
          {
            attemptId: 'p_att_1',
            outcome: 'with_hint',
            needsReview: true,
            savedAt: '2026-10-18T10:00:00Z',
            nextReviewDate: '2026-10-28'
          }
        ]
      }
    }
  };

  const reinforcement = deriveAdaptiveReinforcement(goal, MOCK_CATALOG);
  assert.equal(reinforcement.practiceReviews.length, 1);
  const p = reinforcement.practiceReviews[0];
  assert.equal(p.problemId, 'prac_arrays_01');
  assert.equal(p.isSelfReported, true);
  assert.equal(p.isVerified, false);
  assert.ok(p.reason.includes('Self-reported'));
});

test('AR14: Full curriculum completion recommends deliberate revision with zero fabricated lessons', () => {
  const fullLessonProgress = {};
  for (const l of curriculumData.lessons) {
    fullLessonProgress[l.id] = { status: 'completed', completedAt: '2026-10-15T10:00:00Z' };
  }

  const goal = {
    id: 'goal_all_done',
    studyWorkspace: {
      lessonProgress: fullLessonProgress
    }
  };

  const reinforcement = deriveAdaptiveReinforcement(goal, MOCK_CATALOG);
  assert.ok(reinforcement.recommendedNextStep);
  assert.equal(reinforcement.recommendedNextStep.kind, 'revision_lesson');
  assert.ok(reinforcement.recommendedNextStep.reason.includes('All published lessons completed'));
  assert.ok(!reinforcement.recommendedNextStep.lessonId.includes('49'), 'Never invents non-existent lessons');
});

test('AR15: Curriculum search index searches by keywords, patterns, and boundary conditions', () => {
  const index = buildCurriculumSearchIndex(MOCK_CATALOG);

  // Search by topic keyword
  const r1 = index.search('binary search');
  assert.ok(r1.length > 0);
  assert.ok(r1.some((r) => r.title.toLowerCase().includes('binary search')));

  // Search by invariant/pattern
  const r2 = index.search('prefix invariant');
  assert.ok(r2.length > 0);

  // Search by empty string
  const r3 = index.search('');
  assert.deepEqual(r3, []);
});

test('AR16: deriveExplainableRecommendation surfaces adaptive reinforcement for check-in struggle', () => {
  const goal = {
    id: 'goal_explainable_adaptive',
    studyWorkspace: {
      lessonProgress: {
        les_arrays_01: {
          status: 'completed',
          completedAt: '2026-10-19T10:00:00Z',
          checkIn: {
            version: 1,
            confidence: 'needs_example'
          }
        }
      }
    }
  };

  const rec = deriveExplainableRecommendation(goal, MOCK_CATALOG);
  assert.ok(rec);
  assert.equal(rec.kind, 'adaptive_reinforcement');
  assert.equal(rec.badge, 'Worked Example Needed');
  assert.ok(rec.reason.includes('worked example'));
});
