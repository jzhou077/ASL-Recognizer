import { FilesetResolver, GestureRecognizer } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/vision_bundle.js";

const video = document.getElementById("webcam");
const webcamButton = document.getElementById("webcam-button");
const canvasElement = document.getElementById("output_canvas");
const canvasCtx = canvasElement.getContext("2d");
const gestureOutput = document.getElementById("gesture_output");
const videoHeight = "360px";
const videoWidth = "480px";

let webcamRunning = false;

let gestureRecognizer = null;
let vision = null;

function getUserMediaSupported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

function enableCam(event) {
    if (!gestureRecognizer) {
        alert("Gesture recognizer loading");
        return;
    }
    const constraints = {
        video: true
    };

    if (webcamRunning === true) {
        webcamRunning = false;
    }
    else {
        webcamRunning = true;
    }

    if (webcamRunning === true) {
        navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
            video.srcObject = stream;
            video.addEventListener('loadeddata', predictWebcam);
        });
    } else {
        video.srcObject = null;
    }
}

async function buildTask() {
    // Create task for image file processing:
    vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );
    gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
        baseOptions: {
        modelAssetPath: "ASL_Recognizer.task"
        },
        numHands: 1
    });
}

async function predictWebcam() {
    await gestureRecognizer.setOptions({ runningMode: "video" });
    let nowInMs = Date.now();
    const results = gestureRecognizer.recognizeForVideo(video, nowInMs);

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    video.style.height = videoHeight;
    canvasElement.style.height = videoHeight;
    video.style.width = videoWidth;
    canvasElement.style.width = videoWidth;

    if (results.landmarks) {
        for (const landmarks of results.landmarks) {
            drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
                color: "#00ff00",
                lineWidth: 5
            });
            drawLandmarks(canvasCtx, landmarks, {color: "#ff0000", lineWidth: 2});
        }
    }
    canvasCtx.restore();
    if (results.gestures.length > 0) {
        gestureOutput.style.display = "block";
        gestureOutput.style.width = video.videoWidth;
        gestureOutput.innerText = "GestureRecognizer: " + results.gestures[0][0].categoryName + "\n Confidence: " + Math.round(parseFloat(results.gestures[0][0].score) * 100) + "%";
    }
    else {
        gestureOutput.style.display = "none";
    }

    if (webcamRunning === true) {
        window.requestAnimationFrame(predictWebcam);
    }

}

$(document).ready(function() {

    if (getUserMediaSupported()) {
        webcamButton.addEventListener('click', enableCam);
    }
    else {
        console.warn('getUserMedia() is not supported by browser');
    }

    buildTask();
})
