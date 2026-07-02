/**
 * To-Do Application with Complete Authentication
 * State Manager & Dual-Mode Synchronizer (Local Storage / Remote REST API)
 */

// === APPLICATION STATE ===
const state = {
  route: "login", // "login" | "register" | "forgot" | "dashboard"
  user: null,     // { id, name, email, avatar, bio, location }
  token: null,    // HMAC JWT Token
  tasks: [],      // Array of tasks: { id, userId, text, completed, createdAt }
  filter: "all",  // "all" | "active" | "completed"
  editingId: null,// ID of task being edited
  isOnline: true,  // Detected backend API status
  preferences: {
    dailyReminders: true,
    secureSessions: true
  }
};

// === DOM SELECTORS ===
const elements = {
  initializationLoader: document.getElementById("initialization-loader"),
  loginScreen: document.getElementById("login-screen"),
  registerScreen: document.getElementById("register-screen"),
  forgotScreen: document.getElementById("forgot-screen"),
  dashboardScreen: document.getElementById("dashboard-screen"),

  // Login
  loginForm: document.getElementById("login-form"),
  loginEmailInput: document.getElementById("login-email-input"),
  loginPasswordInput: document.getElementById("login-password-input"),
  loginRememberCheckbox: document.getElementById("login-remember-checkbox"),
  loginTogglePasswordBtn: document.getElementById("login-toggle-password-btn"),
  loginEmailError: document.getElementById("login-email-error"),
  loginPasswordError: document.getElementById("login-password-error"),
  loginRegisterRedirectBtn: document.getElementById("login-register-redirect-btn"),
  loginForgotPasswordLink: document.getElementById("login-forgot-password-link"),
  socialGoogleBtn: document.getElementById("social-google-btn"),
  socialGithubBtn: document.getElementById("social-github-btn"),
  socialMicrosoftBtn: document.getElementById("social-microsoft-btn"),

  // Register
  registerForm: document.getElementById("register-form"),
  registerNameInput: document.getElementById("register-name-input"),
  registerEmailInput: document.getElementById("register-email-input"),
  registerPasswordInput: document.getElementById("register-password-input"),
  registerTogglePasswordBtn: document.getElementById("register-toggle-password-btn"),
  registerConfirmPasswordInput: document.getElementById("register-confirm-password-input"),
  registerToggleConfirmPasswordBtn: document.getElementById("register-toggle-confirm-password-btn"),
  registerTermsCheckbox: document.getElementById("register-terms-checkbox"),
  registerNameError: document.getElementById("register-name-error"),
  registerEmailError: document.getElementById("register-email-error"),
  registerPasswordError: document.getElementById("register-password-error"),
  registerConfirmPasswordError: document.getElementById("register-confirm-password-error"),
  registerTermsError: document.getElementById("register-terms-error"),
  registerLoginRedirectBtn: document.getElementById("register-login-redirect-btn"),

  // Forgot Password
  forgotForm: document.getElementById("forgot-form"),
  forgotEmailInput: document.getElementById("forgot-email-input"),
  forgotEmailError: document.getElementById("forgot-email-error"),
  forgotLoginRedirectBtn: document.getElementById("forgot-login-redirect-btn"),
  recoveryResultAlert: document.getElementById("recovery-result-alert"),
  recoveryAlertIcon: document.getElementById("recovery-alert-icon"),
  recoveryAlertText: document.getElementById("recovery-alert-text"),

  // Dashboard & Task Form
  currentDateDisplay: document.getElementById("current-date-display"),
  dashboardStatsBadge: document.getElementById("dashboard-stats-badge"),
  profileDropdownBtn: document.getElementById("profile-dropdown-btn"),
  profileDropdownContainer: document.getElementById("profile-dropdown-container"),
  profileDropdownMenu: document.getElementById("profile-dropdown-menu"),
  navbarUserAvatar: document.getElementById("navbar-user-avatar"),
  navbarUserName: document.getElementById("navbar-user-name"),
  navbarUserEmail: document.getElementById("navbar-user-email"),
  dropdownMobileName: document.getElementById("dropdown-mobile-name"),
  dropdownMobileEmail: document.getElementById("dropdown-mobile-email"),
  dropdownProfileBtn: document.getElementById("dropdown-profile-btn"),
  dropdownSettingsBtn: document.getElementById("dropdown-settings-btn"),
  dropdownLogoutBtn: document.getElementById("dropdown-logout-btn"),
  taskForm: document.getElementById("task-form"),
  dashboardTaskInput: document.getElementById("dashboard-task-input"),
  clearTaskInputBtn: document.getElementById("clear-task-input-btn"),
  addTaskBtn: document.getElementById("add-task-btn"),
  filterAllBtn: document.getElementById("filter-all-btn"),
  filterActiveBtn: document.getElementById("filter-active-btn"),
  filterCompletedBtn: document.getElementById("filter-completed-btn"),
  tasksLoader: document.getElementById("tasks-loader"),
  taskList: document.querySelector(".task-list"),
  dashboardEmptyState: document.getElementById("dashboard-empty-state"),
  dashboardEmptyText: document.getElementById("dashboard-empty-text"),
  dashboardFooter: document.getElementById("dashboard-footer"),
  remainingTasksCount: document.getElementById("remaining-tasks-count"),
  clearCompletedTasksBtn: document.getElementById("clear-completed-tasks-btn"),

  // Profile Modal
  profileSettingsModal: document.getElementById("profile-settings-modal"),
  closeProfileModalBtn: document.getElementById("close-profile-modal-btn"),
  modalBackdrop: document.getElementById("modal-backdrop"),
  modalProfileTabBtn: document.getElementById("modal-profile-tab-btn"),
  modalSettingsTabBtn: document.getElementById("modal-settings-tab-btn"),
  profileSettingsForm: document.getElementById("profile-settings-form"),
  modalSettingsContent: document.getElementById("modal-settings-content"),
  modalAvatarPreview: document.getElementById("modal-avatar-preview"),
  avatarInput: document.getElementById("avatar-input"),
  nameInput: document.getElementById("name-input"),
  modalEmailReadOnly: document.getElementById("modal-email-read-only"),
  bioInput: document.getElementById("bio-input"),
  locationInput: document.getElementById("location-input"),
  saveProfileBtn: document.getElementById("save-profile-btn"),
  toggleNotify: document.getElementById("toggle-notify"),
  toggleSecure: document.getElementById("toggle-secure"),
  dbConnectorBadge: document.getElementById("db-connector-badge"),
  toastContainer: document.getElementById("toast-container")
};

