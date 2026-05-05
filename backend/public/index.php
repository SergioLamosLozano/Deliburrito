<?php

// Deli Burrito - Simple PHP Server (No Composer Required)
header('Content-Type: application/json');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

try {
    // Basic .env parser for standalone PHP
    $envPath = __DIR__ . '/../.env';
    if (file_exists($envPath)) {
        $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos(trim($line), '#') === 0) continue;
            if (strpos($line, '=') !== false) {
                list($name, $value) = explode('=', $line, 2);
                $name = trim($name);
                $value = trim($value, "\" '");
                putenv(sprintf('%s=%s', $name, $value));
            }
        }
    }

    // Database Connection using Environment Variables
    $db_host = getenv('DB_HOST') ?: '127.0.0.1';
    $db_user = getenv('DB_USERNAME') ?: 'root';
    $db_pass = getenv('DB_PASSWORD') ?: '';
    $db_name = getenv('DB_DATABASE') ?: 'deliburrito_db';

    $db = new mysqli($db_host, $db_user, $db_pass, $db_name);
    $db->set_charset('utf8mb4');
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed', 'details' => $e->getMessage()]);
    exit;
}

// Parse Request
$method = $_SERVER['REQUEST_METHOD'];
$path = '/';
if (!empty($_GET['route'])) {
    $path = '/' . ltrim((string) $_GET['route'], '/');
} else {
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/';
    $path = str_replace('/admin', '', $path);
    $path = preg_replace('#^/index\.php#', '', $path);
}

// ── Session helpers ───────────────────────────────────────────────────────
session_start();

function isAdminAuthenticated(): bool {
    return !empty($_SESSION['admin_authenticated']) && $_SESSION['admin_authenticated'] === true;
}

function requireAdmin(): void {
    if (!isAdminAuthenticated()) {
        http_response_code(401);
        echo json_encode(['error' => 'No autenticado', 'redirect' => '/admin/login/']);
        exit;
    }
}

// Routes
try {
    if ($method === 'GET' && ($path === '/' || $path === '')) {
        header('Content-Type: text/html');
        readfile(__DIR__ . '/index.html');
        exit;
    }

    // ── Admin login endpoint ───────────────────────────────────────────────
    if ($method === 'POST' && $path === '/admin-login') {
        handleAdminLogin($db);
        exit;
    }

    // ── Admin logout endpoint ──────────────────────────────────────────────
    if ($method === 'POST' && $path === '/admin-logout') {
        $_SESSION = [];
        session_destroy();
        echo json_encode(['ok' => true]);
        exit;
    }

    // ── Admin session check ────────────────────────────────────────────────
    if ($method === 'GET' && $path === '/admin-check') {
        echo json_encode(['authenticated' => isAdminAuthenticated()]);
        exit;
    }

    if ($method === 'POST' && $path === '/orders') {
        handleCreateOrder($db);
    } elseif ($method === 'GET' && $path === '/orders') {
        handleListOrders($db);
    } elseif (preg_match('/^\/orders\/(\d+)\/aceptado$/', $path, $matches)) {
        handleAcceptOrder($db, $matches[1]);
    } elseif (preg_match('/^\/orders\/(\d+)\/cancelado$/', $path, $matches)) {
        handleCancelOrder($db, $matches[1]);
    } elseif (preg_match('/^\/orders\/(\d+)\/pendiente$/', $path, $matches)) {
        handlePendientizeOrder($db, $matches[1]);
    } elseif (preg_match('/^\/orders\/(\d+)\/print$/', $path, $matches)) {
        handlePrintOrder($db, $matches[1]);
    } elseif ($path === '/categories' || $path === '/menu') {
        if ($method === 'GET') handleListCategories($db, $path === '/menu');
        elseif ($method === 'POST') { requireAdmin(); handleCreateCategory($db); }
    } elseif (preg_match('/^\/categories\/(\d+)$/', $path, $matches)) {
        requireAdmin();
        if ($method === 'POST' || $method === 'PUT') handleUpdateCategory($db, $matches[1]);
        elseif ($method === 'DELETE') handleDeleteCategory($db, $matches[1]);
    } elseif ($path === '/options') {
        if ($method === 'GET') { requireAdmin(); handleListOptions($db); }
        elseif ($method === 'POST') { requireAdmin(); handleCreateOption($db); }
    } elseif (preg_match('/^\/options\/(\d+)$/', $path, $matches)) {
        requireAdmin();
        if ($method === 'POST' || $method === 'PUT') handleUpdateOption($db, $matches[1]);
        elseif ($method === 'DELETE') handleDeleteOption($db, $matches[1]);
    } elseif ($path === '/settings') {
        requireAdmin();
        if ($method === 'GET') handleListSettings($db);
        elseif ($method === 'POST') handleUpdateSetting($db);
    } elseif ($path === '/reports') {
        requireAdmin();
        handleReports($db);
    } elseif (preg_match('/^\/orders\/(\d+)\/(aceptado|cancelado|pendiente)$/', $path, $matches)) {
        requireAdmin();
        $status = $matches[2];
        if ($status === 'aceptado') handleAcceptOrder($db, $matches[1]);
        elseif ($status === 'cancelado') handleCancelOrder($db, $matches[1]);
        elseif ($status === 'pendiente') handlePendientizeOrder($db, $matches[1]);
    } elseif (preg_match('/^\/orders\/(\d+)\/print$/', $path, $matches)) {
        requireAdmin();
        handlePrintOrder($db, $matches[1]);
    } elseif ($method === 'GET' && $path === '/orders') {
        requireAdmin();
        handleListOrders($db);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Route not found', 'path' => $path]);
    }
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Unhandled API error', 'details' => $e->getMessage()]);
}

