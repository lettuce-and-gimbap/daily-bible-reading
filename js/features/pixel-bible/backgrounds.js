// 선택형 상상 지형. 실제 성경 지리나 해당 사건의 장소를 확정하지 않는다.
export const BACKGROUNDS = {
 meadow:{name:'초록 마을',ground:'#6f995f',sky:'#9cb9cf',tile:['#759f62','#6c955b'],speck:'#9ab56d',path:'#b9b082',pathLight:'#c9bc8b',water:'#467f8e',wave:'#71a9a6',bank:'#8c9570',hill:'#4a7758',house:'#d0bd8a',roof:'#b09e70',motif:'village'},
 desert:{name:'모래 광야',ground:'#c6ad78',sky:'#d7b88e',tile:['#cbb37e','#c2a671'],speck:'#e0ca96',path:'#b59a68',pathLight:'#d5bd88',water:'#5a9298',wave:'#91b6a9',bank:'#ae9468',hill:'#a78660',house:'#d6bd8e',roof:'#ad8e63',motif:'dunes'},
 lake:{name:'호숫가',ground:'#7eaa87',sky:'#9bc3d4',tile:['#86b18f','#79a480'],speck:'#a6c49d',path:'#c3b995',pathLight:'#d7cba6',water:'#4c91ac',wave:'#93c8cf',bank:'#a6b49b',hill:'#568b85',house:'#c7c8ae',roof:'#8eaa99',motif:'lake'},
 mountain:{name:'바위 산지',ground:'#8b9883',sky:'#a6b8c4',tile:['#929d88','#84917d'],speck:'#b5baa0',path:'#b5aa91',pathLight:'#ccc0a6',water:'#658a95',wave:'#9bb4b4',bank:'#929989',hill:'#64756e',house:'#bcc1ac',roof:'#8e9b8c',motif:'mountains'},
 evening:{name:'노을 들판',ground:'#99916c',sky:'#db9e88',tile:['#a19a72','#938b66'],speck:'#c4b684',path:'#baaa82',pathLight:'#d7bd8f',water:'#786f91',wave:'#b59bab',bank:'#9a8b78',hill:'#786e75',house:'#d0b597',roof:'#a2887e',motif:'sunset'},
 night:{name:'별빛 마을',ground:'#536f70',sky:'#354668',tile:['#597778','#4e696c'],speck:'#7c9790',path:'#8b8e86',pathLight:'#ada994',water:'#405d80',wave:'#7c94b0',bank:'#667b83',hill:'#344b64',house:'#9aaba6',roof:'#70888b',motif:'stars'},
};
export const backgroundFor=key=>Object.hasOwn(BACKGROUNDS,key)?BACKGROUNDS[key]:BACKGROUNDS.meadow;

// 분량별로 고정된 상상 배경. 실제 성경 지리를 확정하는 용도가 아니다.
export function defaultBackground(chapters) {
 const first=chapters[0];
 if(!first)return 'meadow';
 const match=BACKGROUND_CONTEXTS.find(r=>r.code===first.code&&(r.chapters?r.chapters.includes(Number(first.chap)):first.chap>=r.from&&first.chap<=r.to));
 return match?.key||'meadow';
}
export const backgroundStorageKey=key=>`pixel-bible-background:${key}`;

