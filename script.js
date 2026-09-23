const API_URL =
  'https://script.google.com/macros/s/AKfycbx-KpDFXlX152DoB0Rk4GfFkmvK1SEhWiaFco5BX0GskCgAzVhgy-UYiDBLURDtnWN6/exec';


let token =
  sessionStorage.getItem('rose_token') || '';

let currentUsername =
  sessionStorage.getItem('rose_username') || '';

let products = [];

let currentPage = 'dashboard';


/* =========================
   ELEMENTS
========================= */

const loginPage =
  document.getElementById('loginPage');

const appPage =
  document.getElementById('appPage');

const loginForm =
  document.getElementById('loginForm');

const otpForm =
  document.getElementById('otpForm');

const loginMessage =
  document.getElementById('loginMessage');

const appMessage =
  document.getElementById('appMessage');

const usernameInput =
  document.getElementById('username');

const passwordInput =
  document.getElementById('password');

const emailInput =
  document.getElementById('email');

const otpInput =
  document.getElementById('otp');


/* =========================
   START
========================= */

document.addEventListener(
  'DOMContentLoaded',
  function () {

    bindEvents();

    if (token) {
      showApp();
      loadProducts();
    }

  }
);


/* =========================
   EVENTS
========================= */

function bindEvents() {

  loginForm.addEventListener(
    'submit',
    sendLogin
  );

  otpForm.addEventListener(
    'submit',
    verifyOtp
  );

  document
    .getElementById('backToLogin')
    .addEventListener(
      'click',
      function () {

        otpForm.classList.add('hidden');
        loginForm.classList.remove('hidden');

        loginMessage.textContent = '';

      }
    );

  document
    .getElementById('logoutBtn')
    .addEventListener(
      'click',
      logout
    );

  document
    .getElementById('settingsBtn')
    .addEventListener(
      'click',
      function () {
        showPage('settings');
      }
    );

  document
    .getElementById('homeBtn')
    .addEventListener(
      'click',
      function () {
        showPage('dashboard');
      }
    );

  document
    .getElementById('backBtn')
    .addEventListener(
      'click',
      function () {
        showPage('dashboard');
      }
    );

  document
    .getElementById('addProductBtn')
    .addEventListener(
      'click',
      function () {
        openAddProduct();
      }
    );

  document
    .getElementById('cancelProductBtn')
    .addEventListener(
      'click',
      function () {
        showPage('dashboard');
      }
    );

  document
    .getElementById('cancelStockBtn')
    .addEventListener(
      'click',
      function () {
        showPage('dashboard');
      }
    );

  document
    .getElementById('productForm')
    .addEventListener(
      'submit',
      saveProduct
    );

  document
    .getElementById('stockInForm')
    .addEventListener(
      'submit',
      saveStockIn
    );

  document
    .getElementById('settingsForm')
    .addEventListener(
      'submit',
      saveSettings
    );

  document
    .getElementById('searchInput')
    .addEventListener(
      'input',
      renderProducts
    );

}


/* =========================
   API
========================= */

async function api(action, data = {}) {

  const payload = {
    action: action,
    ...data
  };

  try {

    const response =
      await fetch(
        API_URL,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'text/plain;charset=utf-8'
          },

          body: JSON.stringify(payload)
        }
      );

    return await response.json();

  } catch (error) {

    return {
      success: false,
      message:
        'Unable to connect to the server. Check your Apps Script URL.'
    };
  }
}


/* =========================
   LOGIN
========================= */

async function sendLogin(event) {

  event.preventDefault();

  clearMessage(loginMessage);

  const username =
    usernameInput.value.trim();

  const password =
    passwordInput.value;

  const email =
    emailInput.value.trim();

  if (!username || !password || !email) {

    showMessage(
      loginMessage,
      'Please complete all fields.',
      'error'
    );

    return;
  }

  showMessage(
    loginMessage,
    'Sending OTP...',
    'info'
  );

  const result =
    await api(
      'login',
      {
        username,
        password,
        email
      }
    );

  if (!result.success) {

    showMessage(
      loginMessage,
      result.message,
      'error'
    );

    return;
  }

  showMessage(
    loginMessage,
    'OTP sent. Check your Gmail.',
    'success'
  );

  loginForm.classList.add('hidden');
  otpForm.classList.remove('hidden');

  otpInput.focus();
}


/* =========================
   OTP
========================= */

