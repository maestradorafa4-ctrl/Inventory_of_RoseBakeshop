const API_URL =
  "https://script.google.com/macros/s/AKfycbx4orqrn5-YWeOAHBtCkhNesh5C1X78ieHC9uTfMQe_oMT-UcVOnvZ082Oh_SRzQJDBig/exec";

let productsCache = [];
let auditCache = [];
let otpChallenge = "";


/* ==================================================
   BASIC
================================================== */

function $(id) {
  return document.getElementById(id);
}

function token() {
  return sessionStorage.getItem("roseToken");
}

function showToast(message, error = false) {

  const toast = $("toast");

  toast.textContent = message;

  toast.style.background =
    error
      ? "#b13a3a"
      : "#2d2420";

  toast.classList.add("show");

  clearTimeout(window.toastTimer);

  window.toastTimer =
    setTimeout(function() {

      toast.classList.remove("show");

    }, 3500);
}


/* ==================================================
   API
================================================== */

async function api(action, data = {}) {

  const payload =
    new URLSearchParams();

  payload.set(
    "action",
    action
  );

  Object.entries(data).forEach(
    function([key, value]) {

      payload.set(
        key,
        value == null
          ? ""
          : String(value)
      );

    }
  );

  let response;

  try {

    response =
      await fetch(
        API_URL,
        {
          method: "POST",
          body: payload
        }
      );

  } catch (error) {

    throw new Error(
      "Unable to connect to the inventory server."
    );
  }

  const text =
    await response.text();

  let result;

  try {

    result =
      JSON.parse(text);

  } catch (error) {

    throw new Error(
      "The Apps Script server did not return valid JSON."
    );
  }

  if (!result.success) {

    throw new Error(
      result.message ||
      "Request failed."
    );
  }

  return result;
}


/* ==================================================
   LOGIN
================================================== */

async function login(event) {

  event.preventDefault();

  const username =
    $("username").value.trim();

  const password =
    $("password").value;

  const email =
    $("email").value.trim();

  if (
    !username ||
    !password ||
    !email
  ) {

    showToast(
      "Enter username, password, and Gmail.",
      true
    );

    return;
  }

  try {

    const result =
      await api(
        "login",
        {
          username:
            username,

          password:
            password,

          email:
            email
        }
      );

    otpChallenge =
      result.challengeId;

    $("loginStep")
      .classList
      .add("hidden");

    $("otpStep")
      .classList
      .remove("hidden");

    $("otpMessage").textContent =
      "A 6-digit OTP was sent to " +
      result.maskedEmail;

    $("otpAttempts").textContent =
      result.attemptsRemaining +
      " OTP attempts available.";

    $("otp").focus();

    showToast(
      "OTP sent to your Gmail."
    );

  } catch (error) {

    showToast(
      error.message,
      true
    );
  }
}


/* ==================================================
   VERIFY OTP
================================================== */

async function verifyOtp(event) {

  event.preventDefault();

  const otp =
    $("otp").value.trim();

  if (!otp) {

    showToast(
      "Enter the OTP.",
      true
    );

    return;
  }

  try {

    const result =
      await api(
        "verifyOTP",
        {
          challengeId:
            otpChallenge,

          otp:
            otp
        }
      );

    sessionStorage.setItem(
      "roseToken",
      result.token
    );

    sessionStorage.setItem(
      "roseUser",
      JSON.stringify(result.user)
    );

    otpChallenge = "";

    showApp();

    showPage(
      "dashboardPage"
    );

    await loadDashboard();

    showToast(
      "Login successful."
    );

  } catch (error) {

    showToast(
      error.message,
      true
    );
  }
}


/* ==================================================
   SHOW / HIDE
================================================== */

function showApp() {

  $("loginScreen")
    .classList
    .add("hidden");

  $("appScreen")
    .classList
    .remove("hidden");
}

