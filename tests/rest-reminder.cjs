const {test}=require('node:test');
const assert=require('node:assert/strict');

const subscription={endpoint:'https://web.push.apple.com/QwErTy',keys:{p256dh:'a'.repeat(87),auth:'b'.repeat(22)}};

test('rest reminders accept a short-lived device schedule only',async()=>{
 const {validate}=await import('../api/_lib/rest-reminders.mjs');
 const input={token:'a'.repeat(64),nonce:'b'.repeat(32),delaySeconds:60,subscription};
 assert.deepEqual(validate(input),input);
 assert.throws(()=>validate({...input,delaySeconds:1801}));
 assert.throws(()=>validate({...input,nonce:'short'}));
 assert.throws(()=>validate({...input,subscription:{...subscription,endpoint:'https://localhost/private'}}));
});
