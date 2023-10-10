import { ContentItem, ContentRepository } from 'dc-management-sdk-js';
import { Body } from './body';

export type DependencyContentTypeSchema =
  | 'http://bigcontent.io/cms/schema/v1/core#/definitions/content-link'
  | 'http://bigcontent.io/cms/schema/v1/core#/definitions/content-reference'
  | '_hierarchy'; // Used internally for parent dependencies.

export interface RepositoryContentItem {
  repo: ContentRepository;
  content: ContentItem;
}

export interface ContentDependency {
  _meta: { schema: DependencyContentTypeSchema; name: string };
  contentType: string;
  id: string | undefined;
}

export interface ContentDependencyInfo {
  resolved?: ItemContentDependencies;
  dependency: ContentDependency;
  owner: RepositoryContentItem;

  parent?: RecursiveSearchStep;
  index: string | number;
}

export interface ItemContentDependencies {
  owner: RepositoryContentItem;
  dependencies: ContentDependencyInfo[];
  dependants: ContentDependencyInfo[];
}

export interface ContentDependencyLayer {
  items: ItemContentDependencies[];
}

export const referenceTypes = [
  'http://bigcontent.io/cms/schema/v1/core#/definitions/content-link',
  'http://bigcontent.io/cms/schema/v1/core#/definitions/content-reference',
];

enum CircularDependencyStage {
  Standalone = 0,
  Intertwined,
  Parent,
}

type RecursiveSearchStep = Body | ContentDependency | Array<Body>;

export class ContentDependencyTree {
  levels: ContentDependencyLayer[];

  circularLinks: ItemContentDependencies[];

  all: ItemContentDependencies[];

  byId: Map<string, ItemContentDependencies>;

  requiredSchema: string[];

  constructor(items: RepositoryContentItem[]) {
    // Identify all content dependencies.
    let info = ContentDependencyTree.identifyContentDependencies(items);
    const allInfo = info;
    this.resolveContentDependencies(info);

    const requiredSchema = new Set<string>();
    info.forEach((item) => {
      requiredSchema.add(item.owner.content.body._meta.schema);
    });

    // For each stage, add all content that has no dependencies resolved in a previous stage
    const resolved = new Set<string>();
    /*
    mapping.contentItems.forEach((to, from) => {
      resolved.add(from);
    });
    */

    let unresolvedCount = info.length;

    const stages: ContentDependencyLayer[] = [];
    while (unresolvedCount > 0) {
      const stage: ItemContentDependencies[] = [];
      const lastUnresolvedCount = unresolvedCount;
      info = info.filter((item) => {
        const unresolvedDependencies = item.dependencies.filter(
          (dep) => !resolved.has(dep.dependency.id as string)
        );

        if (unresolvedDependencies.length === 0) {
          stage.push(item);
          return false;
        }

        return true;
      });

      stage.forEach((item) => {
        resolved.add(item.owner.content.id as string);
      });

      unresolvedCount = info.length;
      if (unresolvedCount === lastUnresolvedCount) {
        break;
      }

      stages.push({ items: stage });
    }

    // Remaining items in the info array are connected to circular dependencies, so must be resolved via rewriting.

    // Create dependency layers for circular dependencies

    const circularStages: ItemContentDependencies[][] = [];
    while (unresolvedCount > 0) {
      const stage: ItemContentDependencies[] = [];

      // To be in this stage, the circular dependency must contain no other circular dependencies (before self-loop).
      // The circular dependencies that appear before self loop are
      const lastUnresolvedCount = unresolvedCount;
      const circularLevels = info.map((item) =>
        this.topLevelCircular(item, info)
      );

      const chosenLevel = Math.min(
        ...circularLevels
      ) as CircularDependencyStage;

      for (let i = 0; i < info.length; i++) {
        const item = info[i];
        if (circularLevels[i] === chosenLevel) {
          stage.push(item);
          circularLevels.splice(i, 1);
          info.splice(i--, 1);
        }
      }

      unresolvedCount = info.length;
      if (unresolvedCount === lastUnresolvedCount) {
        break;
      }

      circularStages.push(stage);
    }

    this.levels = stages;
    this.circularLinks = [];
    circularStages.forEach((stage) => this.circularLinks.push(...stage));

    this.all = allInfo;
    this.byId = new Map(
      allInfo.map((info) => [info.owner.content.id as string, info])
    );
    this.requiredSchema = Array.from(requiredSchema);
  }

