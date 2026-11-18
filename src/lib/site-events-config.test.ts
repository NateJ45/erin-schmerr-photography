// Safe to edit by hand
// Pins this site's GA4 rules (src/config/events.ts) against the real classifier,
// and the privacy page's sentence that names them (event-kinds.ts). The browser
// half (a real click on a real page) is tests/site-events.spec.ts.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { eventsConfig } from '../config/events.ts';
import { classifyLink } from './track.ts';
import { eventsSentence } from './event-kinds.ts';

const HOST = 'tate.test';
const hit = (href: string) =>
  classifyLink(href, new URL(href, `https://${HOST}/`).href, HOST, 'page', eventsConfig);

test('booking, her profiles and press are their own events', () => {
  assert.equal(hit('/contact/')?.event, 'book_click');
  assert.equal(hit('/contact/?about=Sessions')?.event, 'book_click');
  assert.deepEqual(hit('https://www.instagram.com/tatefineartphotography/')?.params, {
    platform: 'instagram',
    location: 'page',
  });
  assert.equal(hit('https://www.facebook.com/StellinaFineArtPhotography/')?.event, 'social_click');
  assert.equal(hit('https://canvasrebel.com/meet-erin-schmerr/')?.event, 'press_click');
  assert.equal(
    hit('https://someblog.example/an-interview-with-erin-schmerr/')?.event,
    'press_click',
  );
});

test('anything else keeps the built-in rules', () => {
  assert.equal(hit('https://www.instagram.com/some.model/')?.event, 'outbound_click');
  assert.equal(hit('/about/'), null);
  assert.equal(hit('/contactless/'), null);
});

test('the privacy page names the kinds in plain words', () => {
  const s = eventsSentence(eventsConfig);
  for (const words of [
    'links to the booking page',
    'links to her Instagram and Facebook pages',
    'links to magazine features about her work',
  ]) {
    assert.ok(s.includes(words), s);
  }
  assert.equal(s.split('links to her Instagram and Facebook pages').length, 2, 'named once');
});
