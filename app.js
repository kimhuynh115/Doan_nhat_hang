const FARE_ORDER = ["E1_ECO","A1_ECO","Z1_ECO","W1_ECO","U1_ECO","J1_ECO","I1_ECO","B1_ECO","H1_ECO","K1_ECO","L1_ECO","M1_ECO","N1_ECO","Q1_ECO","V1_ECO","R1_ECO","T1_ECO","Y1_ECO"];

const STORAGE_USERS = "vjFareUsers";
const STORAGE_CURRENT_USER = "vjFareCurrentUser";
const STORAGE_HISTORY = "vjFareHistory";

let currentUser = "";
let currentRole = "user";
let legAverage = {1:0, 2:0};
let legTotal = {1:0, 2:0};
let legRoute = {1:"", 2:""};
let legOCR = {1:"", 2:""};
let lastSavedSignature = "";

document.addEventListener("DOMContentLoaded", function(){
    initDefaultUsers();
    autoLoginIfNeeded();
    renderUsers();
    renderHistory();
});

function initDefaultUsers(){
    if(!localStorage.getItem(STORAGE_USERS)){
        localStorage.setItem(STORAGE_USERS, JSON.stringify([{username:"admin",password:"123456",role:"admin",active:true}]));
    }
}

function getUsers(){ return JSON.parse(localStorage.getItem(STORAGE_USERS) || "[]"); }
function setUsers(users){ localStorage.setItem(STORAGE_USERS, JSON.stringify(users)); }

function loginLocal(){
    const user = document.getElementById("username").value.trim();
    const pass = document.getElementById("password").value.trim();
    const found = getUsers().find(u => u.username === user && u.password === pass && u.active !== false);

    if(!found){
        document.getElementById("loginMessage").innerText = "Sai Username hoặc Password";
        return;
    }

    currentUser = found.username;
    currentRole = found.role || "user";
    localStorage.setItem(STORAGE_CURRENT_USER, JSON.stringify({username:currentUser,role:currentRole}));
    showApp();
}

function autoLoginIfNeeded(){
    const saved = localStorage.getItem(STORAGE_CURRENT_USER);
    if(!saved) return;

    try{
        const obj = JSON.parse(saved);
        const found = getUsers().find(u => u.username === obj.username && u.active !== false);
        if(found){
            currentUser = found.username;
            currentRole = found.role || "user";
            showApp();
        }
    }catch(e){}
}

function showApp(){
    document.getElementById("loginBox").style.display = "none";
    document.getElementById("appArea").style.display = "block";
    document.getElementById("currentUserLabel").innerText = `${currentUser} (${currentRole})`;
    document.getElementById("usersTabBtn").style.display = currentRole === "admin" ? "inline-block" : "none";
    showTab("ocrTab");
    renderUsers();
    renderHistory();
}

function logoutLocal(){
    localStorage.removeItem(STORAGE_CURRENT_USER);
    location.reload();
}

function showTab(tabId){
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.getElementById(tabId).classList.add("active");
    if(tabId === "historyTab") renderHistory();
    if(tabId === "usersTab") renderUsers();
}

function addUser(){
    if(currentRole !== "admin"){ alert("Only admin can add user."); return; }

    const username = document.getElementById("newUsername").value.trim();
    const password = document.getElementById("newPassword").value.trim();
    const role = document.getElementById("newRole").value;

    if(!username || !password){ alert("Input username and password."); return; }

    const users = getUsers();
    if(users.some(u => u.username === username)){ alert("User already exists."); return; }

    users.push({username,password,role,active:true});
    setUsers(users);

    document.getElementById("newUsername").value = "";
    document.getElementById("newPassword").value = "";
    renderUsers();
}

function deleteUser(username){
    if(currentRole !== "admin"){ alert("Only admin can delete user."); return; }
    if(username === currentUser){ alert("Cannot delete current login user."); return; }
    if(!confirm("Delete user " + username + "?")) return;

    setUsers(getUsers().filter(u => u.username !== username));
    renderUsers();
}

function toggleUser(username){
    if(currentRole !== "admin") return;

    const users = getUsers();
    const user = users.find(u => u.username === username);

    if(user) user.active = user.active === false ? true : false;

    setUsers(users);
    renderUsers();
}

