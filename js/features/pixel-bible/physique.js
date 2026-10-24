// Relative sprite proportions, not a claim about exact historical measurements.
export function physiqueFor(name='',role='',refs=[]){
 const seed=[...name].reduce((n,c)=>(Math.imul(n,31)+c.codePointAt(0))>>>0,0);
 if(/골리앗/.test(name))return {width:1.38,height:1.58,evidence:'사무엘상 17:4 · 큰 키. 배율은 비교를 위한 창작 수치예요.'};
 if(name==='삭개오')return {width:.96,height:.82,evidence:'누가복음 19:3 · 키가 작았다는 기록.'};
 if(name==='사울'&&(!refs.length||refs.some(r=>/^(사무엘|역대상)/.test(r)))&&!/바울/.test(role))return {width:1.08,height:1.2,evidence:'사무엘상 9:2 · 다른 사람보다 큰 키.'};
 if(/아낙|아히만|세새|달매/.test(name)&&refs.some(r=>/^(민수기|신명기|여호수아|사사기)/.test(r)))return {width:1.2,height:1.3,evidence:'민수기 13:22, 33 · 아낙 자손에 관한 기록. 모든 가나안 사람에게 적용하지 않아요.'};
 return {width:[.96,1,1.04][seed%3],height:[.97,1,1.03][(seed>>>3)%3],evidence:'기록되지 않은 체격의 작은 차이는 창작 디자인이에요.'};
}
