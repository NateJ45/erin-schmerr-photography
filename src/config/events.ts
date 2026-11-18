// Safe to edit by hand
// =============================================================================
// events.ts - this site's map for the GA4 event layer (PORTS.md card 217)
// =============================================================================
// NOT PORTABLE: each site edits this file. The shared half is src/lib/track.ts
// and src/components/analytics/SiteEvents.astro; they read this map and nothing
// else. This site adds book_click, social_click and press_click (below, pinned in
// tests/site-events.spec.ts); with the map empty only the built-in rules run:
//
//   contact_click      an email or phone link (the kind only, never the address)
//   watch_click        YouTube or Vimeo
//   directions_click   a Google or Apple Maps link
//   download_click     a PDF, document, spreadsheet, archive or audio/video file
//   outbound_click     any other link to another site
//   form_view          a form (form[data-track-form]) came 40% into view
//   embed_interact     the visitor first used a frame (video, or a form frame)
//   generate_lead      a sign-up or contact form was sent (the form calls track())
//   site_search        the last search term once the visitor pauses
//   search_no_results  the same, when nothing was found
//   article_progress   25, 50, 75 and 100% of an article's text passed
//   article_read       the end reached after real reading time
//   page_not_found     the 404 page
//   js_error           an error in the site's own scripts, at most three a page view
//
// Add rules for what only this site has: where giving happens, where people
// register, an app, social networks. Rules are tried in order and the first
// match wins; yours run before the built-in ones. The privacy
// wording follows by itself: the privacy page lists the kinds of event this map
// sends (src/lib/event-kinds.ts). Give an event of your own a plain-words
// `describe` line (describe: 'links to the church app') or the page says
// "other links the site marks".
//
// Docs: docs/agent/analytics.md.
// =============================================================================

// Relative, with the extension, so the unit test (src/lib/site-events-config.test.ts) can load it.
import { hostUnder, type EventsConfig } from '../lib/track.ts';

export const eventsConfig: EventsConfig = {
  links: [
    // Booking (2026-11-18). Any link to the contact page is a step towards a session:
    // the "Book a session" buttons, the footer link and any text link an editor adds.
    {
      own: true,
      path: /^\/contact(\/|$)/,
      event: 'book_click',
      describe: 'links to the booking page',
      params: { destination: 'contact_page' },
    },

    // Her own profiles. A collaborator's Instagram (the story credits) is not hers and
    // stays an outbound_click; only her studio's accounts count here.
    {
      host: 'instagram.com',
      path: /^\/tatefineartphotography(\/|$)/,
      event: 'social_click',
      describe: 'links to her Instagram and Facebook pages',
      params: { platform: 'instagram' },
    },
    {
      host: ['facebook.com', 'fb.com'],
      path: /^\/(stellinafineartphotography|share\/19xsggv2za)(\/|$)/,
      event: 'social_click',
      describe: 'links to her Instagram and Facebook pages',
      params: { platform: 'facebook' },
    },

    // Press: a feature or interview about her on another site. The hosts are the
    // features in the dataset with a web address (add one when a new feature has a
    // link); any other site's page with her name in its address counts too.
    {
      own: false,
      test: (l) =>
        ['bleachfilm.com', 'canvasrebel.com'].some((h) => hostUnder(l.host, h)) ||
        (hostUnder(l.host, 'vogue.com') && /photovogue/.test(l.path)) ||
        (/^https?:$/.test(l.url.protocol) && /schmerr/.test(l.path)),
      event: 'press_click',
      describe: 'links to magazine features about her work',
      params: (l) => ({ destination: l.host.slice(0, 80) }),
    },
  ],

  // Events this site does not send, by name. Enhanced measurement in GA4
  // already counts outbound clicks and file downloads, so a site that has it
  // on may prefer to switch ours off to avoid two counts:
  // off: ['outbound_click', 'download_click'],
  off: [],

  // Where the page parts live, if this site's markup differs from the defaults:
  // formSelector: 'form[data-track-form]',
  // formFrameSelector: '[data-my-form-frame]',
  // articleSelector: '[data-article-body]',
  // notFoundSelector: '[data-page-not-found]',
};
