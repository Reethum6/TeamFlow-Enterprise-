const API_URL = "http://127.0.0.1:8000";

// --- 🔔 Toast Popup Controller Function ---
function showToastAlert(message) {
    const container = document.getElementById("toast-container");
    if (!container) return;
    
    const toast = document.createElement("div");
    toast.className = "toast-notification";
    toast.innerText = `⚙️ SYSTEM // ${message}`;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.transform = "translateX(120%)";
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// --- ↔️ Sidebar Sliding Function Toggle ---
function toggleSidebar() {
    const forms = document.querySelector('.sidebar-forms');
    const grid = document.querySelector('.workspace-grid');
    if (forms && grid) {
        forms.classList.toggle('collapsed');
        grid.classList.toggle('expanded');
        showToastAlert("Workspace pipeline dimensions modified.");
    }
}

function checkAppSession() {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const username = localStorage.getItem("username");
    
    if (token) {
        document.getElementById("auth-gateway").classList.add("hidden");
        document.getElementById("workspace-shell").classList.remove("hidden");
        document.getElementById("user-badge").innerHTML = `${username} <span class="role-pill">${role}</span>`;
        document.getElementById("form-section-review").style.display = (role === "Manager") ? "block" : "none";
        fetchAndDisplayTasks();
        fetchAndDisplayRCAs();
    } else {
        document.getElementById("auth-gateway").classList.remove("hidden");
        document.getElementById("workspace-shell").classList.add("hidden");
    }
}

function logOut() {
    localStorage.clear();
    checkAppSession();
    showToastAlert("Session terminated safely.");
}

function switchTab(target) {
    const tabs = ['kanban', 'rca'];
    tabs.forEach(t => {
        const btn = document.getElementById(`tab-${t}`);
        const view = document.getElementById(`view-${t}`);
        if (t === target) {
            btn.classList.add('active');
            view.classList.remove('hidden');
        } else {
            btn.classList.remove('active');
            view.classList.add('hidden');
        }
    });
    if (target === 'rca') fetchAndDisplayRCAs();
}

async function handleRegistration() {
    const usernameInput = document.getElementById('login-username').value;
    const passwordInput = document.getElementById('login-password').value;
    const roleInput = document.getElementById('login-role').value;
    if (!usernameInput || !passwordInput) { showToastAlert("Incomplete credentials."); return; }
    
    try {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: usernameInput, password: passwordInput, role: roleInput })
        });
        if (res.ok) showToastAlert("Profile registered.");
        else showToastAlert("Registration rejected.");
    } catch { showToastAlert("Network pathway timeout."); }
}

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const authData = {
        username: document.getElementById('login-username').value,
        password: document.getElementById('login-password').value,
        role: document.getElementById('login-role').value
    };
    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(authData)
        });
        if (res.ok) {
            const data = await res.json();
            localStorage.setItem("token", data.token);
            localStorage.setItem("role", data.role);
            localStorage.setItem("username", data.username);
            checkAppSession();
            showToastAlert(`Session active: ${data.username}`);
        } else { showToastAlert("Authentication rejected."); }
    } catch { showToastAlert("Server terminal connection lost."); }
});

async function quickMoveStatus(taskId, targetStatus) {
    try {
        const res = await fetch(`${API_URL}/tasks/${taskId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: targetStatus })
        });
        if (res.ok) {
            showToastAlert(`Node state updated to ${targetStatus}`);
            fetchAndDisplayTasks();
        }
    } catch {}
}

async function postComment(taskId) {
    const textInput = document.getElementById(`comm-input-${taskId}`);
    const text = textInput.value;
    const username = localStorage.getItem("username") || "user";
    if (!text) return;

    try {
        const res = await fetch(`${API_URL}/tasks/${taskId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, text })
        });
        if (res.ok) {
            textInput.value = "";
            showToastAlert("Discussion board appended.");
            renderCardComments(taskId);
        }
    } catch {}
}

async function renderCardComments(taskId) {
    try {
        const res = await fetch(`${API_URL}/tasks/${taskId}/comments`);
        if (res.ok) {
            const comments = await res.json();
            const box = document.getElementById(`comm-box-${taskId}`);
            box.innerHTML = comments.map(c => 
                `<div class="comment-item">
                    <span class="comment-author">@${c.username}:</span> <span>${c.text}</span>
                 </div>`
            ).join('');
        }
    } catch {}
}