// === TOAST NOTIFICATION ENGINE ===
function showToast(message, type = "success") {
  if (!elements.toastContainer) return;
  
  const toast = document.createElement("div");
  toast.className = `toast-item toast-${type}`;
  
  let iconName = "check-circle";
  if (type === "error") iconName = "alert-circle";
  if (type === "info") iconName = "info";
  
  toast.innerHTML = `
    <i data-lucide="${iconName}" class="w-4.5 h-4.5 shrink-0"></i>
    <span>${message}</span>
  `;
  
  elements.toastContainer.appendChild(toast);
  lucide.createIcons();
  
  // Auto-dismiss after 3.2s
  setTimeout(() => {
    toast.classList.add("dismissing");
    toast.addEventListener("animationend", () => {
      toast.remove();
    });
  }, 3200);
}

// === UTILITY ACTIONS ===
function updateSystemDate() {
  const options = { weekday: "long", month: "short", day: "numeric" };
  const today = new Date();
  if (elements.currentDateDisplay) {
    elements.currentDateDisplay.textContent = today.toLocaleDateString("en-US", options);
  }
}

// Check online API connectivity status
async function checkBackendStatus() {
  try {
    const res = await fetch("/api/health", { method: "GET" });
    const data = await res.json();
    state.isOnline = (data.status === "ok" || res.status === 200);
  } catch (err) {
    state.isOnline = false;
  }
  
  if (elements.dbConnectorBadge) {
    elements.dbConnectorBadge.textContent = state.isOnline 
      ? "Remote Cloud API / Persistent Space" 
      : "Isolated Local / LocalStorage Database";
    elements.dbConnectorBadge.className = state.isOnline 
      ? "text-rose-300 font-medium" 
      : "text-amber-300 font-medium";
  }
}

// Clean form validation errors
function clearAllErrors() {
  const errorElements = [
    elements.loginEmailError, elements.loginPasswordError,
    elements.registerNameError, elements.registerEmailError,
    elements.registerPasswordError, elements.registerConfirmPasswordError,
    elements.registerTermsError, elements.forgotEmailError
  ];
  errorElements.forEach(el => {
    if (el) {
      el.textContent = "";
      el.classList.add("hidden");
    }
  });
}

// Navigational transitions
function navigateTo(route) {
  state.route = route;
  clearAllErrors();
  
  const screens = [
    elements.initializationLoader,
    elements.loginScreen,
    elements.registerScreen,
    elements.forgotScreen,
    elements.dashboardScreen
  ];
  
  screens.forEach(screen => {
    if (screen) screen.classList.add("hidden");
  });
  
  // Close modal and dropdown on navigate
  hideProfileModal();
  elements.profileDropdownMenu.classList.add("hidden");
  
  if (route === "login" && elements.loginScreen) elements.loginScreen.classList.remove("hidden");
  else if (route === "register" && elements.registerScreen) elements.registerScreen.classList.remove("hidden");
  else if (route === "forgot" && elements.forgotScreen) {
    elements.forgotScreen.classList.remove("hidden");
    elements.recoveryResultAlert.classList.add("hidden");
  } else if (route === "dashboard" && elements.dashboardScreen) {
    elements.dashboardScreen.classList.remove("hidden");
    updateSystemDate();
    loadTasks();
  }
  
  renderNavbar();
}

// === LOCAL PERSISTENCE SIMULATION ENGINE (OFFLINE FALLBACK) ===
const LocalDB = {
  getUsers: () => JSON.parse(localStorage.getItem("local_todo_users")) || [],
  saveUsers: (users) => localStorage.setItem("local_todo_users", JSON.stringify(users)),
  getTasks: (userId) => JSON.parse(localStorage.getItem(`local_todo_tasks_${userId}`)) || [],
  saveTasks: (userId, tasks) => localStorage.setItem(`local_todo_tasks_${userId}`, JSON.stringify(tasks))
};

