/**
 * ========================================================
 * Expense Tracker App — main.js
 * ========================================================
 */
const STORAGE_KEY_TRANSACTIONS = "expense-tracker-transactions";
const STORAGE_KEY_THEME = "expense-tracker-theme";
const STORAGE_KEY_USERS = "expense-tracker-users";
const STORAGE_KEY_SESSION = "expense-tracker-session";

let transactions = [];
let editingId = null;

const transactionForm = document.getElementById("transactionForm");
const profileButton = document.getElementById("profileButton");
const profileDropdown = document.getElementById("profileDropdown");
const toggleThemeButton = document.getElementById("toggleThemeButton");
const openSettingsButton = document.getElementById("openSettingsButton");
const openAboutButton = document.getElementById("openAboutButton");
const closeSettingsButton = document.getElementById("closeSettingsButton");
const closeAboutButton = document.getElementById("closeAboutButton");
const settingsModal = document.getElementById("settingsModal");
const aboutModal = document.getElementById("aboutModal");
const themeToggle = document.getElementById("themeToggle");
const loginButton = document.getElementById("loginButton");
const registerButton = document.getElementById("registerButton");
const editProfileButton = document.getElementById("editProfileButton");
const logoutButton = document.getElementById("logoutButton");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const editProfileForm = document.getElementById("editProfileForm");
const loginUsernameInput = document.getElementById("loginUsernameInput");
const loginPasswordInput = document.getElementById("loginPasswordInput");
const registerUsernameInput = document.getElementById("registerUsernameInput");
const registerPasswordInput = document.getElementById("registerPasswordInput");
const editUsernameInput = document.getElementById("editUsernameInput");
const editPasswordInput = document.getElementById("editPasswordInput");
const loginSubmitButton = document.getElementById("loginSubmitButton");
const registerSubmitButton = document.getElementById("registerSubmitButton");
const editProfileSubmitButton = document.getElementById("editProfileSubmitButton");
const currentUserStatus = document.getElementById("currentUserStatus");
const userGreeting = document.getElementById("userGreeting");

const titleInput = document.getElementById("transactionFormTitleInput");
const amountInput = document.getElementById("transactionFormAmountInput");
const dateInput = document.getElementById("transactionFormDateInput");
const typeInput = document.getElementById("transactionFormTypeSelect");
const incomeList = document.getElementById("incomeList");
const expenseList = document.getElementById("expenseList");
const searchInput = document.getElementById("searchTransactionFormTitleInput");
const balanceElement = document.querySelector(".tracker-summary__balance-amount");
const incomeElement = document.querySelector(".tracker-summary__stat-amount--income");
const expenseElement = document.querySelector(".tracker-summary__stat-amount--expense");

let currentUser = null;

