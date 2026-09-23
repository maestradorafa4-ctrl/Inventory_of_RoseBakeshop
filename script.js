const API_URL =
    'https://script.google.com/macros/s/AKfycbxTT72qqvdutm00W0ETDyjMFQ1x1WCLrQ4wG5PoybIQu_Xh88DOQ-6HqaPWdTJ6RT8cUQ/exec';


let productsCache = [];

let auditCache = [];

let otpChallenge = '';

function $(id) {
    return document.getElementById(id);
}


function token() {
    return sessionStorage.getItem(
        'roseToken'
    );
}


/* =====================================================
   API
===================================================== */

async function api(
    action,
    data = {}
) {

    const payload =
        new URLSearchParams();


    payload.set(
        'action',
        action
    );


    Object.entries(
        data
    ).forEach(
        ([key, value]) => {

            payload.set(
                key,
                value == null
                    ? ''
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
                    method:
                        'POST',

                    body:
                        payload
                }
            );

    }

    catch (error) {

        throw new Error(
            'Unable to connect to the inventory server.'
        );

    }


    const text =
        await response.text();


    let result;


    try {

        result =
            JSON.parse(
                text
            );

    }

    catch (error) {

        throw new Error(
            'The Apps Script server did not return valid JSON.'
        );

    }


    if (
        !result.ok
    ) {

        const error =
            new Error(
                result.error ||
                'Request failed.'
            );


        error.attemptsRemaining =
            result.attemptsRemaining;


        error.locked =
            result.locked;


        throw error;

    }


    return result;

}


/* =====================================================
   TOAST
===================================================== */

function showToast(
    message,
    error = false
) {

    const toast =
        $('toast');


    toast.textContent =
        message;


    toast.classList.add(
        'show'
    );


    if (error) {

        toast.style.background =
            '#b13a3a';

    }

    else {

        toast.style.background =
            '#2d2420';

    }


    clearTimeout(
        window.toastTimer
    );


    window.toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    'show'
                );

            },
            3500
        );

}


function handleError(
    error
) {

    showToast(
        error.message ||
        'Something went wrong.',
        true
    );

}


/* =====================================================
   LOGIN
===================================================== */

