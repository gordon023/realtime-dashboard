const API_URL = "https://realtime-dashboard-qlut.onrender.com"; // change after deploy
let currentUser = null;

// --- Login/Register ---
async function login() {
  const user = document.getElementById("username").value;
  const pass = document.getElementById("password").value;
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: user, password: pass })
  });
  const data = await res.json();
  if (!res.ok) return alert(data.error);
  currentUser = data;
  document.getElementById("loginForm").style.display = "none";
  document.getElementById("dashboard").style.display = "block";
  document.getElementById("welcomeText").innerText = `Welcome ${currentUser.username}`;
  if (currentUser.role === "admin") document.getElementById("adminTabBtn").style.display = "block";
  renderWalletTable();
  renderCombatTable();
  showTab("walletTab");
}

async function register() {
  const user = document.getElementById("regUsername").value;
  const pass = document.getElementById("regPassword").value;
  const res = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: user, password: pass })
  });
  const data = await res.json();
  if (!res.ok) return alert(data.error);
  alert("Registered! Please login.");
  showLogin();
}

function showRegister() {
  document.getElementById("loginForm").style.display = "none";
  document.getElementById("registerForm").style.display = "block";
}
function showLogin() {
  document.getElementById("loginForm").style.display = "block";
  document.getElementById("registerForm").style.display = "none";
}
function showTab(tabId) {
  document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
  document.getElementById(tabId).classList.add("active");
}

// --- Wallet ---
async function renderWalletTable() {
  const res = await fetch(`${API_URL}/wallets`);
  const wallets = await res.json();
  const tbody = document.querySelector("#walletTable tbody");
  tbody.innerHTML = wallets
    .map(
      (w) => `
    <tr>
      <td>${w.name}</td>
      <td>${w.wallet}</td>
      <td>${w.addedBy}</td>
      <td>${
        currentUser.role === "admin"
          ? `<button onclick="deleteWallet('${w._id}')">Delete</button>`
          : ""
      }</td>
    </tr>`
    )
    .join("");
}

async function addWallet() {
  const name = document.getElementById("walletName").value;
  const wallet = document.getElementById("walletAddress").value;
  if (!name || !wallet) return alert("Fill all fields");
  await fetch(`${API_URL}/wallets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, wallet, addedBy: currentUser.username })
  });
  renderWalletTable();
}

async function deleteWallet(id) {
  if (!confirm("Delete this wallet?")) return;
  await fetch(`${API_URL}/wallets/${id}`, { method: "DELETE" });
  renderWalletTable();
}

// --- Combat (OCR with Tesseract) ---
async function renderCombatTable() {
  const res = await fetch(`${API_URL}/combats`);
  const combats = await res.json();
  const tbody = document.querySelector("#combatTable tbody");
  tbody.innerHTML = combats
    .map(
      (c) => `
    <tr>
      <td>${c.name}</td>
      <td><img src="${c.image}" alt="combat"></td>
      <td>${c.power}</td>
      <td>${c.addedBy}</td>
      <td>${
        currentUser.role === "admin"
          ? `<button onclick="deleteCombat('${c._id}')">Delete</button>`
          : ""
      }</td>
    </tr>`
    )
    .join("");
}

async function addCombat() {
  const name = document.getElementById("combatName").value;
  const imgFile = document.getElementById("combatImage").files[0];
  if (!name || !imgFile) return alert("Fill all fields");

  const reader = new FileReader();
  reader.onload = async function (e) {
    const imgData = e.target.result;
    const { data: { text } } = await Tesseract.recognize(imgData, "eng");
    const match = text.match(/Combat\s*Power\s*([\d,]+)/i);
    const detectedPower = match ? match[1].replace(/,/g, "") : "0";

    await fetch(`${API_URL}/combats`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        image: imgData,
        power: detectedPower,
        addedBy: currentUser.username
      })
    });
    renderCombatTable();
    alert(`Detected Combat Power: ${detectedPower}`);
  };
  reader.readAsDataURL(imgFile);
}

async function deleteCombat(id) {
  if (!confirm("Delete this combat?")) return;
  await fetch(`${API_URL}/combats/${id}`, { method: "DELETE" });
  renderCombatTable();
}

// --- Auto-refresh every 5s ---
setInterval(renderWalletTable, 5000);
setInterval(renderCombatTable, 5000);
