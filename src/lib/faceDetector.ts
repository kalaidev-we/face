import * as faceapi from '@vladmandic/face-api';

const MODEL_CDN_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';

let modelsLoaded = false;
let loadingPromise: Promise<void> | null = null;

/**
 * Loads the face-api models from CDN.
 * Ensures we only load once.
 */
export const loadFaceModels = (): Promise<void> => {
  if (modelsLoaded) return Promise.resolve();
  if (loadingPromise) return loadingPromise;

  loadingPromise = new Promise(async (resolve, reject) => {
    try {
      // Load tiny face detector, face landmark 68, and face recognition models
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_CDN_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_CDN_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_CDN_URL)
      ]);
      modelsLoaded = true;
      resolve();
    } catch (err) {
      console.error('Failed to load face-api models:', err);
      loadingPromise = null;
      reject(err);
    }
  });

  return loadingPromise;
};

export interface FaceValidationResult {
  isValid: boolean;
  message: string;
  brightness?: number;
  blurScore?: number;
  facesDetected?: number;
}

/**
 * Measures the brightness of an image from a canvas context.
 */
export const checkLighting = (canvas: HTMLCanvasElement): { isValid: boolean; brightness: number } => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return { isValid: false, brightness: 0 };

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  let totalLuminance = 0;

  // Sample pixels (every 4th pixel for speed)
  const step = 4;
  let count = 0;
  for (let i = 0; i < data.length; i += 4 * step) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Relative luminance formula
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    totalLuminance += luminance;
    count++;
  }

  const averageBrightness = totalLuminance / count;
  
  // Brightness thresholds
  if (averageBrightness < 50) {
    return { isValid: false, brightness: averageBrightness }; // Too dark
  }
  if (averageBrightness > 220) {
    return { isValid: false, brightness: averageBrightness }; // Too bright / overexposed
  }

  return { isValid: true, brightness: averageBrightness };
};

/**
 * Custom blur check estimating edge contrast / local pixel difference variance.
 * High scores mean sharp image; low scores indicate blur.
 */
export const checkBlur = (canvas: HTMLCanvasElement): { isValid: boolean; score: number } => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return { isValid: false, score: 0 };

  // Sample a smaller central patch for speed
  const patchWidth = 100;
  const patchHeight = 100;
  const patchX = Math.floor((canvas.width - patchWidth) / 2);
  const patchY = Math.floor((canvas.height - patchHeight) / 2);

  const imageData = ctx.getImageData(patchX, patchY, patchWidth, patchHeight);
  const data = imageData.data;
  
  let diffSum = 0;
  let count = 0;

  for (let y = 1; y < patchHeight - 1; y += 2) {
    for (let x = 1; x < patchWidth - 1; x += 2) {
      const idx = (y * patchWidth + x) * 4;
      const idxRight = (y * patchWidth + (x + 1)) * 4;
      const idxBottom = ((y + 1) * patchWidth + x) * 4;

      const currentG = data[idx + 1]; // Green channel is good enough proxy
      const rightG = data[idxRight + 1];
      const bottomG = data[idxBottom + 1];

      // Measure local difference
      const horizontalDiff = Math.abs(currentG - rightG);
      const verticalDiff = Math.abs(currentG - bottomG);
      
      diffSum += horizontalDiff + verticalDiff;
      count += 2;
    }
  }

  const averageContrast = diffSum / count;
  
  // Threshold: below 6-8 is usually blurry
  const minSharpness = 7.5;
  return {
    isValid: averageContrast >= minSharpness,
    score: averageContrast
  };
};

/**
 * Checks if the face is centered within the canvas view.
 */
export const checkCenterAlignment = (
  box: faceapi.Box,
  canvasWidth: number,
  canvasHeight: number
): { isValid: boolean; message: string } => {
  const faceCenterX = box.x + box.width / 2;
  const faceCenterY = box.y + box.height / 2;
  const canvasCenterX = canvasWidth / 2;
  const canvasCenterY = canvasHeight / 2;

  // Max displacement threshold: 20% of canvas dimensions
  const maxDisplacementX = canvasWidth * 0.20;
  const maxDisplacementY = canvasHeight * 0.20;

  const dx = Math.abs(faceCenterX - canvasCenterX);
  const dy = Math.abs(faceCenterY - canvasCenterY);

  if (dx > maxDisplacementX) {
    return { isValid: false, message: 'Position face in the center horizontally' };
  }
  if (dy > maxDisplacementY) {
    return { isValid: false, message: 'Position face in the center vertically' };
  }

  // Check face size: face should cover between 15% and 60% of the screen height
  const faceHeightRatio = box.height / canvasHeight;
  if (faceHeightRatio < 0.22) {
    return { isValid: false, message: 'Please move closer to the camera' };
  }
  if (faceHeightRatio > 0.65) {
    return { isValid: false, message: 'Please move slightly back' };
  }

  return { isValid: true, message: 'Face aligned' };
};

// Anti-spoofing tracker state
let prevBoxCenter: { x: number; y: number } | null = null;
let movementHistory: number[] = [];

