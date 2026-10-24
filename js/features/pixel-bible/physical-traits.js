// Evidence-backed physical traits; exact face shapes and hair styling remain art.
export const PHYSICAL_TRAITS=[
 {names:['압살롬'],books:['사무엘하'],ref:'사무엘하 14:25–26',note:'아름다운 용모와 무거운 머리털.',set:{longHair:true,hairSheen:true,fringe:0,eyeSpacing:0}},
 {names:['사라','사래'],books:['창세기'],ref:'창세기 12:11',note:'아름다운 용모. 구체적인 얼굴형은 기록되지 않음.',set:{hairSheen:true,eyeSpacing:0}},
 {names:['리브가'],books:['창세기'],ref:'창세기 24:16',note:'아름다운 용모.',set:{hairSheen:true,fringe:0,eyeSpacing:0}},
 {names:['라헬'],books:['창세기'],ref:'창세기 29:17',note:'아름다운 용모.',set:{hairSheen:true,fringe:1,eyeSpacing:0}},
 {names:['레아'],books:['창세기'],ref:'창세기 29:17',note:'눈의 묘사는 번역에 차이가 있어 질환·추한 외모로 단정하지 않음.',set:{softEyes:true}},
 {names:['요셉'],books:['창세기'],ref:'창세기 39:6',note:'아름다운 용모. 신약의 동명이인과 구분.',set:{hairSheen:true,fringe:0,eyeSpacing:0}},
 {names:['다윗'],books:['사무엘상','사무엘하','역대상'],ref:'사무엘상 16:12',note:'붉은 안색과 빼어난 눈. 붉은 머리라는 뜻으로 단정하지 않음.',set:{warmCheeks:true,eyeSpacing:0}},
 {names:['아비가일'],books:['사무엘상','사무엘하'],ref:'사무엘상 25:3',note:'아름다운 용모.',set:{hairSheen:true,eyeSpacing:1}},
 {names:['아비삭'],books:['열왕기상'],ref:'열왕기상 1:3–4',note:'젊고 아름다운 용모.',set:{hairSheen:true,longHair:true,fringe:1}},
 {names:['아도니야'],books:['열왕기상'],ref:'열왕기상 1:6',note:'준수한 용모.',set:{hairSheen:true,fringe:0,eyeSpacing:0}},
 {names:['에스더','하닷사'],books:['에스더'],ref:'에스더 2:7',note:'아름다운 용모.',set:{hairSheen:true,eyeSpacing:0}},
 {names:['와스디'],books:['에스더'],ref:'에스더 1:11',note:'아름다운 용모와 왕후의 관.',set:{hairSheen:true,crown:true,royal:true}},
 {names:['다말'],books:['사무엘하'],ref:'사무엘하 13:1; 14:27',note:'사무엘하의 서로 다른 다말에게 아름다운 용모가 기록됨. 창세기의 다말과 구분.',set:{hairSheen:true,eyeSpacing:0}},
 {names:['에서'],books:['창세기'],ref:'창세기 25:25; 27:11',note:'털이 많은 몸. 털옷을 입었다는 뜻과 구분.',set:{bodyHair:true,fur:false,warmCheeks:true}},
 {names:['삼손'],books:['사사기'],ref:'사사기 16:13, 17',note:'머리털 일곱 가닥. 삭발 전의 상징 외형.',set:{longHair:true,braidedHair:true}},
 {names:['엘리사'],books:['열왕기상','열왕기하'],ref:'열왕기하 2:23',note:'대머리라는 묘사.',set:{bald:true}},
 {names:['에훗'],books:['사사기'],ref:'사사기 3:15–16',note:'왼손잡이이며 오른쪽 허벅지에 칼을 참.',set:{leftHanded:true,rightScabbard:true}},
 {names:['에글론'],books:['사사기'],ref:'사사기 3:17',note:'몸집이 매우 컸다는 기록.',set:{broadTorso:true}},
 {names:['엘리'],books:['사무엘상'],chapters:[4],ref:'사무엘상 4:15, 18',note:'고령이며 몸이 무겁고 시력이 약해진 시점.',set:{hair:'#d2c6b4',beard:'#d2c6b4',softEyes:true}},
 {names:['아히야'],books:['열왕기상'],chapters:[14],ref:'열왕기상 14:4',note:'나이가 많아 눈이 어두워진 시점.',set:{hair:'#d2c6b4',beard:'#d2c6b4',softEyes:true}},
 {names:['이삭'],books:['창세기'],minChapter:27,ref:'창세기 27:1',note:'늙어 시력이 약해진 시점. 어린 시절에는 적용하지 않음.',set:{hair:'#d2c6b4',beard:'#d2c6b4',softEyes:true}},
 {names:['다니엘','하나냐','미사엘','아사랴','사드락','메삭','아벳느고'],books:['다니엘'],chapters:[1],ref:'다니엘 1:4–6',note:'왕궁 교육에 선발된 용모가 준수한 소년들. 같은 이름의 제사장과 구분.',set:{hairSheen:true,eyeSpacing:0}},
 {names:['안나'],books:['누가복음'],chapters:[2],ref:'누가복음 2:36–37',note:'고령의 여선지자. 흰 머리 표현은 나이를 나타내는 창작 도안.',set:{hair:'#d2c6b4',hood:false,shawl:true}},
 {names:['바르실래'],books:['사무엘하'],chapters:[17,19],ref:'사무엘하 19:32',note:'여든 살의 노인. 머리와 수염 색은 나이를 나타내는 창작 도안.',set:{hair:'#d2c6b4',beard:'#d2c6b4'}},
 {names:['므비보셋'],books:['사무엘하'],chapters:[4,9,16,19],ref:'사무엘하 4:4; 9:13',note:'요나단의 아들로 두 발에 장애가 있음. 기존 비대칭 걸음과 함께 표시.',set:{unevenStance:true}},
 {names:['여섯 손가락 거인','가드의 거인'],books:['역대상','사무엘하'],ref:'역대상 20:6; 사무엘하 21:20',note:'큰 체격과 손발의 여섯 가락. 작은 도트에서 가락 수를 정확하게 그리지는 않음.',set:{broadHands:true}},
 {names:['느부갓네살'],books:['다니엘'],chapters:[4],minVerse:33,ref:'다니엘 4:33',note:'머리털과 손톱이 길어진 사건 시점. 장 전체 선택에는 앞뒤 시점을 구분할 수 없어 고정하지 않음.',set:{longHair:true,unkempt:true,crown:false}},
];
function scope(ref){const m=String(ref).match(/^(.+?)\s+(\d+)(?:[:장편](\d+))?/);return m?{book:m[1],chapter:Number(m[2]),verse:Number(m[3]||0)}:null;}
export function physicalTraitsFor(name,refs=[]){
 const scopes=refs.map(scope).filter(Boolean);return PHYSICAL_TRAITS.filter(t=>t.names.includes(name)&&scopes.some(s=>t.books.includes(s.book)&&(!t.chapters||t.chapters.includes(s.chapter))&&(!t.minChapter||s.chapter>=t.minChapter)&&(!t.minVerse||s.verse>=t.minVerse)));
}
export function withPhysicalTraits(style,name,refs){const traits=physicalTraitsFor(name,refs);return {...style,...Object.assign({},...traits.map(t=>t.set)),physicalEvidence:traits.map(t=>`${t.ref} · ${t.note}`).join(' ')};}
export function drawPhysicalDetails(r,s,{side=false,back=false}={}){
 if(s.broadHands){r(side?16:18,27,3,2,'#f2d5af');if(!side)r(4,27,3,2,'#f2d5af');}
 if(s.bodyHair){r(side?14:5,26,1,1,'#735139');r(side?15:18,28,1,1,'#735139');}
 if(s.rightScabbard){r(side?15:16,28,2,5,'#765b44');r(side?14:15,27,4,1,'#c9b780');}
 if(s.braidedHair&&back)for(let x=6;x<19;x+=2){r(x,15,1,6,s.hair);r(x,20,1,1,'#b49664');}
 if(s.hairSheen){if(back)r(8,8,8,1,'#ffffff33');else if(side)r(8,8,5,1,'#ffffff33');}
}
