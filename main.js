// Updated main.js with advanced video chat controls and status panel
const firebaseConfig = {
  apiKey: "AIzaSyDooJlQCfk104yS4XzOj1bgpVEoOB8rTnQ",
  authDomain: "webrtc-demo-33437.firebaseapp.com",
  projectId: "webrtc-demo-33437",
  storageBucket: "webrtc-demo-33437.appspot.com",
  messagingSenderId: "99021841417",
  appId: "1:99021841417:web:510b0562a0d20c437ec4d8",
  measurementId: "G-H2KFF0EHS0"
};

firebase.initializeApp(firebaseConfig);
const firestore = firebase.firestore();

const servers = {
  iceServers: [{ urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] }],
  iceCandidatePoolSize: 10,
};

const pc = new RTCPeerConnection(servers);
let localStream = null;
let remoteStream = null;

const webcamButton = document.getElementById('webcamButton');
const webcamVideo = document.getElementById('webcamVideo');
const callButton = document.getElementById('callButton');
const callInput = document.getElementById('callInput');
const answerButton = document.getElementById('answerButton');
const remoteVideo = document.getElementById('remoteVideo');
const hangupButton = document.getElementById('hangupButton');
const muteButton = document.getElementById('muteButton');
const volumeSlider = document.getElementById('volumeSlider');
const audioSelect = document.getElementById('audioSelect');
const videoSelect = document.getElementById('videoSelect');
const speakerSelect = document.getElementById('speakerSelect');
const statusPanel = document.getElementById('statusPanel');

let isMuted = false;

webcamButton.onclick = async () => {
  const audioSource = audioSelect.value;
  const videoSource = videoSelect.value;

  const constraints = {
    video: { deviceId: videoSource ? { exact: videoSource } : undefined },
    audio: { deviceId: audioSource ? { exact: audioSource } : undefined },
  };

  localStream = await navigator.mediaDevices.getUserMedia(constraints);
  remoteStream = new MediaStream();

  localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

  pc.ontrack = event => {
    event.streams[0].getTracks().forEach(track => remoteStream.addTrack(track));
  };

  webcamVideo.srcObject = localStream;
  remoteVideo.srcObject = remoteStream;

  callButton.disabled = false;
  answerButton.disabled = false;
  webcamButton.disabled = true;

  updateStatus();
};

callButton.onclick = async () => {
  const callDoc = firestore.collection('calls').doc();
  const offerCandidates = callDoc.collection('offerCandidates');
  const answerCandidates = callDoc.collection('answerCandidates');
  callInput.value = callDoc.id;

  pc.onicecandidate = event => {
    if (event.candidate) {
      offerCandidates.add(event.candidate.toJSON());
    }
  };

  const offerDescription = await pc.createOffer();
  await pc.setLocalDescription(offerDescription);

  await callDoc.set({ offer: { type: offerDescription.type, sdp: offerDescription.sdp } });

  callDoc.onSnapshot(snapshot => {
    const data = snapshot.data();
    if (!pc.currentRemoteDescription && data?.answer) {
      pc.setRemoteDescription(new RTCSessionDescription(data.answer));
    }
  });

  answerCandidates.onSnapshot(snapshot => {
    snapshot.docChanges().forEach(change => {
      if (change.type === 'added') {
        pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
      }
    });
  });

  hangupButton.disabled = false;
  updateStatus();
};

answerButton.onclick = async () => {
  const callId = callInput.value;
  const callDoc = firestore.collection('calls').doc(callId);
  const answerCandidates = callDoc.collection('answerCandidates');
  const offerCandidates = callDoc.collection('offerCandidates');

  pc.onicecandidate = event => {
    if (event.candidate) {
      answerCandidates.add(event.candidate.toJSON());
    }
  };

  const callData = (await callDoc.get()).data();
  await pc.setRemoteDescription(new RTCSessionDescription(callData.offer));

  const answerDescription = await pc.createAnswer();
  await pc.setLocalDescription(answerDescription);

  await callDoc.update({ answer: { type: answerDescription.type, sdp: answerDescription.sdp } });

  offerCandidates.onSnapshot(snapshot => {
    snapshot.docChanges().forEach(change => {
      if (change.type === 'added') {
        pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
      }
    });
  });

  updateStatus();
};

hangupButton.onclick = () => {
  pc.close();
  localStream.getTracks().forEach(track => track.stop());
  webcamVideo.srcObject = null;
  remoteVideo.srcObject = null;
  callInput.value = '';
  webcamButton.disabled = false;
  callButton.disabled = true;
  answerButton.disabled = true;
  hangupButton.disabled = true;
  updateStatus('Disconnected');
};

muteButton.onclick = () => {
  isMuted = !isMuted;
  localStream.getAudioTracks()[0].enabled = !isMuted;
  muteButton.innerText = isMuted ? '🔇 Unmute' : '🔊 Mute';
};

volumeSlider.oninput = () => {
  remoteVideo.volume = volumeSlider.value;
};

navigator.mediaDevices.enumerateDevices().then(devices => {
  devices.forEach(device => {
    const option = document.createElement('option');
    option.value = device.deviceId;
    option.text = device.label || device.kind;

    if (device.kind === 'audioinput') audioSelect.appendChild(option);
    else if (device.kind === 'videoinput') videoSelect.appendChild(option);
    else if (device.kind === 'audiooutput') speakerSelect.appendChild(option);
  });
});

function updateStatus(msg = 'Connected') {
  statusPanel.innerText = `${msg} | Local: ${localStream ? '🟢' : '🔴'} | Remote: ${remoteVideo.srcObject ? '🟢' : '🔴'}`;
}

// Optional: handle device change
navigator.mediaDevices.ondevicechange = () => {
  console.log("Device change detected. You may need to refresh device list.");
};
