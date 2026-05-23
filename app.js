import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {

    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    onAuthStateChanged,
    signOut

}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {

    getDatabase,
    ref,
    push,
    onChildAdded,
    set,
    onValue,
    remove,
    update

}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

import {

    getStorage,
    ref as storageRef,
    uploadBytes,
    getDownloadURL

}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

/* FIREBASE */

const firebaseConfig = {

  apiKey: "AIzaSyBgbixws2rf6VdqjQATVwZsKg0lgiqy0xI",
  authDomain: "ordog-fizetes.firebaseapp.com",
  databaseURL: "https://ordog-fizetes-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "ordog-fizetes",
  storageBucket: "ordog-fizetes.firebasestorage.app",
  messagingSenderId: "672089263660",
  appId: "1:672089263660:web:3797a2fc935c63a0464b89"

};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getDatabase(app);

const storage = getStorage(app);

const provider = new GoogleAuthProvider();

/* USER */

let currentUser = null;

/* ELEMENTS */

const loginScreen = document.getElementById("loginScreen");

const appScreen = document.getElementById("app");

const loginBtn = document.getElementById("googleLogin");

const logoutBtn = document.getElementById("logoutBtn");

const sendBtn = document.getElementById("sendBtn");

const messageInput = document.getElementById("messageInput");

const messages = document.getElementById("messages");

const usersList = document.getElementById("usersList");

const typingDiv = document.getElementById("typing");

const imageInput = document.getElementById("imageInput");

/* LOGIN */

loginBtn.onclick = async ()=>{

    await signInWithPopup(auth, provider);

};

/* AUTH */

onAuthStateChanged(auth, (user)=>{

    if(user){

        currentUser = user;

        loginScreen.classList.add("hidden");

        appScreen.classList.remove("hidden");

        set(ref(db, "online/" + user.uid), {

            name:user.displayName,
            photo:user.photoURL

        });

    }else{

        loginScreen.classList.remove("hidden");

        appScreen.classList.add("hidden");

    }

});

/* LOGOUT */

logoutBtn.onclick = ()=>{

    signOut(auth);

};

/* SEND */

async function sendMessage(imageUrl = ""){

    const text = messageInput.value;

    if(text === "" && imageUrl === "") return;

    push(ref(db, "messages"), {

        uid:currentUser.uid,

        name:currentUser.displayName,

        photo:currentUser.photoURL,

        text:text,

        image:imageUrl,

        time:new Date().toLocaleTimeString()

    });

    messageInput.value = "";

    set(ref(db, "typing"), "");

}

/* BUTTON */

sendBtn.onclick = ()=>{

    sendMessage();

};

/* ENTER */

messageInput.addEventListener("keypress", (e)=>{

    if(e.key === "Enter"){

        sendMessage();

    }

});

/* TYPING */

messageInput.addEventListener("input", ()=>{

    if(currentUser){

        set(

            ref(db, "typing"),

            currentUser.displayName + " ír..."

        );

    }

});

onValue(ref(db, "typing"), (snapshot)=>{

    typingDiv.innerText = snapshot.val() || "";

});

/* EMOJI */

const emojis = [

    "😀",
    "😂",
    "🔥",
    "❤️",
    "😎",
    "👍"

];

document.getElementById("emojiBtn")
.onclick = ()=>{

    const random = emojis[
        Math.floor(Math.random()*emojis.length)
    ];

    messageInput.value += random;

};

/* IMAGE */

imageInput.addEventListener("change", async (e)=>{

    const file = e.target.files[0];

    if(!file) return;

    const imgRef = storageRef(

        storage,
        "images/" + Date.now()

    );

    await uploadBytes(imgRef, file);

    const url = await getDownloadURL(imgRef);

    sendMessage(url);

});

/* LOAD MESSAGES */

onChildAdded(ref(db, "messages"), (snapshot)=>{

    const data = snapshot.val();

    const div = document.createElement("div");

    div.className = "message";

    if(currentUser && data.uid === currentUser.uid){

        div.classList.add("me");

    }

    div.innerHTML = `

        <img
            class="avatar"
            src="${data.photo}"
        >

        <div class="content">

            <div class="username">
                ${data.name}
            </div>

            <div>
                ${data.text || ""}
            </div>

            ${
                data.image
                ?
                `<img class="msg-image" src="${data.image}">`
                :
                ""
            }

            <div class="time">
                ${data.time}
            </div>

            <div style="margin-top:10px;display:flex;gap:10px;">

                <button onclick="editMessage('${snapshot.key}')">
                    ✏️
                </button>

                <button onclick="deleteMessage('${snapshot.key}')">
                    🗑️
                </button>

            </div>

        </div>

    `;

    messages.appendChild(div);

    messages.scrollTop = messages.scrollHeight;

});

/* EDIT */

window.editMessage = function(id){

    const text = prompt("Új üzenet:");

    if(!text) return;

    update(ref(db, "messages/" + id), {

        text:text

    });

};

/* DELETE */

window.deleteMessage = function(id){

    remove(ref(db, "messages/" + id));

};

/* USERS */

onValue(ref(db, "online"), (snapshot)=>{

    usersList.innerHTML = "";

    const users = snapshot.val();

    for(let uid in users){

        const user = users[uid];

        usersList.innerHTML += `

            <div class="user">

                <img src="${user.photo}">

                <div>
                    ${user.name}
                </div>

            </div>

        `;

    }

});

/* NOTIFICATION */

Notification.requestPermission();

onChildAdded(ref(db, "messages"), (snapshot)=>{

    const data = snapshot.val();

    if(currentUser && data.uid !== currentUser.uid){

        new Notification(

            data.name,

            {

                body:data.text || "Kép küldve",

                icon:data.photo

            }

        );

    }

});

/* WEBRTC */

const servers = {

    iceServers:[

        {

            urls:["stun:stun.l.google.com:19302"]

        }

    ]

};

let peerConnection;

let localStream;

let remoteStream;

/* START CALL */

async function startCall(video = true){

    localStream =
    await navigator.mediaDevices.getUserMedia({

        video:video,
        audio:true

    });

    document.getElementById("localVideo")
    .srcObject = localStream;

    peerConnection =
    new RTCPeerConnection(servers);

    remoteStream = new MediaStream();

    document.getElementById("remoteVideo")
    .srcObject = remoteStream;

    localStream.getTracks()
    .forEach(track=>{

        peerConnection.addTrack(
            track,
            localStream
        );

    });

    peerConnection.ontrack = (event)=>{

        event.streams[0]
        .getTracks()
        .forEach(track=>{

            remoteStream.addTrack(track);

        });

    };

}

/* BUTTONS */

document.getElementById("voiceBtn")
.onclick = ()=>{

    startCall(false);

};

document.getElementById("videoBtn")
.onclick = ()=>{

    startCall(true);

};

document.getElementById("screenBtn")
.onclick = async ()=>{

    const screen =
    await navigator.mediaDevices
    .getDisplayMedia({

        video:true

    });

    document.getElementById("localVideo")
    .srcObject = screen;

};
