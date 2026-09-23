/* =========================================================
   ROSE BAKESHOP INVENTORY SYSTEM
   FRONTEND JAVASCRIPT
========================================================= */

const API_URL =
  'https://script.google.com/macros/s/AKfycbx-KpDFXlX152DoB0Rk4GfFkmv1KSEhWiaFco5BX0GskAzVhgy-UYiDBLURDtnWN6/exec';


/* =========================================================
   SESSION
========================================================= */

let token = sessionStorage.getItem('rose_token') || '';
let currentUsername =
  sessionStorage.getItem('rose_username') || '';

let products = [];
let previousPage = 'dashboard';


/* =========================================================
   ELEMENTS
========================================================= */

const loginPage =
  document.getElementById('loginPage');

const appPage =
  document.getElementById('appPage');

const loginForm =
  document.getElementById('loginForm');

const otpForm =
  document.getElementById('otpForm');

const usernameInput =
  document.getElementById('username');

const passwordInput =
  document.getElementById('password');

const emailInput =
  document.getElementById('email');

const otpInput =
  document.getElementById('otp');

const loginMessage =
  document.getElementById('loginMessage');

const otpMessage =
  document.getElementById('otpMessage');

const productsBody =
  document.getElementById('productsBody');

const activityBody =
  document.getElementById('activityBody');

const totalProducts =
  document.getElementById('totalProducts');

const totalStock =
  document.getElementById('totalStock');

const inventoryValue =
  document.getElementById('inventoryValue');

const lowStockCount =
  document.getElementById('lowStockCount');


/* =========================================================
   PAGE ELEMENTS
========================================================= */

const pages = {
  dashboard:
    document.getElementById('dashboardPage'),

  addProduct:
    document.getElementById('addProductPage'),

  editProduct:
    document.getElementById('editProductPage'),

  stockIn:
    document.getElementById('stockInPage'),

  settings:
    document.getElementById('settingsPage')
};


/* =========================================================
   UTILITY
========================================================= */

function showElement(element) {
  if (element) {
    element.classList.remove('hidden');
  }
}


function hideElement(element) {
  if (element) {
    element.classList.add('hidden');
  }
}


function clearMessage(element) {
  if (!element) return;

  element.textContent = '';
  element.className = 'message';
}


function showMessage(element, message, type = 'info') {

  if (!element) return;

  element.textContent = message;

  element.className =
    'message ' + type;
}


