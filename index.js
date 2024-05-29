console.log("Script running...");

document.addEventListener("DOMContentLoaded", () => {
    const startBtn = document.getElementById("startBtn");
    const retryBtn = document.getElementById("retryBtn");
    const resultSection = document.getElementById("resultSection");
    const result = document.getElementById("result");
    const measurementList = document.getElementById("measurementList");
    const progressBar = document.getElementById("progressBar");
    const totalBeepCount = 5;

    let audioContext;
    let microphone;
    let mediaStream;
    let startTime;
    let beepTimes = [];
    const beepDelay = 10; // estimated delay before beep in milliseconds
    const beepFile = "short-beep-2.wav"; // Replace with the path to your sound file

    async function startDetection() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert("Your browser does not support audio recording.");
            return;
        }

        try {
            mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioContext = new (window.AudioContext || window.webkitAudioContext)();

            await audioContext.audioWorklet.addModule("worklet-processor.js");

            microphone = audioContext.createMediaStreamSource(mediaStream);
            const audioWorkletNode = new AudioWorkletNode(audioContext, "beep-detector-processor");

            audioWorkletNode.port.onmessage = (event) => {
                if (event.data === "beep" && startTime) {
                    const elapsedTime = performance.now() - startTime - beepDelay;
                    beepTimes.push(elapsedTime); // Calculate offset directly
                    startTime = null; // Reset the timer

                    updateProgressBar(beepTimes.length);

                    if (beepTimes.length === totalBeepCount) {
                        const averageTime = beepTimes.reduce((a, b) => a + b, 0) / totalBeepCount;
                        result.textContent = `Average detection time: ${averageTime.toFixed(2)} milliseconds`;
                        console.log(`Average detection time: ${averageTime.toFixed(2)} milliseconds`);
                        retryBtn.style.display = "block";
                        resultSection.style.display = "block";
                        beepTimes.forEach((time) => {
                            const timeTextElement = document.createElement("li");
                            timeTextElement.textContent = `${time.toFixed(2)}ms`;
                            measurementList.appendChild(timeTextElement);
                        });
                    }
                }
            };

            microphone.connect(audioWorkletNode).connect(audioContext.destination);

            startBtn.disabled = true;
            playBeep();

        } catch (err) {
            console.error("Error accessing media devices.", err);
        }
    }

    function stopDetection() {
        if (audioContext) {
            audioContext.close().then(() => {
                startBtn.disabled = false;
                retryBtn.style.display = "none";
                beepTimes = [];
                result.textContent = "";
                measurementList.innerHTML = "";
                resultSection.style.display = "none";
                updateProgressBar(0); // Reset progress bar
            });
        }
        if (mediaStream) {
            mediaStream.getTracks().forEach((track) => track.stop());
        }
    }

    function playBeep() {
        if (beepTimes.length < totalBeepCount) {
            setTimeout(() => {
                const audio = new Audio(beepFile);
                audio.play();
                startTime = performance.now();
                audio.onended = playBeep; // Continue playing the beep sound
            }, 500);
        }
    }

    function updateProgressBar(count) {
        const progress = (count / totalBeepCount) * 100;
        progressBar.style.width = `${progress}%`;
    }

    startBtn.addEventListener("click", startDetection);
    retryBtn.addEventListener("click", () => {
        stopDetection();
        startDetection();
    });
});