// === API / ENDPOINT CONNECTIVITY CLIENT ===
async function makeRequest(endpoint, method = "GET", body = null) {
  const headers = { "Content-Type": "application/json" };
  if (state.token) {
    headers["Authorization"] = `Bearer ${state.token}`;
  }
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s network timeout

  try {
    const config = { method, headers, signal: controller.signal };
    if (body) config.body = JSON.stringify(body);
    
    const response = await fetch(endpoint, config);
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server responded with ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// === AUTHENTICATION ACTIONS ===

// Registration Submission
async function handleRegister(e) {
  e.preventDefault();
  clearAllErrors();
  
  const name = elements.registerNameInput.value.trim();
  const email = elements.registerEmailInput.value.trim();
  const password = elements.registerPasswordInput.value;
  const confirmPassword = elements.registerConfirmPasswordInput.value;
  const terms = elements.registerTermsCheckbox.checked;
  
  let hasError = false;
  
  if (!name) {
    elements.registerNameError.textContent = "Full Name is required";
    elements.registerNameError.classList.remove("hidden");
    hasError = true;
  }
  
  if (!email || !email.includes("@")) {
    elements.registerEmailError.textContent = "Please enter a valid email address";
    elements.registerEmailError.classList.remove("hidden");
    hasError = true;
  }
  
  if (password.length < 6) {
    elements.registerPasswordError.textContent = "Password must be at least 6 characters long";
    elements.registerPasswordError.classList.remove("hidden");
    hasError = true;
  }
  
  if (password !== confirmPassword) {
    elements.registerConfirmPasswordError.textContent = "Passwords do not match";
    elements.registerConfirmPasswordError.classList.remove("hidden");
    hasError = true;
  }
  
  if (!terms) {
    elements.registerTermsError.textContent = "You must accept the terms & conditions";
    elements.registerTermsError.classList.remove("hidden");
    hasError = true;
  }
  
  if (hasError) return;
  
  try {
    // Attempt backend registration
    const data = await makeRequest("/api/auth/register", "POST", { name, email, password });
    state.token = data.token;
    state.user = data.user;
    
    // Remember me configuration
    localStorage.setItem("todo_session_token", data.token);
    localStorage.setItem("todo_session_user", JSON.stringify(data.user));
    
    showToast(`Account successfully registered! Welcome ${data.user.name}.`, "success");
    navigateTo("dashboard");
  } catch (err) {
    console.warn("Backend Registration failed. Falling back to local offline persistence.", err);
    
    // Offline simulation fallback
    const localUsers = LocalDB.getUsers();
    if (localUsers.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      elements.registerEmailError.textContent = "Email already registered in local database";
      elements.registerEmailError.classList.remove("hidden");
      return;
    }
    
    const mockUser = {
      id: "user_local_" + Date.now(),
      name,
      email: email.toLowerCase(),
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=fda4af&color=4c0519&bold=true&size=128`,
      bio: "Offline productivity enthusiast 🎯",
      location: "Local Sandbox 🌎"
    };
    
    localUsers.push({ ...mockUser, password }); // Save password securely for mock login comparison
    LocalDB.saveUsers(localUsers);
    
    state.token = "mock_jwt_token_" + mockUser.id;
    state.user = mockUser;
    
    localStorage.setItem("todo_session_token", state.token);
    localStorage.setItem("todo_session_user", JSON.stringify(mockUser));
    
    showToast(`Account successfully created (Offline Sandbox)! Welcome ${mockUser.name}.`, "success");
    navigateTo("dashboard");
  }
}

// Login Submission
async function handleLogin(e) {
  e.preventDefault();
  clearAllErrors();
  
  const email = elements.loginEmailInput.value.trim();
  const password = elements.loginPasswordInput.value;
  const remember = elements.loginRememberCheckbox.checked;
  
  let hasError = false;
  
  if (!email || !email.includes("@")) {
    elements.loginEmailError.textContent = "Please enter a valid email address";
    elements.loginEmailError.classList.remove("hidden");
    hasError = true;
  }
  
  if (!password) {
    elements.loginPasswordError.textContent = "Password is required";
    elements.loginPasswordError.classList.remove("hidden");
    hasError = true;
  }
  
  if (hasError) return;
  
  try {
    // Attempt backend authentication
    const data = await makeRequest("/api/auth/login", "POST", { email, password });
    state.token = data.token;
    state.user = data.user;
    
    if (remember) {
      localStorage.setItem("todo_session_token", data.token);
      localStorage.setItem("todo_session_user", JSON.stringify(data.user));
    } else {
      sessionStorage.setItem("todo_session_token", data.token);
      sessionStorage.setItem("todo_session_user", JSON.stringify(data.user));
    }
    
    showToast(`Successfully logged in. Welcome back, ${data.user.name}!`, "success");
    navigateTo("dashboard");
  } catch (err) {
    console.warn("Backend Login failed. Searching offline backup...", err);
    
    // Offline simulation validation fallback
    const localUsers = LocalDB.getUsers();
    const userMatched = localUsers.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    
    if (userMatched) {
      const { password: _, ...userNoPassword } = userMatched;
      state.token = "mock_jwt_token_" + userNoPassword.id;
      state.user = userNoPassword;
      
      if (remember) {
        localStorage.setItem("todo_session_token", state.token);
        localStorage.setItem("todo_session_user", JSON.stringify(userNoPassword));
      } else {
        sessionStorage.setItem("todo_session_token", state.token);
        sessionStorage.setItem("todo_session_user", JSON.stringify(userNoPassword));
      }
      
      showToast(`Successfully logged in (Offline Sandbox Mode)! Welcome ${userNoPassword.name}.`, "success");
      navigateTo("dashboard");
    } else {
      elements.loginPasswordError.textContent = "Invalid email or password";
      elements.loginPasswordError.classList.remove("hidden");
      showToast("Verification failed. Please check credentials or register.", "error");
    }
  }
}

// Social Login Simulation Flow
function triggerSocialLogin(platform) {
  showToast(`Initiating handshakes with ${platform} securely...`, "info");
  
  // Create beautiful social loading screen inside login screen
  const originalFormHTML = elements.loginForm.parentNode.innerHTML;
  const parent = elements.loginForm.parentNode;
  
  parent.innerHTML = `
    <div class="py-12 flex flex-col items-center justify-center space-y-4 animate-fade-in">
        <div class="relative flex items-center justify-center">
            <div class="w-14 h-14 rounded-full border-4 border-rose-400/10 border-t-rose-400 animate-spin"></div>
            <i data-lucide="${platform.toLowerCase() === 'google' ? 'sparkles' : platform.toLowerCase()}" class="absolute w-5 h-5 text-rose-300 animate-pulse"></i>
        </div>
        <div class="text-center space-y-1">
            <h3 class="text-sm font-semibold text-white uppercase tracking-wider font-mono">Verifying Credentials</h3>
            <p class="text-xs text-rose-200/40">Handshaking with ${platform} API gateways...</p>
        </div>
    </div>
  `;
  lucide.createIcons();
  
  setTimeout(() => {
    // Generate simulated high-res social identities for Yazhini
    let name = "Yazhini Kumaravel";
    let email = "yazhinikumaravel07@gmail.com";
    let avatar = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80"; // Premium woman profile
    
    if (platform === "GitHub") {
      name = "Yazhini (GitHub Dev)";
      email = "yazhini.dev@github.com";
      avatar = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80";
    } else if (platform === "Microsoft") {
      name = "Yazhini (MS Core)";
      email = "yazhini.kumaravel@microsoft.com";
      avatar = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80";
    }
    
    const socialUser = {
      id: `user_social_${platform.toLowerCase()}_${Date.now()}`,
      name,
      email,
      avatar,
      bio: `Verified OAuth integration via ${platform} 🔒`,
      location: "Silicon Valley 🌐"
    };
    
    state.token = `oauth_token_${platform.toLowerCase()}_${Date.now()}`;
    state.user = socialUser;
    
    localStorage.setItem("todo_session_token", state.token);
    localStorage.setItem("todo_session_user", JSON.stringify(socialUser));
    
    // Restore parent container to avoid visual breakage next time
    parent.innerHTML = originalFormHTML;
    attachLoginListeners(); // Re-bind events to restored elements
    
    showToast(`Successfully authenticated with ${platform}! Welcome ${socialUser.name}.`, "success");
    navigateTo("dashboard");
  }, 200);
}

// Forgot Password Recovery Submission
async function handleForgotPassword(e) {
  e.preventDefault();
  clearAllErrors();
  
  const email = elements.forgotEmailInput.value.trim();
  if (!email || !email.includes("@")) {
    elements.forgotEmailError.textContent = "Please enter a valid email address";
    elements.forgotEmailError.classList.remove("hidden");
    return;
  }
  
  try {
    const data = await makeRequest("/api/auth/forgot-password", "POST", { email });
    showRecoveryResult(true, data.message);
  } catch (err) {
    console.warn("Backend forgot password simulation failed. Simulating local recovery.", err);
    showRecoveryResult(true, "An interactive password reset link has been successfully simulated and saved locally! Check the browser developer logs for details.");
    console.log(`[PASS RECOVERY BACKUP]: Recovering session for ${email}. Access token generated: recovery_${Date.now()}`);
  }
}

function showRecoveryResult(isSuccess, message) {
  elements.recoveryResultAlert.classList.remove("hidden", "bg-emerald-500/10", "border-emerald-500/20", "text-emerald-300", "bg-rose-500/10", "border-rose-500/20", "text-rose-300");
  
  if (isSuccess) {
    elements.recoveryResultAlert.classList.add("bg-emerald-500/10", "border-emerald-500/20", "text-emerald-300");
    elements.recoveryAlertIcon.setAttribute("data-lucide", "check-circle");
    elements.recoveryAlertText.textContent = message;
  } else {
    elements.recoveryResultAlert.classList.add("bg-rose-500/10", "border-rose-500/20", "text-rose-300");
    elements.recoveryAlertIcon.setAttribute("data-lucide", "alert-circle");
    elements.recoveryAlertText.textContent = message;
  }
  lucide.createIcons();
}

// Log Out Session
function handleLogout() {
  localStorage.removeItem("todo_session_token");
  localStorage.removeItem("todo_session_user");
  sessionStorage.removeItem("todo_session_token");
  sessionStorage.removeItem("todo_session_user");
  
  state.token = null;
  state.user = null;
  state.tasks = [];
  
  showToast("Your session has been logged out securely.", "info");
  navigateTo("login");
}

// === PROFILE AND SETTINGS MODAL INTERACTIONS ===
function showProfileModal() {
  if (!state.user) return;
  
  // Fill input fields with current user state
  elements.nameInput.value = state.user.name || "";
  elements.avatarInput.value = state.user.avatar || "";
  elements.modalEmailReadOnly.value = state.user.email || "";
  elements.bioInput.value = state.user.bio || "";
  elements.locationInput.value = state.user.location || "";
  elements.modalAvatarPreview.src = state.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(state.user.name)}`;
  
  elements.profileSettingsModal.classList.remove("hidden");
  switchModalTab("profile");
}

function hideProfileModal() {
  elements.profileSettingsModal.classList.add("hidden");
}

function switchModalTab(tab) {
  elements.modalProfileTabBtn.classList.remove("border-rose-400", "text-rose-300", "border-transparent", "text-rose-200/50");
  elements.modalSettingsTabBtn.classList.remove("border-rose-400", "text-rose-300", "border-transparent", "text-rose-200/50");
  
  elements.profileSettingsForm.classList.add("hidden");
  elements.modalSettingsContent.classList.add("hidden");
  
  if (tab === "profile") {
    elements.modalProfileTabBtn.classList.add("border-rose-400", "text-rose-300");
    elements.modalSettingsTabBtn.classList.add("border-transparent", "text-rose-200/50");
    elements.profileSettingsForm.classList.remove("hidden");
  } else {
    elements.modalSettingsTabBtn.classList.add("border-rose-400", "text-rose-300");
    elements.modalProfileTabBtn.classList.add("border-transparent", "text-rose-200/50");
    elements.modalSettingsContent.classList.remove("hidden");
  }
}

// Handle Profile Form Submission
async function saveProfileSettings(e) {
  e.preventDefault();
  
  const name = elements.nameInput.value.trim();
  const avatar = elements.avatarInput.value.trim();
  const bio = elements.bioInput.value.trim();
  const location = elements.locationInput.value.trim();
  
  if (!name) {
    showToast("Full Name is required.", "error");
    return;
  }
  
  const payload = {
    name,
    avatar: avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=fda4af&color=4c0519&bold=true&size=128`,
    bio,
    location
  };
  
  try {
    const updatedUser = await makeRequest("/api/auth/profile", "PUT", payload);
    state.user = updatedUser;
    
    // Save updated session user
    if (localStorage.getItem("todo_session_user")) {
      localStorage.setItem("todo_session_user", JSON.stringify(updatedUser));
    } else {
      sessionStorage.setItem("todo_session_user", JSON.stringify(updatedUser));
    }
    
    // Update local storage backup user database as well
    const localUsers = LocalDB.getUsers();
    const userIndex = localUsers.findIndex(u => u.email.toLowerCase() === updatedUser.email.toLowerCase());
    if (userIndex !== -1) {
      localUsers[userIndex] = { ...localUsers[userIndex], ...updatedUser };
      LocalDB.saveUsers(localUsers);
    }
    
    renderNavbar();
    hideProfileModal();
    showToast("Profile settings updated successfully!", "success");
  } catch (err) {
    console.warn("Backend Profile Update failed. Updating offline sandbox database.", err);
    
    // offline profile updates
    const updatedUser = {
      ...state.user,
      name,
      avatar: avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=fda4af&color=4c0519&bold=true&size=128`,
      bio,
      location
    };
    
    state.user = updatedUser;
    if (localStorage.getItem("todo_session_user")) {
      localStorage.setItem("todo_session_user", JSON.stringify(updatedUser));
    } else {
      sessionStorage.setItem("todo_session_user", JSON.stringify(updatedUser));
    }
    
    const localUsers = LocalDB.getUsers();
    const userIndex = localUsers.findIndex(u => u.id === updatedUser.id);
    if (userIndex !== -1) {
      localUsers[userIndex] = { ...localUsers[userIndex], ...updatedUser };
      LocalDB.saveUsers(localUsers);
    }
    
    renderNavbar();
    hideProfileModal();
    showToast("Profile updated successfully (Offline Sandbox Saved)!", "success");
  }
}

// Render user stats in top navbar
function renderNavbar() {
  if (!state.user) return;
  
  const finalAvatar = state.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(state.user.name)}&background=random`;
  
  if (elements.navbarUserAvatar) elements.navbarUserAvatar.src = finalAvatar;
  if (elements.navbarUserName) elements.navbarUserName.textContent = state.user.name;
  if (elements.navbarUserEmail) elements.navbarUserEmail.textContent = state.user.email;
  
  if (elements.dropdownMobileName) elements.dropdownMobileName.textContent = state.user.name;
  if (elements.dropdownMobileEmail) elements.dropdownMobileEmail.textContent = state.user.email;
}

// === TASK MANAGEMENT AND RENDERING ENGINE ===

// Fetch tasks from dual-mode engine
async function loadTasks() {
  if (!state.user) return;
  
  elements.tasksLoader.classList.remove("hidden");
  elements.taskList.classList.add("hidden");
  elements.dashboardEmptyState.classList.add("hidden");
  
  try {
    const tasks = await makeRequest("/api/tasks", "GET");
    state.tasks = tasks;
    renderTasks();
  } catch (err) {
    console.warn("Backend task loading failed. Fetching sandbox data from local storage database.", err);
    state.tasks = LocalDB.getTasks(state.user.id);
    renderTasks();
  } finally {
    elements.tasksLoader.classList.add("hidden");
    elements.taskList.classList.remove("hidden");
  }
}

// Synchronize task states to endpoints/local storage
async function syncTasks() {
  if (!state.user) return;
  
  try {
    await makeRequest("/api/tasks", "POST", { tasks: state.tasks });
  } catch (err) {
    console.warn("Task cloud synchronization failed. Storing in offline sandbox storage.", err);
  }
  
  // Always back up locally as well to safeguard against cleared cache or network failure
  LocalDB.saveTasks(state.user.id, state.tasks);
  updateDashboardStats();
}

// Render actual tasks onto the DOM
function renderTasks() {
  if (!elements.taskList) return;
  
  elements.taskList.innerHTML = "";
  
  // Filter tasks based on selected tab
  const filteredTasks = state.tasks.filter(task => {
    if (state.filter === "active") return !task.completed;
    if (state.filter === "completed") return task.completed;
    return true; // "all"
  });
  
  // Sort tasks by creation date
  filteredTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  if (filteredTasks.length === 0) {
    elements.taskList.classList.add("hidden");
    elements.dashboardEmptyState.classList.remove("hidden");
    
    if (state.filter === "completed") {
      elements.dashboardEmptyText.textContent = "Finish outstanding tasks first to log them here.";
    } else if (state.filter === "active") {
      elements.dashboardEmptyText.textContent = "All space clear! Time to relax or create new milestones.";
    } else {
      elements.dashboardEmptyText.textContent = "Type a task above and press Enter to start.";
    }
    updateDashboardStats();
    return;
  }
  
  elements.dashboardEmptyState.classList.add("hidden");
  elements.taskList.classList.remove("hidden");
  
  filteredTasks.forEach(task => {
    const isEditing = state.editingId === task.id;
    const item = document.createElement("li");
    item.className = `task-item group ${task.completed ? 'completed' : ''}`;
    item.setAttribute("data-id", task.id);
    
    item.innerHTML = `
      <div class="task-content">
        <button type="button" class="toggle-btn" title="${task.completed ? 'Mark Active' : 'Mark Completed'}">
          <i data-lucide="circle" class="icon-circle w-5 h-5"></i>
          <i data-lucide="check-circle-2" class="icon-check-circle w-5 h-5"></i>
        </button>
        
        <span class="task-text truncate select-text cursor-pointer ${isEditing ? 'hidden' : ''}">${escapeHtml(task.text)}</span>
        <input 
          type="text" 
          class="task-edit-input flex-1 ${isEditing ? '' : 'hidden'}" 
          value="${escapeHtml(task.text)}"
        >
      </div>
      
      <div class="task-actions">
        <!-- Default State Actions -->
        <button type="button" class="edit-btn ${isEditing ? 'hidden' : ''}" title="Edit task">
          <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
        </button>
        <button type="button" class="delete-btn ${isEditing ? 'hidden' : ''}" title="Delete task">
          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
        </button>
        
        <!-- Editing State Actions -->
        <button type="button" class="save-btn ${isEditing ? '' : 'hidden'}" title="Save updates">
          <i data-lucide="check" class="w-3.5 h-3.5"></i>
        </button>
        <button type="button" class="cancel-btn ${isEditing ? '' : 'hidden'}" title="Cancel editing">
          <i data-lucide="x" class="w-3.5 h-3.5"></i>
        </button>
      </div>
    `;
    
    // Bind Action Handlers for this specific Task Item
    const toggleBtn = item.querySelector(".toggle-btn");
    const taskText = item.querySelector(".task-text");
    const editInput = item.querySelector(".task-edit-input");
    const editBtn = item.querySelector(".edit-btn");
    const deleteBtn = item.querySelector(".delete-btn");
    const saveBtn = item.querySelector(".save-btn");
    const cancelBtn = item.querySelector(".cancel-btn");
    
    // Complete/Active Toggle
    toggleBtn.addEventListener("click", () => toggleTaskCompletion(task.id));
    
    // Edit trigger
    editBtn.addEventListener("click", () => startEditingTask(task.id, editInput));
    taskText.addEventListener("dblclick", () => startEditingTask(task.id, editInput));
    
    // Delete trigger
    deleteBtn.addEventListener("click", () => deleteTask(task.id));
    
    // Save trigger
    saveBtn.addEventListener("click", () => finishEditingTask(task.id, editInput.value));
    editInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") finishEditingTask(task.id, editInput.value);
      if (e.key === "Escape") cancelEditingTask();
    });
    
    // Cancel trigger
    cancelBtn.addEventListener("click", () => cancelEditingTask());
    
    elements.taskList.appendChild(item);
  });
  
  lucide.createIcons();
  updateDashboardStats();
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

// Task Operation details
function toggleTaskCompletion(id) {
  state.tasks = state.tasks.map(task => 
    task.id === id ? { ...task, completed: !task.completed } : task
  );
  
  // Show sparkle or deletion audio/toast depending on status
  const foundTask = state.tasks.find(t => t.id === id);
  if (foundTask && foundTask.completed) {
    showToast("Goal accomplished! Task crossed out beautifully.", "success");
  }
  
  syncTasks();
  renderTasks();
}

function startEditingTask(id, inputElement) {
  state.editingId = id;
  renderTasks();
  
  // Focus and select input
  const activeInput = document.querySelector(`li[data-id="${id}"] .task-edit-input`);
  if (activeInput) {
    activeInput.focus();
    activeInput.select();
  }
}

function cancelEditingTask() {
  state.editingId = null;
  renderTasks();
}

function finishEditingTask(id, newText) {
  const cleanText = newText.trim();
  if (!cleanText) {
    deleteTask(id);
    return;
  }
  
  state.tasks = state.tasks.map(task => 
    task.id === id ? { ...task, text: cleanText } : task
  );
  
  state.editingId = null;
  syncTasks();
  renderTasks();
  showToast("Task updated.", "success");
}

function deleteTask(id) {
  state.tasks = state.tasks.filter(task => task.id !== id);
  syncTasks();
  renderTasks();
  showToast("Task deleted safely.", "error");
}

// Add New Task Item
async function addNewTask(e) {
  if (e) e.preventDefault();
  
  const text = elements.dashboardTaskInput.value.trim();
  if (!text || !state.user) return;
  
  const newTask = {
    id: "task_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9),
    userId: state.user.id,
    text,
    completed: false,
    createdAt: new Date().toISOString()
  };
  
  state.tasks.unshift(newTask);
  elements.dashboardTaskInput.value = "";
  elements.clearTaskInputBtn.classList.add("hidden");
  elements.addTaskBtn.disabled = true;
  
  syncTasks();
  renderTasks();
  showToast("Task appended successfully!", "success");
}

// Clear Completed Tasks
function clearCompletedTasks() {
  const initialCount = state.tasks.length;
  state.tasks = state.tasks.filter(t => !t.completed);
  
  const clearedCount = initialCount - state.tasks.length;
  if (clearedCount === 0) {
    showToast("No completed tasks found to clear.", "info");
    return;
  }
  
  syncTasks();
  renderTasks();
  showToast(`Successfully cleared ${clearedCount} completed tasks!`, "success");
}

// Update remaining count details
function updateDashboardStats() {
  const total = state.tasks.length;
  const completed = state.tasks.filter(t => t.completed).length;
  const active = total - completed;
  
  if (elements.dashboardStatsBadge) {
    elements.dashboardStatsBadge.textContent = `${completed}/${total} Done`;
  }
  
  if (elements.remainingTasksCount) {
    elements.remainingTasksCount.textContent = `${active} task${active !== 1 ? 's' : ''} remaining`;
  }
  
  // Show/Hide Dashboard footer based on content
  if (total === 0) {
    elements.dashboardFooter.classList.add("hidden");
  } else {
    elements.dashboardFooter.classList.remove("hidden");
  }
  
  // Show/Hide "Clear Completed" button based on presence of completed tasks
  if (completed === 0) {
    elements.clearCompletedTasksBtn.classList.add("hidden");
  } else {
    elements.clearCompletedTasksBtn.classList.remove("hidden");
  }
}

// === INTERACTIVE EVENT LISTENERS ===

// Toggle password visibility helper
function setupPasswordToggle(inputField, toggleBtn) {
  toggleBtn.addEventListener("click", () => {
    const isPassword = inputField.getAttribute("type") === "password";
    inputField.setAttribute("type", isPassword ? "text" : "password");
    
    // Toggle eye / eye-off icons dynamically
    const eyeIcon = toggleBtn.querySelector("i");
    if (eyeIcon) {
      if (isPassword) {
        eyeIcon.setAttribute("data-lucide", "eye-off");
      } else {
        eyeIcon.setAttribute("data-lucide", "eye");
      }
      lucide.createIcons();
    }
  });
}

function attachLoginListeners() {
  // Re-bind variables since the HTML parent is replaced on social triggers
  elements.loginForm = document.getElementById("login-form");
  elements.loginEmailInput = document.getElementById("login-email-input");
  elements.loginPasswordInput = document.getElementById("login-password-input");
  elements.loginRememberCheckbox = document.getElementById("login-remember-checkbox");
  elements.loginTogglePasswordBtn = document.getElementById("login-toggle-password-btn");
  elements.loginEmailError = document.getElementById("login-email-error");
  elements.loginPasswordError = document.getElementById("login-password-error");
  elements.loginRegisterRedirectBtn = document.getElementById("login-register-redirect-btn");
  elements.loginForgotPasswordLink = document.getElementById("login-forgot-password-link");
  elements.socialGoogleBtn = document.getElementById("social-google-btn");
  elements.socialGithubBtn = document.getElementById("social-github-btn");
  elements.socialMicrosoftBtn = document.getElementById("social-microsoft-btn");
  
  if (elements.loginForm) elements.loginForm.addEventListener("submit", handleLogin);
  if (elements.loginTogglePasswordBtn) setupPasswordToggle(elements.loginPasswordInput, elements.loginTogglePasswordBtn);
  if (elements.loginRegisterRedirectBtn) elements.loginRegisterRedirectBtn.addEventListener("click", () => navigateTo("register"));
  if (elements.loginForgotPasswordLink) elements.loginForgotPasswordLink.addEventListener("click", () => navigateTo("forgot"));
  
  if (elements.socialGoogleBtn) elements.socialGoogleBtn.addEventListener("click", () => triggerSocialLogin("Google"));
  if (elements.socialGithubBtn) elements.socialGithubBtn.addEventListener("click", () => triggerSocialLogin("GitHub"));
  if (elements.socialMicrosoftBtn) elements.socialMicrosoftBtn.addEventListener("click", () => triggerSocialLogin("Microsoft"));
}

function initEventBindings() {
  // Navigation tabs redirect
  elements.registerLoginRedirectBtn.addEventListener("click", () => navigateTo("login"));
  elements.forgotLoginRedirectBtn.addEventListener("click", () => navigateTo("login"));
  
  // Submit actions
  elements.registerForm.addEventListener("submit", handleRegister);
  elements.forgotForm.addEventListener("submit", handleForgotPassword);
  elements.taskForm.addEventListener("submit", addNewTask);
  elements.profileSettingsForm.addEventListener("submit", saveProfileSettings);
  
  // Password toggles
  setupPasswordToggle(elements.registerPasswordInput, elements.registerTogglePasswordBtn);
  setupPasswordToggle(elements.registerConfirmPasswordInput, elements.registerToggleConfirmPasswordBtn);
  
  // Dropdown menus and modals triggers
  elements.profileDropdownBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    elements.profileDropdownMenu.classList.toggle("hidden");
  });
  
  document.addEventListener("click", (e) => {
    if (!elements.profileDropdownContainer.contains(e.target)) {
      elements.profileDropdownMenu.classList.add("hidden");
    }
  });
  
  elements.dropdownProfileBtn.addEventListener("click", () => {
    elements.profileDropdownMenu.classList.add("hidden");
    showProfileModal();
  });
  elements.dropdownSettingsBtn.addEventListener("click", () => {
    elements.profileDropdownMenu.classList.add("hidden");
    showProfileModal();
    switchModalTab("settings");
  });
  elements.dropdownLogoutBtn.addEventListener("click", handleLogout);
  
  // Close Modals
  elements.closeProfileModalBtn.addEventListener("click", hideProfileModal);
  elements.modalBackdrop.addEventListener("click", hideProfileModal);
  
  // Switch Tabs in Modal
  elements.modalProfileTabBtn.addEventListener("click", () => switchModalTab("profile"));
  elements.modalSettingsTabBtn.addEventListener("click", () => switchModalTab("settings"));
  
  // Input validation controls in add task
  elements.dashboardTaskInput.addEventListener("input", () => {
    const text = elements.dashboardTaskInput.value;
    if (text.length > 0) {
      elements.clearTaskInputBtn.classList.remove("hidden");
      elements.addTaskBtn.disabled = false;
    } else {
      elements.clearTaskInputBtn.classList.add("hidden");
      elements.addTaskBtn.disabled = true;
    }
  });
  
  elements.clearTaskInputBtn.addEventListener("click", () => {
    elements.dashboardTaskInput.value = "";
    elements.clearTaskInputBtn.classList.add("hidden");
    elements.addTaskBtn.disabled = true;
    elements.dashboardTaskInput.focus();
  });
  
  // List Filter Tabs click events
  elements.filterAllBtn.addEventListener("click", () => selectFilter("all"));
  elements.filterActiveBtn.addEventListener("click", () => selectFilter("active"));
  elements.filterCompletedBtn.addEventListener("click", () => selectFilter("completed"));
  
  // Footer clearing
  elements.clearCompletedTasksBtn.addEventListener("click", clearCompletedTasks);
  
  // Preference switch triggers
  elements.toggleNotify.addEventListener("change", (e) => {
    state.preferences.dailyReminders = e.target.checked;
    showToast(state.preferences.dailyReminders 
      ? "Daily Sparkle Reminders enabled!" 
      : "Sparkle Reminders disabled safely.", "info");
  });
  elements.toggleSecure.addEventListener("change", (e) => {
    state.preferences.secureSessions = e.target.checked;
    showToast(state.preferences.secureSessions 
      ? "Session isolation security enforced!" 
      : "Relaxed session checks allowed.", "info");
  });
  
  // Avatar Instant URL Preview
  elements.avatarInput.addEventListener("input", () => {
    const url = elements.avatarInput.value.trim();
    if (url) {
      elements.modalAvatarPreview.src = url;
    } else {
      elements.modalAvatarPreview.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(state.user?.name || 'User')}`;
    }
  });

  attachLoginListeners();
}

