const test=require('node:test');
const assert=require('node:assert/strict');
const Training=require('../public/my-workout/training.js');

test('recognizes timed exercises, uses the upper end of ranges, and ignores repetition counts',()=>{
  assert.equal(Training.durationSeconds('30–45 s'),45);
  assert.equal(Training.durationSeconds('1-2 min'),120);
  assert.equal(Training.durationSeconds('30 segundos'),30);
  assert.equal(Training.durationSeconds('8–12'),0);
  assert.equal(Training.durationSeconds('90 min'),0);
});

test('counts down an exercise timer and preserves remaining time while paused',()=>{
  const timer={end:16000,remaining:10000};
  assert.equal(Training.exerciseTimeLeft(timer,11000),5000);
  timer.end=null;
  timer.remaining=5000;
  assert.equal(Training.exerciseTimeLeft(timer,20000),5000);
});

test('starts a timed series, freezes it on pause, and resumes the remaining time',()=>{
  const session={startedAt:1000,rest:null};
  const plank={reps:'30–45 s'};
  Training.syncExerciseTimer(session,plank,2,1000);
  assert.equal(session.exerciseTimer.end,46000);
  Training.pauseExerciseTimer(session,11000);
  assert.equal(session.exerciseTimer.remaining,35000);
  session.startedAt=20000;
  Training.syncExerciseTimer(session,plank,2,20000);
  assert.equal(session.exerciseTimer.end,55000);
});

test('restores the most recently used unfinished workout from this week',()=>{
  const sessions={
    '2026-10-26:1':{current:2,startedAt:null,elapsed:30000,updatedAt:10},
    '2026-10-26:3':{current:1,startedAt:1000,elapsed:0,updatedAt:20},
    '2026-10-26:4':{current:0,startedAt:null,elapsed:20000,finished:true,updatedAt:30},
    '2026-10-19:5':{current:0,startedAt:1000,elapsed:20000,updatedAt:40}
  };
  assert.equal(Training.resumeDay(sessions,'2026-10-26'),3);
  assert.equal(Training.resumeDay({},'2026-10-26'),null);
});

test('starts a rest timer after the final set when moving to another exercise',()=>{
  const items=[{name:'A',sets:'2',reps:'8'},{name:'B',sets:'1',reps:'10'}];
  const session={startedAt:1000,elapsed:0,current:0};
  let done=Training.mark(session,items,[],0,false,60,2000);
  assert.equal(session.current,0);
  assert.equal(session.rest.betweenExercises,false);
  session.rest=null;
  done=Training.mark(session,items,done,0,false,60,3000);
  assert.equal(session.current,1);
  assert.equal(session.rest.betweenExercises,true);
  assert.equal(session.rest.nextExercise,1);
  assert.equal(session.rest.seconds,60);
});

test('cycles through grouped exercises one series each, then starts the next round',()=>{
  const items=[{name:'A1',sets:'2',reps:'8',cycle:'A'},{name:'A2',sets:'2',reps:'10',cycle:'A'},{name:'B',sets:'1',reps:'12'}];
  const session={startedAt:1000,elapsed:0,current:0};
  let done=[];
  for(const expected of [1,0,1,2]){
    done=Training.mark(session,items,done,session.current,false,0,2000+done.length);
    assert.equal(session.current,expected);
    session.rest=null;
  }
  assert.deepEqual(session.sets,{0:2,1:2});
});

test('predicts the next exercise from the actual series or cycle order without changing progress',()=>{
  const items=[{name:'A1',sets:'2',reps:'8',cycle:'A'},{name:'A2',sets:'2',reps:'10',cycle:'A'},{name:'B',sets:'1',reps:'12'}];
  const session={startedAt:1000,elapsed:0,current:0,sets:{}};
  assert.equal(Training.predictNext(session,items,[],0),1);
  assert.deepEqual(session.sets,{});
  session.sets[0]=1;
  assert.equal(Training.predictNext(session,items,[],0),1);
});
