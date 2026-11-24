import {test} from 'node:test';import assert from 'node:assert/strict';import {extractGame,titleOf,sandboxDocument,packGame,unpackGame,pkce} from '../core.js';import {DEMO} from '../demo.js';
test('valid game and markdown fences',()=>{assert.equal(extractGame('~~~'.replace(/~/g,'\x60')+'html\n'+DEMO+'\n'+'~~~'.replace(/~/g,'\x60')),DEMO);assert.equal(titleOf(DEMO),'Orbit Runner')});
test('rejects truncated and scriptless games',()=>{assert.throws(()=>extractGame('<html><body>'));assert.throws(()=>extractGame('<html><body>hi</body></html>'))});
test('sandbox policy precedes untrusted script',()=>{const html=sandboxDocument(DEMO);assert.ok(html.indexOf('Content-Security-Policy')<html.indexOf('<script>'));assert.match(html,/connect-src 'none'/);assert.match(html,/frame-src 'none'/);});
test('share roundtrip, rejects malformed and oversized input',async()=>{assert.equal(await unpackGame(await packGame(DEMO)),DEMO);await assert.rejects(unpackGame('!'));await assert.rejects(unpackGame('a'.repeat(120001)));});
test('PKCE unique verifier/state and correct challenge shape',async()=>{const a=await pkce(),b=await pkce();assert.notEqual(a.state,b.state);assert.notEqual(a.verifier,b.verifier);assert.match(a.challenge,/^[A-Za-z0-9_-]{43}$/);});

import {MEDIA,mediaRequest,validateAssets,assetScript} from '../media.js';
import {unpackBundle} from '../core.js';
import {GALLERY} from '../gallery.js';
test('media requests use the correct endpoints and never put credentials in URL',()=>{for(const kind of Object.keys(MEDIA)){const u=new URL(mediaRequest(kind,'original game asset'));assert.equal(u.origin,'https://gen.pollinations.ai');assert.equal(u.searchParams.get('model'),MEDIA[kind].model);assert.equal(u.searchParams.has('key'),false);assert.ok(u.pathname.startsWith(kind==='texture'?'/image/':'/audio/'));}});
test('media assets survive sharing and sandbox injection; unsafe data types rejected',async()=>{const assets={texture:'data:image/png;base64,AA==',music:'data:audio/mpeg;base64,AA==',sound:'data:audio/mpeg;base64,AA=='};assert.deepEqual((await unpackBundle(await packGame(DEMO,assets))).assets,assets);assert.match(sandboxDocument(DEMO,assets),/FORGE_ASSETS/);assert.throws(()=>validateAssets({texture:'data:image/svg+xml;base64,AA=='}));assert.throws(()=>assetScript({sound:'https://example.com/a.mp3'}));});
test('all gallery examples contain complete playable HTML scripts',()=>{assert.equal(GALLERY.length,3);for(const g of GALLERY)assert.equal(titleOf(extractGame(g.code)),g.title);});
