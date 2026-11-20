// scaffold-file: sessions
// Safe to edit by hand
// =============================================================================
// SessionsPageBuilderInput - the Sessions page offers its own blocks only
// =============================================================================
// Custom pages (`page`) share one sections list, so the Sessions page would
// otherwise offer every starter block in "+ Add item". This wraps the kit's
// PageBuilderInput: on the page whose address is `sessions` it narrows the
// list (and the insert menu's groups) to the Sessions blocks from
// sessionSections.ts, plus any type the page already holds, so a block typed
// before the change is never shown as unknown. Every other page is untouched.
//
// It only hides blocks from the menu: the schema still accepts every type, so
// no data can go invalid and "Remove field" never appears (rule 1).
// =============================================================================

import type { ArrayOfObjectsInputProps } from 'sanity';
import { useFormValue } from 'sanity';
import { PageBuilderInput } from './PageBuilderInput';
import { SESSION_SECTION_TYPES } from '../schemaTypes/sessionSections';

/** The page address whose sections list is narrowed to the Sessions blocks. */
export const SESSIONS_SLUG = 'sessions';

type InsertGroup = { name: string; title?: string; of?: string[] };

export function SessionsPageBuilderInput(props: ArrayOfObjectsInputProps) {
  const slug = useFormValue(['slug', 'current']);
  if (slug !== SESSIONS_SLUG) return <PageBuilderInput {...props} />;

  const present = ((props.value ?? []) as { _type?: string }[])
    .map((item) => item?._type)
    .filter((t): t is string => typeof t === 'string');
  const keep = new Set<string>([...SESSION_SECTION_TYPES, ...present]);
  const { schemaType } = props;
  const options = schemaType.options ?? {};
  const menu = (options as { insertMenu?: { groups?: InsertGroup[] } }).insertMenu;
  const narrowed = {
    ...schemaType,
    of: (schemaType.of ?? []).filter((t) => keep.has(t.name)),
    options: {
      ...options,
      insertMenu: menu
        ? {
            ...menu,
            groups: (menu.groups ?? [])
              .map((g) => ({ ...g, of: (g.of ?? []).filter((n) => keep.has(n)) }))
              .filter((g) => g.of.length > 0),
          }
        : menu,
    },
  } as typeof schemaType;

  return <PageBuilderInput {...props} schemaType={narrowed} />;
}
