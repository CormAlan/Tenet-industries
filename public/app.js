class PixelTextReveal {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {object} options
   */
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");

    this.options = {
      text: options.text ?? "HELLO WORLD",
      fontFamily: options.fontFamily ?? "Arial Black, Arial, sans-serif",
      fontWeight: options.fontWeight ?? "900",
      fontSize: options.fontSize ?? 120,
      color: options.color ?? "#ffffff",
      background: options.background ?? "transparent",
      duration: options.duration ?? 1000,
      initialPixelSize: options.initialPixelSize ?? 28,
      letterSpacing: options.letterSpacing ?? 0,
      paddingX: options.paddingX ?? 40,
      paddingY: options.paddingY ?? 30,
      ease: options.ease ?? ((t) => 1 - Math.pow(1 - t, 3)), // easeOutCubic
      autoReplayOnResize: options.autoReplayOnResize ?? true,
      debug: options.debug ?? false,
    };

    this.offscreen = document.createElement("canvas");
    this.offCtx = this.offscreen.getContext("2d");

    this.tinyCanvas = document.createElement("canvas");
    this.tinyCtx = this.tinyCanvas.getContext("2d");

    this.animationFrame = null;
    this.startTime = 0;

    this.drawX = 0;
    this.drawY = 0;
    this.drawWidth = 0;
    this.drawHeight = 0;
    this.textStartX = 0;
    this.textBaselineY = 0;

    this.handleResize = this.handleResize.bind(this);

    window.addEventListener("resize", this.handleResize);

    this.setup();
    this.play();
  }

  setup() {
    const dpr = window.devicePixelRatio || 1;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    this.canvas.width = Math.floor(vw * dpr);
    this.canvas.height = Math.floor(vh * dpr);
    this.canvas.style.width = `${vw}px`;
    this.canvas.style.height = `${vh}px`;

    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);

    this.renderTextToOffscreen(vw, vh);
  }

  renderTextToOffscreen(viewWidth, viewHeight) {
    const {
      text,
      fontFamily,
      fontWeight,
      fontSize,
      color,
      background,
      letterSpacing,
      paddingX,
      paddingY,
      initialPixelSize,
    } = this.options;

    const measureCanvas = document.createElement("canvas");
    const measureCtx = measureCanvas.getContext("2d");
    measureCtx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    measureCtx.textBaseline = "alphabetic";

    let textWidth = 0;
    for (const char of text) {
      textWidth += measureCtx.measureText(char).width;
    }
    textWidth += Math.max(0, text.length - 1) * letterSpacing;
    textWidth = Math.ceil(textWidth);

    const metrics = measureCtx.measureText(text);
    const ascent =
      Math.ceil(metrics.actualBoundingBoxAscent || fontSize * 0.8);
    const descent =
      Math.ceil(metrics.actualBoundingBoxDescent || fontSize * 0.2);
    const textHeight = ascent + descent;

    const safety = Math.max(12, Math.ceil(initialPixelSize * 2));
    const extraRightSafety = Math.max(8, Math.ceil(initialPixelSize));
    const extraBottomSafety = Math.max(8, Math.ceil(initialPixelSize * 0.75));

    const drawWidth = Math.ceil(
      textWidth + paddingX * 2 + safety + extraRightSafety
    );
    const drawHeight = Math.ceil(
      textHeight + paddingY * 2 + safety + extraBottomSafety
    );

    this.offscreen.width = drawWidth;
    this.offscreen.height = drawHeight;

    const ctx = this.offCtx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, drawWidth, drawHeight);

    if (background !== "transparent") {
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, drawWidth, drawHeight);
    }

    ctx.fillStyle = color;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.imageSmoothingEnabled = false;

    const startX = Math.round(paddingX + safety / 2);
    const baselineY = Math.round(paddingY + safety / 2 + ascent);

    let x = startX;
    for (const char of text) {
      ctx.fillText(char, x, baselineY);
      x += ctx.measureText(char).width + letterSpacing;
    }

    this.textStartX = startX;
    this.textBaselineY = baselineY;
    this.drawWidth = drawWidth;
    this.drawHeight = drawHeight;
    this.drawX = Math.round((viewWidth - drawWidth) / 2);
    this.drawY = Math.round((viewHeight - drawHeight) / 2);
  }

  draw(pixelSize) {
    const ctx = this.ctx;
    const viewWidth = this.canvas.clientWidth;
    const viewHeight = this.canvas.clientHeight;

    ctx.clearRect(0, 0, viewWidth, viewHeight);

    const safePixelSize = Math.max(1, pixelSize);
    const scaledW = Math.max(1, Math.ceil(this.drawWidth / safePixelSize));
    const scaledH = Math.max(1, Math.ceil(this.drawHeight / safePixelSize));

    const tinyPad = 2;
    const tinyW = scaledW + tinyPad * 2;
    const tinyH = scaledH + tinyPad * 2;

    if (this.tinyCanvas.width !== tinyW || this.tinyCanvas.height !== tinyH) {
      this.tinyCanvas.width = tinyW;
      this.tinyCanvas.height = tinyH;
    } else {
      this.tinyCtx.clearRect(0, 0, tinyW, tinyH);
    }

    this.tinyCtx.setTransform(1, 0, 0, 1, 0, 0);
    this.tinyCtx.imageSmoothingEnabled = false;
    this.tinyCtx.clearRect(0, 0, tinyW, tinyH);

    this.tinyCtx.drawImage(
      this.offscreen,
      0,
      0,
      this.drawWidth,
      this.drawHeight,
      tinyPad,
      tinyPad,
      scaledW,
      scaledH
    );

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      this.tinyCanvas,
      0,
      0,
      tinyW,
      tinyH,
      this.drawX,
      this.drawY,
      this.drawWidth,
      this.drawHeight
    );

    if (this.options.debug) {
      ctx.save();
      ctx.strokeStyle = "red";
      ctx.lineWidth = 1;
      ctx.strokeRect(this.drawX, this.drawY, this.drawWidth, this.drawHeight);
      ctx.restore();
    }
  }

  play() {
    cancelAnimationFrame(this.animationFrame);
    this.startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - this.startTime;
      const t = Math.min(elapsed / this.options.duration, 1);
      const eased = this.options.ease(t);

      const pixelSize = Math.max(
        1,
        this.options.initialPixelSize * (1 - eased)
      );

      this.draw(pixelSize);

      if (t < 1) {
        this.animationFrame = requestAnimationFrame(animate);
      } else {
        this.draw(1);
      }
    };

    this.animationFrame = requestAnimationFrame(animate);
  }

  setText(newText) {
    this.options.text = newText;
    this.setup();
    this.play();
  }

  updateOptions(nextOptions = {}) {
    this.options = { ...this.options, ...nextOptions };
    this.setup();
    this.play();
  }

  handleResize() {
    this.setup();
    if (this.options.autoReplayOnResize) {
      this.play();
    } else {
      this.draw(1);
    }
  }

  destroy() {
    cancelAnimationFrame(this.animationFrame);
    window.removeEventListener("resize", this.handleResize);
  }
}

// Demo usage
const canvas = document.getElementById("pixelTextCanvas");

const effect = new PixelTextReveal(canvas, {
  text: "PIXEL REVEAL",
  fontSize: Math.min(window.innerWidth * 0.12, 140),
  duration: 1000,
  initialPixelSize: 30,
  color: "#f5f7ff",
  fontFamily: "Arial Black, Arial, sans-serif",
  letterSpacing: 2,
  paddingX: 40,
  paddingY: 30,
  debug: false,
});

// Replay on click
window.addEventListener("click", () => {
  effect.play();
});

// Example:
// setTimeout(() => {
//   effect.setText("WELCOME");
// }, 2500);