function showLogin() {

  $("appScreen")
    .classList
    .add("hidden");

  $("loginScreen")
    .classList
    .remove("hidden");

  $("loginStep")
    .classList
    .remove("hidden");

  $("otpStep")
    .classList
    .add("hidden");

  $("password").value = "";

  $("otp").value = "";

  otpChallenge = "";
}


/* ==================================================
   LOGOUT
================================================== */

async function logout() {

  try {

    if (token()) {

      await api(
        "logout",
        {
          token:
            token()
        }
      );
    }

  } catch (error) {

    console.log(error);
  }

  sessionStorage.clear();

  showLogin();

  showToast(
    "Logged out successfully."
  );
}


/* ==================================================
   NAVIGATION
================================================== */

function showPage(id) {

  document
    .querySelectorAll(".page")
    .forEach(function(page) {

      page.classList.add(
        "hidden"
      );

    });

  $(id)
    .classList
    .remove("hidden");

  const titles = {

    dashboardPage:
      "Dashboard",

    productsPage:
      "Products",

    addPage:
      "Add Product",

    settingsPage:
      "Settings"
  };

  $("pageTitle")
    .textContent =
      titles[id] ||
      "Dashboard";

  document
    .querySelectorAll(
      ".bottom-nav button"
    )
    .forEach(function(button) {

      button.classList.toggle(
        "active",
        button.dataset.page === id
      );

    });

  if (
    id ===
    "dashboardPage"
  ) {

    loadDashboard();
  }

  if (
    id ===
    "productsPage"
  ) {

    loadProducts();
  }

  if (
    id ===
    "settingsPage"
  ) {

    loadSettings();

    loadAuditLogs();
  }
}


/* ==================================================
   DASHBOARD
================================================== */

async function loadDashboard() {

  try {

    const result =
      await api(
        "getProducts",
        {
          token:
            token()
        }
      );

    const products =
      result.products || [];

    let totalProducts =
      products.length;

    let totalItems = 0;

    let lowStock = 0;

    let outOfStock = 0;

    let inventoryValue = 0;

    products.forEach(
      function(product) {

        const stock =
          Number(
            product.stock || 0
          );

        const price =
          Number(
            product.price || 0
          );

        totalItems += stock;

        inventoryValue +=
          stock * price;

        if (
          stock <= 0
        ) {

          outOfStock++;

        } else if (
          stock <=
          Number(
            product.reorderLevel || 0
          )
        ) {

          lowStock++;
        }

      }
    );

    $("totalProducts")
      .textContent =
        totalProducts;

    $("totalItems")
      .textContent =
        totalItems;

    $("lowStock")
      .textContent =
        lowStock;

    $("outOfStock")
      .textContent =
        outOfStock;

    $("inventoryValue")
      .textContent =
        "₱" +
        inventoryValue.toLocaleString(
          "en-PH",
          {
            minimumFractionDigits: 2
          }
        );

    await loadNotifications();

  } catch (error) {

    handleError(error);
  }
}


/* ==================================================
   PRODUCTS
================================================== */

async function loadProducts(
  search = ""
) {

  try {

    const result =
      await api(
        "getProducts",
        {
          token:
            token()
        }
      );

    productsCache =
      result.products || [];

    if (search) {

      const keyword =
        search.toLowerCase();

      productsCache =
        productsCache.filter(
          function(product) {

            return (
              String(
                product.productName
              )
              .toLowerCase()
              .includes(keyword)
              ||
              String(
                product.category
              )
              .toLowerCase()
              .includes(keyword)
            );
          }
        );
    }

    renderProducts(
      productsCache
    );

  } catch (error) {

    handleError(error);
  }
}

