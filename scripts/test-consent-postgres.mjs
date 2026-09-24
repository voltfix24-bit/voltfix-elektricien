import assert from 'node:assert/strict';

// Called only by the disposable-cluster runner. No production URL or .env is read.
export async function testConsentPostgres(sql) {
  const results = [];
  const h = 'a'.repeat(64), token = 'b'.repeat(64), other = 'c'.repeat(64), otherToken = 'd'.repeat(64);
  const choice = (seq, value, db = sql, key = token, storage = 'granted') =>
    db`select ads_consent_apply_v2(${key}, ${seq}, ${value}, ${storage}, 'test', 3) as result`.then(r => r[0].result);
  const ensure = (hash = h, key = token) => sql`select ads_consent_subject_v2(${hash}, ${key})`;
  const reset = async () => {
    await sql`truncate ad_consent_choices_v2, ad_consent_subjects_v2, conversion_events, quote_requests, leads, ads_conversion_outbox cascade`;
    await sql`delete from ads_worker_checkpoint`;
    await sql`update ads_migration_policy set backfill_start_at = now() - interval '2 days' where id=1`;
  };
  const seed = async () => {
    await ensure(); await choice(1,'granted');
    const [lead] = await sql`insert into leads (consent_visitor_hash,gclid,ad_click_evidence,ad_consent_ad_user_data,outcome,outcome_at)
      values (${h},'SAME_PUBLIC_CLICK','form','granted','done',now()) returning *`;
    const [row] = await sql`insert into ads_conversion_outbox
      (lead_id,phase,account_id,conversion_action_id,status,event_time,gclid,value_cents)
      values (${lead.id},'job_completed','9084464909','action-1','pending',now(),'SAME_PUBLIC_CLICK',12500) returning *`;
    return { lead, row };
  };
  const claim = (row, db = sql, action = 'action-1') =>
    db`select ads_claim_v2(${row.id},${row.attempts},${row.status},${action},now()+interval '1 hour') as result`.then(r=>r[0].result);
  const check = async (name, run) => {
    await reset();
    try { await run(); results.push({name,passed:true}); console.log('PASS',name); }
    catch (e) { results.push({name,passed:false,error:String(e)}); console.error('FAIL',name,e); }
  };
  const deferred = () => { let resolve; const promise = new Promise(r=>{resolve=r}); return {promise,resolve}; };
  const waitForLock = async () => {
    for(let n=0;n<100;n++) {
      const [r] = await sql`select count(*)::int as n from pg_stat_activity where datname=current_database() and wait_event_type='Lock'`;
      if(r.n>0) return;
      await new Promise(r=>setTimeout(r,10));
    }
    throw new Error('Expected a real PostgreSQL lock wait');
  };

  await check('concurrent receipt issuance has one stable owner',async()=>{
    await Promise.all([ensure(),ensure(),ensure()]);
    assert.equal((await sql`select * from ad_consent_subjects_v2`).length,1);
    await assert.rejects(ensure(h,otherToken),/credential mismatch/);
  });
  await check('foreign browser with the same public click cannot block a valid export',async()=>{
    const {row,lead}=await seed(); await ensure(other,otherToken);
    await sql`insert into leads (consent_visitor_hash,gclid) values (${other},'SAME_PUBLIC_CLICK')`;
    await choice(1,'denied',sql,otherToken);
    assert.equal((await sql`select ad_consent_ad_user_data as c from leads where id=${lead.id}`)[0].c,'granted');
    assert.equal((await claim(row)).claimed,true);
  });
  await check('unknown receipt cannot modify any record',async()=>{
    await seed(); assert.deepEqual(await choice(2,'denied',sql,otherToken),{ok:false,reason:'unknown_ticket'});
    assert.equal((await sql`select ad_user_data from ad_consent_subjects_v2`)[0].ad_user_data,'granted');
  });
  await check('same decision retries successfully and conflicting sequence is rejected',async()=>{
    await seed(); assert.equal((await choice(2,'denied')).ok,true);
    assert.equal((await choice(2,'denied')).ok,true);
    assert.deepEqual(await choice(2,'granted'),{ok:false,reason:'conflict'});
    assert.deepEqual(await choice(1,'granted'),{ok:false,reason:'stale'});
    assert.equal((await sql`select * from ad_consent_choices_v2`).length,2);
  });
  await check('projection failure rolls the entire choice back; identical retry completes',async()=>{
    const {lead}=await seed();
    await sql.unsafe(`create function test_fail_projection() returns trigger language plpgsql as $$begin raise exception 'injected failure'; end$$;
      create trigger test_failure before update on leads for each row execute function test_fail_projection();`);
    try {
      await assert.rejects(choice(2,'denied'),/injected failure/);
      assert.equal((await sql`select seq::int from ad_consent_subjects_v2`)[0].seq,1);
    } finally { await sql.unsafe('drop trigger test_failure on leads; drop function test_fail_projection();'); }
    assert.equal((await choice(2,'denied')).ok,true);
    assert.equal((await sql`select ad_consent_ad_user_data as c from leads where id=${lead.id}`)[0].c,'denied');
  });
  await check('overlapping choices serialize without a time-based lock takeover',async()=>{
    const {lead}=await seed(), acquired=deferred(), release=deferred();
    const first=sql.begin(async tx=>{ await choice(2,'denied',tx); acquired.resolve(); await release.promise; });
    await acquired.promise;
    const second=choice(3,'granted');
    try { await waitForLock(); } finally { release.resolve(); }
    await first; assert.equal((await second).ok,true);
    assert.equal((await sql`select ad_consent_ad_user_data as c from leads where id=${lead.id}`)[0].c,'granted');
    assert.equal((await sql`select seq::int from ad_consent_subjects_v2`)[0].seq,3);
  });
  await check('withdrawal committed before a claim blocks the waiting claim, with zero attempts',async()=>{
    const {row}=await seed(), acquired=deferred(), release=deferred();
    const first=sql.begin(async tx=>{ await choice(2,'denied',tx); acquired.resolve(); await release.promise; });
    await acquired.promise;
    const second=claim(row);
    try { await waitForLock(); } finally { release.resolve(); }
    await first; assert.equal((await second).claimed,false);
    assert.equal((await sql`select attempts from ads_conversion_outbox where id=${row.id}`)[0].attempts,0);
  });
  await check('two workers can claim a conversion only once',async()=>{
    const {row}=await seed(); const both=await Promise.all([claim(row),claim(row)]);
    assert.equal(both.filter(r=>r.claimed).length,1);
    assert.equal((await sql`select attempts from ads_conversion_outbox where id=${row.id}`)[0].attempts,1);
  });
  await check('a missing authoritative decision blocks a copied grant',async()=>{
    const {row}=await seed(); await sql`update ad_consent_subjects_v2 set ad_user_data=null,ad_storage=null`;
    assert.equal((await claim(row)).reason,'blocked_consent');
  });
  await check('an unbound historical dossier cannot export a recent phase',async()=>{
    const {row,lead}=await seed(); await sql`update leads set consent_visitor_hash=null where id=${lead.id}`;
    assert.equal((await claim(row)).reason,'blocked_consent');
  });
  await check('late form data cannot restore identifiers after withdrawal',async()=>{
    await seed(); await choice(2,'denied',sql,token,'denied');
    const [r]=await sql`insert into leads(consent_visitor_hash,gclid,ad_consent_ad_user_data) values (${h},'LATE_CLICK','granted') returning *`;
    assert.equal(r.gclid,null); assert.equal(r.ad_consent_ad_user_data,'denied');
    assert.equal((await choice(1,'granted')).reason,'stale');
  });
  await check('intake waits for an overlapping withdrawal, then strips ad identifiers',async()=>{
    await seed(); const acquired=deferred(),release=deferred();
    const first=sql.begin(async tx=>{await choice(2,'denied',tx,token,'denied');acquired.resolve();await release.promise;});
    await acquired.promise;
    const insert=sql`insert into quote_requests(ad_visitor_hash,gclid,ad_consent_ad_user_data) values (${h},'LATE','granted') returning *`.execute();
    try { await waitForLock(); } finally { release.resolve(); }
    await first; assert.equal((await insert)[0].gclid,null);
  });
  await check('older application instances cannot bypass the atomic claim',async()=>{
    const {row}=await seed();
    await assert.rejects(sql`update ads_conversion_outbox set status='in_flight',attempts=1 where id=${row.id}`,/Use ads_claim_v2/);
  });
  await check('a frozen payload rejects stale revalidation even after status changes back',async()=>{
    const {row}=await seed(); const result=await claim(row); assert.equal(result.claimed,true);
    await sql`update ads_conversion_outbox set status='config_missing' where id=${row.id}`;
    await assert.rejects(sql`update ads_conversion_outbox set gclid='STALE',value_cents=1 where id=${row.id}`,/Frozen conversion/);
    assert.equal((await sql`select value_cents from ads_conversion_outbox where id=${row.id}`)[0].value_cents,12500);
  });
  await check('retry retains exact identity and a changed destination is blocked',async()=>{
    const {row}=await seed(); const first=(await claim(row)).row;
    const [retry]=await sql`update ads_conversion_outbox set status='failed_temporary',next_attempt_at=now() where id=${row.id} returning *`;
    const second=await claim(retry);
    assert.equal(second.claimed,true);
    for(const k of ['event_time','gclid','conversion_action_id','value_cents','event_source','currency','payload_frozen_at']) assert.equal(second.row[k],first[k]);
    const [changed]=await sql`update ads_conversion_outbox set status='failed_temporary',next_attempt_at=now() where id=${row.id} returning *`;
    assert.equal((await claim(changed,sql,'action-2')).reason,'destination_changed');
  });
  await check('current history policy blocks a row that was already queued',async()=>{
    const {row}=await seed(); await sql`update ads_conversion_outbox set event_time=now()-interval '10 days' where id=${row.id}`;
    assert.equal((await claim(row)).reason,'skipped_historical');
  });
  await check('explicit legacy marker blocks every phase',async()=>{
    const {row}=await seed(); await sql`update ads_conversion_outbox set legacy_import=true where id=${row.id}`;
    assert.equal((await claim(row)).reason,'skipped_historical');
  });
  await check('test dossiers never claim',async()=>{
    const {row,lead}=await seed(); await sql`update leads set is_test=true where id=${lead.id}`;
    assert.equal((await claim(row)).reason,'skipped_test');
  });
  await check('anonymous and authenticated roles cannot invoke privileged consent RPCs',async()=>{
    await seed();
    for(const role of ['anon','authenticated']) {
      await assert.rejects(sql.begin(async tx=>{await tx.unsafe(`set local role ${role}`);await choice(2,'denied',tx);}),/permission denied/);
      await assert.rejects(sql.begin(async tx=>{await tx.unsafe(`set local role ${role}`);await tx`select * from ad_consent_subjects_v2`;}),/permission denied/);
    }
  });
  return results;
}