  private static searchObjectForContentDependencies(
    item: RepositoryContentItem,
    body: RecursiveSearchStep,
    result: ContentDependencyInfo[],
    parent: RecursiveSearchStep | undefined,
    index: string | number
  ): void {
    if (Array.isArray(body)) {
      body.forEach((contained, index) => {
        this.searchObjectForContentDependencies(
          item,
          contained,
          result,
          body,
          index
        );
      });
    } else if (body != null) {
      const allPropertyNames = Object.getOwnPropertyNames(body);
      // Does this object match the pattern expected for a content item or reference?
      if (
        body._meta &&
        referenceTypes.indexOf(body._meta.schema) !== -1 &&
        typeof body.contentType === 'string' &&
        typeof body.id === 'string'
      ) {
        result.push({
          dependency: body as ContentDependency,
          owner: item,
          parent,
          index,
        });
        return;
      }

      allPropertyNames.forEach((propName) => {
        const prop = (body as Body)[propName];
        if (typeof prop === 'object') {
          this.searchObjectForContentDependencies(
            item,
            prop,
            result,
            body,
            propName
          );
        }
      });
    }
  }

  public removeContentDependenciesFromBody(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body: any,
    remove: object[]
  ): void {
    if (Array.isArray(body)) {
      for (let i = 0; i < body.length; i++) {
        if (remove.indexOf(body[i]) !== -1) {
          body.splice(i--, 1);
        } else {
          this.removeContentDependenciesFromBody(body[i], remove);
        }
      }
    } else {
      const allPropertyNames = Object.getOwnPropertyNames(body);

      allPropertyNames.forEach((propName) => {
        const prop = body[propName];
        if (remove.indexOf(prop) !== -1) {
          delete body[propName];
        } else if (typeof prop === 'object') {
          this.removeContentDependenciesFromBody(prop, remove);
        }
      });
    }
  }

  private topLevelCircular(
    top: ItemContentDependencies,
    unresolved: ItemContentDependencies[]
  ): CircularDependencyStage {
    let selfLoop = false;
    let intertwinedLoop = false;
    let isParent = false;
    const seenBefore = new Set<ItemContentDependencies>();

    const traverse = (
      top: ItemContentDependencies,
      item: ItemContentDependencies | undefined,
      depth: number,
      unresolved: ItemContentDependencies[],
      seenBefore: Set<ItemContentDependencies>,
      intertwined: boolean
    ): boolean => {
      let hasCircular = false;

      if (item == null) {
        return false;
      }
      if (top === item && depth > 0) {
        selfLoop = true;
        return false;
      }
      if (top !== item && unresolved.indexOf(item) !== -1) {
        // Contains a circular dependency.

        if (!intertwined) {
          // Does it loop back to the parent?
          const storedSelfLoop = selfLoop;
          const childIntertwined = traverse(
            item,
            item,
            0,
            [top],
            new Set<ItemContentDependencies>(),
            true
          );
          selfLoop = storedSelfLoop;

          if (childIntertwined) {
            intertwinedLoop = true;
          } else {
            // We're the parent of a non-intertwined circular loop.
            isParent = true;
          }
        }

        hasCircular = true;
      }

      if (seenBefore.has(item)) {
        return false;
      }

      seenBefore.add(item);

      item.dependencies.forEach((dep) => {
        hasCircular =
          traverse(
            top,
            dep.resolved,
            depth + 1,
            unresolved,
            seenBefore,
            intertwined
          ) || hasCircular;
      });

      return hasCircular;
    };

    const hasCircular = traverse(top, top, 0, unresolved, seenBefore, false);

    if (hasCircular) {
      if (intertwinedLoop) {
        if (selfLoop && !isParent) {
          return CircularDependencyStage.Intertwined;
        }

        return CircularDependencyStage.Parent;
      }

      return CircularDependencyStage.Parent;
    }

    return CircularDependencyStage.Standalone;
  }

  static identifyContentDependencies(
    items: RepositoryContentItem[]
  ): ItemContentDependencies[] {
    return items.map((item) => {
      const result: ContentDependencyInfo[] = [];
      this.searchObjectForContentDependencies(
        item,
        item.content.body,
        result,
        undefined,
        0
      );

      // Hierarchy parent is also a dependency.
      if (
        item.content.body._meta.hierarchy &&
        item.content.body._meta.hierarchy.parentId
      ) {
        result.push({
          dependency: {
            _meta: {
              schema: '_hierarchy',
              name: '_hierarchy',
            },
            id: item.content.body._meta.hierarchy.parentId,
            contentType: '',
          },
          owner: item,
          parent: undefined,
          index: 0,
        });
      }

      return { owner: item, dependencies: result, dependants: [] };
    });
  }

  private resolveContentDependencies(items: ItemContentDependencies[]): void {
    // Create cross references to make it easier to traverse dependencies.

    const idMap = new Map(
      items.map((item) => [item.owner.content.id as string, item])
    );
    const visited = new Set<ItemContentDependencies>();

    const resolve = (item: ItemContentDependencies): void => {
      if (visited.has(item)) return;
      visited.add(item);

      item.dependencies.forEach((dep) => {
        const target = idMap.get(dep.dependency.id as string);
        dep.resolved = target;
        if (target) {
          target.dependants.push({
            owner: target.owner,
            resolved: item,
            dependency: dep.dependency,
            parent: dep.parent,
            index: dep.index,
          });
          resolve(target);
        }
      });
    };

    items.forEach((item) => resolve(item));
  }