// --- ADMIN AUTH ---

function handleAdminLogin($db) {
    $ip          = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $attemptsKey = 'login_attempts_' . md5($ip);
    $lockKey     = 'login_locked_'   . md5($ip);

    if (!empty($_SESSION[$lockKey]) && $_SESSION[$lockKey] > time()) {
        $wait = $_SESSION[$lockKey] - time();
        http_response_code(429);
        echo json_encode(['ok' => false, 'message' => "Demasiados intentos. Espera {$wait} segundos."]);
        return;
    }

    $data     = json_decode(file_get_contents('php://input'), true);
    $email    = trim($data['email'] ?? '');
    $password = $data['password'] ?? '';

    if (empty($email) || empty($password)) {
        http_response_code(422);
        echo json_encode(['ok' => false, 'message' => 'Email y contrasena son requeridos.']);
        return;
    }

    $stmt = $db->prepare("SELECT id, password, role FROM users WHERE email = ? LIMIT 1");
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();

    if ($user && $user['role'] === 'admin' && password_verify($password, $user['password'])) {
        $_SESSION[$attemptsKey] = 0;
        unset($_SESSION[$lockKey]);
        session_regenerate_id(true);
        $_SESSION['admin_authenticated'] = true;
        $_SESSION['admin_user_id']        = $user['id'];
        $_SESSION['admin_email']          = $email;
        $token = bin2hex(random_bytes(16));
        $_SESSION['admin_token'] = $token;
        echo json_encode(['ok' => true, 'token' => $token]);
    } else {
        $_SESSION[$attemptsKey] = ($_SESSION[$attemptsKey] ?? 0) + 1;
        if ($_SESSION[$attemptsKey] >= 5) {
            $_SESSION[$lockKey]     = time() + 60;
            $_SESSION[$attemptsKey] = 0;
        }
        http_response_code(401);
        echo json_encode(['ok' => false, 'message' => 'Credenciales invalidas.']);
    }
}

// --- CATEGORIES HANDLERS ---

function handleListCategories($db, $onlyActive = false) {
    $sql = "SELECT * FROM categories";
    if ($onlyActive) $sql .= " WHERE is_active = 1";
    $sql .= " ORDER BY order_index";
    
    $result = $db->query($sql);
    $categories = $result->fetch_all(MYSQLI_ASSOC);
    
    if ($onlyActive) {
        foreach ($categories as &$cat) {
            $cat['options'] = $db->query("SELECT * FROM options WHERE category_id = ".$cat['id']." AND is_active = 1")->fetch_all(MYSQLI_ASSOC);
        }
    }
    
    echo json_encode($categories);
}