function renderProducts(products) {

  const list =
    $("productList");

  if (!products.length) {

    list.innerHTML =
      '<div class="form-card">' +
      'No products found.' +
      '</div>';

    return;
  }

  list.innerHTML =
    products.map(
      function(product) {

        let statusClass =
          "in";

        if (
          product.stockStatus ===
          "Low Stock"
        ) {

          statusClass =
            "low";

        } else if (
          product.stockStatus ===
          "Out of Stock"
        ) {

          statusClass =
            "out";
        }

        const value =
          Number(
            product.stock || 0
          ) *
          Number(
            product.price || 0
          );

        return `
          <div class="product-card">

            <div class="product-top">

              <div>
                <div class="product-name">
                  ${escapeHtml(
                    product.productName
                  )}
                </div>

                <div class="product-category">
                  ${escapeHtml(
                    product.category
                  )}
                </div>
              </div>

              <span class="status ${statusClass}">
                ${escapeHtml(
                  product.stockStatus
                )}
              </span>

            </div>

            <div class="product-info">

              <div class="info-box">
                <small>Stock</small>
                <strong>
                  ${product.stock}
                  ${escapeHtml(product.unit)}
                </strong>
              </div>

              <div class="info-box">
                <small>Price</small>
                <strong>
                  ₱${Number(
                    product.price || 0
                  ).toFixed(2)}
                </strong>
              </div>

              <div class="info-box">
                <small>Reorder</small>
                <strong>
                  ${product.reorderLevel}
                </strong>
              </div>

              <div class="info-box">
                <small>Value</small>
                <strong>
                  ₱${value.toFixed(2)}
                </strong>
              </div>

            </div>

            <div class="product-actions">

              <button
                class="action-btn stock-in"
                onclick="stockInPrompt('${product.productId}')"
              >
                Stock In
              </button>

              <button
                class="action-btn stock-out"
                onclick="stockOutPrompt('${product.productId}')"
              >
                Stock Out
              </button>

              <button
                class="action-btn edit-btn"
                onclick="editProduct('${product.productId}')"
              >
                Edit
              </button>

              <button
                class="action-btn delete-btn"
                onclick="deleteProduct('${product.productId}')"
              >
                Delete
              </button>

            </div>

          </div>
        `;
      }
    ).join("");
}