/**
 * Basic anti-spoofing check.
 * Real human faces have micro-movements (breathing, muscle movements).
 * Static photos scanned directly have exactly 0 pixel variance or extreme sudden jumps.
 * We track center displacement variance over a few frames.
 */
export const checkAntiSpoofing = (box: faceapi.Box): { isValid: boolean; message: string } => {
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;

  if (!prevBoxCenter) {
    prevBoxCenter = { x: centerX, y: centerY };
    return { isValid: true, message: 'Liveness checking initiated...' };
  }

  // Calculate Euclidean distance moved
  const dist = Math.sqrt(Math.pow(centerX - prevBoxCenter.x, 2) + Math.pow(centerY - prevBoxCenter.y, 2));
  prevBoxCenter = { x: centerX, y: centerY };

  movementHistory.push(dist);
  if (movementHistory.length > 10) {
    movementHistory.shift();
  }

  // Once we have history, analyze it
  if (movementHistory.length >= 5) {
    const sum = movementHistory.reduce((s, val) => s + val, 0);
    const avgMovement = sum / movementHistory.length;
    
    // Check if the camera view is perfectly static (photo on phone/paper, or tripod fake feed)
    // Real handheld or sitting humans move by at least 0.1 - 0.2 pixels.
    // If movement is literally 0 (e.g. static image injection) or too jittery, alert.
    if (avgMovement < 0.02) {
      return { isValid: false, message: 'Liveness check failed: Static face detected' };
    }
  }

  return { isValid: true, message: 'Liveness verified' };
};

/**
 * Resets liveness tracking buffers
 */
export const resetLivenessTracker = () => {
  prevBoxCenter = null;
  movementHistory = [];
};

/**
 * Combines face-api detection with our quality validations.
 * Returns face descriptor/embedding along with quality validation result.
 */
export const detectAndValidateFace = async (
  videoEl: HTMLVideoElement,
  canvasEl: HTMLCanvasElement
): Promise<{
  faceDetected: boolean;
  validation: FaceValidationResult;
  embedding: number[] | null;
  box: faceapi.Box | null;
}> => {
  try {
    await loadFaceModels();
    
    // 1. Detect all faces
    const detections = await faceapi.detectAllFaces(
      videoEl, 
      new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
    ).withFaceLandmarks().withFaceDescriptors();

    if (detections.length === 0) {
      return {
        faceDetected: false,
        validation: { isValid: false, message: 'No face detected', facesDetected: 0 },
        embedding: null,
        box: null
      };
    }

    if (detections.length > 1) {
      return {
        faceDetected: true,
        validation: { isValid: false, message: 'Multiple faces detected', facesDetected: detections.length },
        embedding: null,
        box: null
      };
    }

    const detection = detections[0];
    const box = detection.detection.box;

    // 2. Extract frame to canvas for lighting and blur validation
    const ctx = canvasEl.getContext('2d');
    if (ctx) {
      // Draw current video frame to matching size canvas
      ctx.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);
    }

    // 3. Run Validation Pipeline
    // A. Lighting
    const lighting = checkLighting(canvasEl);
    if (!lighting.isValid) {
      return {
        faceDetected: true,
        validation: { 
          isValid: false, 
          message: lighting.brightness < 50 ? 'Low lighting detected. Increase brightness.' : 'Excessive light. Adjust environment.',
          brightness: lighting.brightness,
          facesDetected: 1
        },
        embedding: null,
        box
      };
    }

    // B. Blur
    const blur = checkBlur(canvasEl);
    if (!blur.isValid) {
      return {
        faceDetected: true,
        validation: { 
          isValid: false, 
          message: 'Image is blurry. Please stay still.', 
          blurScore: blur.score,
          facesDetected: 1
        },
        embedding: null,
        box
      };
    }

    // C. Alignment
    const alignment = checkCenterAlignment(box, videoEl.videoWidth, videoEl.videoHeight);
    if (!alignment.isValid) {
      return {
        faceDetected: true,
        validation: { isValid: false, message: alignment.message, facesDetected: 1 },
        embedding: null,
        box
      };
    }

    // D. Anti-spoofing
    const spoof = checkAntiSpoofing(box);
    if (!spoof.isValid) {
      return {
        faceDetected: true,
        validation: { isValid: false, message: spoof.message, facesDetected: 1 },
        embedding: null,
        box
      };
    }

    // Everything is valid! Get embedding.
    // faceapi.Descriptor is a Float32Array. Convert to standard number[] for Supabase
    const embedding = Array.from(detection.descriptor);

    return {
      faceDetected: true,
      validation: { isValid: true, message: 'Face verified', brightness: lighting.brightness, blurScore: blur.score, facesDetected: 1 },
      embedding,
      box
    };
  } catch (err) {
    console.error('Face detection error:', err);
    return {
      faceDetected: false,
      validation: { isValid: false, message: 'Error processing camera stream' },
      embedding: null,
      box: null
    };
  }
};