function changePassword(){
    if(currentRole !== "admin"){ alert("Only admin can change password."); return; }

    const username = document.getElementById("changeUser").value.trim();
    const password = document.getElementById("changePassword").value.trim();

    if(!username || !password){ alert("Input username and new password."); return; }

    const users = getUsers();
    const user = users.find(u => u.username === username);

    if(!user){ alert("User not found."); return; }

    user.password = password;
    setUsers(users);

    document.getElementById("changeUser").value = "";
    document.getElementById("changePassword").value = "";

    alert("Password changed.");
    renderUsers();
}

function renderUsers(){
    const table = document.getElementById("usersTable");
    if(!table) return;

    let html = `<tr><th>Username</th><th>Role</th><th>Active</th><th>Action</th></tr>`;

    getUsers().forEach(u => {
        html += `<tr>
            <td>${escapeHtml(u.username)}</td>
            <td>${escapeHtml(u.role || "user")}</td>
            <td>${u.active === false ? "N" : "Y"}</td>
            <td>
                <button onclick="toggleUser('${escapeAttr(u.username)}')">${u.active === false ? "Enable" : "Disable"}</button>
                <button class="danger" onclick="deleteUser('${escapeAttr(u.username)}')">Delete</button>
            </td>
        </tr>`;
    });

    table.innerHTML = html;
}

function money(value){ return Math.round(value || 0).toLocaleString("vi-VN"); }

function parseMoney(value){
    return Number(String(value).replace(/,/g,"").replace(".00",""));
}

function normalizeLine(line){
    return line.replace(/\s+/g," ")
        .replace(/EY ECO/gi,"E1_ECO")
        .replace(/E¥ ECO/gi,"E1_ECO")
        .replace(/Wi_ECO/gi,"W1_ECO")
        .replace(/Wl_ECO/gi,"W1_ECO")
        .replace(/IA1_ECO/gi,"A1_ECO")
        .replace(/Z1_FCO/gi,"Z1_ECO")
        .replace(/L1_FCO/gi,"L1_ECO")
        .replace(/B1_EC0/gi,"B1_ECO")
        .replace(/H1_EC0/gi,"H1_ECO")
        .replace(/J1_EC0/gi,"J1_ECO")
        .replace(/I1_EC0/gi,"I1_ECO")
        .replace(/K1_EC0/gi,"K1_ECO")
        .replace(/L1_EC0/gi,"L1_ECO")
        .replace(/M1_EC0/gi,"M1_ECO")
        .replace(/N1_EC0/gi,"N1_ECO")
        .replace(/Q1_EC0/gi,"Q1_ECO")
        .replace(/l1_ECO/gi,"I1_ECO")
        .replace(/11_ECO/gi,"I1_ECO")
        .replace(/©/g,"0")
        .replace(/7\.,/g,"7,")
        .trim();
}

function extractRoute(text){
    const lines = text.split(/\n/);

    for(let line of lines){
        line = line.replace(/\s+/g," ").trim();

        if(/\d{1,2}:\d{2}/.test(line) && /[A-Z]{3}/.test(line)){
            return line.replace(/\s+0\.00\s*$/,"");
        }
    }

    return "Flight info not found";
}

function extractRows(text){
    const rows = [];
    const lines = text.split(/\n/);

    for(let line of lines){
        line = normalizeLine(line);

        const fareClassMatch = line.match(/\b[A-Z][0-9A-Z]?_ECO\b/i);
        if(!fareClassMatch) continue;

        const fareClass = fareClassMatch[0].toUpperCase();
        if(!FARE_ORDER.includes(fareClass)) continue;

        const fareMatch = line.match(/\d{1,3}(?:,\d{3})+\.00/);
        if(!fareMatch) continue;

        const fare = parseMoney(fareMatch[0]);
        const afterFare = line.substring(line.indexOf(fareMatch[0]) + fareMatch[0].length).trim();
        const availMatch = afterFare.match(/^(\d{1,3})\b/);

        if(!availMatch) continue;

        rows.push({fareClass,fare,availability:Number(availMatch[1])});
    }

    const clean = {};
    rows.forEach(r => clean[r.fareClass] = r);

    return Object.values(clean).sort((a,b) => a.fare - b.fare);
}

function calculateFromRows(rows, paxNeeded){
    let previousAvailability = 0;
    let remaining = paxNeeded;
    let total = 0;
    const detail = [];

    for(const row of rows){
        const bucketSeats = Math.max(0, row.availability - previousAvailability);
        previousAvailability = row.availability;

        const paxUsed = Math.min(remaining, bucketSeats);
        const amount = paxUsed * row.fare;

        detail.push({fareClass:row.fareClass,fare:row.fare,availability:row.availability,bucketSeats,paxUsed,amount});

        total += amount;
        remaining -= paxUsed;

        if(remaining <= 0) break;
    }

    const usedPax = paxNeeded - remaining;

    return {detail,average: usedPax > 0 ? total / usedPax : 0,total,usedPax,remaining};
}

