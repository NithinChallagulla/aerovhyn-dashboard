// main.js
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

const muteToggle = document.getElementById('muteToggle');
const volumeSlider = document.getElementById('volumeSlider');
const audioInput = document.getElementById('audioInput');
const audioOutput = document.getElementById('audioOutput');
const videoInput = document.getElementById('videoInput');

const webcamStatus = document.getElementById('webcamStatus');
const remoteStatus = document.getElementById('remoteStatus');

async function listMediaDevices() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  audioInput.innerHTML = '';
  audioOutput.innerHTML = '';
  videoInput.innerHTML = '';

  devices.forEach(device => {
    const option = document.createElement('option');
    option.value = device.deviceId;
    option.text = device.label || `${device.kind}`;

    if (device.kind === 'audioinput') audioInput.appendChild(option);
    if (device.kind === 'audiooutput') audioOutput.appendChild(option);
    if (device.kind === 'videoinput') videoInput.appendChild(option);
  });
}

webcamButton.onclick = async () => {
  await listMediaDevices();

  const constraints = {
    video: { deviceId: videoInput.value ? { exact: videoInput.value } : undefined },
    audio: { deviceId: audioInput.value ? { exact: audioInput.value } : undefined },
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
  webcamStatus.textContent = 'Webcam: ✅';

  muteToggle.onchange = () => {
    localStream.getAudioTracks().forEach(track => track.enabled = !muteToggle.checked);
  };
  volumeSlider.oninput = () => remoteVideo.volume = volumeSlider.value;
};

callButton.onclick = async () => {
  const callDoc = firestore.collection('calls').doc();
  const offerCandidates = callDoc.collection('offerCandidates');
  const answerCandidates = callDoc.collection('answerCandidates');

  callInput.value = callDoc.id;

  pc.onicecandidate = event => {
    if (event.candidate) offerCandidates.add(event.candidate.toJSON());
  };

  const offerDescription = await pc.createOffer();
  await pc.setLocalDescription(offerDescription);

  await callDoc.set({ offer: { type: offerDescription.type, sdp: offerDescription.sdp } });

  callDoc.onSnapshot(snapshot => {
    const data = snapshot.data();
    if (!pc.currentRemoteDescription && data?.answer) {
      pc.setRemoteDescription(new RTCSessionDescription(data.answer));
      remoteStatus.textContent = 'Remote: ✅';
    }
  });

  answerCandidates.onSnapshot(snapshot => {
    snapshot.docChanges().forEach(change => {
      if (change.type === 'added') pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
    });
  });

  hangupButton.disabled = false;
};

answerButton.onclick = async () => {
  const callId = callInput.value;
  const callDoc = firestore.collection('calls').doc(callId);
  const answerCandidates = callDoc.collection('answerCandidates');
  const offerCandidates = callDoc.collection('offerCandidates');

  pc.onicecandidate = event => {
    if (event.candidate) answerCandidates.add(event.candidate.toJSON());
  };

  const callData = (await callDoc.get()).data();
  await pc.setRemoteDescription(new RTCSessionDescription(callData.offer));

  const answerDescription = await pc.createAnswer();
  await pc.setLocalDescription(answerDescription);

  await callDoc.update({ answer: { type: answerDescription.type, sdp: answerDescription.sdp } });

  offerCandidates.onSnapshot(snapshot => {
    snapshot.docChanges().forEach(change => {
      if (change.type === 'added') pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
    });
  });
  remoteStatus.textContent = 'Remote: ✅';
};