function generateId() {
  return `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function formatCurrency(number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(number);
}

function formatDate(inputDate) {
  const date = inputDate ? new Date(inputDate) : new Date();
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function saveTransactions() {
  localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(transactions));
}

function loadTransactions() {
  const stored = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
  transactions = stored ? JSON.parse(stored) : [];
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
}

function loadUsers() {
  const stored = localStorage.getItem(STORAGE_KEY_USERS);
  return stored ? JSON.parse(stored) : [];
}

function saveSession(username) {
  localStorage.setItem(STORAGE_KEY_SESSION, username);
}

function loadSession() {
  return localStorage.getItem(STORAGE_KEY_SESSION);
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEY_SESSION);
}

function saveSettings() {
  localStorage.setItem(STORAGE_KEY_THEME, themeToggle.checked ? "dark" : "light");
}

function loadSettings() {
  const savedTheme = localStorage.getItem(STORAGE_KEY_THEME) || "light";
  themeToggle.checked = savedTheme === "dark";
  setTheme(savedTheme);
}

function setTheme(theme) {
  document.body.classList.toggle("dark", theme === "dark");
  themeToggle.checked = theme === "dark";
  updateDropdownThemeLabel();
}

function updateDropdownThemeLabel() {
  if (!toggleThemeButton) return;
  toggleThemeButton.textContent = document.body.classList.contains("dark")
    ? "☀️ Mode Terang"
    : "🌙 Mode Gelap";
}

function updateSummary() {
  const totalIncome = transactions
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + transaction.amount, 0);

  const totalExpense = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + transaction.amount, 0);

  const balance = totalIncome - totalExpense;

  incomeElement.textContent = formatCurrency(totalIncome);
  expenseElement.textContent = formatCurrency(totalExpense);
  balanceElement.textContent = formatCurrency(balance);
}

function createTransactionCard(transaction) {
  const card = document.createElement("div");
  card.className = "tracker-transaction-item";
  card.setAttribute("data-testid", "transactionItem");

  card.innerHTML = `
    <div class="tracker-transaction-item__icon ${
      transaction.type === "income"
        ? "tracker-transaction-item__icon--income"
        : "tracker-transaction-item__icon--expense"
    }" data-testid="transactionItemType">
      ${transaction.type === "income" ? "💰" : "💸"}
      <span class="visually-hidden">${
        transaction.type === "income" ? "Pemasukan" : "Pengeluaran"
      }</span>
    </div>

    <div class="tracker-transaction-item__detail">
      <p class="tracker-transaction-item__title" data-testid="transactionItemTitle">${transaction.title}</p>
      <p class="tracker-transaction-item__date" data-testid="transactionItemDate">${formatDate(transaction.date)}</p>
    </div>

    <div class="tracker-transaction-item__right">
      <p class="tracker-transaction-item__amount ${
        transaction.type === "income"
          ? "tracker-transaction-item__amount--income"
          : "tracker-transaction-item__amount--expense"
      }" data-testid="transactionItemAmount">
        ${formatCurrency(transaction.amount)}
      </p>
      <div class="tracker-transaction-item__actions">
        <button class="tracker-transaction-item__btn toggle-btn" type="button" data-testid="transactionItemEditTypeButton">Tukar</button>
        <button class="tracker-transaction-item__btn edit-btn" type="button">Edit</button>
        <button class="tracker-transaction-item__btn delete-btn" type="button" data-testid="transactionItemDeleteButton">Hapus</button>
      </div>
    </div>
  `;

  card.querySelector(".delete-btn").addEventListener("click", () => {
    transactions = transactions.filter((item) => item.id !== transaction.id);
    saveTransactions();
    renderTransactions();
    updateSummary();
  });

  card.querySelector(".edit-btn").addEventListener("click", () => {
    editingId = transaction.id;
    titleInput.value = transaction.title;
    amountInput.value = transaction.amount;
    dateInput.value = transaction.date;
    typeInput.value = transaction.type;
    titleInput.focus();
  });

  card.querySelector(".toggle-btn").addEventListener("click", () => {
    transaction.type = transaction.type === "income" ? "expense" : "income";
    saveTransactions();
    renderTransactions();
    updateSummary();
  });

  return card;
}

function renderTransactions(data = transactions) {
  incomeList.innerHTML = "";
  expenseList.innerHTML = "";

  if (data.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "tracker-empty-state";
    emptyMessage.textContent = "Belum ada transaksi. Tambahkan transaksi baru di atas.";
    incomeList.appendChild(emptyMessage);
    expenseList.appendChild(emptyMessage.cloneNode(true));
    return;
  }

  data.forEach((transaction) => {
    const card = createTransactionCard(transaction);
    if (transaction.type === "income") {
      incomeList.appendChild(card);
    } else {
      expenseList.appendChild(card);
    }
  });
}

function showModal(modal) {
  modal.classList.add("modal--visible");
  modal.setAttribute("aria-hidden", "false");
}

function hideModal(modal) {
  modal.classList.remove("modal--visible");
  modal.setAttribute("aria-hidden", "true");
}

function closeAllPopups() {
  profileDropdown.style.display = "none";
  profileButton.setAttribute("aria-expanded", "false");
}

function updateUserGreeting() {
  if (currentUser) {
    userGreeting.innerHTML = `Halo, <strong>${currentUser}</strong>`;
  } else {
    userGreeting.innerHTML = `Halo, <strong>Jhodie Naufal Kertoprodjo</strong>`;
  }
}

function hideAllAuthForms() {
  loginForm.classList.add("hidden");
  registerForm.classList.add("hidden");
  editProfileForm.classList.add("hidden");
}

function updateAccountActions() {
  const loggedIn = Boolean(currentUser);
  loginButton.classList.toggle("hidden", loggedIn);
  registerButton.classList.toggle("hidden", loggedIn);
  editProfileButton.classList.toggle("hidden", !loggedIn);
  logoutButton.classList.toggle("hidden", !loggedIn);
  currentUserStatus.textContent = loggedIn
    ? `Sedang masuk sebagai ${currentUser}.`
    : "Belum masuk. Silakan login atau daftar untuk menyimpan data Anda.";
}

function showLoginForm() {
  hideAllAuthForms();
  loginForm.classList.remove("hidden");
}

function showRegisterForm() {
  hideAllAuthForms();
  registerForm.classList.remove("hidden");
}

function showEditProfileForm() {
  hideAllAuthForms();
  editProfileForm.classList.remove("hidden");
  editUsernameInput.value = currentUser || "";
  editPasswordInput.value = "";
}

function showLoginSuccess(message) {
  alert(message);
  loginUsernameInput.value = "";
  loginPasswordInput.value = "";
  registerUsernameInput.value = "";
  registerPasswordInput.value = "";
  editUsernameInput.value = "";
  editPasswordInput.value = "";
  hideAllAuthForms();
}

transactionForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = titleInput.value.trim();
  const amount = Number(amountInput.value);
  const date = dateInput.value || new Date().toISOString().slice(0, 10);
  const type = typeInput.value;

  if (title === "") {
    alert("Judul transaksi tidak boleh kosong.");
    return;
  }

  if (Number.isNaN(amount) || amount < 1) {
    alert("Nominal minimal Rp1.");
    return;
  }

  if (editingId) {
    const transaction = transactions.find((item) => item.id === editingId);
    if (transaction) {
      transaction.title = title;
      transaction.amount = amount;
      transaction.date = date;
      transaction.type = type;
    }
    editingId = null;
  } else {
    transactions.push({
      id: generateId(),
      title,
      amount,
      date,
      type,
    });
  }

  saveTransactions();
  renderTransactions();
  updateSummary();
  transactionForm.reset();
});

searchInput.addEventListener("input", () => {
  const keyword = searchInput.value.toLowerCase();
  const filtered = transactions.filter((transaction) =>
    transaction.title.toLowerCase().includes(keyword)
  );
  renderTransactions(filtered);
});

profileButton.addEventListener("click", (event) => {
  event.stopPropagation();
  const isOpen = profileDropdown.style.display === "block";
  profileDropdown.style.display = isOpen ? "none" : "block";
  profileButton.setAttribute("aria-expanded", String(!isOpen));
});

document.addEventListener("click", (event) => {
  if (!profileButton.contains(event.target) && !profileDropdown.contains(event.target)) {
    closeAllPopups();
  }
});

openSettingsButton.addEventListener("click", () => {
  showModal(settingsModal);
  closeAllPopups();
});

openAboutButton.addEventListener("click", () => {
  showModal(aboutModal);
  closeAllPopups();
});

closeSettingsButton.addEventListener("click", () => hideModal(settingsModal));
closeAboutButton.addEventListener("click", () => hideModal(aboutModal));

themeToggle.addEventListener("change", () => {
  setTheme(themeToggle.checked ? "dark" : "light");
  saveSettings();
});

if (toggleThemeButton) {
  toggleThemeButton.addEventListener("click", () => {
    const nextTheme = document.body.classList.contains("dark") ? "light" : "dark";
    setTheme(nextTheme);
    saveSettings();
    closeAllPopups();
  });
}

loginButton.addEventListener("click", () => {
  showModal(settingsModal);
  closeAllPopups();
  showLoginForm();
});

registerButton.addEventListener("click", () => {
  showModal(settingsModal);
  closeAllPopups();
  showRegisterForm();
});

editProfileButton.addEventListener("click", () => {
  showModal(settingsModal);
  closeAllPopups();
  showEditProfileForm();
});

logoutButton.addEventListener("click", () => {
  currentUser = null;
  clearSession();
  updateUserGreeting();
  updateAccountActions();
  hideModal(settingsModal);
  hideAllAuthForms();
  alert("Anda telah keluar.");
});

loginSubmitButton.addEventListener("click", () => {
  const username = loginUsernameInput.value.trim();
  const password = loginPasswordInput.value;
  const users = loadUsers();

  if (!username || !password) {
    alert("Username dan password harus diisi.");
    return;
  }

  const user = users.find((item) => item.username === username && item.password === password);

  if (!user) {
    alert("Login gagal. Periksa username dan password.");
    return;
  }

  currentUser = user.username;
  saveSession(currentUser);
  updateUserGreeting();
  updateAccountActions();
  hideModal(settingsModal);
  showLoginSuccess("Login berhasil. Transaksi tersimpan secara lokal di browser.");
});

registerSubmitButton.addEventListener("click", () => {
  const username = registerUsernameInput.value.trim();
  const password = registerPasswordInput.value;
  const users = loadUsers();

  if (!username || !password) {
    alert("Username dan password harus diisi.");
    return;
  }

  if (users.some((item) => item.username === username)) {
    alert("Username sudah terdaftar. Silakan gunakan username lain.");
    return;
  }

  users.push({ username, password });
  saveUsers(users);
  currentUser = username;
  saveSession(currentUser);
  updateUserGreeting();
  updateAccountActions();
  hideModal(settingsModal);
  showLoginSuccess("Pendaftaran berhasil. Anda sekarang masuk sebagai pengguna lokal.");
});

editProfileSubmitButton.addEventListener("click", () => {
  const newUsername = editUsernameInput.value.trim();
  const newPassword = editPasswordInput.value;
  const users = loadUsers();
  const userIndex = users.findIndex((item) => item.username === currentUser);

  if (userIndex === -1) {
    alert("Pengguna tidak ditemukan. Silakan login lagi.");
    return;
  }

  if (!newUsername || !newPassword) {
    alert("Username dan password harus diisi.");
    return;
  }

  if (newUsername !== currentUser && users.some((item) => item.username === newUsername)) {
    alert("Username sudah digunakan. Silakan pilih yang lain.");
    return;
  }

  users[userIndex] = { username: newUsername, password: newPassword };
  saveUsers(users);
  currentUser = newUsername;
  saveSession(currentUser);
  updateUserGreeting();
  updateAccountActions();
  hideModal(settingsModal);
  showLoginSuccess("Profil berhasil diperbarui.");
});

settingsModal.addEventListener("click", (event) => {
  if (event.target === settingsModal) hideModal(settingsModal);
});

aboutModal.addEventListener("click", (event) => {
  if (event.target === aboutModal) hideModal(aboutModal);
});

loadTransactions();
loadSettings();
const storedSession = loadSession();
if (storedSession) {
  currentUser = storedSession;
}
updateUserGreeting();
updateAccountActions();
hideAllAuthForms();
renderTransactions();
updateSummary();



/**
 * TODO [Skilled]:
 * Tambahkan validasi input sebelum menyimpan data:
 *  - Tampilkan alert() dan hentikan proses jika judul kosong
 *  - Tampilkan alert() dan hentikan proses jika nominal kurang dari 1
 */

/**
 * TODO [Advanced]:
 * Setiap kali data transaksi berubah, perbarui Panel Dasbor:
 *  - Hitung total pemasukan, total pengeluaran, dan saldo (pemasukan - pengeluaran)
 *  - Tampilkan hasilnya ke elemen yang sesuai di HTML
 */


/**
 * ========================================================
 * Kriteria 2: Mengelola Penyimpanan Data (Web Storage API)
 * ========================================================
 */
/**
 * TODO [Basic]:
 * Data transaksi disimpan ke localStorage menggunakan JSON.stringify(), dan dimuat kembali saat halaman dibuka menggunakan JSON.parse().
 *  - Tombol "Hapus" berfungsi: transaksi yang dihapus langsung hilang dari layar dan dari localStorage.
 */

/**
 * TODO [Skilled]:
 * Tombol "Edit" berfungsi: saat ditekan, formulir (#transactionForm) secara otomatis terisi dengan data transaksi yang dipilih.
 *  - Pengguna dapat mengubah data lalu menyimpan perubahan.
 *  - Formulir kembali ke mode "Tambah" setelah pembaruan selesai.
 */

/**
 * TODO [Advanced]:
 * Gunakan Custom Event sebagai penghubung antara perubahan data dan pembaruan tampilan:
 *  - Kirim sinyal dengan document.dispatchEvent(new Event('transaction:updated')) setiap kali data berubah
 *  - Pasang satu listener untuk event tersebut yang memanggil fungsi render dan update dasbor
 */


/**
 * ========================================================
 * Kriteria 3: Fitur Interaktif (Pindah Kategori dan Pencarian)
 * ========================================================
 */
/**
 * TODO [Basic]:
 * Tambahkan tombol "Ubah Tipe" pada setiap kartu transaksi:
 *  - Saat diklik, ubah tipe transaksi: 'income' → 'expense' atau 'expense' → 'income'
 *  - Simpan perubahan ke localStorage dan perbarui tampilan
 */

/**
 * TODO [Skilled]:
 * Tambahkan event listener 'input' pada kolom pencarian:
 *  - Filter array transaksi berdasarkan kecocokan kata kunci dengan judul transaksi
 *  - Tampilkan hanya transaksi yang judulnya mengandung kata kunci tersebut
 */

/**
 * TODO [Advanced]:
 * Pastikan fitur pencarian berjalan dengan baik di semua kondisi:
 *  - Saat kolom pencarian dikosongkan, tampilkan kembali seluruh daftar transaksi
 */