function renderParsedTable(tableId, rows){
    let html = `<tr><th>Fare Class</th><th>Fare</th><th>Availability</th></tr>`;

    rows.forEach(r => {
        html += `<tr><td>${r.fareClass}</td><td>${money(r.fare)}</td><td>${r.availability}</td></tr>`;
    });

    document.getElementById(tableId).innerHTML = html;
}

function renderResult(tableId, summaryId, result, legNo){
    let html = `<tr><th>Fare Class</th><th>Fare</th><th>Avail</th><th>Bucket</th><th>Pax Used</th><th>Amount</th></tr>`;

    result.detail.forEach(r => {
        html += `<tr class="${r.paxUsed===0 ? "zero" : ""}">
            <td>${r.fareClass}</td><td>${money(r.fare)}</td><td>${r.availability}</td><td>${r.bucketSeats}</td><td>${r.paxUsed}</td><td>${money(r.amount)}</td>
        </tr>`;
    });

    html += `<tr><th>Total</th><th></th><th></th><th></th><th>${result.usedPax}</th><th>${money(result.total)}</th></tr>`;

    if(result.remaining > 0){
        html += `<tr><th colspan="6">Còn thiếu ${result.remaining} khách do không đủ availability.</th></tr>`;
    }

    document.getElementById(tableId).innerHTML = html;
    document.getElementById(summaryId).innerHTML = `<b>Average: ${money(result.average)} đ/pax</b>`;

    legAverage[legNo] = result.average;
    legTotal[legNo] = result.total;
    updateRoundTrip();
}

async function processLeg(legNo){
    const file = document.getElementById(`imageInput${legNo}`).files[0];

    if(!file){ alert(`Choose image ${legNo}`); return false; }

    const status = document.getElementById(`status${legNo}`);
    status.innerHTML = "OCR Processing...";

    const result = await Tesseract.recognize(file, "eng", {
        logger:m => {
            if(m.status && m.progress){
                status.innerText = `${m.status} ${Math.round(m.progress * 100)}%`;
            }
        }
    });

    const text = result.data.text;
    legOCR[legNo] = text;
    document.getElementById(`ocrPreview${legNo}`).innerText = text;

    const route = extractRoute(text);
    legRoute[legNo] = route;
    document.getElementById(`route${legNo}`).innerText = route;

    const rows = extractRows(text);
    renderParsedTable(`parsedTable${legNo}`, rows);

    const paxNeeded = Number(document.getElementById("paxInput").value);
    const calc = calculateFromRows(rows, paxNeeded);

    renderResult(`resultTable${legNo}`, `summary${legNo}`, calc, legNo);

    status.innerHTML = "Done";
    return true;
}

async function processBoth(){
    const ok1 = await processLeg(1);
    if(!ok1) return;

    const ok2 = await processLeg(2);
    if(!ok2) return;

    saveCurrentLog();
}

function updateRoundTrip(){
    if(legAverage[1] === 0 || legAverage[2] === 0) return;

    const pax = document.getElementById("paxInput").value;
    const ow = money(legAverage[1]);
    const rt = money(legAverage[2]);
    const roundTrip = money(legAverage[1] + legAverage[2]);

    document.getElementById("roundTripSummary").innerText =
`Flight:
${legRoute[1]}

${legRoute[2]}

Pax: ${pax}

OW Avg:
${ow}

RT Avg:
${rt}

Round Trip Avg:
${roundTrip}`;
}

function copyFinalResult(){
    navigator.clipboard.writeText(document.getElementById("roundTripSummary").innerText);
    alert("Copied");
}

function getHistory(){ return JSON.parse(localStorage.getItem(STORAGE_HISTORY) || "[]"); }
function setHistory(history){ localStorage.setItem(STORAGE_HISTORY, JSON.stringify(history)); }

