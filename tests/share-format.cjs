const test=require('node:test');
const assert=require('node:assert/strict');
const {planForSharing,toImportText}=require('../public/my-workout/share-format.js');

const plan={
  1:{title:'Full Body A',validity:{months:2,expiresOn:'2026-12-23'},items:[
    {name:'Agachamento livre',sets:'3',reps:'6–8',restSeconds:90,completedSets:2},
    {name:'Prancha',sets:'3',reps:'30–45 s'}
  ]},
  2:{title:'Descanso',items:[]}
};

test('prepara uma ficha portátil sem validade nem progresso local',()=>{
  assert.deepEqual(planForSharing(plan),{
    1:{title:'Full Body A',items:[
      {name:'Agachamento livre',sets:'3',reps:'6–8',restSeconds:90},
      {name:'Prancha',sets:'3',reps:'30–45 s'}
    ]}
  });
});

test('gera texto estruturado que pode ser colado no importador',()=>{
  const text=toImportText(plan);
  assert.match(text,/## Segunda — Full Body A/);
  assert.match(text,/\| Agachamento livre \| 3 \| 6–8 \| 90 \|/);
  assert.match(text,/\| Prancha \| 3 \| 30–45 s \| — \|/);
  assert.doesNotMatch(text,/\| Descanso \|/);
});