function handleCreateCategory($db) {
    $data = json_decode(file_get_contents('php://input'), true);
    $name = $data['name'];
    $is_req = (int)$data['is_required'];
    $max_sel = (int)$data['max_selections'];
    $order = (int)$data['order_index'];
    $type = $data['product_type'];
    $active = (int)($data['is_active'] ?? 1);
    
    $stmt = $db->prepare("INSERT INTO categories (name, is_required, max_selections, order_index, product_type, is_active) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->bind_param('siiisi', $name, $is_req, $max_sel, $order, $type, $active);
    $stmt->execute();
    echo json_encode(['ok' => true, 'id' => $stmt->insert_id]);
}

function handleUpdateCategory($db, $id) {
    $data = json_decode(file_get_contents('php://input'), true);
    $name = $data['name'] ?? '';
    $is_req = (int)($data['is_required'] ?? 0);
    $max_sel = (int)($data['max_selections'] ?? 1);
    $order = (int)($data['order_index'] ?? 0);
    $type = $data['product_type'] ?? 'burrito';
    $active = (int)($data['is_active'] ?? 1);
    $id_int = (int)$id;

    $stmt = $db->prepare("UPDATE categories SET name=?, is_required=?, max_selections=?, order_index=?, product_type=?, is_active=? WHERE id=?");
    $stmt->bind_param('siiisii', $name, $is_req, $max_sel, $order, $type, $active, $id_int);
    $stmt->execute();
    echo json_encode(['ok' => true]);
}

function handleDeleteCategory($db, $id) {
    try {
        $db->query("DELETE FROM categories WHERE id = " . (int)$id);
        echo json_encode(['ok' => true]);
    } catch (Throwable $e) {
        // Fallback to deactivation if there are dependencies
        $db->query("UPDATE categories SET is_active = 0 WHERE id = " . (int)$id);
        echo json_encode(['ok' => true, 'message' => 'Category deactivated due to dependencies']);
    }
}

// --- OPTIONS HANDLERS ---

function handleListOptions($db) {
    // Only show options from active categories
    $result = $db->query("SELECT o.*, c.name as category_name FROM options o JOIN categories c ON o.category_id = c.id WHERE c.is_active = 1 ORDER BY c.order_index, o.id");
    echo json_encode($result->fetch_all(MYSQLI_ASSOC));
}

function handleCreateOption($db) {
    $data = json_decode(file_get_contents('php://input'), true);
    $stmt = $db->prepare("INSERT INTO options (category_id, name, price_base, price_extra, is_active) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param('isddi', $data['category_id'], $data['name'], $data['price_base'], $data['price_extra'], $data['is_active']);
    $stmt->execute();
    echo json_encode(['ok' => true, 'id' => $stmt->insert_id]);
}

function handleUpdateOption($db, $id) {
    $data = json_decode(file_get_contents('php://input'), true);
    $stmt = $db->prepare("UPDATE options SET category_id=?, name=?, price_base=?, price_extra=?, is_active=? WHERE id=?");
    $stmt->bind_param('isddii', $data['category_id'], $data['name'], $data['price_base'], $data['price_extra'], $data['is_active'], $id);
    $stmt->execute();
    echo json_encode(['ok' => true]);
}

function handleDeleteOption($db, $id) {
    try {
        $db->query("DELETE FROM options WHERE id = " . (int)$id);
        echo json_encode(['ok' => true]);
    } catch (Throwable $e) {
        // If deletion fails (e.g. foreign key), just deactivate it
        $db->query("UPDATE options SET is_active = 0 WHERE id = " . (int)$id);
        echo json_encode(['ok' => true, 'message' => 'Option deactivated instead of deleted due to order history']);
    }
}

// --- ORDER HANDLERS ---

function handleCreateOrder($db) {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data) {
        throw new Exception("No data received");
    }

    $subtotal = 0;
    $items = isset($data['items']) ? $data['items'] : [];
    foreach ($items as $item) {
        $subtotal += (float)($item['item_total'] ?? 0);
    }
    
    $delivery_cost = 0;
    if (isset($data['delivery_type']) && $data['delivery_type'] === 'domicilio') {
        $settingRes = $db->query("SELECT value FROM settings WHERE `key` = 'costo_domicilio'");
        if ($settingRes && $s = $settingRes->fetch_assoc()) {
            $delivery_cost = (float)$s['value'];
        } else {
            $delivery_cost = 5000;
        }
    }

    $total = $subtotal + $delivery_cost;
    $customer_name = $data['customer_name'] ?? 'Cliente Sin Nombre';
    $customer_phone = $data['customer_phone'] ?? '';
    $customer_address = $data['customer_address'] ?? '';
    $delivery_type = $data['delivery_type'] ?? 'local';

    $stmt = $db->prepare("INSERT INTO orders (customer_name, customer_phone, customer_address, delivery_type, subtotal, delivery_cost, total, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'pendiente', NOW(), NOW())");
    $stmt->bind_param('ssssddd', $customer_name, $customer_phone, $customer_address, $delivery_type, $subtotal, $delivery_cost, $total);
    $stmt->execute();
    $order_id = $stmt->insert_id;

    foreach ($items as $item) {
        $product_type = $item['product_type'] ?? 'burrito';
        $item_total = (float)($item['item_total'] ?? 0);
        $notes = $item['notes'] ?? '';

        $stmt2 = $db->prepare("INSERT INTO order_items (order_id, product_type, item_total, notes) VALUES (?, ?, ?, ?)");
        $stmt2->bind_param('isds', $order_id, $product_type, $item_total, $notes);
        $stmt2->execute();
        $item_id = $stmt2->insert_id;

        $options = isset($item['options']) ? $item['options'] : [];
        foreach ($options as $opt) {
            $option_id = (int)($opt['option_id'] ?? 0);
            if ($option_id <= 0) continue;

            $optRes = $db->query("SELECT price_base, price_extra FROM options WHERE id = " . $option_id);
            if ($optRes && $optData = $optRes->fetch_assoc()) {
                $is_primary = !empty($opt['is_primary']);
                $price = $is_primary ? (float)$optData['price_base'] : (float)$optData['price_extra'];
                
                $stmt3 = $db->prepare("INSERT INTO order_item_options (order_item_id, option_id, price_charged) VALUES (?, ?, ?)");
                $stmt3->bind_param('iid', $item_id, $option_id, $price);
                $stmt3->execute();
            }
        }
    }
    echo json_encode(['ok' => true, 'order_id' => $order_id]);
    exit;
}

function handleListOrders($db) {
    $result = $db->query("SELECT * FROM orders ORDER BY created_at DESC LIMIT 50");
    $orders = [];
    while ($row = $result->fetch_assoc()) {
        $items = $db->query("SELECT id, product_type, item_total, notes FROM order_items WHERE order_id = ".$row['id'])->fetch_all(MYSQLI_ASSOC);
        foreach($items as &$item) {
            $item['options'] = $db->query("SELECT o.name FROM order_item_options oio JOIN options o ON oio.option_id = o.id WHERE oio.order_item_id = ".$item['id'])->fetch_all(MYSQLI_ASSOC);
        }
        unset($item); // Clear reference
        $row['items'] = $items;
        $orders[] = $row;
    }
    echo json_encode(['orders' => $orders]);
}

function handleAcceptOrder($db, $id) {
    $db->query("UPDATE orders SET status = 'aceptado', updated_at = NOW() WHERE id = " . (int)$id);
    echo json_encode(['ok' => true]);
}

function handleCancelOrder($db, $id) {
    $db->query("UPDATE orders SET status = 'cancelado', updated_at = NOW() WHERE id = " . (int)$id);
    echo json_encode(['ok' => true]);
}

function handlePendientizeOrder($db, $id) {
    $db->query("UPDATE orders SET status = 'pendiente', updated_at = NOW() WHERE id = " . (int)$id);
    echo json_encode(['ok' => true]);
}

function handlePrintOrder($db, $id) {
    header('Content-Type: text/html; charset=utf-8');
    $order = $db->query("SELECT * FROM orders WHERE id = $id")->fetch_assoc();
    $itemsResult = $db->query("SELECT oi.id, oi.product_type, oi.item_total FROM order_items oi WHERE oi.order_id = $id");
    $items = [];
    while ($item = $itemsResult->fetch_assoc()) {
        $optsResult = $db->query("SELECT opt.name FROM order_item_options oio JOIN options opt ON oio.option_id = opt.id WHERE oio.order_item_id = " . (int)$item['id']);
        $item['options'] = $optsResult->fetch_all(MYSQLI_ASSOC);
        $items[] = $item;
    }

    $fecha = date('d/m/Y', strtotime($order['created_at']));
    $hora = date('H:i', strtotime($order['created_at']));

    echo "
    <!DOCTYPE html>
    <html lang='es'>
    <head>
        <meta charset='UTF-8'>
        <meta name='viewport' content='width=device-width, initial-scale=1.0'>
        <title>Comanda #$id</title>
        <script src='https://cdn.tailwindcss.com'></script>
        <link href='https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&display=swap' rel='stylesheet'>
        <style>
            body { font-family: 'monospace'; line-height: 1.1; }
            @media print {
                @page { margin: 0; }
                body { margin: 0; padding: 0; width: 80mm; visibility: hidden; }
                #zona-impresion, #zona-impresion * { visibility: visible; }
                #zona-impresion { 
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 76mm; 
                    margin: 0;
                    padding: 2mm;
                }
            }
        </style>
    </head>
    <body class='bg-gray-100 p-0' onload='window.print()'>
        <div id='zona-impresion' class='w-[76mm] bg-white text-black p-2 font-mono text-xs mx-auto print:border-none'>
            
            <!-- --- ENCABEZADO --- -->
            <div class='text-center border-b border-black pb-1 mb-2'>
                <h1 class='font-black text-xl uppercase tracking-widest leading-none'>Deli Burrito</h1>
                <h2 class='font-bold text-lg tracking-tighter uppercase'>Ticket #$id</h2>
                <p class='text-[9px] font-bold'>$fecha - $hora</p>
            </div>

            <!-- --- DATOS DEL CLIENTE --- -->
            <div class='border-b border-dashed border-black pb-1 mb-2 space-y-0.5 text-[10px]'>
                <p><span class='font-bold uppercase bg-black text-white px-1'>Cliente:</span> {$order['customer_name']}</p>
                <p><span class='font-bold uppercase'>Tel:</span> {$order['customer_phone']}</p>
                <p><span class='font-bold uppercase'>Dir:</span> " . ($order['customer_address'] ?: 'RECOGE EN LOCAL') . "</p>
            </div>

            <!-- --- DETALLE DEL PEDIDO --- -->
            <div class='border-b border-black pb-2 mb-2'>
                <h3 class='font-bold text-center mb-2 uppercase underline decoration-1 underline-offset-2 text-xs'>Preparación</h3>
                ";

    foreach ($items as $item) {
        $productName = strtoupper($item['product_type']);
        echo "
                <div class='mb-3'>
                    <div class='bg-black text-white font-black text-sm p-0.5 px-1 uppercase flex justify-between'>
                        <span>1x $productName</span>
                    </div>
                    <ul class='mt-1 space-y-0.5 text-[12px] font-bold pl-1'>
        ";
        foreach ($item['options'] as $opt) {
            echo "
                        <li class='flex items-start'>
                            <span class='mr-1'>-</span>
                            <span>{$opt['name']}</span>
                        </li>
            ";
        }
        echo "
                    </ul>
                </div>
        ";
    }

    echo "
            </div>

            <!-- --- TOTAL --- -->
            <div class='text-right'>
                <p class='font-black text-lg'>TOTAL: $" . number_format($order['total']) . "</p>
            </div>
            
            <div class='h-4'></div>
        </div>
    </body>
    </html>";
}

// --- MISC HANDLERS ---

function handleListSettings($db) {
    $result = $db->query("SELECT * FROM settings");
    echo json_encode($result->fetch_all(MYSQLI_ASSOC));
}

function handleUpdateSetting($db) {
    $data = json_decode(file_get_contents('php://input'), true);
    $stmt = $db->prepare("UPDATE settings SET value = ? WHERE `key` = ?");
    $stmt->bind_param('ss', $data['value'], $data['key']);
    $stmt->execute();
    echo json_encode(['ok' => true]);
}

function handleReports($db) {
    $total = $db->query("SELECT SUM(total) as t, COUNT(*) as c FROM orders WHERE status='aceptado'")->fetch_assoc();
    echo json_encode(['revenue' => (float)$total['t'], 'count' => (int)$total['c']]);
}