function escapeHtml(value) {

  return String(
    value ?? ""
  )
  .replace(
    /[&<>"']/g,
    function(character) {

      return {
        "&":
          "&amp;",
        "<":
          "&lt;",
        ">":
          "&gt;",
        '"':
          "&quot;",
        "'":
          "&#39;"
      }[character];

    }
  );
}


/* ==================================================
   ADD PRODUCT
================================================== */

async function addProduct(event) {

  event.preventDefault();

  try {

    const result =
      await api(
        "addProduct",
        {

          token:
            token(),

          productName:
            $("productName")
              .value
              .trim(),

          category:
            $("category")
              .value
              .trim(),

          unit:
            $("unit")
              .value,

          stock:
            $("stock")
              .value,

          reorderLevel:
            $("reorderLevel")
              .value,

          price:
            $("price")
              .value
        }
      );

    showToast(
      result.message
    );

    $("productForm")
      .reset();

    $("stock")
      .value = 0;

    $("reorderLevel")
      .value = 5;

    $("price")
      .value = 0;

    await loadProducts();

    await loadDashboard();

    showPage(
      "productsPage"
    );

  } catch (error) {

    handleError(error);
  }
}


/* ==================================================
   EDIT PRODUCT
================================================== */

async function editProduct(id) {

  const product =
    productsCache.find(
      function(item) {

        return String(
          item.productId
        ) === String(id);

      }
    );

  if (!product) {

    await loadProducts();

    return;
  }

  const name =
    prompt(
      "Product Name:",
      product.productName
    );

  if (name === null) return;

  const category =
    prompt(
      "Category:",
      product.category
    );

  if (category === null) return;

  const unit =
    prompt(
      "Unit (pcs, box, pack):",
      product.unit
    );

  if (unit === null) return;

  const stock =
    prompt(
      "Stock:",
      product.stock
    );

  if (stock === null) return;

  const reorder =
    prompt(
      "Reorder Level:",
      product.reorderLevel
    );

  if (reorder === null) return;

  const price =
    prompt(
      "Price:",
      product.price
    );

  if (price === null) return;

  try {

    const result =
      await api(
        "updateProduct",
        {

          token:
            token(),

          productId:
            id,

          productName:
            name,

          category:
            category,

          unit:
            unit,

          stock:
            stock,

          reorderLevel:
            reorder,

          price:
            price
        }
      );

    showToast(
      result.message
    );

    await loadProducts();

    await loadDashboard();

  } catch (error) {

    handleError(error);
  }
}


/* ==================================================
   DELETE PRODUCT
================================================== */

async function deleteProduct(id) {

  const product =
    productsCache.find(
      function(item) {

        return String(
          item.productId
        ) === String(id);

      }
    );

  if (!product) return;

  const confirmed =
    confirm(
      "Delete " +
      product.productName +
      "?"
    );

  if (!confirmed) return;

  try {

    const result =
      await api(
        "deleteProduct",
        {

          token:
            token(),

          productId:
            id
        }
      );

    showToast(
      result.message
    );

    await loadProducts();

    await loadDashboard();

  } catch (error) {

    handleError(error);
  }
}


/* ==================================================
   STOCK IN
================================================== */

async function stockInPrompt(id) {

  const amount =
    prompt(
      "Enter quantity to add:"
    );

  if (
    amount === null ||
    Number(amount) <= 0
  ) {

    return;
  }

  const reason =
    prompt(
      "Reason:",
      "Stock In"
    );

  try {

    const result =
      await api(
        "stockIn",
        {

          token:
            token(),

          productId:
            id,

          quantity:
            amount,

          reason:
            reason ||
            "Stock In"
        }
      );

    showToast(
      result.message
    );

    await loadProducts();

    await loadDashboard();

  } catch (error) {

    handleError(error);
  }
}


/* ==================================================
   STOCK OUT
================================================== */

async function stockOutPrompt(id) {

  const amount =
    prompt(
      "Enter quantity to remove:"
    );

  if (
    amount === null ||
    Number(amount) <= 0
  ) {

    return;
  }

  const reason =
    prompt(
      "Reason:",
      "Stock Out"
    );

  try {

    const result =
      await api(
        "stockOut",
        {

          token:
            token(),

          productId:
            id,

          quantity:
            amount,

          reason:
            reason ||
            "Stock Out"
        }
      );

    showToast(
      result.message
    );

    await loadProducts();

    await loadDashboard();

  } catch (error) {

    handleError(error);
  }
}


/* ==================================================
   NOTIFICATIONS
================================================== */

async function loadNotifications() {

  try {

    const result =
      await api(
        "getNotifications",
        {
          token:
            token()
        }
      );

    const notifications =
      result.notifications || [];

    const list =
      $("notificationList");

    if (!notifications.length) {

      list.textContent =
        "No notifications.";

      return;
    }

    list.innerHTML =
      notifications
        .slice(0, 10)
        .map(
          function(item) {

            return `
              <div class="activity-row">

                <strong>
                  ${escapeHtml(
                    item.subject
                  )}
                </strong>

                <div>
                  ${escapeHtml(
                    item.message
                  )}
                </div>

                <small>
                  ${escapeHtml(
                    item.status
                  )}
                </small>

              </div>
            `;
          }
        )
        .join("");

  } catch (error) {

    console.log(error);
  }
}


/* ==================================================
   SETTINGS
================================================== */

async function loadSettings() {

  try {

    const result =
      await api(
        "getSettings",
        {
          token:
            token()
        }
      );

    const settings =
      result.settings || {};

    $("otpExpiration")
      .value =
        settings
          .OTP_EXPIRATION_MINUTES ||
        5;

    $("sessionExpiration")
      .value =
        settings
          .SESSION_EXPIRATION_MINUTES ||
        60;

    $("systemName")
      .value =
        settings.SYSTEM_NAME ||
        "Rose Bakeshop Inventory System";

  } catch (error) {

    handleError(error);
  }
}

async function saveSettings(event) {

  event.preventDefault();

  const password =
    $("currentPassword")
      .value;

  if (!password) {

    showToast(
      "Enter your current password.",
      true
    );

    return;
  }

  try {

    await api(
      "updateSetting",
      {

        token:
          token(),

        setting:
          "OTP_EXPIRATION_MINUTES",

        value:
          $("otpExpiration")
            .value,

        currentPassword:
          password
      }
    );

    await api(
      "updateSetting",
      {

        token:
          token(),

        setting:
          "SESSION_EXPIRATION_MINUTES",

        value:
          $("sessionExpiration")
            .value,

        currentPassword:
          password
      }
    );

    await api(
      "updateSetting",
      {

        token:
          token(),

        setting:
          "SYSTEM_NAME",

        value:
          $("systemName")
            .value,

        currentPassword:
          password
      }
    );

    $("currentPassword")
      .value = "";

    showToast(
      "Settings saved successfully."
    );

    await loadSettings();

    await loadAuditLogs();

  } catch (error) {

    handleError(error);
  }
}


/* ==================================================
   LOGIN ACTIVITY
================================================== */

async function loadAuditLogs() {

  try {

    const result =
      await api(
        "getLoginActivity",
        {
          token:
            token()
        }
      );

    auditCache =
      result.activities || [];

    renderAudit();

  } catch (error) {

    handleError(error);
  }
}

function renderAudit() {

  const list =
    $("auditList");

  const filter =
    $("auditFilter")
      .value;

  let items =
    auditCache;

  if (
    filter !== "ALL"
  ) {

    items =
      items.filter(
        function(item) {

          return String(
            item.action
          )
          .toUpperCase()
          .includes(filter);

        }
      );
  }

  if (!items.length) {

    list.innerHTML =
      "<p>No activity found.</p>";

    return;
  }

  list.innerHTML =
    items
      .slice(0, 50)
      .map(
        function(item) {

          return `
            <div class="activity-row">

              <strong>
                ${escapeHtml(
                  item.action
                )}
              </strong>

              <div>
                ${escapeHtml(
                  item.details
                )}
              </div>

              <small>
                ${escapeHtml(
                  item.status
                )}
                —
                ${escapeHtml(
                  item.username
                )}
              </small>

            </div>
          `;
        }
      )
      .join("");
}


/* ==================================================
   ERROR
================================================== */

function handleError(error) {

  showToast(
    error.message ||
    "Something went wrong.",
    true
  );

  if (
    error.message &&
    error.message.includes(
      "session has expired"
    )
  ) {

    sessionStorage.clear();

    showLogin();
  }
}


/* ==================================================
   START
================================================== */

document.addEventListener(
  "DOMContentLoaded",
  function() {

    if (token()) {

      showApp();

      showPage(
        "dashboardPage"
      );

    } else {

      showLogin();
    }


    $("loginForm")
      .addEventListener(
        "submit",
        login
      );


    $("otpForm")
      .addEventListener(
        "submit",
        verifyOtp
      );


    $("backToLogin")
      .addEventListener(
        "click",
        showLogin
      );


    $("logoutBtn")
      .addEventListener(
        "click",
        logout
      );


    $("settingsTopBtn")
      .addEventListener(
        "click",
        function() {

          showPage(
            "settingsPage"
          );

        }
      );


    $("productForm")
      .addEventListener(
        "submit",
        addProduct
      );


    $("settingsForm")
      .addEventListener(
        "submit",
        saveSettings
      );


    $("searchProducts")
      .addEventListener(
        "input",
        function(event) {

          loadProducts(
            event.target.value
          );

        }
      );


    $("refreshProducts")
      .addEventListener(
        "click",
        function() {

          loadProducts(
            $("searchProducts")
              .value
          );

        }
      );


    $("refreshAudit")
      .addEventListener(
        "click",
        loadAuditLogs
      );


    $("auditFilter")
      .addEventListener(
        "change",
        renderAudit
      );


    document
      .querySelectorAll(
        ".bottom-nav button"
      )
      .forEach(
        function(button) {

          button.addEventListener(
            "click",
            function() {

              showPage(
                button.dataset.page
              );

            }
          );

        }
      );

  }
);