// 본문이 묘사한 지형 요소를 사용하는 도안. 지도/건축 복원도는 아니다.
const additions={
 garden:['강이 흐르는 동산','meadow','garden','창세기 2:8–14'],
 nile:['나일 강변','desert','river','출애굽기 2:3–10'],
 camp:['광야의 진영','desert','camp','민수기 2:1–34'],
 sinai:['시내산 아래','mountain','sinai','출애굽기 19:16–20'],
 river:['요단 강변','lake','river','여호수아 3:14–17'],
 harvest:['베들레헴 보리밭','meadow','harvest','룻기 2:1–23'],
 vineyard:['포도원 곁 마을','evening','vineyard','열왕기상 21:1–3'],
 pasture:['푸른 초장','meadow','pasture','시편 23:1–2'],
 galilee:['갈릴리 호숫가','lake','galilee','마태복음 4:18–22'],
 jerusalem:['예루살렘 성벽','mountain','city','느헤미야 3:1–32'],
 babylon:['바벨론 궁성','desert','babylon','다니엘 1:1–6'],
 ruins:['무너진 성벽','mountain','ruins','열왕기하 25:8–10'],
 temple:['성전 뜰','desert','temple','열왕기상 6:1–10'],
 newcity:['강과 생명나무의 성','meadow','newcity','요한계시록 21:10–21; 22:1–2'],
};
for(const [id,[name,base,motif,ref]]of Object.entries(additions))BACKGROUNDS[id]={...BACKGROUNDS[base],name,motif,ref};
export const BACKGROUND_CONTEXTS=[
 {code:'gen',chapters:[2,3],key:'garden'}, {code:'exo',chapters:[1,2,7,8,9,10,11,12],key:'nile'},
 {code:'exo',chapters:[19,20,24,32,33,34],key:'sinai'}, {code:'exo',from:25,to:31,key:'camp'},
 {code:'num',from:1,to:10,key:'camp'}, {code:'jos',chapters:[3,4],key:'river'},
 {code:'rut',from:1,to:4,key:'harvest'}, {code:'psa',chapters:[23],key:'pasture'},
 {code:'1ki',chapters:[19],key:'mountain'}, {code:'1ki',chapters:[21],key:'vineyard'}, {code:'1ki',from:6,to:8,key:'temple'},
 {code:'mat',chapters:[4,8,13,14],key:'galilee'}, {code:'mrk',chapters:[1,4,6],key:'galilee'},
 {code:'luk',chapters:[5,8],key:'galilee'}, {code:'jhn',chapters:[6,21],key:'galilee'},
 {code:'neh',from:2,to:13,key:'jerusalem'}, {code:'2ki',chapters:[2],key:'river'}, {code:'2ki',chapters:[25],key:'ruins'},
 {code:'dan',chapters:[1,2,4,5],key:'babylon'}, {code:'rev',chapters:[21,22],key:'newcity'},
];

Object.assign(BACKGROUNDS.newcity,{ground:'#d6d5bb',tile:['#dad9c0','#d1d3b7'],house:'#eee5c4',roof:'#c9b36f',hill:'#9faa83',water:'#7db5c0',wave:'#d6ebdb'});

// Additional palettes pair different ground color with an existing terrain
// layout. Together with the original set this exposes forty distinct choices.
const expandedBackdrops=[
 ['olive-grove','올리브 동산','meadow','garden',18],['palm-oasis','종려나무 오아시스','river','river',36],
 ['terraced-valley','계단식 골짜기','mountain','mountains',52],['moonlit-shore','달빛 물가','lake','lake',220],
 ['cedar-ridge','백향목 언덕','mountain','mountains',82],['barley-dusk','보리밭 저녁','harvest','harvest',34],
 ['stone-ravine','돌 골짜기','ruins','ruins',8],['island-cove','섬의 만','galilee','galilee',194],
 ['high-desert','높은 광야','desert','dunes',46],['acacia-camp','아카시아 진영','camp','camp',28],
 ['spring-river','샘이 솟는 강','river','river',164],['walled-quarter','성벽 마을','jerusalem','city',202],
 ['vineyard-twilight','포도원 황혼','vineyard','vineyard',284],['temple-court','성전 뜰 안쪽','temple','temple',42],
 ['shepherd-meadow','목자의 풀밭','pasture','pasture',110],['date-garden','대추야자 동산','garden','garden',70],
 ['blue-night-lake','푸른 밤 호숫가','night','stars',196],['red-canyon','붉은 협곡','mountain','mountains',342],
 ['eastern-palace','동쪽 궁성','babylon','babylon',248],['river-of-life','생명 강가','newcity','newcity',128],
];
function rotateHue(hex,degrees){
 const n=parseInt(hex.slice(1),16),r=((n>>16)&255)/255,g=((n>>8)&255)/255,b=(n&255)/255;
 const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min,l=(max+min)/2;
 let h=0,s=0;if(d){s=d/(1-Math.abs(2*l-1));if(max===r)h=60*(((g-b)/d)%6);else if(max===g)h=60*((b-r)/d+2);else h=60*((r-g)/d+4);}
 h=(h+degrees+360)%360;const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2;
 const rgb=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];
 return '#'+rgb.map(v=>Math.max(0,Math.min(255,Math.round((v+m)*255))).toString(16).padStart(2,'0')).join('');
}
for(const [id,name,base,motif,hue]of expandedBackdrops){
 const palette={...BACKGROUNDS[base],name,motif,expanded:true};
 for(const key of ['ground','sky','speck','path','pathLight','water','wave','bank','hill','house','roof'])palette[key]=rotateHue(BACKGROUNDS[base][key],hue);
 palette.tile=BACKGROUNDS[base].tile.map(color=>rotateHue(color,hue));
 BACKGROUNDS[id]=palette;
}
