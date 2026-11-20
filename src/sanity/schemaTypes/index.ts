// Registers every schema type with the Studio.
// Order doesn't affect runtime; alphabetical here for readability.

import { aboutPage } from './aboutPage'; // scaffold: about
import { announcement } from './announcement';
import { popup } from './popup';
import { businessInfo } from './businessInfo';
import { contactPage } from './contactPage';
import { ctaBlock } from './ctaBlock';
import { formQuestion } from './formQuestion';
import { form } from './form';
import { formDateQuestion, formTickQuestion } from './formQuestionMore';
import { homePage } from './homePage';
import { mainPageSectionSchemas } from './mainPageSections';
import { navLink } from './navLink';
import { newsletter } from './newsletter';
import { page } from './page';
import { privatePage } from './privatePage';
import { pageSectionSchemas, syncedSection } from './sections';
import { richSectionSchemas } from './richSections';
import { notFoundPage } from './notFoundPage';
import { photo } from './photo';
import { collaborator } from './collaborator'; // scaffold: stories
import { story } from './story'; // scaffold: stories
import { storyIndex, coverHero, craftNotes, crewSection, signedClose } from './storyIndexSection'; // scaffold: stories
import { publication } from './publication'; // scaffold: press
import { pressSectionSchemas } from './pressSections'; // scaffold: press
import { aboutSectionSchemas } from './aboutSections'; // scaffold: about
import { privacyPage } from './privacyPage';
import { redirect } from './redirect';
import { sectionPreset } from './sectionPreset';
import { shortLink } from './shortLink';
import { siteSettings } from './siteSettings';
import { studioGuide } from './studioGuide';
import { studioNotes } from './studioNotes';
import { testimonial } from './testimonial'; // scaffold: testimonials
import { kindWords } from './kindWordsSection'; // scaffold: testimonials
import { libraryDocument } from './libraryDocument'; // scaffold: documents

export const schemaTypes = [
  // Object types (embedded) first so they're defined before docs that reference them
  ctaBlock,
  // Shared menu link (header menu, footer columns, small print, header button)
  navLink,
  // One editor-written form question (contactPage.formFields).
  formQuestion,
  // The form builder's two extra question kinds (card 194): a date, tick any that apply.
  formDateQuestion,
  formTickQuestion,
  // Page-builder section blocks (objects). Registered before the documents
  // whose pageBuilder arrays reference them.
  ...pageSectionSchemas,
  syncedSection, // authoring kit, card 109: shows a saved section, edit once everywhere
  ...richSectionSchemas,
  // Every main page a page builder (card 190): blocks offered on their own page only.
  ...mainPageSectionSchemas,
  // The portfolio's home page blocks (the stories and press capabilities).
  storyIndex, // scaffold: stories
  coverHero, // scaffold: stories
  craftNotes, // scaffold: stories
  crewSection, // scaffold: stories
  signedClose, // scaffold: stories
  ...pressSectionSchemas, // scaffold: press
  // The About page's own blocks (aboutSections.ts).
  ...aboutSectionSchemas, // scaffold: about
  // Kind words (kindWordsSection.ts): clients' words beside their portraits, from Testimonials.
  kindWords, // scaffold: testimonials
  // One photograph (photo.ts): used by stories AND press, so in neither capability.
  photo,

  // Singletons
  siteSettings,
  businessInfo, // Content-side singleton: service areas, travel fees, availability, geo
  homePage,
  aboutPage, // scaffold: about
  contactPage,
  notFoundPage,
  privacyPage,
  // Start Here editable singletons
  studioGuide,
  studioNotes,

  // Reusable content collections
  announcement, // site-wide banner collection (enabled + date-windowed)
  popup, // popups (card 170): one at a time, date-windowed, src/lib/popup.ts
  testimonial, // scaffold: testimonials
  libraryDocument, // scaffold: documents
  // The portfolio: stories, the people credited on them, and the press list.
  story, // scaffold: stories
  collaborator, // scaffold: stories
  publication, // scaffold: press
  // One issue of the email newsletter (card 127); subscribers live in D1, never here.
  newsletter,
  // Custom pages built from the section library (multi-instance, not a singleton)
  page,
  // Pages only people with the password can see (card 122). Stored under the
  // privatePage. id path, which the public API never serves.
  privatePage,
  // One saved section, kept for reuse on other pages. Not content: nothing
  // about a preset reaches the live site until it is added to a page.
  sectionPreset,
  // Old address -> new address forwards, filed by hand or automatically on a
  // web-address change (see components/slugRedirect.tsx).
  redirect,
  // Short addresses like /spring for flyers and QR codes (PORTS.md card 171).
  shortLink,
  // Forms an editor writes (card 194), shown by the Form block; answers go to D1.
  form,
];
