import { useEffect, useRef, useState } from 'react';

export default function FaceMeshViewer({ onBaselineCapture, baselinePositions }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const faceMeshRef = useRef(null);
  const cameraRef = useRef(null);
  const latestResultsRef = useRef(null);
  
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const initMediaPipe = async () => {
      try {
        const { FaceMesh } = await import('@mediapipe/face_mesh');
        const { Camera } = await import('@mediapipe/camera_utils');

        const faceMeshInstance = new FaceMesh({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
          }
        });

        faceMeshInstance.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        faceMeshInstance.onResults((results) => {
          latestResultsRef.current = results;
          drawResults(results);
        });

        if (mounted) {
          faceMeshRef.current = faceMeshInstance;
        }
      } catch (err) {
        console.error('Failed to load MediaPipe:', err);
        if (mounted) {
          setError('Failed to load face tracking. Please refresh the page.');
        }
      }
    };

    const drawResults = (results) => {
      if (!canvasRef.current || !videoRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const video = videoRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      if (results.multiFaceLandmarks && results.multiFaceLandmarks[0]) {
        const landmarks = results.multiFaceLandmarks[0];
        
        // Draw landmarks
        ctx.fillStyle = '#00ff00';
        for (const landmark of landmarks) {
          ctx.beginPath();
          ctx.arc(landmark.x * canvas.width, landmark.y * canvas.height, 2, 0, 2 * Math.PI);
          ctx.fill();
        }

        // Draw connections
        ctx.strokeStyle = '#00ff0088';
        ctx.lineWidth = 1;
        
        // Import FACEMESH_TESSELATION dynamically
        import('@mediapipe/face_mesh').then(({ FACEMESH_TESSELATION }) => {
          for (const connection of FACEMESH_TESSELATION) {
            const start = landmarks[connection[0]];
            const end = landmarks[connection[1]];
            ctx.beginPath();
            ctx.moveTo(start.x * canvas.width, start.y * canvas.height);
            ctx.lineTo(end.x * canvas.width, end.y * canvas.height);
            ctx.stroke();
          }
        });
      }

      ctx.restore();
    };

    initMediaPipe();

    return () => {
      mounted = false;
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraReady(true);

        if (faceMeshRef.current) {
          const { Camera } = await import('@mediapipe/camera_utils');
          const camera = new Camera(videoRef.current, {
            onFrame: async () => {
              if (faceMeshRef.current && videoRef.current) {
                await faceMeshRef.current.send({ image: videoRef.current });
              }
            },
            width: 640,
            height: 480
          });
          camera.start();
          cameraRef.current = camera;
        }
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Camera access denied. Please allow camera permissions.');
    }
  };

  const captureBaseline = () => {
    const results = latestResultsRef.current;
    
    if (!results || !results.multiFaceLandmarks || !results.multiFaceLandmarks[0]) {
      alert('No face detected. Please ensure your face is visible in the camera.');
      return;
    }

    const landmarks = results.multiFaceLandmarks[0];
    const positions = new Float32Array(468 * 3);
    
    // Convert normalized coordinates to 3D positions
    for (let i = 0; i < landmarks.length; i++) {
      const landmark = landmarks[i];
      // Center and scale the face
      positions[i * 3] = (landmark.x - 0.5) * 2;      // X: -1 to 1
      positions[i * 3 + 1] = (0.5 - landmark.y) * 2;  // Y: -1 to 1 (flip)
      positions[i * 3 + 2] = landmark.z * 2;          // Z: scaled depth
    }

    onBaselineCapture(positions);
    alert('Baseline captured! You can now edit the mesh with the controls.');
  };

  return (
    <div className="facemesh-viewer">
      <div className="viewer-header">
        <h3>Camera Feed</h3>
        {!cameraReady && !error && (
          <button className="btn-primary" onClick={startCamera}>
            Start Camera
          </button>
        )}
        {cameraReady && !baselinePositions && (
          <button className="btn-primary" onClick={captureBaseline}>
            Capture Neutral Face
          </button>
        )}
        {baselinePositions && (
          <span className="status-text">✓ Baseline captured</span>
        )}
      </div>

      {error && (
        <div className="error-box">
          <p>{error}</p>
          <button className="btn-secondary" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}

      <div className="video-container">
        <video ref={videoRef} style={{ display: 'none' }} />
        <canvas ref={canvasRef} />
      </div>

      {!cameraReady && !error && (
        <div className="placeholder">
          <p>📷</p>
          <p>Click "Start Camera" to begin</p>
        </div>
      )}

      <style jsx>{`
        .facemesh-viewer {
          height: 100%;
          display: flex;
          flex-direction: column;
          padding: 10px;
        }

        .viewer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
          padding-bottom: 5px;
          border-bottom: 1px solid var(--border-dark);
        }

        .viewer-header h3 {
          margin: 0;
          font-size: 12px;
        }

        .status-text {
          color: var(--success-green);
          font-size: 11px;
          font-weight: bold;
        }

        .error-box {
          background: #ffcccc;
          border: 2px solid var(--error-red);
          padding: 10px;
          margin-bottom: 10px;
        }

        .video-container {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #000;
          position: relative;
        }

        .video-container canvas {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        .placeholder {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
        }

        .placeholder p:first-child {
          font-size: 48px;
          margin-bottom: 10px;
        }
      `}</style>
    </div>
  );
}