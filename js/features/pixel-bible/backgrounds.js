// 선택형 상상 지형. 실제 성경 지리나 해당 사건의 장소를 확정하지 않는다.
export const BACKGROUNDS = {
 meadow:{name:'초록 마을',ground:'#6f995f',tile:['#759f62','#6c955b'],speck:'#9ab56d',path:'#b9b082',pathLight:'#c9bc8b',water:'#467f8e',wave:'#71a9a6',bank:'#8c9570',hill:'#4a7758',house:'#d0bd8a',roof:'#b09e70',motif:'village'},
 desert:{name:'모래 광야',ground:'#c6ad78',tile:['#cbb37e','#c2a671'],speck:'#e0ca96',path:'#b59a68',pathLight:'#d5bd88',water:'#5a9298',wave:'#91b6a9',bank:'#ae9468',hill:'#a78660',house:'#d6bd8e',roof:'#ad8e63',motif:'dunes'},
 lake:{name:'호숫가',ground:'#7eaa87',tile:['#86b18f','#79a480'],speck:'#a6c49d',path:'#c3b995',pathLight:'#d7cba6',water:'#4c91ac',wave:'#93c8cf',bank:'#a6b49b',hill:'#568b85',house:'#c7c8ae',roof:'#8eaa99',motif:'lake'},
 mountain:{name:'바위 산지',ground:'#8b9883',tile:['#929d88','#84917d'],speck:'#b5baa0',path:'#b5aa91',pathLight:'#ccc0a6',water:'#658a95',wave:'#9bb4b4',bank:'#929989',hill:'#64756e',house:'#bcc1ac',roof:'#8e9b8c',motif:'mountains'},
 evening:{name:'노을 들판',ground:'#99916c',tile:['#a19a72','#938b66'],speck:'#c4b684',path:'#baaa82',pathLight:'#d7bd8f',water:'#786f91',wave:'#b59bab',bank:'#9a8b78',hill:'#786e75',house:'#d0b597',roof:'#a2887e',motif:'sunset'},
 night:{name:'별빛 마을',ground:'#536f70',tile:['#597778','#4e696c'],speck:'#7c9790',path:'#8b8e86',pathLight:'#ada994',water:'#405d80',wave:'#7c94b0',bank:'#667b83',hill:'#344b64',house:'#9aaba6',roof:'#70888b',motif:'stars'},
};
export const backgroundFor=key=>Object.hasOwn(BACKGROUNDS,key)?BACKGROUNDS[key]:BACKGROUNDS.meadow;
