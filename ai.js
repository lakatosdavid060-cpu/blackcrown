async function sendMessage(){

const input = document.getElementById("input");
const chat = document.getElementById("chat");

const userText = input.value;

if(!userText) return;

chat.innerHTML += `<div class="user">${userText}</div>`;

input.value="";

try{

const res = await fetch("https://api.groq.com/openai/v1/chat/completions",{
method:"POST",
headers:{
"Content-Type":"application/json",
"Authorization":"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"
},
body:JSON.stringify({
model:"llama3-70b-8192",
messages:[
{role:"user",content:userText}
]
})
});

const data = await res.json();

const reply = data.choices[0].message.content;

chat.innerHTML += `<div class="ai">${reply}</div>`;

}catch(e){

chat.innerHTML += `<div class="ai">Hiba történt.</div>`;

}

}
