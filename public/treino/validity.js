/* Calendar months, clamped at month end; dates use the device's local calendar. */
const WorkoutValidity={
 today(now=new Date()){return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`},
 validDate(value){if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const [y,m,d]=value.split('-').map(Number);const date=new Date(y,m-1,d,12);return date.getFullYear()===y&&date.getMonth()===m-1&&date.getDate()===d},
 create(months,now=new Date()){if(![1,2,3].includes(months))throw Error('Escolha uma validade de 1, 2 ou 3 meses.');const end=new Date(now.getFullYear(),now.getMonth()+months,1,12);end.setDate(Math.min(now.getDate(),new Date(end.getFullYear(),end.getMonth()+1,0).getDate()));return {months,startsOn:this.today(now),expiresOn:this.today(end)}},
 valid(value){return !!value&&[1,2,3].includes(value.months)&&this.validDate(value.startsOn)&&this.validDate(value.expiresOn)&&value.expiresOn>value.startsOn},
 state(value,now=new Date()){if(!this.valid(value))return 'unset';return this.today(now)>value.expiresOn?'expired':'active'},
 format(date){const [y,m,d]=date.split('-');return `${d}/${m}/${y}`}
};
if(typeof module!=='undefined')module.exports=WorkoutValidity;