async function verifyOtp(event) {

  event.preventDefault();

  clearMessage(loginMessage);

  const username =
    usernameInput.value.trim();

  const email =
    emailInput.value.trim();

  const otp =
    otpInput.value.trim();

  if (!otp) {

    showMessage(
      loginMessage,
      'Please enter the OTP.',
      'error'
    );

    return;
  }

  showMessage(
    loginMessage,
    'Verifying OTP...',
    'info'
  );

  const result =
    await api(
      'verifyOtp',
      {
        username,
        email,
        otp
      }
    );

  if (!result.success) {

    showMessage(
      loginMessage,
      result.message,
      'error'
    );

    return;
  }

  token = result.token;
  currentUsername = result.username;

  sessionStorage.setItem(
    'rose_token',
    token
  );

  sessionStorage.setItem(
    'rose_username',
    currentUsername
  );

  showApp();

  loadProducts();
}


/* =========================
   APP
========================= */

function showApp() {

  loginPage.classList.add('hidden');

  appPage.classList.remove('hidden');

  showPage('dashboard');
}


function showPage(page) {

  currentPage = page;

  document
    .getElementById('dashboardPage')
    .classList.add('hidden');

  document
    .getElementById('productPage')
    .classList.add('hidden');

  document
    .getElementById('stockInPage')
    .classList.add('hidden');

  document
    .getElementById('settingsPage')
    .classList.add('hidden');

  if (page === 'dashboard') {

    document
      .getElementById('dashboardPage')
      .classList.remove('hidden');

    loadProducts();

  }

  if (page === 'product') {

    document
      .getElementById('productPage')
      .classList.remove('hidden');

  }

  if (page === 'stock') {

    document
      .getElementById('stockInPage')
      .classList.remove('hidden');

    loadStockProducts();

  }

  if (page === 'settings') {

    document
      .getElementById('settingsPage')
      .classList.remove('hidden');

    loadSettings();

    loadActivity();

  }
}


/* =========================
   PRODUCTS
========================= */

async function loadProducts() {

  const result =
    await api(
      'products',
      {
        token
      }
    );

  if (!result.success) {

    handleSessionError(
      result.message
    );

    return;
  }

  products =
    result.products || [];

  renderProducts();
  updateStats();
}


