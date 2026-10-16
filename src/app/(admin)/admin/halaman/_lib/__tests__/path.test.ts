import { describe, expect, it } from "vitest";

import {
  addCompareColumn,
  getAt,
  insertAt,
  moveCompareColumn,
  moveItem,
  parsePath,
  removeAt,
  removeCompareColumn,
  setAt,
} from "../path";

describe("path helpers", () => {
  it("parses dotted paths with numeric indexes", () => {
    expect(parsePath("items.0.title")).toEqual(["items", 0, "title"]);
    expect(parsePath("")).toEqual([]);
  });

  it("gets nested values safely", () => {
    const obj = { items: [{ title: "a" }] };
    expect(getAt(obj, ["items", 0, "title"])).toBe("a");
    expect(getAt(obj, ["items", 3, "title"])).toBeUndefined();
    expect(getAt(null, ["x"])).toBeUndefined();
  });

  it("sets immutably and creates containers", () => {
    const obj = { a: { b: 1 }, list: [1, 2] };
    const next = setAt(obj, ["a", "b"], 2);
    expect(next).toEqual({ a: { b: 2 }, list: [1, 2] });
    expect(obj.a.b).toBe(1);
    expect(next.list).toBe(obj.list);
    expect(setAt({}, ["items", 0, "title"], "x")).toEqual({
      items: [{ title: "x" }],
    });
  });

  it("deletes object keys when value is undefined", () => {
    expect(setAt({ a: 1, b: 2 }, ["a"], undefined)).toEqual({ b: 2 });
  });
});

describe("list helpers", () => {
  it("moves items", () => {
    expect(moveItem(["a", "b", "c"], 0, 2)).toEqual(["b", "c", "a"]);
    expect(moveItem(["a", "b", "c"], 2, 0)).toEqual(["c", "a", "b"]);
    const same = ["a"];
    expect(moveItem(same, 0, 5)).toBe(same);
  });

  it("removes and inserts", () => {
    expect(removeAt([1, 2, 3], 1)).toEqual([1, 3]);
    expect(insertAt([1, 3], 1, 2)).toEqual([1, 2, 3]);
    expect(insertAt([1], 99, 2)).toEqual([1, 2]);
  });
});

describe("compare table columns", () => {
  const rows = [{ label: "Tekstur", values: ["x", "y"] }];

  it("adds a column and pads rows", () => {
    const res = addCompareColumn(["A", "B"], rows, "C");
    expect(res.columns).toEqual(["A", "B", "C"]);
    expect(res.rows[0]!.values).toEqual(["x", "y", ""]);
  });

  it("removes a column from every row", () => {
    const res = removeCompareColumn(["A", "B"], rows, 0);
    expect(res.columns).toEqual(["B"]);
    expect(res.rows[0]!.values).toEqual(["y"]);
  });

  it("moves a column in every row and fixes short rows", () => {
    const res = moveCompareColumn(
      ["A", "B"],
      [{ label: "r", values: ["x"] }],
      0,
      1,
    );
    expect(res.columns).toEqual(["B", "A"]);
    expect(res.rows[0]!.values).toEqual(["", "x"]);
  });
});
