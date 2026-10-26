// Only authored books are fetched; unfinished books keep the existing scene player.
export const VERSE_BOOKS=Object.freeze(['mat','mrk','luk']);
const pending=new Map();
export function loadVerseBook(code,fetcher=globalThis.fetch){
 if(!VERSE_BOOKS.includes(code))return Promise.resolve(null);
 if(!pending.has(code))pending.set(code,Promise.resolve().then(()=>fetcher(new URL(`../../../data/pixel-bible/verse-events/${code}.json`,import.meta.url))).then(r=>r.ok?r.json():null).catch(()=>{pending.delete(code);return null;}));
 return pending.get(code);
}
