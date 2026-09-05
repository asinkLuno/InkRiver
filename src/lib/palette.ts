import type { MoaiMap } from "@/lib/api";

/** 染线数量,对应 globals.css 中的 --dye-1…--dye-6 */
export const DYE_COUNT = 6;

/**
 * 染线按实体在故事中的出现顺序循环分配:同一故事内
 * 时间线、关系图、事件卡片始终使用同一种颜色,且相邻实体色相岔开。
 * 以 get_moai 返回的对象实例为键做记忆,各视图共享同一份分配。
 */
const assignments = new WeakMap<MoaiMap, Map<string, string>>();

export function dyeAssignments(moais: MoaiMap): Map<string, string> {
  let map = assignments.get(moais);
  if (!map) {
    map = new Map();
    Object.keys(moais).forEach((name, index) => {
      map!.set(name, `var(--dye-${(index % DYE_COUNT) + 1})`);
    });
    assignments.set(moais, map);
  }
  return map;
}

/**
 * 实体名 → 染线 CSS 变量,如 var(--dye-3)。
 * 传入 moais 时按出现顺序取色;不在册的名字退回名字哈希。
 */
export function dyeVar(name: string, moais?: MoaiMap): string {
  const assigned = moais ? dyeAssignments(moais).get(name) : undefined;
  return assigned ?? `var(--dye-${(hashName(name) % DYE_COUNT) + 1})`;
}

function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** 事件取第一个关联实体的染线颜色。 */
export function eventDyeVar(
  moaiNames: readonly string[] | null | undefined,
  moais?: MoaiMap,
): string {
  const first = moaiNames?.[0];
  return first ? dyeVar(first, moais) : "var(--primary)";
}