function renderProducts() {

  const tbody =
    document.getElementById(
      'productTableBody'
    );

  const search =
    document
      .getElementById('searchInput')
      .value
      .toLowerCase()
      .trim();

  const filtered =
    products.filter(
      function (product) {

        return (
          product.name
            .toLowerCase()
            .includes(search) ||

          product.category
            .toLowerCase()
            .includes(search)
        );

      }
    );

  tbody.innerHTML = '';

  if (filtered.length === 0) {

    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty">
          No products found.
        </td>
      </tr>
    `;

    return;
  }

  filtered.forEach(
    function (product) {

      const tr =
        document.createElement('tr');

      tr.innerHTML = `

        <td>
          <strong>
            ${esc(product.name)}
          </strong>
        </td>

        <td>
          ${esc(product.category || '-')}
        </td>

        <td>
          ${formatNumber(product.quantity)}
        </td>

        <td>
          ${esc(product.unit)}
        </td>

        <td>
          ₱${formatMoney(product.price)}
        </td>

        <td>
          <span class="status ${statusClass(product.status)}">
            ${esc(product.status)}
          </span>
        </td>

        <td>

          <div class="action-buttons">

            <button
              class="small-btn"
              onclick="openEditProduct('${escAttr(product.id)}')"
            >
              Edit
            </button>

            <button
              class="small-btn stock-btn"
              onclick="openStockIn('${escAttr(product.id)}')"
            >
              Stock In
            </button>

            <button
              class="small-btn delete-btn"
              onclick="deleteProduct('${escAttr(product.id)}')"
            >
              Delete
            </button>

          </div>

        </td>

      `;

      tbody.appendChild(tr);

    }
  );
}


/* =========================
   STATS
========================= */

function updateStats() {

  const totalProducts =
    products.length;

  const totalStock =
    products.reduce(
      (sum, product) =>
        sum + Number(product.quantity || 0),
      0
    );

  const lowStock =
    products.filter(
      product =>
        product.status === 'Low Stock' ||
        product.status === 'Out of Stock'
    ).length;

  const inventoryValue =
    products.reduce(
      (sum, product) =>
        sum +
        (
          Number(product.quantity || 0) *
          Number(product.price || 0)
        ),
      0
    );

  document.getElementById(
    'totalProducts'
  ).textContent =
    totalProducts;

  document.getElementById(
    'totalStock'
  ).textContent =
    formatNumber(totalStock);

  document.getElementById(
    'lowStock'
  ).textContent =
    lowStock;

  document.getElementById(
    'inventoryValue'
  ).textContent =
    '₱' + formatMoney(inventoryValue);
}


/* =========================
   ADD PRODUCT
========================= */

function openAddProduct() {

  document.getElementById(
    'productForm'
  ).reset();

  document.getElementById(
    'productId'
  ).value = '';

  document.getElementById(
    'productFormTitle'
  ).textContent =
    'Add Product';

  showPage('product');
}


/* =========================
   EDIT PRODUCT
========================= */

function openEditProduct(id) {

  const product =
    products.find(
      p => String(p.id) === String(id)
    );

  if (!product) return;

  document.getElementById(
    'productId'
  ).value =
    product.id;

  document.getElementById(
    'productName'
  ).value =
    product.name;

  document.getElementById(
    'productCategory'
  ).value =
    product.category;

  document.getElementById(
    'productQuantity'
  ).value =
    product.quantity;

  document.getElementById(
    'productUnit'
  ).value =
    product.unit;

  document.getElementById(
    'productPrice'
  ).value =
    product.price;

  document.getElementById(
    'productFormTitle'
  ).textContent =
    'Edit Product';

  showPage('product');
}


/* =========================
   SAVE PRODUCT
========================= */

async function saveProduct(event) {

  event.preventDefault();

  const id =
    document.getElementById(
      'productId'
    ).value;

  const data = {

    token,

    id,

    name:
      document.getElementById(
        'productName'
      ).value.trim(),

    category:
      document.getElementById(
        'productCategory'
      ).value.trim(),

    quantity:
      Number(
        document.getElementById(
          'productQuantity'
        ).value
      ),

    unit:
      document.getElementById(
        'productUnit'
      ).value,

    price:
      Number(
        document.getElementById(
          'productPrice'
        ).value
      )

  };

  const action =
    id ? 'editProduct' : 'addProduct';

  const result =
    await api(
      action,
      data
    );

  if (!result.success) {

    showMessage(
      appMessage,
      result.message,
      'error'
    );

    return;
  }

  showMessage(
    appMessage,
    result.message,
    'success'
  );

  await loadProducts();

  showPage('dashboard');
}


/* =========================
   DELETE
========================= */

async function deleteProduct(id) {

  const product =
    products.find(
      p => String(p.id) === String(id)
    );

  if (!product) return;

  const confirmed =
    confirm(
      'Delete "' +
      product.name +
      '" from inventory?'
    );

  if (!confirmed) return;

  const result =
    await api(
      'deleteProduct',
      {
        token,
        id
      }
    );

  if (!result.success) {

    showMessage(
      appMessage,
      result.message,
      'error'
    );

    return;
  }

  showMessage(
    appMessage,
    '✓ ' +
    result.message,
    'success'
  );

  await loadProducts();
}


/* =========================
   STOCK IN
========================= */

function openStockIn(id) {

  showPage('stock');

  setTimeout(
    function () {

      const select =
        document.getElementById(
          'stockProduct'
        );

      select.value = id;

    },
    50
  );
}


function loadStockProducts() {

  const select =
    document.getElementById(
      'stockProduct'
    );

  select.innerHTML = '';

  products.forEach(
    function (product) {

      const option =
        document.createElement(
          'option'
        );

      option.value =
        product.id;

      option.textContent =
        product.name +
        ' — Current: ' +
        formatNumber(product.quantity);

      select.appendChild(option);

    }
  );
}


async function saveStockIn(event) {

  event.preventDefault();

  const id =
    document.getElementById(
      'stockProduct'
    ).value;

  const amount =
    Number(
      document.getElementById(
        'stockAmount'
      ).value
    );

  const result =
    await api(
      'stockIn',
      {
        token,
        id,
        amount
      }
    );

  if (!result.success) {

    showMessage(
      appMessage,
      result.message,
      'error'
    );

    return;
  }

  document
    .getElementById('stockInForm')
    .reset();

  showMessage(
    appMessage,
    result.message,
    'success'
  );

  await loadProducts();

  showPage('dashboard');
}


/* =========================
   SETTINGS
========================= */

async function loadSettings() {

  const result =
    await api(
      'settings',
      {
        token
      }
    );

  if (!result.success) {

    handleSessionError(
      result.message
    );

    return;
  }

  const settings =
    result.settings;

  document.getElementById(
    'reorderLevel'
  ).value =
    settings.reorderLevel;

  document.getElementById(
    'lowStockThreshold'
  ).value =
    settings.lowStockThreshold;

  document.getElementById(
    'defaultUnit'
  ).value =
    settings.defaultUnit;
}


async function saveSettings(event) {

  event.preventDefault();

  const data = {

    token,

    reorderLevel:
      Number(
        document.getElementById(
          'reorderLevel'
        ).value
      ),

    lowStockThreshold:
      Number(
        document.getElementById(
          'lowStockThreshold'
        ).value
      ),

    defaultUnit:
      document.getElementById(
        'defaultUnit'
      ).value,

    currentPassword:
      document.getElementById(
        'currentPassword'
      ).value

  };

  const result =
    await api(
      'updateSettings',
      data
    );

  if (!result.success) {

    showMessage(
      appMessage,
      result.message,
      'error'
    );

    return;
  }

  document.getElementById(
    'currentPassword'
  ).value = '';

  showMessage(
    appMessage,
    result.message,
    'success'
  );

  await loadProducts();
  await loadActivity();
}


/* =========================
   ACTIVITY
========================= */

async function loadActivity() {

  const result =
    await api(
      'activity',
      {
        token
      }
    );

  if (!result.success) {

    handleSessionError(
      result.message
    );

    return;
  }

  const activity =
    result.activity || [];

  const loginActivity =
    activity.filter(
      item =>
        [
          'LOGIN',
          'FAILED LOGIN',
          'LOGOUT',
          'OTP'
        ].includes(item.action)
    );

  const recentActivity =
    activity.filter(
      item =>
        ![
          'LOGIN',
          'FAILED LOGIN',
          'LOGOUT',
          'OTP'
        ].includes(item.action)
    );

  renderActivity(
    'loginActivity',
    loginActivity
  );

  renderActivity(
    'recentActivity',
    recentActivity
  );
}


function renderActivity(
  elementId,
  activity
) {

  const container =
    document.getElementById(
      elementId
    );

  container.innerHTML = '';

  if (activity.length === 0) {

    container.innerHTML = `
      <div class="empty">
        No activity records found.
      </div>
    `;

    return;
  }

  activity.forEach(
    function (item) {

      const div =
        document.createElement('div');

      div.className =
        'activity-item';

      div.innerHTML = `

        <div>

          <strong>
            ${esc(item.action)}
          </strong>

          <p>
            ${esc(item.details)}
          </p>

        </div>

        <div class="activity-right">

          <span class="activity-status">
            ${esc(item.status)}
          </span>

          <small>
            ${formatDate(item.date)}
          </small>

        </div>

      `;

      container.appendChild(div);

    }
  );
}


/* =========================
   LOGOUT
========================= */

async function logout() {

  await api(
    'logout',
    {
      token
    }
  );

  token = '';
  currentUsername = '';

  sessionStorage.removeItem(
    'rose_token'
  );

  sessionStorage.removeItem(
    'rose_username'
  );

  appPage.classList.add('hidden');
  loginPage.classList.remove('hidden');

  loginForm.classList.remove('hidden');
  otpForm.classList.add('hidden');

  loginForm.reset();
  otpForm.reset();

  showMessage(
    loginMessage,
    'You have been logged out.',
    'success'
  );
}


/* =========================
   SESSION
========================= */

function handleSessionError(message) {

  if (
    message &&
    message.toLowerCase()
      .includes('session')
  ) {

    token = '';

    sessionStorage.removeItem(
      'rose_token'
    );

    sessionStorage.removeItem(
      'rose_username'
    );

    appPage.classList.add('hidden');
    loginPage.classList.remove('hidden');

    return;
  }

  showMessage(
    appMessage,
    message,
    'error'
  );
}


/* =========================
   MESSAGE
========================= */

function showMessage(
  element,
  message,
  type
) {

  element.textContent =
    message;

  element.className =
    'message ' + type;
}


function clearMessage(element) {

  element.textContent = '';

  element.className =
    'message';
}


/* =========================
   FORMATTING
========================= */

function formatMoney(value) {

  return Number(value || 0)
    .toLocaleString(
      'en-PH',
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    );
}


function formatNumber(value) {

  return Number(value || 0)
    .toLocaleString(
      'en-PH',
      {
        maximumFractionDigits: 2
      }
    );
}


function formatDate(value) {

  if (!value) return '';

  const date =
    new Date(value);

  if (isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString(
    'en-PH',
    {
      dateStyle: 'medium',
      timeStyle: 'short'
    }
  );
}


function statusClass(status) {

  if (status === 'In Stock') {
    return 'in-stock';
  }

  if (status === 'Low Stock') {
    return 'low-stock';
  }

  return 'out-stock';
}


/* =========================
   SECURITY HELPERS
========================= */

function esc(value) {

  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}


function escAttr(value) {

  return String(value ?? '')
    .replaceAll('\\', '\\\\')
    .replaceAll("'", "\\'");
}
