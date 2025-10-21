const API = "https://realtime-dashboard-6ehp.onrender.com"; // change this after backend deploy
let currentUser = null;

function showRegister(){document.getElementById("loginForm").style.display="none";document.getElementById("registerForm").style.display="block";}
function showLogin(){document.getElementById("loginForm").style.display="block";document.getElementById("registerForm").style.display="none";}

async function login(){
  const user=document.getElementById("username").value;
  const pass=document.getElementById("password").value;
  const res=await fetch(`${API}/login`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:user,password:pass})});
  const data=await res.json();
  if(!res.ok)return alert(data.error);
  currentUser=data;
  document.getElementById("loginForm").style.display="none";
  document.getElementById("dashboard").style.display="block";
  document.getElementById("welcomeText").innerText=`Welcome ${data.username}`;
  if(data.role==="admin")document.getElementById("adminTabBtn").style.display="block";
  renderWallet();renderCombat();if(data.role==="admin")renderUsers();
  showTab("walletTab");
}

async function register(){
  const user=document.getElementById("regUsername").value;
  const pass=document.getElementById("regPassword").value;
  const res=await fetch(`${API}/register`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:user,password:pass})});
  const data=await res.json();
  if(!res.ok)return alert(data.error);
  alert("Registered! Please login.");showLogin();
}

function logout(){location.reload();}

function showTab(id){document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));document.getElementById(id).classList.add("active");}

// --- Wallet ---
async function renderWallet(){
  const res=await fetch(`${API}/wallets`);
  const wallets=await res.json();
  const tbody=document.getElementById("walletBody");
  tbody.innerHTML=wallets.map(w=>`
    <tr><td>${w.name}</td><td>${w.wallet}</td><td>${w.addedBy}</td>
    <td>${currentUser.role==="admin"?`<button onclick="editWallet('${w._id}')">Edit</button><button onclick="deleteWallet('${w._id}')">Delete</button>`:""}</td></tr>
  `).join("");
}
async function addWallet(){
  const name=document.getElementById("walletName").value;
  const wallet=document.getElementById("walletAddress").value;
  if(!name||!wallet)return alert("Fill all fields");
  await fetch(`${API}/wallets`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,wallet,addedBy:currentUser.username})});
  renderWallet();
}
async function editWallet(id){
  const newName=prompt("New name:");const newWallet=prompt("New wallet:");
  if(newName&&newWallet)await fetch(`${API}/wallets/${id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:newName,wallet:newWallet})});
  renderWallet();
}
async function deleteWallet(id){if(confirm("Delete?")){await fetch(`${API}/wallets/${id}`,{method:"DELETE"});renderWallet();}}

// --- Combat ---
async function renderCombat(){
  const res=await fetch(`${API}/combats`);
  const combats=await res.json();
  const tbody=document.getElementById("combatBody");
  tbody.innerHTML=combats.map(c=>`
    <tr><td>${c.name}</td><td><img src="${c.image}"></td><td>${c.power}</td><td>${c.addedBy}</td>
    <td>${currentUser.role==="admin"?`<button onclick="editCombat('${c._id}')">Edit</button><button onclick="deleteCombat('${c._id}')">Delete</button>`:""}</td></tr>
  `).join("");
}
async function addCombat(){
  const name=document.getElementById("combatName").value;
  const file=document.getElementById("combatImage").files[0];
  if(!name||!file)return alert("Fill all fields");
  const reader=new FileReader();
  reader.onload=async e=>{
    const img=e.target.result;
    const {data:{text}}=await Tesseract.recognize(img,"eng");
    const match=text.match(/Combat\s*Power\s*([\d,]+)/i);
    const power=match?match[1].replace(/,/g,""):"0";
    await fetch(`${API}/combats`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,image:img,power,addedBy:currentUser.username})});
    alert(`Detected Combat Power: ${power}`);renderCombat();
  };
  reader.readAsDataURL(file);
}
async function editCombat(id){
  const newName=prompt("New name:");const newPower=prompt("New power:");
  if(newName&&newPower)await fetch(`${API}/combats/${id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:newName,power:newPower})});
  renderCombat();
}
async function deleteCombat(id){if(confirm("Delete?")){await fetch(`${API}/combats/${id}`,{method:"DELETE"});renderCombat();}}

// --- Admin Users ---
async function renderUsers(){
  const res=await fetch(`${API}/users`);
  const users=await res.json();
  const tbody=document.getElementById("userBody");
  tbody.innerHTML=users.map(u=>`
    <tr><td>${u.username}</td><td>${u.password}</td><td>${u.role}</td>
    <td><button onclick="editUser('${u._id}')">Edit</button><button onclick="deleteUser('${u._id}')">Delete</button></td></tr>
  `).join("");
}
async function editUser(id){
  const newPass=prompt("New password:");
  if(newPass)await fetch(`${API}/users/${id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({password:newPass})});
  renderUsers();
}
async function deleteUser(id){if(confirm("Delete user?")){await fetch(`${API}/users/${id}`,{method:"DELETE"});renderUsers();}}

// --- Auto Refresh ---
setInterval(()=>{if(currentUser){renderWallet();renderCombat();if(currentUser.role==="admin")renderUsers();}},5000);