  public traverseDependants(
    item: ItemContentDependencies,
    action: (item: ItemContentDependencies) => void,
    onlyLinks = false,
    traversed?: Set<ItemContentDependencies>
  ): void {
    const traversedSet = traversed || new Set<ItemContentDependencies>();
    traversedSet.add(item);
    action(item);
    item.dependants.forEach((dependant) => {
      if (
        onlyLinks &&
        dependant.dependency._meta.schema !==
          'http://bigcontent.io/cms/schema/v1/core#/definitions/content-link'
      ) {
        return;
      }

      const resolved = dependant.resolved as ItemContentDependencies;
      if (!traversedSet.has(resolved)) {
        this.traverseDependants(resolved, action, onlyLinks, traversedSet);
      }
    });
  }

  public filterAny(
    action: (item: ItemContentDependencies) => boolean
  ): ItemContentDependencies[] {
    return this.all.filter((item) => {
      let match = false;
      this.traverseDependants(item, (item) => {
        if (action(item)) {
          match = true;
        }
      });
      return match;
    });
  }

  public removeContent(items: ItemContentDependencies[]): void {
    this.levels.forEach((level) => {
      level.items = level.items.filter((item) => items.indexOf(item) === -1);
    });

    this.all = this.all.filter((item) => items.indexOf(item) === -1);
    this.circularLinks = this.circularLinks.filter(
      (item) => items.indexOf(item) === -1
    );

    items.forEach((item) => {
      this.byId.delete(item.owner.content.id as string);
    });
  }
}

export enum CircularMode {
  Ignore,
  Repeat,
  Throw,
}

/**
 * Similar to content graph deepCopy, but should also support refs, hierarchies, circular dependencies.
 * @param ids Ids of the root content items to copy
 * @param contentItemProvider Function that loads content items by id
 * @param contentItemPicker Function that creates or returns an existing content item that should be used in place of the original
 * @returns {Promise<any>} Mapping of old content item ids to the newly created ids
 */
export async function deepCopy(
  ids: string[],
  contentItemProvider: (id: string) => Promise<ContentItem>,
  contentItemPicker: (original: ContentItem, body: any) => Promise<ContentItem>,
  circularMode = CircularMode.Ignore
): Promise<any> {
  const cache: any = {};
  const mapping: any = {};
  const circular = new Set<string>();

  const rewriteItem = async (item: ContentItem): Promise<ContentItem> => {
    // Rewrite the body so that linked items point to the id of the copy
    const body: any = JSON.parse(JSON.stringify(item.body));

    const deps = ContentDependencyTree.identifyContentDependencies([
      { repo: undefined as any, content: { ...item, body } as ContentItem },
    ])[0];

    for (let i = 0; i < deps.dependencies.length; i++) {
      const dep = deps.dependencies[i];
      if (dep.dependency.id != null) {
        updateDependency(dep, mapping[dep.dependency.id]);
      }
    }

    // Let the application choose how to copy the item
    const newItem = await contentItemPicker(item, body);
    mapping[item.id] = newItem.id;

    return newItem;
  };

  const processItem = (
    id: string,
    parents: string[] = [id]
  ): Promise<ContentItem> => {
    if (cache[id]) {
      return cache[id];
    }

    return (cache[id] = contentItemProvider(id)
      .then(async (item) => {
        // visit children
        const deps = ContentDependencyTree.identifyContentDependencies([
          { repo: undefined as any, content: item },
        ])[0];

        for (let i = 0; i < deps.dependencies.length; i++) {
          const { id } = deps.dependencies[i].dependency;
          if (id != null) {
            if (parents.indexOf(id) !== -1) {
              // Circular dependency...
              if (circularMode === CircularMode.Throw) {
                throw new Error(
                  `CONTENT_ITEM_CYCLIC_DEPENDENCY: Circular dependency (${item.id}) -> (${id}) is not allowed.`
                );
              } else {
                circular.add(id);
              }
            } else {
              await processItem(id, [...parents, id]);
            }
          }
        }

        return item;
      })
      .then(rewriteItem));
  };

  await Promise.all(ids.map((id) => processItem(id)));

  if (circularMode === CircularMode.Repeat) {
    const ids = Array.from(circular);

    for (let i = 0; i < ids.length; i++) {
      const item = await cache[ids[i]];

      rewriteItem(item);
    }
  }

  return mapping;
}

export const updateDependency = (
  dep: ContentDependencyInfo,
  id: string | undefined
) => {
  if (dep.dependency._meta.schema === '_hierarchy') {
    dep.owner.content.body._meta.hierarchy.parentId = id;
  } else if (dep.parent) {
    const { parent } = dep;
    if (id == null) {
      delete parent[dep.index];
    } else {
      parent[dep.index] = dep.dependency;
      dep.dependency.id = id;
    }
  }
};
