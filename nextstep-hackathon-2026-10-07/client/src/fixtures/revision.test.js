import test from 'node:test';
import assert from 'node:assert/strict';
import { apiFixture } from './apiFixture.js';

test('completed-work fixture guidance is labelled synthetic and never changes progress',async()=>{
  await apiFixture.signIn('student.active@nextstep.local');
  const before=(await apiFixture.getGoal()).data.goal;
  const response=await apiFixture.getGuidance({expectedVersion:before.version,missionId:'m01',category:'need_revision'});
  assert.equal(response.data.guidance.source,'fixture');
  assert.equal(response.data.guidance.missionId,'m01');
  assert.deepEqual((await apiFixture.getGoal()).data.goal,before);
  await assert.rejects(apiFixture.getGuidance({expectedVersion:before.version,missionId:'m04',category:'need_revision'}),e=>e.code==='INVALID_MISSION');
});
