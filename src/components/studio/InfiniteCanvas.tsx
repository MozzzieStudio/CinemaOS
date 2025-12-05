import { useEffect, useRef } from "react";
import { Application, Container, Graphics, Text, TextStyle } from "pixi.js";

/**
 * InfiniteCanvas - PixiJS v8 (WebGPU) Implementation
 * 
 * Freepik Spaces-style infinite canvas for visual storyboarding.
 * Uses imperative PixiJS API instead of React bindings.
 */
export default function InfiniteCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);

  useEffect(() => {
    const initPixi = async () => {
      if (!containerRef.current) return;

      // Create PixiJS Application with WebGPU preference
      const app = new Application();
      await app.init({
        background: "#050505",
        resizeTo: containerRef.current,
        preference: "webgpu",
        antialias: true,
      });

      containerRef.current.appendChild(app.canvas);
      appRef.current = app;

      // Create main container for pan/zoom
      const mainContainer = new Container();
      app.stage.addChild(mainContainer);

      // Draw grid
      const grid = createGrid(2000, 2000);
      mainContainer.addChild(grid);

      // Add scene nodes
      mainContainer.addChild(createSceneNode(100, 100, "Scene 1: The Arrival"));
      mainContainer.addChild(createSceneNode(350, 100, "Scene 2: The Confrontation"));
      mainContainer.addChild(createSceneNode(600, 250, "Scene 3: The Escape"));

      // Connection lines
      const lines = new Graphics();
      lines.stroke({ width: 2, color: 0x666666, alpha: 0.5 });
      lines.moveTo(300, 160).lineTo(350, 160);
      lines.moveTo(550, 160).lineTo(575, 160).lineTo(575, 310).lineTo(600, 310);
      mainContainer.addChild(lines);

      // Enable pan & zoom
      enablePanZoom(app.stage, mainContainer);
    };

    initPixi();

    return () => {
      appRef.current?.destroy(true);
    };
  }, []);

  return (
    <div className="w-full h-full bg-[#050505] overflow-hidden relative">
      <div className="absolute top-4 left-4 z-10 text-white/50 text-xs font-mono pointer-events-none">
        INFINITE CANVAS v0.2 (WebGPU)
      </div>
      <div
        ref={containerRef}
        className="w-full h-full"
        style={{ touchAction: "none" }}
      />
    </div>
  );
}

/** Create infinite grid */
function createGrid(width: number, height: number): Container {
  const grid = new Container();
  const graphics = new Graphics();

  graphics.stroke({ width: 1, color: 0x1a1a1a });

  const gridSize = 50;
  for (let x = 0; x < width; x += gridSize) {
    graphics.moveTo(x, 0).lineTo(x, height);
  }
  for (let y = 0; y < height; y += gridSize) {
    graphics.moveTo(0, y).lineTo(width, y);
  }

  grid.addChild(graphics);
  return grid;
}

/** Create a scene node card */
function createSceneNode(x: number, y: number, title: string): Container {
  const node = new Container();
  node.position.set(x, y);

  // Card background
  const bg = new Graphics();
  bg.roundRect(0, 0, 200, 120, 10);
  bg.fill({ color: 0x1a1a1a });
  bg.stroke({ width: 2, color: 0xffffff, alpha: 0.3 });
  node.addChild(bg);

  // Title
  const titleStyle = new TextStyle({
    fill: "#ffffff",
    fontSize: 14,
    fontFamily: "Inter, sans-serif",
    fontWeight: "bold",
  });
  const titleText = new Text({ text: title, style: titleStyle });
  titleText.position.set(10, 10);
  node.addChild(titleText);

  // Subtitle
  const subtitleStyle = new TextStyle({
    fill: "#888888",
    fontSize: 10,
    fontFamily: "Courier Prime, monospace",
  });
  const subtitleText = new Text({
    text: "INT. LOCATION - DAY",
    style: subtitleStyle,
  });
  subtitleText.position.set(10, 30);
  node.addChild(subtitleText);

  // Make interactive
  node.eventMode = "static";
  node.cursor = "pointer";

  return node;
}

/** Enable pan & zoom on stage */
function enablePanZoom(stage: Container, mainContainer: Container) {
  let isDragging = false;
  let lastPosition = { x: 0, y: 0 };

  stage.eventMode = "static";
  stage.hitArea = { contains: () => true } as any;

  stage.on("pointerdown", (e) => {
    isDragging = true;
    lastPosition = { x: e.global.x, y: e.global.y };
  });

  stage.on("pointerup", () => {
    isDragging = false;
  });
  
  stage.on("pointerupoutside", () => {
    isDragging = false;
  });

  stage.on("pointermove", (e) => {
    if (!isDragging) return;
    const dx = e.global.x - lastPosition.x;
    const dy = e.global.y - lastPosition.y;
    mainContainer.position.x += dx;
    mainContainer.position.y += dy;
    lastPosition = { x: e.global.x, y: e.global.y };
  });

  stage.on("wheel", (e) => {
    const scaleBy = 1.1;
    const direction = e.deltaY > 0 ? -1 : 1;
    const newScale = mainContainer.scale.x * (direction > 0 ? scaleBy : 1 / scaleBy);
    const clampedScale = Math.max(0.1, Math.min(5, newScale));
    mainContainer.scale.set(clampedScale);
  });
}
