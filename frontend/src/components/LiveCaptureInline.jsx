import { useEffect, useRef, useState } from "react";

const THRESHOLDS = {
    shoulderTilt:   8,
    hipTilt:        8,
    minVisibility:  0.70,
    };

    const STATUS = { LOADING: "loading", NO_PERSON: "no_person", ALIGNING: "aligning", READY: "ready" };

    const STATUS_COLOR = {
    loading:   "#9b9488",
    no_person: "#8a3030",
    aligning:  "#b8963e",
    ready:     "#3d7a5e",
    };

    const STATUS_LABEL = {
    loading:   "Starting camera…",
    no_person: "No person detected — step into frame",
    aligning:  "Adjusting position…",
    ready:     "Hold still — capturing",
    };

    export default function LiveCaptureInline({ onCapture, onCancel }) {
    const videoRef     = useRef(null);
    const canvasRef    = useRef(null);
    const poseRef      = useRef(null);
    const cameraRef    = useRef(null);

    const [status,    setStatus]    = useState(STATUS.LOADING);
    const [feedback,  setFeedback]  = useState([]);
    const [countdown, setCountdown] = useState(null);
    const [capturing, setCapturing] = useState(false);
    const capturedRef   = useRef(false);
    const countdownRef  = useRef(null);

    useEffect(() => {
        let mounted = true;

        const loadScript = (src) =>
        new Promise((res) => {
            if (document.querySelector(`script[src="${src}"]`)) return res();
            const s = document.createElement("script");
            s.src = src; s.crossOrigin = "anonymous";
            s.onload = res;
            document.head.appendChild(s);
        });

        const init = async () => {
        await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js");
        await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js");

        if (!mounted) return;

        const pose = new window.Pose({
            locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${f}`,
        });
        pose.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            enableSegmentation: false,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
        });
        pose.onResults(handleResults);
        poseRef.current = pose;

        const camera = new window.Camera(videoRef.current, {
            onFrame: async () => {
            if (poseRef.current) await poseRef.current.send({ image: videoRef.current });
            },
            width: 480, height: 640,
        });
        await camera.start();
        cameraRef.current = camera;
        };

        init().catch(console.error);
        return () => {
        mounted = false;
        clearTimeout(countdownRef.current);
        cameraRef.current?.stop?.();
        };
    }, []);

    const handleResults = (results) => {
        if (!results.poseLandmarks) {
        setStatus(STATUS.NO_PERSON);
        setFeedback([]);
        clearTimeout(countdownRef.current);
        setCountdown(null);
        return;
        }

        const lm = results.poseLandmarks;
        const issues = [];

        // Visibility check
        const keyLm = [11, 12, 23, 24, 27, 28];
        const lowVis = keyLm.filter(i => (lm[i]?.visibility ?? 0) < THRESHOLDS.minVisibility);
        if (lowVis.length > 0) issues.push("Make sure your full body is visible");

        // Shoulder tilt
        const shoulderDiff = Math.abs((lm[11]?.y ?? 0) - (lm[12]?.y ?? 0));
        if (shoulderDiff * 100 > THRESHOLDS.shoulderTilt) issues.push("Level your shoulders");

        // Hip tilt
        const hipDiff = Math.abs((lm[23]?.y ?? 0) - (lm[24]?.y ?? 0));
        if (hipDiff * 100 > THRESHOLDS.hipTilt) issues.push("Level your hips");

        setFeedback(issues);

        if (issues.length === 0 && !capturedRef.current) {
        setStatus(STATUS.READY);
        startCountdown();
        } else if (issues.length > 0) {
        setStatus(STATUS.ALIGNING);
        clearTimeout(countdownRef.current);
        setCountdown(null);
        }
    };

    const startCountdown = () => {
        if (countdownRef.current || capturedRef.current) return;
        setCountdown(3);

        const tick = (n) => {
        if (capturedRef.current) return;
        setCountdown(n);
        if (n === 0) {
            doCapture();
        } else {
            countdownRef.current = setTimeout(() => { countdownRef.current = null; tick(n - 1); }, 1000);
        }
        };
        countdownRef.current = setTimeout(() => { countdownRef.current = null; tick(2); }, 1000);
    };

    const doCapture = () => {
        if (capturedRef.current) return;
        capturedRef.current = true;
        setCapturing(true);
        setCountdown(null);

        const canvas = canvasRef.current;
        const video  = videoRef.current;
        if (!canvas || !video) return;

        canvas.width  = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0);

        canvas.toBlob(async (blob) => {
        cameraRef.current?.stop?.();
        const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
        setTimeout(() => {
            setCapturing(false);
            onCapture(file, URL.createObjectURL(blob));
        }, 400);
        }, "image/jpeg", 0.92);
    };

    const color = STATUS_COLOR[status];

    return (
        <div className="live-capture-wrap">
        {/* Camera viewport */}
        <div className="live-capture-video-box">
            <video ref={videoRef} className="live-capture-video" autoPlay muted playsInline />
            <canvas ref={canvasRef} style={{ display: "none" }} />
            <div className="live-capture-silhouette" />
            {countdown !== null && (
            <div className="live-capture-countdown">{countdown}</div>
            )}
            {capturing && <div className="live-capture-flash" />}
        </div>

        {/* Status bar */}
        <div className="live-capture-footer">
            <div className="live-capture-dot" style={{ background: color }} />
            <span className="live-capture-status" style={{ color }}>
            {STATUS_LABEL[status]}
            </span>
            <button
            onClick={onCancel}
            style={{
                background: "none", border: "1px solid rgba(255,255,255,0.15)",
                color: "rgba(255,255,255,0.4)", fontSize: "0.72rem",
                padding: "3px 10px", borderRadius: "3px", cursor: "pointer",
                fontFamily: "var(--font-body)",
            }}
            >
            Cancel
            </button>
        </div>

        {/* Feedback hints */}
        {feedback.length > 0 && (
            <div className="live-capture-feedback">
            {feedback.map((f, i) => (
                <div key={i} className="live-capture-hint">› {f}</div>
            ))}
            </div>
        )}
        </div>
    );
}