async function login(
    event
) {

    event.preventDefault();


    const username =
        $('username')
            .value
            .trim();


    const password =
        $('password')
            .value;


    const email =
        $('email')
            .value
            .trim();


    if (
        !username ||
        !password ||
        !email
    ) {

        showToast(
            'Enter username, password, and Gmail.',
            true
        );

        return;

    }


    try {

        const result =
            await api(
                'login',
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


        $('loginStep')
            .classList
            .add(
                'hidden'
            );


        $('otpStep')
            .classList
            .remove(
                'hidden'
            );


        $('otpMessage')
            .textContent =
            'OTP sent to ' +
            result.maskedEmail +
            '. It expires in 5 minutes.';


        $('otpAttempts')
            .textContent =
            result.attemptsRemaining +
            ' OTP attempts available';


        $('otp')
            .focus();


        showToast(
            'Verification code sent to your Gmail.'
        );

    }

    catch (error) {

        if (
            error.attemptsRemaining !==
            undefined
        ) {

            $('attempts')
                .textContent =
                error.attemptsRemaining +
                ' login attempts remaining';

        }


        handleError(
            error
        );

    }

}


/* =====================================================
   OTP
===================================================== */

async function verifyOtp(
    event
) {

    event.preventDefault();


    const otp =
        $('otp')
            .value
            .trim();


    if (
        !/^\d{6}$/.test(otp)
    ) {

        showToast(
            'Enter the 6-digit OTP.',
            true
        );

        return;

    }


    try {

        const result =
            await api(
                'verifyOtp',
                {
                    challengeId:
                        otpChallenge,

                    otp:
                        otp
                }
            );


        sessionStorage.setItem(
            'roseToken',
            result.token
        );


        sessionStorage.setItem(
            'roseUser',
            JSON.stringify(
                result.user
            )
        );


        otpChallenge =
            '';


        showApp();


        showPage(
            'dashboardPage'
        );


        await loadDashboard();


        showToast(
            'Login successful.'
        );

    }

    catch (error) {

        if (
            error.attemptsRemaining !==
            undefined
        ) {

            $('otpAttempts')
                .textContent =
                error.attemptsRemaining +
                ' OTP attempts remaining';

        }


        handleError(
            error
        );

    }

}


/* =====================================================
   SHOW / HIDE
===================================================== */

function showApp() {

    $('loginScreen')
        .classList
        .add(
            'hidden'
        );


    $('appScreen')
        .classList
        .remove(
            'hidden'
        );

}


function showLogin() {

    $('appScreen')
        .classList
        .add(
            'hidden'
        );


    $('loginScreen')
        .classList
        .remove(
            'hidden'
        );


    $('loginStep')
        .classList
        .remove(
            'hidden'
        );


    $('otpStep')
        .classList
        .add(
            'hidden'
        );


    $('password')
        .value = '';


    $('otp')
        .value = '';

}


/* =====================================================
   LOGOUT
===================================================== */

async function logout() {

    try {

        if (
            token()
        ) {

            await api(
                'logout',
                {
                    token:
                        token()
                }
            );

        }

    }

    catch (error) {

        console.log(
            error
        );

    }


    sessionStorage.clear();


    showLogin();


    showToast(
        'Logged out successfully.'
    );

}


/* =====================================================
   PAGE NAVIGATION
===================================================== */

function showPage(
    id
) {

    document
        .querySelectorAll(
            '.page'
        )
        .forEach(
            page => {

                page.classList.add(
                    'hidden'
                );

            }
        );


    $(id)
        .classList
        .remove(
            'hidden'
        );


    const titles = {

        dashboardPage:
            'Dashboard',

        productsPage:
            'Products',

        addPage:
            'Add Product',

        stockPage:
            'Stock In',

        editPage:
            'Edit Product',

        settingsPage:
            'Settings'

    };


    $('pageTitle')
        .textContent =
        titles[id] ||
        'Dashboard';


    document
        .querySelectorAll(
            '.bottom-nav button'
        )
        .forEach(
            button => {

                button.classList.toggle(
                    'active',

                    button.dataset.page ===
                    id
                );

            }
        );


    if (
        id ===
        'productsPage'
    ) {

        loadProducts();

    }


    if (
        id ===
        'stockPage'
    ) {

        loadProducts()
            .then(
                loadStockProducts
            );

    }


    if (
        id ===
        'settingsPage'
    ) {

        loadSettings();

        loadAuditLogs();

    }

}


/* =====================================================
   DASHBOARD
===================================================== */

async function loadDashboard() {

    try {

        const result =
            await api(
                'dashboard',
                {
                    token:
                        token()
                }
            );


        $('totalProducts')
            .textContent =
            result.totalProducts;


        $('totalItems')
            .textContent =
            result.totalItems;


        $('lowStock')
            .textContent =
            result.lowStock;


        $('outOfStock')
            .textContent =
            result.outOfStock;


        $('inventoryValue')
            .textContent =
            '₱' +
            Number(
                result.inventoryValue ||
                0
            )
            .toLocaleString(
                'en-PH',
                {
                    minimumFractionDigits:
                        2
                }
            );


        renderNotifications(
            result.notifications ||
            []
        );

    }

    catch (error) {

        handleError(
            error
        );

    }

}


/* =====================================================
   PRODUCTS
===================================================== */

async function loadProducts(
    search = ''
) {

    try {

        const result =
            await api(
                'products',
                {
                    token:
                        token(),

                    search:
                        search
                }
            );


        productsCache =
            result.products ||
            [];


        renderProducts(
            productsCache
        );

    }

    catch (error) {

        handleError(
            error
        );

    }

}


function productIcon(
    product
) {

    const text =
        (
            product.category +
            ' ' +
            product.productName
        )
        .toLowerCase();


    if (
        text.includes(
            'bread'
        ) ||
        text.includes(
            'pandesal'
        )
    ) {

        return '🍞';

    }


    if (
        text.includes(
            'pastry'
        ) ||
        text.includes(
            'croissant'
        ) ||
        text.includes(
            'pie'
        )
    ) {

        return '🥐';

    }


    if (
        text.includes(
            'cookie'
        )
    ) {

        return '🍪';

    }


    if (
        text.includes(
            'coffee'
        ) ||
        text.includes(
            'juice'
        ) ||
        text.includes(
            'drink'
        )
    ) {

        return '🥤';

    }


    if (
        text.includes(
            'ingredient'
        )
    ) {

        return '🧈';

    }


    return '🍰';

}


function escapeHtml(
    value
) {

    return String(
        value ??
        ''
    )
    .replace(
        /[&<>'"]/g,
        character => ({

            '&':
                '&amp;',

            '<':
                '&lt;',

            '>':
                '&gt;',

            "'":
                '&#39;',

            '"':
                '&quot;'

        }[character])
    );

}


function renderProducts(
    products
) {

    const list =
        $('productList');


    if (
        !products.length
    ) {

        list.innerHTML =
            '<div class="form-card">No products found.</div>';

        return;

    }


    list.innerHTML =
        products
            .map(
                product => {

                    const statusClass =
                        product.stockStatus ===
                        'Low Stock'
                            ? 'low'
                            : product.stockStatus ===
                              'Out of Stock'
                                ? 'out'
                                : 'in';


                    return `

                        <article class="product-item">

                            <div class="product-image">
                                <span>
                                    ${productIcon(product)}
                                </span>
                            </div>

                            <div>

                                <div class="product-name">
                                    ${escapeHtml(
                                        product.productName
                                    )}
                                </div>

                                <div class="product-meta">

                                    ${escapeHtml(
                                        product.category
                                    )}

                                    · Stock:
                                    ${product.quantity}

                                    ${escapeHtml(
                                        product.unit
                                    )}

                                </div>

                                <span
                                    class="status ${statusClass}"
                                >
                                    ${escapeHtml(
                                        product.stockStatus
                                    )}
                                </span>

                            </div>


                            <div class="product-right">

                                <div class="product-price">
                                    ₱${Number(
                                        product.price
                                    ).toFixed(2)}
                                </div>


                                <div class="product-actions">

                                    <button
                                        onclick="openStockIn('${escapeHtml(product.id)}')"
                                    >
                                        Stock In
                                    </button>


                                    <button
                                        onclick="openEdit('${escapeHtml(product.id)}')"
                                    >
                                        Edit
                                    </button>


                                    <button
                                        class="delete"
                                        onclick="removeProduct('${escapeHtml(product.id)}')"
                                    >
                                        Delete
                                    </button>

                                </div>

                            </div>

                        </article>

                    `;

                }
            )
            .join('');

}


/* =====================================================
   STOCK IN
===================================================== */

function openStockIn(
    id
) {

    showPage(
        'stockPage'
    );


    setTimeout(
        () => {

            $('stockProduct')
                .value =
                id;


            $('stockAmount')
                .focus();

        },
        100
    );

}


function loadStockProducts() {

    const select =
        $('stockProduct');


    select.innerHTML =
        '<option value="">Select product</option>' +

        productsCache
            .map(
                product => `

                    <option
                        value="${escapeHtml(product.id)}"
                    >

                        ${escapeHtml(
                            product.productName
                        )}

                        —
                        ${product.quantity}
                        ${escapeHtml(
                            product.unit
                        )}

                    </option>

                `
            )
            .join('');

}


async function stockIn(
    event
) {

    event.preventDefault();


    const id =
        $('stockProduct')
            .value;


    const amount =
        $('stockAmount')
            .value;


    if (
        !id ||
        Number(amount) <= 0
    ) {

        showToast(
            'Select a product and enter a valid quantity.',
            true
        );

        return;

    }


    try {

        const result =
            await api(
                'stockIn',
                {
                    token:
                        token(),

                    id:
                        id,

                    amount:
                        amount
                }
            );


        showToast(
            result.message
        );


        $('stockForm')
            .reset();


        await loadProducts();


        await loadDashboard();


        showPage(
            'productsPage'
        );

    }

    catch (error) {

        handleError(
            error
        );

    }

}


/* =====================================================
   EDIT
===================================================== */

function openEdit(
    id
) {

    const product =
        productsCache.find(
            item =>
                String(
                    item.id
                ) ===
                String(id)
        );


    if (!product) {
        return;
    }


    $('editId')
        .value =
        product.id;


    $('editProductName')
        .value =
        product.productName;


    $('editCategory')
        .value =
        product.category;


    $('editUnit')
        .value =
        product.unit;


    $('editCostPrice')
        .value =
        product.costPrice ||
        0;


    $('editSellingPrice')
        .value =
        product.price ||
        0;


    $('editQuantity')
        .value =
        product.quantity;


    $('editReorderLevel')
        .value =
        product.reorderLevel;


    showPage(
        'editPage'
    );

}


async function saveEdit(
    event
) {

    event.preventDefault();


    try {

        const result =
            await api(
                'updateProduct',
                {

                    token:
                        token(),

                    id:
                        $('editId')
                            .value,

                    productName:
                        $('editProductName')
                            .value
                            .trim(),

                    category:
                        $('editCategory')
                            .value,

                    unit:
                        $('editUnit')
                            .value,

                    costPrice:
                        $('editCostPrice')
                            .value,

                    quantity:
                        $('editQuantity')
                            .value,

                    sellingPrice:
                        $('editSellingPrice')
                            .value,

                    reorderLevel:
                        $('editReorderLevel')
                            .value

                }
            );


        showToast(
            result.message
        );


        await loadProducts(
            $('searchProducts')
                .value
        );


        await loadDashboard();


        showPage(
            'productsPage'
        );

    }

    catch (error) {

        handleError(
            error
        );

    }

}


/* =====================================================
   ADD PRODUCT
===================================================== */

async function addProduct(
    event
) {

    event.preventDefault();


    try {

        const result =
            await api(
                'addProduct',
                {

                    token:
                        token(),

                    productName:
                        $('productName')
                            .value
                            .trim(),

                    category:
                        $('category')
                            .value,

                    unit:
                        $('unit')
                            .value,

                    costPrice:
                        $('costPrice')
                            .value,

                    sellingPrice:
                        $('sellingPrice')
                            .value,

                    initialStock:
                        $('initialStock')
                            .value,

                    reorderLevel:
                        $('reorderLevel')
                            .value

                }
            );


        showToast(
            result.message
        );


        $('productForm')
            .reset();


        $('unit')
            .value =
            'kg';


        $('reorderLevel')
            .value =
            20;


        await loadProducts();


        await loadDashboard();


        showPage(
            'productsPage'
        );

    }

    catch (error) {

        handleError(
            error
        );

    }

}


/* =====================================================
   DELETE
===================================================== */

async function removeProduct(
    id
) {

    const product =
        productsCache.find(
            item =>
                String(
                    item.id
                ) ===
                String(id)
        );


    if (!product) {
        return;
    }


    const confirmed =
        confirm(

            `Delete "${product.productName}"?

This action cannot be undone.`

        );


    if (!confirmed) {
        return;
    }


    try {

        const result =
            await api(
                'deleteProduct',
                {

                    token:
                        token(),

                    id:
                        id

                }
            );


        showToast(
            result.message
        );


        await loadProducts(
            $('searchProducts')
                .value
        );


        await loadDashboard();


        await loadNotifications();

    }

    catch (error) {

        handleError(
            error
        );

    }

}


/* =====================================================
   SETTINGS
===================================================== */

async function loadSettings() {

    try {

        const result =
            await api(
                'settings',
                {
                    token:
                        token()
                }
            );


        $('settingsReorder')
            .value =
            result.settings
                .reorderLevel;


        $('settingsLow')
            .value =
            result.settings
                .lowStockThreshold;


        $('settingsUnit')
            .value =
            result.settings
                .defaultUnit;

    }

    catch (error) {

        handleError(
            error
        );

    }

}


async function saveSettings(
    event
) {

    event.preventDefault();


    if (
        !confirm(
            'Save these system-wide configuration changes?'
        )
    ) {

        return;

    }


    try {

        const result =
            await api(
                'updateSettings',
                {

                    token:
                        token(),

                    reorderLevel:
                        $('settingsReorder')
                            .value,

                    lowStockThreshold:
                        $('settingsLow')
                            .value,

                    defaultUnit:
                        $('settingsUnit')
                            .value,

                    currentPassword:
                        $('currentPassword')
                            .value

                }
            );


        showToast(
            result.message
        );


        $('currentPassword')
            .value =
            '';


        await loadAuditLogs();


        await loadDashboard();

    }

    catch (error) {

        handleError(
            error
        );

    }

}


/* =====================================================
   AUDIT LOGS
===================================================== */

async function loadAuditLogs() {

    try {

        const result =
            await api(
                'auditLogs',
                {
                    token:
                        token()
                }
            );


        auditCache =
            result.logs ||
            [];


        renderAudit();

    }

    catch (error) {

        handleError(
            error
        );

    }

}


function renderAudit() {

    const filter =
        $('auditFilter')
            .value;


    const rows =
        auditCache.filter(
            item => {

                if (
                    filter ===
                    'ALL'
                ) {

                    return true;

                }


                return (

                    item.action ===
                    filter ||

                    item.action.startsWith(
                        filter +
                        '_'
                    )

                );

            }
        );


    $('auditList')
        .innerHTML =

        rows.length

            ? rows
                .map(
                    item => `

                        <div class="audit-row">

                            <div class="audit-top">

                                <span class="audit-action">

                                    ${escapeHtml(
                                        item.action
                                            .replaceAll(
                                                '_',
                                                ' '
                                            )
                                    )}

                                </span>

                                <span>

                                    ${new Date(
                                        item.date
                                    ).toLocaleString()}

                                </span>

                            </div>


                            <div>

                                <strong>
                                    ${escapeHtml(
                                        item.username
                                    )}
                                </strong>

                            </div>


                            <div class="audit-details">

                                ${escapeHtml(
                                    item.details
                                )}

                            </div>

                        </div>

                    `
                )
                .join('')

            :

            '<div class="audit-details">No audit records found.</div>';

}


/* =====================================================
   NOTIFICATIONS
===================================================== */

async function loadNotifications() {

    try {

        const result =
            await api(
                'notifications',
                {
                    token:
                        token()
                }
            );


        renderNotifications(
            result.notifications ||
            []
        );

    }

    catch (error) {

        handleError(
            error
        );

    }

}


function renderNotifications(
    items
) {

    const box =
        $('dashboardNotifications');


    if (
        !items.length
    ) {

        box.innerHTML =
            '<div class="audit-details">No inventory notifications.</div>';

        return;

    }


    box.innerHTML =
        items
            .slice(
                0,
                30
            )
            .map(
                item => `

                    <div
                        class="notification ${
                            item.read
                                ? ''
                                : 'unread'
                        }"
                    >

                        <strong>

                            ${escapeHtml(
                                item.type
                                    .replaceAll(
                                        '_',
                                        ' '
                                    )
                            )}

                        </strong>


                        <div>

                            ${escapeHtml(
                                item.message
                            )}

                        </div>


                        <small>

                            ${new Date(
                                item.date
                            ).toLocaleString()}

                        </small>

                    </div>

                `
            )
            .join('');

}


async function markRead() {

    try {

        await api(
            'markNotificationsRead',
            {
                token:
                    token()
            }
        );


        await loadNotifications();


        showToast(
            'Notifications marked as read.'
        );

    }

    catch (error) {

        handleError(
            error
        );

    }

}


/* =====================================================
   START SYSTEM
===================================================== */

document.addEventListener(
    'DOMContentLoaded',
    () => {

        if (
            token()
        ) {

            showApp();

            showPage(
                'dashboardPage'
            );

            loadDashboard();

        }


        $('loginForm')
            .addEventListener(
                'submit',
                login
            );


        $('otpForm')
            .addEventListener(
                'submit',
                verifyOtp
            );


        $('backToLogin')
            .addEventListener(
                'click',
                showLogin
            );


        $('logoutBtn')
            .addEventListener(
                'click',
                logout
            );


        $('settingsTopBtn')
            .addEventListener(
                'click',
                () =>
                    showPage(
                        'settingsPage'
                    )
            );


        $('productForm')
            .addEventListener(
                'submit',
                addProduct
            );


        $('stockForm')
            .addEventListener(
                'submit',
                stockIn
            );


        $('editForm')
            .addEventListener(
                'submit',
                saveEdit
            );


        $('settingsForm')
            .addEventListener(
                'submit',
                saveSettings
            );


        $('searchProducts')
            .addEventListener(
                'input',
                event =>
                    loadProducts(
                        event.target.value
                    )
            );


        $('refreshProducts')
            .addEventListener(
                'click',
                () =>
                    loadProducts(
                        $('searchProducts')
                            .value
                    )
            );


        $('refreshAudit')
            .addEventListener(
                'click',
                loadAuditLogs
            );


        $('auditFilter')
            .addEventListener(
                'change',
                renderAudit
            );


        $('markReadBtn')
            .addEventListener(
                'click',
                markRead
            );


        $('addProductTopBtn')
            .addEventListener(
                'click',
                () =>
                    showPage(
                        'addPage'
                    )
            );


        document
            .querySelectorAll(
                '.bottom-nav button'
            )
            .forEach(
                button => {

                    button.addEventListener(
                        'click',
                        () =>
                            showPage(
                                button.dataset.page
                            )
                    );

                }
            );


        document
            .querySelectorAll(
                '.backBtn'
            )
            .forEach(
                button => {

                    button.addEventListener(
                        'click',
                        () =>
                            showPage(
                                button.dataset.target
                            )
                    );

                }
            );

    }
);