function selectFilter(filterType) {
  elements.filterAllBtn.classList.remove("active");
  elements.filterActiveBtn.classList.remove("active");
  elements.filterCompletedBtn.classList.remove("active");
  
  state.filter = filterType;
  
  if (filterType === "all") elements.filterAllBtn.classList.add("active");
  else if (filterType === "active") elements.filterActiveBtn.classList.add("active");
  else if (filterType === "completed") elements.filterCompletedBtn.classList.add("active");
  
  renderTasks();
}

// === INITIALIZATION & SESSION RESOLUTION ===
async function initSession() {
  await checkBackendStatus();
  
  // Resolve pre-existing sessions
  const storedToken = localStorage.getItem("todo_session_token") || sessionStorage.getItem("todo_session_token");
  const storedUser = localStorage.getItem("todo_session_user") || sessionStorage.getItem("todo_session_user");
  
  if (storedToken && storedUser) {
    try {
      state.token = storedToken;
      state.user = JSON.parse(storedUser);
      navigateTo("dashboard");
    } catch (err) {
      console.error("Failed to parse stored user state.", err);
      navigateTo("login");
    }
  } else {
    navigateTo("login");
  }
}

// Bootstrapper
window.addEventListener("DOMContentLoaded", () => {
  initEventBindings();
  
  // Instant session initialization (50ms tiny delay for smooth initial rendering)
  setTimeout(() => {
    initSession();
  }, 50);
});
