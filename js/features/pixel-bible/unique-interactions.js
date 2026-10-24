// 근거가 있는 장/화자/물건 조합만 일상 동작보다 우선한다.
export const UNIQUE_INTERACTIONS=[
 {id:'elijah-jordan',name:'엘리야',code:'2ki',chapter:2,kinds:['cloak'],gesture:'mantle-water',ref:'열왕기하 2:8'},
 {id:'rahab-rope',name:'라합',code:'jos',chapter:2,kinds:['rope'],gesture:'lower-rope',ref:'여호수아 2:15'},
 {id:'joash-arrow',name:'요아스',code:'2ki',chapter:13,kinds:['arrow','bow'],gesture:'shoot',ref:'열왕기하 13:15–17'},
 {id:'moses-bush',name:'모세',code:'exo',chapter:3,kinds:['bush'],gesture:'unshoe',ref:'출애굽기 3:5'},
 {id:'moses-staff',name:'모세',code:'exo',chapter:4,kinds:['staff','rod'],gesture:'staff-snake',ref:'출애굽기 4:2–4'},
 {id:'moses-rock',name:'모세',code:'num',chapter:20,kinds:['stone'],gesture:'strike-water',ref:'민수기 20:11'},
 {id:'jacob-stone',name:'야곱',code:'gen',chapter:28,kinds:['stone'],gesture:'lie-stone',ref:'창세기 28:11–18'},
 {id:'joseph-coat',name:'요셉',code:'gen',chapter:37,kinds:['cloak','robe'],gesture:'wear-pattern',ref:'창세기 37:3,23'},
 {id:'rebekah-well',name:'리브가',code:'gen',chapter:24,kinds:['well','water','pitcher'],gesture:'offer-water',ref:'창세기 24:18–20'},
 {id:'aaron-manna',name:'아론',code:'exo',chapter:16,kinds:['water','jar'],gesture:'fill-manna',ref:'출애굽기 16:33–34'},
 {id:'david-stones',name:'다윗',code:'1sa',chapter:17,kinds:['stone'],gesture:'five-stones',ref:'사무엘상 17:40'},
 {id:'david-lyre',name:'다윗',code:'1sa',chapter:16,kinds:['lyre','harp'],gesture:'soothe-lyre',ref:'사무엘상 16:23'},
 {id:'jonathan-arrows',name:'요나단',code:'1sa',chapter:20,kinds:['arrow','bow'],gesture:'three-arrows',ref:'사무엘상 20:20,35–38'},
 {id:'elijah-mantle',name:'엘리야',code:'1ki',chapter:19,kinds:['cloak'],gesture:'cast-mantle',ref:'열왕기상 19:19'},
 {id:'elisha-mantle',name:'엘리사',code:'2ki',chapter:2,kinds:['cloak'],gesture:'mantle-water',ref:'열왕기하 2:14'},
 {id:'widow-oil',name:'선지자 제자의 아내',code:'2ki',chapter:4,kinds:['oil','olive-oil'],gesture:'fill-vessels',ref:'열왕기하 4:3–6'},
 {id:'josiah-scroll',name:'요시야',code:'2ki',chapter:22,kinds:['scroll','book'],gesture:'tear-garment',ref:'열왕기하 22:11'},
 {id:'baruch-scroll',name:'바룩',code:'jer',chapter:36,kinds:['scroll','book','pen'],gesture:'write-scroll',ref:'예레미야 36:4'},
 {id:'ruth-field',name:'룻',code:'rut',chapter:2,kinds:['field','barley','grain'],gesture:'glean-bundle',ref:'룻기 2:17'},
 {id:'boaz-field',name:'보아스',code:'rut',chapter:2,kinds:['field','barley'],gesture:'instruct-reapers',ref:'룻기 2:15–16'},
 {id:'zacchaeus-tree',name:'삭개오',code:'luk',chapter:19,kinds:['tree','fig-tree'],gesture:'climb',ref:'누가복음 19:4'},
 {id:'jesus-storm',name:'예수',code:'mrk',chapter:4,kinds:['boat'],gesture:'calm-waves',ref:'마가복음 4:39'},
 {id:'jesus-wine',name:'예수',code:'jhn',chapter:2,kinds:['water','jar','water-supply'],gesture:'water-wine',ref:'요한복음 2:7–9'},
 {id:'jesus-bread',name:'예수',code:'jhn',chapter:6,kinds:['bread','barley-bread'],gesture:'break-share',ref:'요한복음 6:11'},
 {id:'ethiopian-read',name:'에디오피아 내시',code:'act',chapter:8,kinds:['scroll','book'],gesture:'read-prophet',ref:'사도행전 8:28–30'},
 {id:'philip-explain',name:'빌립',code:'act',chapter:8,kinds:['scroll','book'],gesture:'explain-scroll',ref:'사도행전 8:35'},
];
export function uniqueInteraction(n,kind){
 return UNIQUE_INTERACTIONS.find(r=>(r.name===n.name||(r.name==='예수'&&n.name==='예수님'))&&r.kinds.includes(kind)&&
  (n.contexts?.some(p=>p.code===r.code&&p.chap===r.chapter)||n.readingChapters?.some(p=>p.code===r.code&&Number(p.chap)===r.chapter)))||null;
}
