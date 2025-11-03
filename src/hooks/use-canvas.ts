import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import type { Shape } from "@/redux/slices/shapes";
import type { Point } from "@/redux/slices/viewport";
import { type AppDispatch, useAppSelector } from "@/redux/store";

type TouchPointer = {
  id: number;
  p: Point;
};

type DraftShape = {
  type: "frame" | "rect" | "ellipse" | "arrow" | "line";
  startWorld: Point;
  currentWorld: Point;
};

type InitialPosition = {
  x?: number;
  y?: number;
  points?: Point[];
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
};

type ResizingData = {
  shapeId: string;
  corner: string;
  initialBounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  startPoint: Point;
};

const TEXT_PADDING = 8;
const TEXT_FONT_SIZE_MULTIPLIER = 0.6;
const TEXT_HEIGHT_MULTIPLIER = 1.2;
const TEXT_WIDTH_MIN = 100;

export const useInfiniteCanvas = () => {
  const dispatch = useDispatch<AppDispatch>();

  const viewport = useAppSelector((state) => state.viewport);
  const entityState = useAppSelector((state) => state.shapes.shapes);
  const shapeList: Shape[] = entityState.ids
    .map((id: string) => entityState.entities[id])
    .filter((shape: Shape | undefined): shape is Shape => Boolean(shape));

  const currentTool = useAppSelector((state) => state.tool);
  const selectedShapes = useAppSelector((state) => state.shapes.selected);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const shapesEntities = useAppSelector(
    (state) => state.shapes.shapes.entities
  );

  const hasSelectedText = Object.keys(selectedShapes).some(
    (id) => shapesEntities[id]?.type === "text"
  );

  useEffect(() => {
    if (hasSelectedText && !isSidebarOpen) {
      setIsSidebarOpen(true);
    } else if (!hasSelectedText) {
      setIsSidebarOpen(false);
    }
  }, [hasSelectedText, isSidebarOpen]);

  const canvasRef = useRef<HTMLDivElement | null>(null);
  const touchMapRef = useRef<Map<number, TouchPointer>>(new Map());

  const draftShapeRef = useRef<DraftShape | null>(null);
  const freeDrawPointsRef = useRef<Point[]>([]);
  const isSpacePressed = useRef(false);
  const isDrawingRef = useRef(false);
  const isMovingRef = useRef(false);
  const moveStartRef = useRef<Point | null>(null);

  const initialShapePositionRef = useRef<Record<string, InitialPosition>>({});
  const isErasingRef = useRef(false);
  const erasedShapesRef = useRef<Set<string>>(new Set());

  const resizingDataRef = useRef<ResizingData | null>(null);

  // Capped at 60fps
  const lastFreehandFrameRef = useRef(0);
  const freehandRafRef = useRef<number | null>(null);
  const panRafRef = useRef<number | null>(null);
  const pendingPanPointRef = useRef<Point | null>(null);

  const [, forceUpdate] = useState(0);
  const requestRender = (): void => {
    forceUpdate((prev) => Math.floor(prev + 1));
  };

  const localPointFromClient = (clientX: number, clientY: number): Point => {
    const el = canvasRef.current;

    if (!el) {
      return { x: clientX, y: clientY };
    }

    const rect = el.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const blurActiveTextInput = () => {
    const activeElement = document.activeElement;
    if (activeElement && activeElement.tagName === "INPUT") {
      (activeElement as HTMLInputElement).blur();
    }
  };

  type WithClientXY = {
    clientX: number;
    clientY: number;
  };

  const getLocalPointFromPtr = (e: WithClientXY): Point =>
    localPointFromClient(e.clientX, e.clientY);

  // Hit Testing
  const distanceToLineSegment = (
    point: Point,
    lineStart: Point,
    lineEnd: Point
  ): number => {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const len_sq = C * C + D * D;

    let param = -1;

    if (len_sq !== 0) {
      param = dot / len_sq;
    }

    let xx: number, yy: number;
    if (param < 0) {
      xx = lineStart.x;
      yy = lineStart.y;
    } else if (param > 1) {
      xx = lineEnd.x;
      yy = lineEnd.y;
    } else {
      xx = lineStart.x + param * C;
      yy = lineStart.y + param * D;
    }

    const dx = point.x - xx;
    const dy = point.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const isPointInShape = (point: Point, shape: Shape): boolean => {
    switch (shape.type) {
      case "frame":
      case "rect":
      case "ellipse":
      case "generatedui":
        return (
          point.x >= shape.x &&
          point.x <= shape.x + shape.w &&
          point.y >= shape.y &&
          point.y <= shape.y + shape.h
        );
      case "freedraw": {
        const threshold = 5;
        for (let i = 0; i < shape.points.length - 1; i++) {
          const point1 = shape.points[i];
          const point2 = shape.points[i + 1];

          if (distanceToLineSegment(point, point1, point2) <= threshold) {
            return true;
          }
        }
        return false;
      }
      case "arrow":
      case "line": {
        const threshold = 5;
        return (
          distanceToLineSegment(
            point,
            { x: shape.startX, y: shape.startY },
            { x: shape.endX, y: shape.endY }
          ) <= threshold
        );
      }
      case "text": {
        const textWidth = Math.max(
          shape.text.length * (shape.fontSize * TEXT_FONT_SIZE_MULTIPLIER),
          TEXT_WIDTH_MIN
        );

        const textHeight = shape.fontSize * TEXT_HEIGHT_MULTIPLIER;
        const padding = TEXT_PADDING;

        return (
          point.x >= shape.x - 2 &&
          point.x <= shape.x + textWidth + padding + 2 &&
          point.y >= shape.y - 2 &&
          point.y <= shape.y + textHeight + padding + 2
        );
      }
      default:
        return false;
    }
  };

  // Colision Detection
  const getShapeAtPoint = (worldPoint: Point): Shape | null => {
    for (let i = shapeList.length - 1; i >= 0; i--) {
      if (isPointInShape(worldPoint, shapeList[i])) {
        return shapeList[i];
      }
    }
    return null;
  };

  const schedulePanMove = (p: Point) => {
    pendingPanPointRef.current = p;
    if (panRafRef.current !== null) {
      return;
    }
  };

  return { viewport, entityState };
};