function buildLogRecord(){
    const pax = document.getElementById("paxInput").value;

    return {
        id: Date.now(),
        datetime: new Date().toLocaleString("vi-VN"),
        user: currentUser,
        flight1: legRoute[1],
        flight2: legRoute[2],
        pax: Number(pax),
        owAvg: Math.round(legAverage[1]),
        rtAvg: Math.round(legAverage[2]),
        roundTripAvg: Math.round(legAverage[1] + legAverage[2]),
        ocrText1: legOCR[1],
        ocrText2: legOCR[2]
    };
}

function getLogSignature(record){
    return JSON.stringify({user:record.user,flight1:record.flight1,flight2:record.flight2,pax:record.pax,owAvg:record.owAvg,rtAvg:record.rtAvg,roundTripAvg:record.roundTripAvg});
}

function saveCurrentLog(){
    if(legAverage[1] === 0 || legAverage[2] === 0){
        alert("Chưa có đủ kết quả 2 chặng để lưu log.");
        return;
    }

    const record = buildLogRecord();
    const signature = getLogSignature(record);

    if(signature === lastSavedSignature) return;

    const history = getHistory();
    history.unshift(record);
    setHistory(history);
    lastSavedSignature = signature;
    renderHistory();
}

function renderHistory(){
    const table = document.getElementById("historyTable");
    if(!table) return;

    let html = `<tr><th>DateTime</th><th>User</th><th>Pax</th><th>Flight 1</th><th>Flight 2</th><th>OW Avg</th><th>RT Avg</th><th>Round Trip Avg</th><th>Action</th></tr>`;

    getHistory().forEach(r => {
        html += `<tr>
            <td>${escapeHtml(r.datetime)}</td>
            <td>${escapeHtml(r.user)}</td>
            <td>${r.pax}</td>
            <td>${escapeHtml(r.flight1)}</td>
            <td>${escapeHtml(r.flight2)}</td>
            <td>${money(r.owAvg)}</td>
            <td>${money(r.rtAvg)}</td>
            <td>${money(r.roundTripAvg)}</td>
            <td><button onclick="copyHistory(${r.id})">Copy</button><button class="danger" onclick="deleteHistory(${r.id})">Delete</button></td>
        </tr>`;
    });

    table.innerHTML = html;
}

function copyHistory(id){
    const record = getHistory().find(r => r.id === id);
    if(!record) return;

    const text =
`Flight:
${record.flight1}

${record.flight2}

Pax: ${record.pax}

OW Avg:
${money(record.owAvg)}

RT Avg:
${money(record.rtAvg)}

Round Trip Avg:
${money(record.roundTripAvg)}`;

    navigator.clipboard.writeText(text);
    alert("Copied history record.");
}

function deleteHistory(id){
    if(!confirm("Delete this history record?")) return;

    setHistory(getHistory().filter(r => r.id !== id));
    renderHistory();
}

function clearHistory(){
    if(!confirm("Clear all history?")) return;

    localStorage.removeItem(STORAGE_HISTORY);
    renderHistory();
}

function exportHistoryJSON(){
    const blob = new Blob([JSON.stringify(getHistory(), null, 2)], {type:"application/json"});
    downloadBlob(blob, "vj_fare_ocr_history.json");
}

function importHistoryJSONPrompt(){
    document.getElementById("historyImportFile").click();
}

function importHistoryJSON(event){
    const file = event.target.files[0];
    if(!file) return;

    const reader = new FileReader();

    reader.onload = function(e){
        try{
            const imported = JSON.parse(e.target.result);

            if(!Array.isArray(imported)){
                alert("Invalid JSON file.");
                return;
            }

            setHistory(imported.concat(getHistory()));
            renderHistory();
            alert("Imported.");
        }catch(err){
            alert("Cannot import JSON.");
        }
    };

    reader.readAsText(file);
}

function exportHistoryExcel(){
    const rows = getHistory().map(r => ({
        DateTime:r.datetime,
        User:r.user,
        Pax:r.pax,
        Flight1:r.flight1,
        Flight2:r.flight2,
        OW_Avg:r.owAvg,
        RT_Avg:r.rtAvg,
        RoundTrip_Avg:r.roundTripAvg,
        OCR_Text_1:r.ocrText1,
        OCR_Text_2:r.ocrText2
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Fare History");
    XLSX.writeFile(wb, "vj_fare_ocr_history.xlsx");
}

function downloadBlob(blob, filename){
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
}

function escapeHtml(value){
    return String(value ?? "")
        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;")
        .replace(/'/g,"&#039;");
}

function escapeAttr(value){
    return String(value ?? "")
        .replace(/\\/g,"\\\\")
        .replace(/'/g,"\\'");
}
