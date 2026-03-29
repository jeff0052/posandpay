import { useSyncExternalStore } from "react";

export type TableShape = "round" | "square" | "rectangular" | "booth";

export interface TableLayout {
  tableId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  shape: TableShape;
  zone: string;
}

type Listener = () => void;

const GRID_SIZE = 20;

const snap = (v: number) => Math.round(v / GRID_SIZE) * GRID_SIZE;

// Initial layouts for demo
const initialLayouts: TableLayout[] = [
  { tableId: "t1", x: 40, y: 40, width: 80, height: 80, shape: "round", zone: "Main Hall" },
  { tableId: "t2", x: 160, y: 40, width: 100, height: 100, shape: "square", zone: "Main Hall" },
  { tableId: "t3", x: 300, y: 40, width: 100, height: 100, shape: "square", zone: "Main Hall" },
  { tableId: "t4", x: 440, y: 40, width: 140, height: 80, shape: "rectangular", zone: "Main Hall" },
  { tableId: "t5", x: 40, y: 160, width: 80, height: 80, shape: "round", zone: "Main Hall" },
  { tableId: "t6", x: 160, y: 160, width: 100, height: 100, shape: "square", zone: "Main Hall" },
  { tableId: "t15", x: 300, y: 160, width: 160, height: 80, shape: "rectangular", zone: "Main Hall" },
  { tableId: "t16", x: 500, y: 160, width: 80, height: 80, shape: "round", zone: "Main Hall" },
  { tableId: "t7", x: 40, y: 40, width: 80, height: 80, shape: "round", zone: "Patio" },
  { tableId: "t8", x: 160, y: 40, width: 100, height: 100, shape: "square", zone: "Patio" },
  { tableId: "t9", x: 300, y: 40, width: 140, height: 80, shape: "rectangular", zone: "Patio" },
  { tableId: "t17", x: 40, y: 160, width: 100, height: 100, shape: "square", zone: "Patio" },
  { tableId: "t10", x: 40, y: 40, width: 160, height: 80, shape: "rectangular", zone: "Private" },
  { tableId: "t11", x: 240, y: 40, width: 160, height: 100, shape: "rectangular", zone: "Private" },
  { tableId: "t18", x: 40, y: 160, width: 200, height: 100, shape: "booth", zone: "Private" },
  { tableId: "t12", x: 40, y: 40, width: 80, height: 80, shape: "round", zone: "Bar" },
  { tableId: "t13", x: 160, y: 40, width: 80, height: 80, shape: "round", zone: "Bar" },
  { tableId: "t14", x: 280, y: 40, width: 80, height: 80, shape: "round", zone: "Bar" },
];

let layoutsState = [...initialLayouts];
const listeners = new Set<Listener>();
const emit = () => listeners.forEach(l => l());
const sub = (l: Listener) => { listeners.add(l); return () => listeners.delete(l); };

export const useFloorLayouts = () => useSyncExternalStore(sub, () => layoutsState, () => layoutsState);

export const moveTable = (tableId: string, x: number, y: number) => {
  layoutsState = layoutsState.map(l => l.tableId === tableId ? { ...l, x: snap(x), y: snap(y) } : l);
  emit();
};

export const resizeTable = (tableId: string, width: number, height: number) => {
  layoutsState = layoutsState.map(l => l.tableId === tableId ? { ...l, width: snap(Math.max(60, width)), height: snap(Math.max(60, height)) } : l);
  emit();
};

export const addTableLayout = (layout: TableLayout) => {
  layoutsState = [...layoutsState, { ...layout, x: snap(layout.x), y: snap(layout.y) }];
  emit();
};

export const removeTableLayout = (tableId: string) => {
  layoutsState = layoutsState.filter(l => l.tableId !== tableId);
  emit();
};

export const updateTableShape = (tableId: string, shape: TableShape) => {
  layoutsState = layoutsState.map(l => l.tableId === tableId ? { ...l, shape } : l);
  emit();
};

export { GRID_SIZE };
