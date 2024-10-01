const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const startCallButton = document.getElementById('startCall');
const endCallButton = document.getElementById('endCall');

let localStream;
let peerConnection;

const servers = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
    ]
};

async function startCall() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideo.srcObject = localStream;

        peerConnection = new RTCPeerConnection(servers);

        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });

        peerConnection.ontrack = event => {
            remoteVideo.srcObject = event.streams[0];
        };

        peerConnection.onicecandidate = event => {
            if (event.candidate) {
                localStorage.setItem('remoteCandidate', JSON.stringify(event.candidate));
            }
        };

        // Ожидание предложения от первого браузера
        waitForOffer();

    } catch (error) {
        console.error('Ошибка при начале звонка:', error);
    }
}

function endCall() {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
    if (peerConnection) {
        peerConnection.close();
    }
    localVideo.srcObject = null;
    remoteVideo.srcObject = null;
}

function waitForOffer() {
    const interval = setInterval(() => {
        const localDescription = localStorage.getItem('localDescription');
        const localCandidate = localStorage.getItem('localCandidate');

        if (localDescription) {
            clearInterval(interval);
            const offer = JSON.parse(localDescription);
            peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

            createAnswer();

            if (localCandidate) {
                const candidate = JSON.parse(localCandidate);
                peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            }
        }
    }, 1000);
}

async function createAnswer() {
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    localStorage.setItem('remoteDescription', JSON.stringify(answer));
}

startCallButton.addEventListener('click', startCall);
endCallButton.addEventListener('click', endCall);