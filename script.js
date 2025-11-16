// Start webcam
const video = document.getElementById("camera");

navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
        video.srcObject = stream;
    })
    .catch(err => {
        alert("Camera access denied!");
        console.error(err);
    });

// Fake AI recognition for demo
function fakeSignRecognition() {
    const signs = ["Hello", "Thank You", "I Love You", "Yes", "No"];
    return signs[Math.floor(Math.random() * signs.length)];
}

// Convert text to speech
function speak(text) {
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1;
    utter.pitch = 1;
    speechSynthesis.speak(utter);
}

document.getElementById("captureBtn").addEventListener("click", () => {
    const detected = fakeSignRecognition();
    
    document.getElementById("detectedText").innerText = detected;
    
    speak(detected);
});
