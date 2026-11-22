import type { Bookmark, LearningData } from '../practice/types';

/**
 * Bookmarks and the revision list.
 *
 * The bookmarks are stored in the local learning data, so they survive a
 * restart of VS Code and never leave the machine.
 */
export class BookmarkService {
  /** Adds a bookmark — an existing bookmark of the same item is not duplicated. */
  static add(
    data: LearningData,
    bookmark: Omit<Bookmark, 'createdAt' | 'reviewed'>
  ): LearningData {
    const existing = data.bookmarks.find(
      (entry) => entry.kind === bookmark.kind && entry.itemId === bookmark.itemId
    );

    if (existing) {
      return {
        ...data,
        bookmarks: data.bookmarks.map((entry) =>
          entry === existing ? { ...entry, reviewed: false } : entry
        ),
      };
    }

    return {
      ...data,
      bookmarks: [
        ...data.bookmarks,
        { ...bookmark, createdAt: Date.now(), reviewed: false },
      ],
    };
  }

  /** Removes a bookmark. */
  static remove(data: LearningData, kind: Bookmark['kind'], itemId: string): LearningData {
    return {
      ...data,
      bookmarks: data.bookmarks.filter(
        (entry) => !(entry.kind === kind && entry.itemId === itemId)
      ),
    };
  }

  /** Marks a bookmark as reviewed. */
  static markReviewed(
    data: LearningData,
    kind: Bookmark['kind'],
    itemId: string,
    reviewed = true
  ): LearningData {
    return {
      ...data,
      bookmarks: data.bookmarks.map((entry) =>
        entry.kind === kind && entry.itemId === itemId ? { ...entry, reviewed } : entry
      ),
    };
  }

  /** Filters the bookmarks. */
  static filter(
    data: LearningData,
    filter: { kind?: Bookmark['kind']; category?: string; onlyUnreviewed?: boolean } = {}
  ): Bookmark[] {
    return data.bookmarks.filter((bookmark) => {
      if (filter.kind && bookmark.kind !== filter.kind) {
        return false;
      }
      if (filter.category && bookmark.category !== filter.category) {
        return false;
      }
      if (filter.onlyUnreviewed && bookmark.reviewed) {
        return false;
      }
      return true;
    });
  }

  /** True when the item is bookmarked. */
  static isBookmarked(
    data: LearningData,
    kind: Bookmark['kind'],
    itemId: string
  ): boolean {
    return data.bookmarks.some(
      (entry) => entry.kind === kind && entry.itemId === itemId
    );
  }
}
