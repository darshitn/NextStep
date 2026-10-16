import test from 'node:test';
import assert from 'node:assert/strict';
import { apiService, onSessionExpired } from '../services/apiService.js';
import { liveApi } from '../lib/api.js';

test('rejected sign-in/signup do not announce session expiry; protected calls still do',async t=>{
  const original={signIn:liveApi.signIn,signUp:liveApi.signUp,getGoal:liveApi.getGoal};
  const fail=async()=>{throw Object.assign(new Error('Synthetic authorization rejection'),{status:401,code:'UNAUTHORIZED'})};
  Object.assign(liveApi,{signIn:fail,signUp:fail,getGoal:fail});
  let expired=0;const unsubscribe=onSessionExpired(()=>expired++);
  t.after(()=>{Object.assign(liveApi,original);unsubscribe()});
  await assert.rejects(apiService.signIn('synthetic@example.test','synthetic'));
  await assert.rejects(apiService.signUp('synthetic@example.test','synthetic'));
  assert.equal(expired,0);
  await assert.rejects(apiService.getGoal());assert.equal(expired,1);
});