function escapeHtml(value) {

  if (value === null || value === undefined) {
    return '';
  }

  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


function money(value) {

  const number = Number(value) || 0;

  return '₱' +
    number.toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
}


function formatNumber(value) {

  return (Number(value) || 0)
    .toLocaleString('en-PH');
}


/* =========================================================
   API
========================================================= */

async function api(action, data = {}) {

  const payload = {
    action: action,
    ...data
  };

  try {

    console.log(
      'API REQUEST:',
      action
    );

    const response = await fetch(
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


    if (!response.ok) {

      throw new Error(
        'Server returned HTTP ' +
        response.status
      );

    }


    const text =
      await response.text();


    console.log(
      'API RESPONSE:',
      text
    );


    if (!text) {

      throw new Error(
        'The server returned an empty response.'
      );

    }


    try {

      return JSON.parse(text);

    } catch (error) {

      console.error(
        'Invalid server response:',
        text
      );

      return {
        success: false,
        message:
          'The Apps Script server returned an invalid response.'
      };

    }

  } catch (error) {

    console.error(
      'API connection error:',
      error
    );

    return {
      success: false,
      message:
        'Unable to connect to the server. Please check your Apps Script deployment.'
    };

  }

}


/* =========================================================
   LOGIN
========================================================= */

async function sendLogin(event) {

  /*
    VERY IMPORTANT:
    This prevents the browser from refreshing
    the page when Send OTP is pressed.
  */

  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }


  clearMessage(loginMessage);


  const username =
    usernameInput.value.trim();

  const password =
    passwordInput.value;

  const email =
    emailInput.value.trim();


  if (!username) {

    showMessage(
      loginMessage,
      'Please enter your username.',
      'error'
    );

    usernameInput.focus();

    return;
  }


  if (!password) {

    showMessage(
      loginMessage,
      'Please enter your password.',
      'error'
    );

    passwordInput.focus();

    return;
  }


  if (!email) {

    showMessage(
      loginMessage,
      'Please enter your Gmail address.',
      'error'
    );

    emailInput.focus();

    return;
  }


  if (!email.toLowerCase().endsWith('@gmail.com')) {

    showMessage(
      loginMessage,
      'Please enter a valid Gmail address.',
      'error'
    );

    emailInput.focus();

    return;
  }


  const button =
    document.getElementById('sendOtpBtn');


  if (button) {

    button.disabled = true;

    button.textContent =
      'Sending OTP...';

  }


  showMessage(
    loginMessage,
    'Sending OTP to your Gmail...',
    'info'
  );


  try {

    const result =
      await api(
        'login',
        {
          username: username,
          password: password,
          email: email
        }
      );


    console.log(
      'LOGIN RESULT:',
      result
    );


    if (!result || !result.success) {

      showMessage(
        loginMessage,
        result &&
        result.message
          ? result.message
          : 'Login failed.',
        'error'
      );

      /*
        IMPORTANT:
        Do NOT clear username,
        password, or email here.
      */

      return;
    }


    /*
      OTP was successfully sent.
      Keep the user's login information
      while moving to the OTP screen.
    */

    showMessage(
      otpMessage,
      'OTP sent successfully. Check your Gmail.',
      'success'
    );


    hideElement(loginForm);

    showElement(otpForm);


    otpInput.value = '';

    otpInput.focus();

  } catch (error) {

    console.error(
      'SEND OTP ERROR:',
      error
    );

    showMessage(
      loginMessage,
      'An error occurred while sending the OTP.',
      'error'
    );

  } finally {

    if (button) {

      button.disabled = false;

      button.textContent =
        'Send OTP';

    }

  }

}


/* =========================================================
   VERIFY OTP
========================================================= */

async function verifyOtp(event) {

  if (event) {

    event.preventDefault();
    event.stopPropagation();

  }


  clearMessage(otpMessage);


  const username =
    usernameInput.value.trim();

  const email =
    emailInput.value.trim();

  const otp =
    otpInput.value.trim();


  if (!otp) {

    showMessage(
      otpMessage,
      'Please enter the OTP.',
      'error'
    );

    otpInput.focus();

    return;
  }


  if (otp.length !== 6) {

    showMessage(
      otpMessage,
      'OTP must contain 6 digits.',
      'error'
    );

    otpInput.focus();

    return;
  }


  const button =
    document.getElementById('verifyOtpBtn');


  if (button) {

    button.disabled = true;

    button.textContent =
      'Verifying...';

  }


  showMessage(
    otpMessage,
    'Verifying OTP...',
    'info'
  );


  try {

    const result =
      await api(
        'verifyOtp',
        {
          username: username,
          email: email,
          otp: otp
        }
      );


    console.log(
      'OTP RESULT:',
      result
    );


    if (!result || !result.success) {

      showMessage(
        otpMessage,
        result &&
        result.message
          ? result.message
          : 'Invalid OTP.',
        'error'
      );

      return;
    }


    token =
      result.token || '';

    currentUsername =
      result.username ||
      username;


    if (!token) {

      showMessage(
        otpMessage,
        'Login succeeded, but no session token was returned.',
        'error'
      );

      return;
    }


    sessionStorage.setItem(
      'rose_token',
      token
    );

    sessionStorage.setItem(
      'rose_username',
      currentUsername
    );


    /*
      Now the login is complete.
    */

    showApp();


    await loadProducts();


  } catch (error) {

    console.error(
      'OTP VERIFICATION ERROR:',
      error
    );

    showMessage(
      otpMessage,
      'An error occurred while verifying the OTP.',
      'error'
    );

  } finally {

    if (button) {

      button.disabled = false;

      button.textContent =
        'Verify OTP';

    }

  }

}


/* =========================================================
   RETURN TO LOGIN
========================================================= */

function backToLogin() {

  hideElement(otpForm);

  showElement(loginForm);

  clearMessage(otpMessage);
   /*
    We intentionally keep the username,
    password and Gmail fields.
  */

  otpInput.value = '';

}


/* =========================================================
   SHOW APPLICATION
========================================================= */

function showApp() {

  hideElement(loginPage);

  showElement(appPage);

  showPage('dashboard');

}


/* =========================================================
   SHOW LOGIN
========================================================= */

function showLogin() {

  hideElement(appPage);

  showElement(loginPage);

  hideElement(otpForm);

  showElement(loginForm);

}


/* =========================================================
   PAGE NAVIGATION
========================================================= */

function showPage(pageName) {

  Object.keys(pages).forEach(
    function (key) {

      if (pages[key]) {

        hideElement(pages[key]);

      }

    }
  );


  if (pages[pageName]) {

    showElement(
      pages[pageName]
    );

  }


  previousPage =
    pageName;


  if (pageName === 'dashboard') {

    loadProducts();

  }


  if (pageName === 'settings') {

    loadSettings();

    loadActivity();

  }


  if (pageName === 'stockIn') {

    populateStockProducts();

  }

}


/* =========================================================
   LOAD PRODUCTS
========================================================= */

async function loadProducts() {

  if (!token) return;


  const result =
    await api(
      'products',
      {
        token: token
      }
    );


  if (!result || !result.success) {

    handleSessionError(
      result
    );

    return;
  }


  products =
    Array.isArray(result.products)
      ? result.products
      : [];


  renderProducts();

  updateDashboard();

  populateStockProducts();

}


/* =========================================================
   RENDER PRODUCTS
========================================================= */

function renderProducts() {

  if (!productsBody) return;


  if (!products.length) {

    productsBody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-row">
          No products available.
        </td>
      </tr>
    `;

    return;
  }


  productsBody.innerHTML =
    products.map(
      function (product) {

        const productId =
          product.productId ||
          product.id ||
          '';


        const name =
          product.productName ||
          product.name ||
          '';


        const category =
          product.category ||
          '';


        const quantity =
          Number(
            product.quantity || 0
          );


        const unit =
          product.unit ||
          'pcs';


        const price =
          Number(
            product.price || 0
          );


        const status =
          product.status ||
          getLocalStockStatus(
            quantity
          );


        return `
          <tr>

            <td>
              ${escapeHtml(productId)}
            </td>

            <td>
              ${escapeHtml(name)}
            </td>

            <td>
              ${escapeHtml(category)}
            </td>

            <td>
              ${formatNumber(quantity)}
            </td>

            <td>
              ${escapeHtml(unit)}
            </td>

            <td>
              ${money(price)}
            </td>

            <td>
              <span class="status-badge">
                ${escapeHtml(status)}
              </span>
            </td>

            <td>

              <div class="action-buttons">

                <button
                  type="button"
                  class="small-btn stock-btn"
                  data-id="${escapeHtml(productId)}"
                >
                  Stock In
                </button>

                <button
                  type="button"
                  class="small-btn edit-btn"
                  data-id="${escapeHtml(productId)}"
                >
                  Edit
                </button>

                <button
                  type="button"
                  class="small-btn delete-btn"
                  data-id="${escapeHtml(productId)}"
                >
                  Delete
                </button>

              </div>

            </td>

          </tr>
        `;

      }
    ).join('');


  /*
    Attach product button events
  */

  document
    .querySelectorAll('.stock-btn')
    .forEach(
      function (button) {

        button.addEventListener(
          'click',
          function () {

            openStockIn(
              button.dataset.id
            );

          }
        );

      }
    );


  document
    .querySelectorAll('.edit-btn')
    .forEach(
      function (button) {

        button.addEventListener(
          'click',
          function () {

            openEditProduct(
              button.dataset.id
            );

          }
        );

      }
    );


  document
    .querySelectorAll('.delete-btn')
    .forEach(
      function (button) {

        button.addEventListener(
          'click',
          function () {

            deleteProduct(
              button.dataset.id
            );

          }
        );

      }
    );

}


/* =========================================================
   LOCAL STOCK STATUS
========================================================= */

function getLocalStockStatus(quantity) {

  const qty =
    Number(quantity) || 0;


  if (qty <= 0) {

    return 'Out of Stock';

  }


  if (qty <= 5) {

    return 'Low Stock';

  }


  return 'In Stock';

}


/* =========================================================
   DASHBOARD
========================================================= */

function updateDashboard() {

  let stock = 0;

  let value = 0;

  let low = 0;


  products.forEach(
    function (product) {

      const quantity =
        Number(
          product.quantity || 0
        );


      const price =
        Number(
          product.price || 0
        );


      stock += quantity;

      value +=
        quantity * price;


      if (
        quantity <= 5
      ) {

        low++;

      }

    }
  );


  if (totalProducts) {

    totalProducts.textContent =
      products.length;

  }


  if (totalStock) {

    totalStock.textContent =
      formatNumber(stock);

  }


  if (inventoryValue) {

    inventoryValue.textContent =
      money(value);

  }


  if (lowStockCount) {

    lowStockCount.textContent =
      low;

  }

}


/* =========================================================
   ADD PRODUCT
========================================================= */

async function addProduct(event) {

  event.preventDefault();
  event.stopPropagation();


  const name =
    document.getElementById(
      'addProductName'
    ).value.trim();


  const category =
    document.getElementById(
      'addCategory'
    ).value.trim();


  const quantity =
    Number(
      document.getElementById(
        'addQuantity'
      ).value
    );


  const unit =
    document.getElementById(
      'addUnit'
    ).value;


  const price =
    Number(
      document.getElementById(
        'addPrice'
      ).value
    );


  const message =
    document.getElementById(
      'addProductMessage'
    );


  if (!name || !category) {

    showMessage(
      message,
      'Please complete all required fields.',
      'error'
    );

    return;
  }


  const result =
    await api(
      'addProduct',
      {
        token: token,
        productName: name,
        category: category,
        quantity: quantity,
        unit: unit,
        price: price
      }
    );


  if (!result || !result.success) {

    handleSessionError(
      result
    );

    showMessage(
      message,
      result &&
      result.message
        ? result.message
        : 'Unable to add product.',
      'error'
    );

    return;
  }


  showNotification(
    'Product added successfully.'
  );


  document
    .getElementById(
      'addProductForm'
    )
    .reset();


  await loadProducts();

  showPage('dashboard');

}


/* =========================================================
   OPEN ADD PRODUCT
========================================================= */

function openAddProduct() {

  const form =
    document.getElementById(
      'addProductForm'
    );


  if (form) {

    form.reset();

  }


  showPage('addProduct');

}


/* =========================================================
   EDIT PRODUCT
========================================================= */

function openEditProduct(productId) {

  const product =
    products.find(
      function (item) {

        return String(
          item.productId ||
          item.id
        ) === String(productId);

      }
    );


  if (!product) {

    showNotification(
      'Product was not found.',
      'error'
    );

    return;
  }


  document.getElementById(
    'editProductId'
  ).value =
    product.productId ||
    product.id ||
    '';


  document.getElementById(
    'editProductName'
  ).value =
    product.productName ||
    product.name ||
    '';


  document.getElementById(
    'editCategory'
  ).value =
    product.category ||
    '';


  document.getElementById(
    'editQuantity'
  ).value =
    product.quantity || 0;


  document.getElementById(
    'editUnit'
  ).value =
    product.unit || 'pcs';


  document.getElementById(
    'editPrice'
  ).value =
    product.price || 0;


  showPage('editProduct');

}


async function editProduct(event) {

  event.preventDefault();
  event.stopPropagation();


  const productId =
    document.getElementById(
      'editProductId'
    ).value;


  const name =
    document.getElementById(
      'editProductName'
    ).value.trim();


  const category =
    document.getElementById(
      'editCategory'
    ).value.trim();


  const quantity =
    Number(
      document.getElementById(
        'editQuantity'
      ).value
    );


  const unit =
    document.getElementById(
      'editUnit'
    ).value;


  const price =
    Number(
      document.getElementById(
        'editPrice'
      ).value
    );


  const message =
    document.getElementById(
      'editProductMessage'
    );


  const result =
    await api(
      'editProduct',
      {
        token: token,
        productId: productId,
        productName: name,
        category: category,
        quantity: quantity,
        unit: unit,
        price: price
      }
    );


  if (!result || !result.success) {

    handleSessionError(
      result
    );

    showMessage(
      message,
      result &&
      result.message
        ? result.message
        : 'Unable to update product.',
      'error'
    );

    return;
  }


  showNotification(
    'Product updated successfully.'
  );


  await loadProducts();

  showPage('dashboard');

}


/* =========================================================
   DELETE PRODUCT
========================================================= */

async function deleteProduct(productId) {

  const product =
    products.find(
      function (item) {

        return String(
          item.productId ||
          item.id
        ) === String(productId);

      }
    );


  if (!product) {

    showNotification(
      'Product was not found.',
      'error'
    );

    return;
  }


  const name =
    product.productName ||
    product.name ||
    'this product';


  const confirmed =
    window.confirm(
      'Delete "' +
      name +
      '" from inventory?'
    );


  if (!confirmed) {

    return;

  }


  const result =
    await api(
      'deleteProduct',
      {
        token: token,
        productId: productId
      }
    );


  if (!result || !result.success) {

    handleSessionError(
      result
    );

    showNotification(
      result &&
      result.message
        ? result.message
        : 'Unable to delete product.',
      'error'
    );

    return;
  }


  /*
    The backend records the deletion
    in ActivityLog.
  */

  showNotification(
    'Product deleted successfully.'
  );


  await loadProducts();


  if (
    document
      .getElementById(
        'settingsPage'
      )
      .classList.contains('hidden') === false
  ) {

    await loadActivity();

  }

}


/* =========================================================
   STOCK IN
========================================================= */

function populateStockProducts() {

  const select =
    document.getElementById(
      'stockProductId'
    );


  if (!select) return;


  select.innerHTML =
    '<option value="">Select Product</option>';


  products.forEach(
    function (product) {

      const id =
        product.productId ||
        product.id;


      const name =
        product.productName ||
        product.name ||
        'Product';


      const option =
        document.createElement(
          'option'
        );


      option.value = id;

      option.textContent =
        name;


      select.appendChild(
        option
      );

    }
  );

}


function openStockIn(productId) {

  populateStockProducts();


  const select =
    document.getElementById(
      'stockProductId'
    );


  select.value =
    productId;


  document.getElementById(
    'stockQuantity'
  ).value = '';


  showPage('stockIn');

}


async function stockIn(event) {

  event.preventDefault();
  event.stopPropagation();


  const productId =
    document.getElementById(
      'stockProductId'
    ).value;


  const quantity =
    Number(
      document.getElementById(
        'stockQuantity'
      ).value
    );


  const message =
    document.getElementById(
      'stockInMessage'
    );


  if (!productId) {

    showMessage(
      message,
      'Please select a product.',
      'error'
    );

    return;
  }


  if (
    !quantity ||
    quantity <= 0
  ) {

    showMessage(
      message,
      'Please enter a valid stock quantity.',
      'error'
    );

    return;
  }


  const result =
    await api(
      'stockIn',
      {
        token: token,
        productId: productId,
        quantity: quantity
      }
    );


  if (!result || !result.success) {

    handleSessionError(
      result
    );

    showMessage(
      message,
      result &&
      result.message
        ? result.message
        : 'Unable to add stock.',
      'error'
    );

    return;
  }


  showNotification(
    'Stock added successfully.'
  );


  document
    .getElementById(
      'stockInForm'
    )
    .reset();


  await loadProducts();

  showPage('dashboard');

}


/* =========================================================
   SETTINGS
========================================================= */

async function loadSettings() {

  if (!token) return;


  const result =
    await api(
      'settings',
      {
        token: token
      }
    );


  if (!result || !result.success) {

    handleSessionError(
      result
    );

    return;
  }


  const settings =
    result.settings || {};


  const reorder =
    document.getElementById(
      'reorderLevel'
    );

const threshold =
    document.getElementById(
      'lowStockThreshold'
    );


  const unit =
    document.getElementById(
      'defaultUnit'
    );


  if (reorder) {

    reorder.value =
      settings.reorderLevel ??
      20;

  }


  if (threshold) {

    threshold.value =
      settings.lowStockThreshold ??
      5;

  }


  if (unit) {

    unit.value =
      settings.defaultUnit ||
      'pcs';

  }

}


async function updateSettings(event) {

  event.preventDefault();
  event.stopPropagation();


  const reorderLevel =
    Number(
      document.getElementById(
        'reorderLevel'
      ).value
    );


  const lowStockThreshold =
    Number(
      document.getElementById(
        'lowStockThreshold'
      ).value
    );


  const defaultUnit =
    document.getElementById(
      'defaultUnit'
    ).value;


  const currentPassword =
    document.getElementById(
      'settingsPassword'
    ).value;


  const message =
    document.getElementById(
      'settingsMessage'
    );


  if (!currentPassword) {

    showMessage(
      message,
      'Enter your current password to authorize this change.',
      'error'
    );

    return;
  }


  const result =
    await api(
      'updateSettings',
      {
        token: token,
        reorderLevel: reorderLevel,
        lowStockThreshold: lowStockThreshold,
        defaultUnit: defaultUnit,
        currentPassword: currentPassword
      }
    );


  if (!result || !result.success) {

    handleSessionError(
      result
    );

    showMessage(
      message,
      result &&
      result.message
        ? result.message
        : 'Unable to update settings.',
      'error'
    );

    return;
  }


  document.getElementById(
    'settingsPassword'
  ).value = '';


  showMessage(
    message,
    'Settings updated successfully.',
    'success'
  );


  showNotification(
    'Settings updated successfully.'
  );


  await loadActivity();

}


/* =========================================================
   ACTIVITY LOG
========================================================= */

async function loadActivity() {

  if (!token) return;


  const result =
    await api(
      'activity',
      {
        token: token
      }
    );


  if (!result || !result.success) {

    handleSessionError(
      result
    );

    return;
  }


  const activity =
    Array.isArray(result.activity)
      ? result.activity
      : [];


  renderActivity(
    activity
  );

}


function renderActivity(activity) {

  if (!activityBody) return;


  if (!activity.length) {

    activityBody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-row">
          No activity records.
        </td>
      </tr>
    `;

    return;
  }


  activityBody.innerHTML =
    activity.map(
      function (item) {

        return `
          <tr>

            <td>
              ${escapeHtml(
                item.dateTime ||
                item.timestamp ||
                ''
              )}
            </td>

            <td>
              ${escapeHtml(
                item.username ||
                ''
              )}
            </td>

            <td>
              ${escapeHtml(
                item.action ||
                ''
              )}
            </td>

            <td>
              ${escapeHtml(
                item.details ||
                ''
              )}
            </td>

            <td>
              ${escapeHtml(
                item.status ||
                ''
              )}
            </td>

          </tr>
        `;

      }
    ).join('');

}


/* =========================================================
   LOGOUT
========================================================= */

async function logout() {

  if (token) {

    await api(
      'logout',
      {
        token: token
      }
    );

  }


  sessionStorage.removeItem(
    'rose_token'
  );

  sessionStorage.removeItem(
    'rose_username'
  );


  token = '';

  currentUsername = '';


  showLogin();


  loginForm.reset();

  otpForm.reset();


  clearMessage(
    loginMessage
  );

  clearMessage(
    otpMessage
  );

}


/* =========================================================
   SESSION ERROR
========================================================= */

function handleSessionError(result) {

  if (!result) return;


  const message =
    String(
      result.message || ''
    ).toLowerCase();


  if (
    message.includes('session') ||
    message.includes('token') ||
    message.includes('login required')
  ) {

    sessionStorage.removeItem(
      'rose_token'
    );

    sessionStorage.removeItem(
      'rose_username'
    );


    token = '';

    currentUsername = '';


    showLogin();


    showMessage(
      loginMessage,
      'Your session has expired. Please log in again.',
      'error'
    );

  }

}


/* =========================================================
   SYSTEM NOTIFICATION
========================================================= */

function showNotification(
  message,
  type = 'success'
) {

  const notification =
    document.getElementById(
      'systemNotification'
    );


  const text =
    document.getElementById(
      'notificationText'
    );


  if (!notification || !text) {
    return;
  }


  text.textContent =
    message;


  notification.className =
    'system-notification ' +
    type;


  showElement(
    notification
  );


  setTimeout(
    function () {

      hideElement(
        notification
      );

    },
    3500
  );

}


/* =========================================================
   EVENT LISTENERS
========================================================= */

document.addEventListener(
  'DOMContentLoaded',
  function () {


    /*
      LOGIN

      We use addEventListener instead of
      allowing normal form submission.
    */

    if (loginForm) {

      loginForm.addEventListener(
        'submit',
        sendLogin
      );

    }


    /*
      OTP
    */

    if (otpForm) {

      otpForm.addEventListener(
        'submit',
        verifyOtp
      );

    }


    /*
      Back to login
    */

    const backToLoginBtn =
      document.getElementById(
        'backToLoginBtn'
      );


    if (backToLoginBtn) {

      backToLoginBtn.addEventListener(
        'click',
        backToLogin
      );

    }


    /*
      Add Product
    */

    const addProductForm =
      document.getElementById(
        'addProductForm'
      );


    if (addProductForm) {

      addProductForm.addEventListener(
        'submit',
        addProduct
      );

    }


    /*
      Edit Product
    */

    const editProductForm =
      document.getElementById(
        'editProductForm'
      );


    if (editProductForm) {

      editProductForm.addEventListener(
        'submit',
        editProduct
      );

    }


    /*
      Stock In
    */

    const stockInForm =
      document.getElementById(
        'stockInForm'
      );


    if (stockInForm) {

      stockInForm.addEventListener(
        'submit',
        stockIn
      );

    }


    /*
      Settings
    */

    const settingsForm =
      document.getElementById(
        'settingsForm'
      );


    if (settingsForm) {

      settingsForm.addEventListener(
        'submit',
        updateSettings
      );

    }


    /*
      Add Product button
    */

    const addProductBtn =
      document.getElementById(
        'addProductBtn'
      );


    if (addProductBtn) {

      addProductBtn.addEventListener(
        'click',
        openAddProduct
      );

    }


    /*
      Cancel Add
    */

    const cancelAddBtn =
      document.getElementById(
        'cancelAddBtn'
      );


    if (cancelAddBtn) {

      cancelAddBtn.addEventListener(
        'click',
        function () {

          showPage('dashboard');

        }
      );

    }


    /*
      Cancel Edit
    */

    const cancelEditBtn =
      document.getElementById(
        'cancelEditBtn'
      );


    if (cancelEditBtn) {

      cancelEditBtn.addEventListener(
        'click',
        function () {

          showPage('dashboard');

        }
      );

    }


    /*
      Cancel Stock
    */

    const cancelStockBtn =
      document.getElementById(
        'cancelStockBtn'
      );


    if (cancelStockBtn) {

      cancelStockBtn.addEventListener(
        'click',
        function () {

          showPage('dashboard');

        }
      );

    }


    /*
      Home
    */

    const homeBtn =
      document.getElementById(
        'homeBtn'
      );


    if (homeBtn) {

      homeBtn.addEventListener(
        'click',
        function () {

          showPage('dashboard');

        }
      );

    }


    /*
      Back
    */

    const backBtn =
      document.getElementById(
        'backBtn'
      );


    if (backBtn) {

      backBtn.addEventListener(
        'click',
        function () {

          showPage(
            previousPage === 'dashboard'
              ? 'dashboard'
              : 'dashboard'
          );

        }
      );

    }


    /*
      Settings
    */

    const settingsBtn =
      document.getElementById(
        'settingsBtn'
      );


    if (settingsBtn) {

      settingsBtn.addEventListener(
        'click',
        function () {

          showPage('settings');

        }
      );

    }


    /*
      Logout
    */

    const logoutBtn =
      document.getElementById(
        'logoutBtn'
      );


    if (logoutBtn) {

      logoutBtn.addEventListener(
        'click',
        logout
      );

    }


    /*
      Refresh products
    */

    const refreshProductsBtn =
      document.getElementById(
        'refreshProductsBtn'
      );


    if (refreshProductsBtn) {

      refreshProductsBtn.addEventListener(
        'click',
        loadProducts
      );

    }


    /*
      Refresh activity
    */

    const refreshActivityBtn =
      document.getElementById(
        'refreshActivityBtn'
      );


    if (refreshActivityBtn) {

      refreshActivityBtn.addEventListener(
        'click',
        loadActivity
      );

    }


    /*
      Only automatically show the application
      if a valid session token already exists.
    */

    if (token) {

      showApp();

      loadProducts();

    } else {

      showLogin();

    }

  }
);
