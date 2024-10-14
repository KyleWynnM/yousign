"use client";

import { useEffect, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import { Hands, HAND_CONNECTIONS } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";

export default function Lesson() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [detectedLetter, setDetectedLetter] = useState("No letter detected");
    const [isModelLoaded, setModelLoaded] = useState(false);
    let model: tf.LayersModel | null = null;

    const loadModel = async () => {
        try {
            model = await tf.loadLayersModel("/asl_letter_model/model.json");
            setModelLoaded(true);
            console.log("Model loaded successfully.");
        } catch (error) {
            console.error("Error loading model:", error);
        }
    };

    const calculateScaledRatios = (landmarks: any) => {
        const xs = landmarks.map((l: any) => l.x);
        const ys = landmarks.map((l: any) => l.y);
        const zs = landmarks.map((l: any) => l.z);
        const min_x = Math.min(...xs), max_x = Math.max(...xs);
        const min_y = Math.min(...ys), max_y = Math.max(...ys);
        const min_z = Math.min(...zs), max_z = Math.max(...zs);

        const scale_x = max_x - min_x;
        const scale_y = max_y - min_y;
        const scale_z = max_z - min_z;

        let ratios: number[] = [];
        for (let i = 0; i < landmarks.length; i++) {
            for (let j = i + 1; j < landmarks.length; j++) {
                ratios.push(
                    (landmarks[i].x - min_x) / scale_x,
                    (landmarks[i].y - min_y) / scale_y,
                    (landmarks[i].z - min_z) / scale_z
                );
            }
        }
        return ratios;
    };

    const predictGesture = async (landmarks: any) => {
        if (!model) {
            console.log("Model not loaded.");
            return;
        }
        const ratios = calculateScaledRatios(landmarks);
        const inputTensor = tf.tensor2d([ratios]);
        const prediction = await model.predict(inputTensor) as tf.Tensor;
        const predictionData = await prediction.data();
        const labels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
        const maxIndex = predictionData.indexOf(Math.max(...predictionData));
        setDetectedLetter(labels[maxIndex]);
        console.log("Detected Letter:", labels[maxIndex]);
    };

    useEffect(() => {
        const hands = new Hands({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });

        hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
        });

        const videoElement = videoRef.current!;
        const canvasElement = canvasRef.current!;
        const canvasCtx = canvasElement.getContext("2d")!;

        hands.onResults((results) => {
            canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
            if (results.multiHandLandmarks.length > 0) {
                const landmarks = results.multiHandLandmarks[0];

                drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: "#e598ff", lineWidth: 2 });
                drawLandmarks(canvasCtx, landmarks, { color: "#ca00ff", lineWidth: 1, radius: 2 });

                predictGesture(landmarks);
            } else {
                setDetectedLetter("No letter detected");
            }
        });

        const camera = new Camera(videoElement, {
            onFrame: async () => {
                await hands.send({ image: videoElement });
            },
            width: 640,
            height: 480,
        });

        camera.start();
        loadModel();
    }, []);

    return (
        <div style={{ position: "relative", width: "640px", height: "480px" }}>
            <h1>ASL Detection</h1>
            <p>Detected Letter: {detectedLetter}</p>
            <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    zIndex: 1,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                }}
            />
            <canvas
                ref={canvasRef}
                width={640}
                height={480}
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    zIndex: 2,
                }}
            />
        </div>
    );
}
