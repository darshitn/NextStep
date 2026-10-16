import test from 'node:test';
import assert from 'node:assert/strict';
import { supabaseAuth } from '../lib/supabase.js';

function setup(t) {
  const originalFetch=globalThis.fetch, originalStorage=globalThis.localStorage;
  let value=JSON.stringify({access_token:'lookup-synthetic',refresh_token:'lookup-refresh',expires_at:Math.floor(Date.now()/1000)+3600,user:null});
  globalThis.localStorage={getItem:()=>value,setItem:(_,v)=>{value=v},removeItem:()=>{value=null}};
  t.after(()=>{globalThis.fetch=originalFetch;globalThis.localStorage=originalStorage});
  return {read:()=>value,replace:v=>{value=v}};
}
const newAccount=()=>JSON.stringify({access_token:'new-account-synthetic',refresh_token:'new-refresh',expires_at:Math.floor(Date.now()/1000)+3600,user:{id:'new-user',email:'new@example.test'}});

test('temporary user lookup outage retains the session and offers a recoverable error',async t=>{
  const store=setup(t),before=store.read();let calls=0;
  globalThis.fetch=async()=>{calls++;return {ok:false,status:503,json:async()=>({})}};
  await assert.rejects(supabaseAuth.getCurrentUser(),e=>e.code==='AUTH_UNAVAILABLE');
  assert.equal(store.read(),before);assert.equal(calls,1,'must not call logout for 503');
});
test('network and malformed lookup responses retain the session for retry',async t=>{
  const store=setup(t),before=store.read();
  globalThis.fetch=async()=>{throw new Error('synthetic outage')};
  await assert.rejects(supabaseAuth.getCurrentUser(),e=>e.code==='NETWORK_ERROR');
  globalThis.fetch=async()=>({ok:true,status:200,json:async()=>({})});
  await assert.rejects(supabaseAuth.getCurrentUser(),e=>e.code==='AUTH_UNAVAILABLE');
  assert.equal(store.read(),before);
});
test('genuinely invalid lookup expires the same session',async t=>{
  const store=setup(t);
  globalThis.fetch=async url=>({ok:String(url).endsWith('/logout'),status:401,json:async()=>({})});
  await assert.rejects(supabaseAuth.getCurrentUser(),e=>e.code==='UNAUTHORIZED');
  assert.equal(store.read(),null);
});
test('late user lookup cannot restore a session after sign-out',async t=>{
  const store=setup(t);let resolve;
  globalThis.fetch=()=>new Promise(r=>{resolve=r});
  const pending=supabaseAuth.getCurrentUser();await Promise.resolve();
  store.replace(null);resolve({ok:true,status:200,json:async()=>({id:'old-user'})});
  assert.equal(await pending,null);assert.equal(store.read(),null);
});
test('late invalid lookup cannot revoke a different account',async t=>{
  const store=setup(t);let resolve;
  globalThis.fetch=()=>new Promise(r=>{resolve=r});
  const pending=supabaseAuth.getCurrentUser();await Promise.resolve();
  const replacement=newAccount();store.replace(replacement);
  resolve({ok:false,status:401,json:async()=>({})});
  assert.equal((await pending).id,'new-user');assert.equal(store.read(),replacement);
});
test('sign-in during invalid-session logout wins over the old expiration error',async t=>{
  const store=setup(t);
  globalThis.fetch=async url=>{
    if(String(url).endsWith('/logout')){store.replace(newAccount());return {ok:true,status:200,json:async()=>({})};}
    return {ok:false,status:401,json:async()=>({})};
  };
  assert.equal((await supabaseAuth.getCurrentUser()).id,'new-user');
});