async function fetchAndDisplayTasks() {
    try {
        const res = await fetch(`${API_URL}/tasks`);
        if (!res.ok) return;
        const tasks = await res.json();
        
        const doneTasks = tasks.filter(t => t.status === "Done").length;
        const pct = tasks.length === 0 ? 0 : Math.round((doneTasks / tasks.length) * 100);
        document.getElementById('progress-bar').style.width = `${pct}%`;
        document.getElementById('metrics-text').innerHTML = `Normalized Productivity: <strong>${pct}% Performance Metrics</strong> (${doneTasks} of ${tasks.length} pipeline runs closed)`;

        const slots = { 
            "Todo": document.getElementById('slot-Todo'), 
            "In Progress": document.getElementById('slot-InProgress'), 
            "Review": document.getElementById('slot-Review'), 
            "Done": document.getElementById('slot-Done') 
        };
        
        Object.values(slots).forEach(s => s.innerHTML = "");
        const counts = { "Todo": 0, "In Progress": 0, "Review": 0, "Done": 0 };
        const role = localStorage.getItem("role");

        tasks.forEach(task => {
            const slot = slots[task.status];
            if (!slot) return;
            counts[task.status]++;

            let reviewHTML = '';
            if (task.review && task.review.status !== 'Pending') {
                const textStyle = task.review.status === 'Approved' ? 'verdict-approved' : 'verdict-rejected';
                reviewHTML = `
                    <div class="verdict-box">
                        <span class="${textStyle}">Verdict: ${task.review.status}</span><br>
                        <span style="color:var(--text-muted); font-size:11px;">"${task.review.comments}"</span>
                    </div>`;
            }

            let controlHTML = '';
            if (role === "Developer") {
                if (task.status === 'Todo') controlHTML = `<button class="btn-action" style="margin-top:10px;" onclick="quickMoveStatus('${task.id}', 'In Progress')">Accept Assignment</button>`;
                else if (task.status === 'In Progress') controlHTML = `<button class="btn-action" style="margin-top:10px; background:var(--warning); color:#000;" onclick="quickMoveStatus('${task.id}', 'Review')">Submit to Quality Gate</button>`;
            } else {
                if (task.status !== 'Done') controlHTML = `<div style="font-size:11px; text-align:center; color:var(--text-muted); margin-top:10px;">System Locked</div>`;
            }

            const card = document.createElement('div');
            card.className = "task-node";
            card.innerHTML = `
                <h4 class="node-title">${task.title}</h4>
                <div class="node-id">ID // ${task.id}</div>
                <p class="node-desc">${task.description}</p>
                <div class="node-footer">
                    <span>${task.assigned_to}</span>
                    <span>${task.project_id}</span>
                </div>
                ${reviewHTML}
                <div class="comment-area">
                    <div id="comm-box-${task.id}" class="comment-list"></div>
                    <div class="comment-form">
                        <input type="text" id="comm-input-${task.id}" placeholder="Note..." class="comment-box-input">
                        <button class="comment-box-btn" onclick="postComment('${task.id}')">Post</button>
                    </div>
                </div>
                ${controlHTML}
            `;
            slot.appendChild(card);
            renderCardComments(task.id);
        });

        Object.keys(slots).forEach(key => {
            document.getElementById(`count-${key.replace(' ', '')}`).innerText = counts[key];
            if (counts[key] === 0) {
                slots[key].innerHTML = `<div class="empty-state-placeholder">No active components inside this environment</div>`;
            }
        });

        fetchAndDisplayLogs();
    } catch {}
}

async function fetchAndDisplayRCAs() {
    try {
        const res = await fetch(`${API_URL}/rcas`);
        if (!res.ok) return;
        const rcas = await res.json();
        const container = document.getElementById('rca-list-container');
        container.innerHTML = "";

        if (rcas.length === 0) {
            container.innerHTML = `<div style="color:var(--text-muted); font-style:italic; font-size:13px; padding:10px 0;">No system compliance breaches registered.</div>`;
            return;
        }

        rcas.forEach(rca => {
            const card = document.createElement('div');
            card.className = "rca-wrapper";
            card.innerHTML = `
                <div class="rca-head">
                    <strong style="font-size:14px;">Audit Reference Node // ${rca.task_id}</strong>
                    <span style="color:var(--danger); font-size:11px; font-weight:700; text-transform:uppercase;">${rca.severity} Severity</span>
                </div>
                <div style="font-size:13px; margin-bottom:10px;">Investigation State: <strong style="color:var(--warning);">${rca.status}</strong></div>
                <div class="rca-timeline">
                    ${rca.timeline.map(t => `<div class="feed-line">> ${t}</div>`).join('')}
                </div>
            `;
            container.appendChild(card);
        });
    } catch {}
}

async function fetchAndDisplayLogs() {
    try {
        const res = await fetch(`${API_URL}/logs`);
        if (res.ok) {
            const logs = await res.json();
            const container = document.getElementById('logs-container');
            container.innerHTML = logs.map(l => `<div class="feed-line">> ${l.message}</div>`).join('');
        }
    } catch {}
}

document.getElementById('task-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const taskData = { title: document.getElementById('task-title').value, description: document.getElementById('task-desc').value };
    try {
        const res = await fetch(`${API_URL}/tasks`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(taskData) });
        if (res.ok) { 
            showToastAlert("Operational component deployed safely.");
            document.getElementById('task-form').reset(); 
            fetchAndDisplayTasks(); 
        }
    } catch {}
});

document.getElementById('review-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('review-task-id').value;
    const reviewData = { status: document.getElementById('review-status').value, comments: document.getElementById('review-comments').value };
    try {
        const res = await fetch(`${API_URL}/tasks/${id}/review`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(reviewData) });
        if (res.ok) { 
            showToastAlert(`Quality gate review finalized: ${reviewData.status}`);
            document.getElementById('review-form').reset(); 
            fetchAndDisplayTasks(); 
            fetchAndDisplayRCAs(); 
        }
    } catch {}
});

window.addEventListener('DOMContentLoaded', checkAppSession);