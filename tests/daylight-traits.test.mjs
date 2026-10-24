import test from 'node:test';
import assert from 'node:assert/strict';
import '../js/shared/daylight.js';
import {appearanceFor} from '../js/features/pixel-bible/appearance.js';
import {physicalTraitsFor} from '../js/features/pixel-bible/physical-traits.js';
test('KST 새벽·낮·저녁·밤과 자정 경계는 호스트 시간대에 의존하지 않는다',()=>{
 for(const [utc,key]of [['2026-10-23T20:00:00Z','dawn'],['2026-10-23T23:00:00Z','day'],['2026-10-24T09:00:00Z','dusk'],['2026-10-24T11:00:00Z','night'],['2026-10-24T15:00:00Z','night']])assert.equal(KstLight.at(new Date(utc)).key,key);
});
test('외형 기록은 동명이인과 노년기·사건 시점을 구분한다',()=>{
 assert.equal(appearanceFor('압살롬',0,'',['사무엘하 14장']).hairSheen,true);
 assert.equal(physicalTraitsFor('요셉',['마태복음 1장']).length,0);
 assert.equal(physicalTraitsFor('아사랴',['역대하 26장']).length,0);
 assert.equal(appearanceFor('이삭',0,'',['창세기 22장']).softEyes,undefined);
 assert.equal(appearanceFor('이삭',0,'',['창세기 27장']).softEyes,true);
 assert.equal(physicalTraitsFor('느부갓네살',['다니엘 4장']).length,0);
 assert.equal(physicalTraitsFor('느부갓네살',['다니엘 4:33']).length,1);
 assert.equal(appearanceFor('에훗',0,'',['사사기 3장']).rightScabbard,true);
});
