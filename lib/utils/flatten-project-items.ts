import type { ProjectItem } from "@/lib/types/database";

/**
 * Flattens a raw project items array so that every child item appears
 * immediately after its parent. This ensures correct ordering in PDF and
 * Excel exports regardless of the raw sort_order from the database.
 *
 * Result order: [Parent1, Child1A, Child1B, Parent2, ...]
 * Orphaned children (parent not present in the list) are appended at the end.
 */
export function flattenProjectItems(items: ProjectItem[]): ProjectItem[] {
  const topLevel: ProjectItem[] = [];
  const childrenByParent = new Map<string, ProjectItem[]>();

  for (const item of items) {
    if (item.parent_assembly_id) {
      const arr = childrenByParent.get(item.parent_assembly_id) ?? [];
      arr.push(item);
      childrenByParent.set(item.parent_assembly_id, arr);
    } else {
      topLevel.push(item);
    }
  }

  const result: ProjectItem[] = [];
  for (const parent of topLevel) {
    result.push(parent);
    const children = childrenByParent.get(parent.id) ?? [];
    for (const child of children) {
      result.push(child);
    }
    childrenByParent.delete(parent.id);
  }

  // Append orphaned children (parent not in items list)
  for (const [, orphans] of childrenByParent) {
    for (const orphan of orphans) {
      result.push(orphan);
    }
  }

  return result;
}
