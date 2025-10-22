"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Webcam from "react-webcam";
import React from "react";
import { ensureMediapipe } from "../utils/mediapipe";

type PoseName = "POSE_1" | "POSE_2" | "POSE_3";

export default function HandCaptureModal({
  open,
  onOpenChange,
  onDone,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onDone: (payload: { file: File; previewUrl: string }) => void;
}) {
  const videoRef = React.useRef<Webcam | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  const [mp, setMp] = React.useState<{ Hands: any; Camera: any } | null>(null);
  const [hands, setHands] = React.useState<any>(null);
  const [camera, setCamera] = React.useState<any>(null);

  const [mode, setMode] = React.useState<"detect" | "preview">("detect");
  const [capturedUrl, setCapturedUrl] = React.useState<string | null>(null);
  const capturedFileRef = React.useRef<File | null>(null);
  const [instanceKey, setInstanceKey] = React.useState(0);

  const sequence: PoseName[] = ["POSE_1", "POSE_2", "POSE_3"];
  const [step, setStep] = React.useState(0);
  const stepRef = React.useRef(0);
  React.useEffect(() => {
    stepRef.current = step;
  }, [step]);

  const [countdown, setCountdown] = React.useState<number | null>(null);
  const countdownRef = React.useRef<number | null>(null);

  const stableCounter = React.useRef(0);
  const boxRef = React.useRef({ x: 0, y: 0, w: 0, h: 0 });
  const targetBoxRef = React.useRef({ x: 0, y: 0, w: 0, h: 0 });
  const boxColorRef = React.useRef<"red" | "green" | "none">("red");

  const ICONS = ["/handpose1.svg", "/handpose2.svg", "/handpose3.svg"];
  const LINE_WIDTH_PX = 5;
  const CHIP_FONT_SIZE = 15;
  const CHIP_FONT_WEIGHT = 700;
  const CHIP_HEIGHT = 32;
  const MIN_BOX_PX = 200;
  const DEFAULT_BOX_SCALE = 0.48;
  const DEFAULT_BOX_HOLD_FRAMES = 12;
  const defaultHoldRef = React.useRef(0);

  const dataURLtoFile = (dataUrl: string, filename: string) => {
    const [meta, b64] = dataUrl.split(",");
    const mime = meta.match(/:(.*?);/)?.[1] || "image/jpeg";
    const bin = atob(b64);
    const u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    return new File([u8], filename, { type: mime });
  };

  const countFingers = (lm: any[]): number => {
    const tips = [4, 8, 12, 16, 20];
    const pips = [2, 6, 10, 14, 18];
    const wrist = lm[0],
      thumbTip = lm[4],
      thumbIP = lm[3];
    const thumbUp =
      (thumbTip.x < thumbIP.x && thumbTip.x < wrist.x) ||
      (thumbTip.x > thumbIP.x && thumbTip.x > wrist.x);
    let c = thumbUp ? 1 : 0;
    for (let i = 1; i < 5; i++) if (lm[tips[i]].y < lm[pips[i]].y) c++;
    return c;
  };

  const classifyPose = (lm: any[]): PoseName | "UNDETECTED" => {
    const c = countFingers(lm);
    if (c === 1) return "POSE_1";
    if (c === 2) return "POSE_2";
    if (c === 3) return "POSE_3";
    return "UNDETECTED";
  };

  const computeBBox = (lm: any[], vw: number, vh: number) => {
    let minX = 1,
      minY = 1,
      maxX = 0,
      maxY = 0;
    for (const p of lm) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
    const pad = 0.08;
    minX = Math.max(0, minX - pad);
    minY = Math.max(0, minY - pad);
    maxX = Math.min(1, maxX + pad);
    maxY = Math.min(1, maxY + pad);
    return {
      x: minX * vw,
      y: minY * vh,
      w: (maxX - minX) * vw,
      h: (maxY - minY) * vh,
    };
  };

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const smoothBoxTowards = (t = 0.25) => {
    const b = boxRef.current,
      tb = targetBoxRef.current;
    boxRef.current = {
      x: lerp(b.x, tb.x, t),
      y: lerp(b.y, tb.y, t),
      w: lerp(b.w, tb.w, t),
      h: lerp(b.h, tb.h, t),
    };
  };

  const resizeCanvasToDisplaySize = (canvas: HTMLCanvasElement) => {
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = canvas.clientWidth | 0;
    const displayHeight = canvas.clientHeight | 0;
    const needResize =
      canvas.width !== Math.floor(displayWidth * dpr) ||
      canvas.height !== Math.floor(displayHeight * dpr);
    if (needResize) {
      canvas.width = Math.floor(displayWidth * dpr);
      canvas.height = Math.floor(displayHeight * dpr);
    }
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { width: canvas.width / dpr, height: canvas.height / dpr, dpr };
  };

  const setDefaultBox = (vw: number, vh: number) => {
    const w = vw * DEFAULT_BOX_SCALE;
    const h = w * (9 / 16);
    const x = vw / 2 - w / 2;
    const y = vh / 2 - h / 2;
    targetBoxRef.current = { x, y, w, h };
    boxRef.current = { x, y, w, h };
  };

  const drawOverlay = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.clearRect(0, 0, w, h);
    smoothBoxTowards();
    const color = boxColorRef.current;
    const { x, y, w: bw, h: bh } = boxRef.current;

    if (mode === "detect" && color !== "none") {
      ctx.lineWidth = LINE_WIDTH_PX;
      ctx.strokeStyle = color === "green" ? "#22c55e" : "#ef4444";
      ctx.strokeRect(x, y, bw, bh);

      const label = `Pose ${Math.min(stepRef.current + 1, 3)}`;
      ctx.font = `${CHIP_FONT_WEIGHT} ${CHIP_FONT_SIZE}px system-ui`;
      ctx.textBaseline = "middle";
      const chipW = ctx.measureText(label).width + 20;
      const chipYTop = y - CHIP_HEIGHT < 0 ? y : y - CHIP_HEIGHT;
      const chipX = x;
      ctx.fillStyle = color === "green" ? "#22c55e" : "#ef4444";
      ctx.fillRect(chipX, chipYTop, chipW, CHIP_HEIGHT);
      ctx.fillStyle = "#fff";
      ctx.fillText(label, chipX + 10, chipYTop + CHIP_HEIGHT / 2);
    }

    if (countdownRef.current != null) {
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(0, 0, w, h);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(0,0,0,0.35)";
      ctx.shadowBlur = 6;

      ctx.fillStyle = "#fff";
      ctx.font = "500 15px system-ui";
      ctx.fillText("Capturing photo in", w / 2, h / 2 - 20);

      ctx.font = "bold 45px system-ui";
      ctx.fillText(String(countdownRef.current), w / 2, h / 2 + 20);
      ctx.shadowBlur = 0;
    }
  };

  React.useEffect(() => {
    if (open) (async () => setMp(await ensureMediapipe()))();
  }, [open]);

  React.useEffect(() => {
    if (!mp || !open || mode !== "detect") return;
    const { Hands, Camera } = mp;
    const video = videoRef.current?.video as HTMLVideoElement | undefined;
    if (!video) return;

    const h = new Hands({
      locateFile: (f: string) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`,
    });
    h.setOptions({
      selfieMode: true,
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.6,
    });
    setHands(h);

    h.onResults((results: any) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      const { width: vw, height: vh } = resizeCanvasToDisplaySize(canvas);

      if (defaultHoldRef.current > 0) {
        setDefaultBox(vw, vh);
        boxColorRef.current = "red";
        defaultHoldRef.current -= 1;
        drawOverlay(ctx, vw, vh);
        return;
      }

      if (!results.multiHandLandmarks?.length) {
        setDefaultBox(vw, vh);
        boxColorRef.current = "red";
        drawOverlay(ctx, vw, vh);
        return;
      }

      const lm = results.multiHandLandmarks[0];
      const bbox = computeBBox(lm, vw, vh);
      const w2 = Math.max(bbox.w, MIN_BOX_PX);
      const h2 = Math.max(bbox.h, MIN_BOX_PX);
      const x2 = Math.min(Math.max(bbox.x, 0), vw - w2);
      const y2 = Math.min(Math.max(bbox.y, 0), vh - h2);
      targetBoxRef.current = { x: x2, y: y2, w: w2, h: h2 };

      const pose = classifyPose(lm);
      const expected = sequence[stepRef.current];
      const match = pose === expected;
      boxColorRef.current = match ? "green" : "red";

      if (match) {
        stableCounter.current++;
        if (stableCounter.current > 10) {
          stableCounter.current = 0;
          if (stepRef.current + 1 <= sequence.length) {
            setStep((s) => s + 1);
            stepRef.current += 1;
          }
        }
      } else {
        stableCounter.current = 0;
      }

      if (stepRef.current >= sequence.length && countdownRef.current == null) {
        boxColorRef.current = "none";
        countdownRef.current = 3;
        setCountdown(3);
        const timer = setInterval(() => {
          countdownRef.current =
            countdownRef.current != null ? countdownRef.current - 1 : null;
          setCountdown(countdownRef.current);
          if (countdownRef.current === 0) {
            clearInterval(timer);
            const shot = videoRef.current?.getScreenshot();
            if (shot) {
              setCapturedUrl(shot);
              capturedFileRef.current = dataURLtoFile(
                shot,
                `apply-${Date.now()}.jpg`
              );
            }
            try {
              camera?.stop();
            } catch {}
            try {
              h.close();
            } catch {}
            setMode("preview");
            countdownRef.current = null;
            setCountdown(null);
          }
        }, 1000);
      }
      drawOverlay(ctx, vw, vh);
    });

    const cam = new Camera(video!, {
      onFrame: async () => {
        await h.send({ image: video! });
      },
      width: 1280,
      height: 720,
    });
    cam.start();
    setCamera(cam);

    const initDefaultBox = () => {
      const vw = video.videoWidth || 1280;
      const vh = video.videoHeight || 720;
      setDefaultBox(vw, vh);
    };
    const readyCheck = setInterval(() => {
      if (video.videoWidth && video.videoHeight) {
        clearInterval(readyCheck);
        initDefaultBox();
      }
    }, 30);

    return () => {
      clearInterval(readyCheck);
      try {
        cam.stop();
      } catch {}
      try {
        h.close();
      } catch {}
    };
  }, [mp, open, mode]);

  const resetDetect = () => {
    setMode("detect");
    setStep(0);
    stepRef.current = 0;
    countdownRef.current = null;
    setCountdown(null);
    stableCounter.current = 0;
    boxColorRef.current = "red";
    setCapturedUrl(null);
    capturedFileRef.current = null;
    defaultHoldRef.current = DEFAULT_BOX_HOLD_FRAMES;
  };

  const handleOpenChange = (v: boolean) => {
    onOpenChange(v);
    if (!v) {
      try {
        camera?.stop();
      } catch {}
      try {
        hands?.close();
      } catch {}
      resetDetect();
    } else {
      resetDetect();
      setInstanceKey((k) => k + 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="w-[95vw] max-w-[960px] p-0"
        aria-describedby={undefined}
      >
        <div className="p-5 pb-3">
          <DialogHeader>
            <DialogTitle>
              <h3 className="text-[18px] font-semibold">
                Raise Your Hand to Capture
              </h3>
              <p className="text-sm font-normal text-gray-600">
                We’ll take the photo once your hand pose is detected.
              </p>
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="px-5">
          <div
            className="relative w-full rounded-lg overflow-hidden"
            style={{ aspectRatio: "16 / 9" }}
          >
            {mode === "detect" ? (
              <>
                <Webcam
                  key={instanceKey}
                  ref={videoRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  className="absolute inset-0 w-full h-full object-cover"
                  videoConstraints={{ facingMode: "user" }}
                  mirrored
                />
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                />
              </>
            ) : (
              <img
                src={capturedUrl ?? ""}
                alt="Captured"
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
          </div>
        </div>

        {mode === "detect" ? (
          <div className="p-5 pt-3">
            <p className="text-sm text-gray-700">
              To take a picture, follow the hand poses in the order shown below.
              The system will automatically capture the image once the final
              pose is detected.
            </p>
            <div className="mt-4 flex items-center justify-center gap-10">
              {ICONS.map((icon, i) => (
                <React.Fragment key={i}>
                  <div className="flex flex-col items-center">
                    <img
                      src={icon}
                      alt={`Pose ${i + 1}`}
                      className="h-16 w-16"
                    />
                    <p className="mt-1 text-xs text-gray-700">{`Pose ${
                      i + 1
                    }`}</p>
                  </div>
                  {i < ICONS.length - 1 && (
                    <span className="text-4xl leading-none font-extrabold text-black select-none">
                      ›
                    </span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-5 flex items-center justify-center gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={resetDetect}
              className="h-10 px-5"
            >
              Retake photo
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (capturedUrl && capturedFileRef.current)
                  onDone({
                    file: capturedFileRef.current,
                    previewUrl: capturedUrl,
                  });
                handleOpenChange(false);
              }}
              className="h-10 px-6 bg-[#03959f] hover:bg-[#01777F]"
            >
              Submit
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
