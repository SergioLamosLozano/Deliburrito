<?php

// Deli Burrito - Simple PHP Server (No Composer Required)
header('Content-Type: application/json');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

try {
    // Basic .env parser for standalone PHP
    $envPaths = [
        __DIR__ . '/../.env', // Entorno local
        __DIR__ . '/../deliburrito_core/backend/.env' // Entorno cPanel (Producción)
    ];
    $envPath = null;
    foreach ($envPaths as $path) {
        if (file_exists($path)) {
            $envPath = $path;
            break;
        }
    }

    if ($envPath) {
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

    // ── Laravel Sanctum dummy route (evita errores 404 en la consola) ──────
    if ($method === 'GET' && $path === '/sanctum/csrf-cookie') {
        echo json_encode(['ok' => true]);
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
    } elseif ($path === '/variations') {
        if ($method === 'GET') {
            // GET es público — el cliente lo necesita para el selector de variaciones
            handleListVariations($db);
        } elseif ($method === 'POST') {
            requireAdmin();
            handleCreateVariation($db);
        }
    } elseif (preg_match('/^\/variations\/(\d+)\/toggle$/', $path, $matches)) {
        requireAdmin();
        handleToggleVariation($db, $matches[1]);
    } elseif (preg_match('/^\/variations\/(\d+)$/', $path, $matches)) {
        requireAdmin();
        if ($method === 'POST' || $method === 'PUT') handleUpdateVariation($db, $matches[1]);
        elseif ($method === 'DELETE') handleDeleteVariation($db, $matches[1]);
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
    } elseif ($path === '/product-types') {
        if ($method === 'GET') handleListProductTypes($db);
        elseif ($method === 'POST') { requireAdmin(); handleCreateProductType($db); }
    } elseif ($path === '/product-types/upload') {
        requireAdmin();
        handleUploadProductImage();
    } elseif (preg_match('/^\/product-types\/(\d+)$/', $path, $matches)) {
        requireAdmin();
        if ($method === 'POST' || $method === 'PUT') handleUpdateProductType($db, $matches[1]);
        elseif ($method === 'DELETE') handleDeleteProductType($db, $matches[1]);
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
    
    foreach ($categories as &$cat) {
        if ($onlyActive) {
            $cat['options'] = $db->query("SELECT * FROM options WHERE category_id = ".$cat['id']." AND is_active = 1")->fetch_all(MYSQLI_ASSOC);
        }
        // Cargar variaciones habilitadas para esta categoría (tabla pivote category_variation)
        $varResult = $db->query(
            "SELECT pv.id, pv.name, pv.product_target, pv.price, cv.max_selections
             FROM product_variations pv
             INNER JOIN category_variation cv ON cv.product_variation_id = pv.id
             WHERE cv.category_id = " . (int)$cat['id']
        );
        $variations = $varResult ? $varResult->fetch_all(MYSQLI_ASSOC) : [];
        // Mapear para que el frontend de Laravel (BurritoBuilder) vea la misma estructura 'pivot'
        foreach ($variations as &$v) {
            $v['pivot'] = ['max_selections' => $v['max_selections']];
        }
        $cat['variations'] = $variations;
    }
    
    echo json_encode($categories);
}

function handleCreateCategory($db) {
    $data = json_decode(file_get_contents('php://input'), true);
    $name    = $data['name'];
    $is_req  = (int)$data['is_required'];
    $is_addon = (int)($data['is_addon'] ?? 0);
    $max_sel = (int)$data['max_selections'];
    $order   = (int)$data['order_index'];
    $type    = !empty($data['product_type']) ? $data['product_type'] : 'ambos';
    $active  = (int)($data['is_active'] ?? 1);
    $allow_qty = (int)($data['allow_quantity'] ?? 0);
    
    $stmt = $db->prepare("INSERT INTO categories (name, is_required, is_addon, max_selections, order_index, product_type, is_active, allow_quantity) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param('siiiisii', $name, $is_req, $is_addon, $max_sel, $order, $type, $active, $allow_qty);
    $stmt->execute();
    $category_id = $stmt->insert_id;

    // Sincronizar variaciones en la tabla pivote
    $vConfig = isset($data['variations_config']) ? $data['variations_config'] : [];
    syncCategoryVariations($db, $category_id, $vConfig);

    echo json_encode(['ok' => true, 'id' => $category_id]);
}

function handleUpdateCategory($db, $id) {
    $data    = json_decode(file_get_contents('php://input'), true);
    
    $name    = $data['name'] ?? '';
    $is_req  = (int)($data['is_required'] ?? 0);
    $is_addon = (int)($data['is_addon'] ?? 0);
    $max_sel = (int)($data['max_selections'] ?? 1);
    $order   = (int)($data['order_index'] ?? 0);
    $type    = !empty($data['product_type']) ? $data['product_type'] : 'ambos';
    $active  = (int)($data['is_active'] ?? 1);
    $allow_qty = (int)($data['allow_quantity'] ?? 0);
    $id_int  = (int)$id;

    $stmt = $db->prepare("UPDATE categories SET name=?, is_required=?, is_addon=?, max_selections=?, order_index=?, product_type=?, is_active=?, allow_quantity=? WHERE id=?");
    $stmt->bind_param('siiiisiii', $name, $is_req, $is_addon, $max_sel, $order, $type, $active, $allow_qty, $id_int);
    $stmt->execute();

    // Sincronizar variaciones
    $vConfig = isset($data['variations_config']) ? $data['variations_config'] : [];
    syncCategoryVariations($db, $id_int, $vConfig);

    echo json_encode(['ok' => true]);
}

/**
 * Sincroniza la tabla pivote category_variation.
 * Equivalente al sync() de Eloquent: borra las existentes y reinserta.
 */
function syncCategoryVariations($db, int $category_id, array $variations_config): void {
    $db->query("DELETE FROM category_variation WHERE category_id = $category_id");
    if (empty($variations_config)) return;
    $stmt = $db->prepare("INSERT IGNORE INTO category_variation (category_id, product_variation_id, max_selections) VALUES (?, ?, ?)");
    foreach ($variations_config as $v) {
        $vid = (int)$v['id'];
        $vmax = ($v['max_selections'] !== null && $v['max_selections'] !== '') ? (int)$v['max_selections'] : null;
        $stmt->bind_param('iii', $category_id, $vid, $vmax);
        $stmt->execute();
    }
}

// --- PRODUCT VARIATIONS HANDLERS ---

function handleListVariations($db) {
    $result = $db->query("SELECT * FROM product_variations ORDER BY product_target, name");
    echo json_encode($result->fetch_all(MYSQLI_ASSOC));
}

function handleReports($db) {
    $sql = "SELECT status, COUNT(*) as count, SUM(total) as total FROM orders GROUP BY status";
    $result = $db->query($sql);
    echo json_encode($result->fetch_all(MYSQLI_ASSOC));
}

// --- PRODUCT TYPE HANDLERS ---

function handleListProductTypes($db) {
    $result = $db->query("SELECT * FROM product_types ORDER BY order_index");
    echo json_encode($result->fetch_all(MYSQLI_ASSOC));
}

function handleCreateProductType($db) {
    $data = json_decode(file_get_contents('php://input'), true);
    $name = $data['name'] ?? '';
    $slug = $data['slug'] ?? '';
    $desc = $data['description'] ?? '';
    $emoji = $data['emoji'] ?? '🍔';
    $img  = $data['image_path'] ?? null;
    $order = (int)($data['order_index'] ?? 0);
    $active = (int)($data['is_active'] ?? 1);

    $stmt = $db->prepare("INSERT INTO product_types (name, slug, description, emoji, image_path, order_index, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())");
    $stmt->bind_param('sssssii', $name, $slug, $desc, $emoji, $img, $order, $active);
    $stmt->execute();
    echo json_encode(['ok' => true, 'id' => $stmt->insert_id]);
}

function handleUpdateProductType($db, $id) {
    $data = json_decode(file_get_contents('php://input'), true);
    $name = $data['name'] ?? '';
    $slug = $data['slug'] ?? '';
    $desc = $data['description'] ?? '';
    $emoji = $data['emoji'] ?? '🍔';
    $img  = $data['image_path'] ?? null;
    $order = (int)($data['order_index'] ?? 0);
    $active = (int)($data['is_active'] ?? 1);
    $id_int = (int)$id;

    $stmt = $db->prepare("UPDATE product_types SET name=?, slug=?, description=?, emoji=?, image_path=?, order_index=?, is_active=?, updated_at=NOW() WHERE id=?");
    $stmt->bind_param('sssssiii', $name, $slug, $desc, $emoji, $img, $order, $active, $id_int);
    $stmt->execute();
    echo json_encode(['ok' => true]);
}

function handleUploadProductImage() {
    if (!isset($_FILES['image'])) {
        echo json_encode(['ok' => false, 'message' => 'No file uploaded']);
        return;
    }
    $file = $_FILES['image'];
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    if (!in_array($ext, $allowed)) {
        echo json_encode(['ok' => false, 'message' => 'Invalid file type']);
        return;
    }
    $filename = uniqid('prod_') . '.' . $ext;
    $targetDir = __DIR__ . '/uploads/products/';
    if (!is_dir($targetDir)) mkdir($targetDir, 0755, true);
    $target = $targetDir . $filename;
    
    if (move_uploaded_file($file['tmp_name'], $target)) {
        echo json_encode(['ok' => true, 'path' => '/uploads/products/' . $filename]);
    } else {
        echo json_encode(['ok' => false, 'message' => 'Failed to move uploaded file']);
    }
}

function handleDeleteProductType($db, $id) {
    $db->query("DELETE FROM product_types WHERE id = " . (int)$id);
    echo json_encode(['ok' => true]);
}

function handleCreateVariation($db) {
    $data = json_decode(file_get_contents('php://input'), true);
    $stmt = $db->prepare("INSERT INTO product_variations (product_target, name, description, price, is_active) VALUES (?, ?, ?, ?, ?)");
    $target = $data['product_target'];
    $name   = $data['name'];
    $desc   = $data['description'] ?? '';
    $price  = (float)($data['price'] ?? 0);
    $active = (int)($data['is_active'] ?? 1);
    $stmt->bind_param('sssdi', $target, $name, $desc, $price, $active);
    $stmt->execute();
    echo json_encode(['ok' => true, 'id' => $stmt->insert_id]);
}

function handleUpdateVariation($db, $id) {
    $data   = json_decode(file_get_contents('php://input'), true);
    $stmt   = $db->prepare("UPDATE product_variations SET product_target=?, name=?, description=?, price=?, is_active=? WHERE id=?");
    $target = $data['product_target'];
    $name   = $data['name'];
    $desc   = $data['description'] ?? '';
    $price  = (float)($data['price'] ?? 0);
    $active = (int)($data['is_active'] ?? 1);
    $id_int = (int)$id;
    $stmt->bind_param('sssdii', $target, $name, $desc, $price, $active, $id_int);
    $stmt->execute();
    echo json_encode(['ok' => true]);
}

function handleDeleteVariation($db, $id) {
    $db->query("DELETE FROM product_variations WHERE id = " . (int)$id);
    echo json_encode(['ok' => true]);
}

function handleToggleVariation($db, $id) {
    $id_int = (int)$id;
    $db->query("UPDATE product_variations SET is_active = NOT is_active WHERE id = $id_int");
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
    $stmt = $db->prepare("INSERT INTO options (category_id, name, price, is_active) VALUES (?, ?, ?, ?)");
    $stmt->bind_param('isdi', $data['category_id'], $data['name'], $data['price'], $data['is_active']);
    $stmt->execute();
    echo json_encode(['ok' => true, 'id' => $stmt->insert_id]);
}

function handleUpdateOption($db, $id) {
    $data = json_decode(file_get_contents('php://input'), true);
    $stmt = $db->prepare("UPDATE options SET category_id=?, name=?, price=?, is_active=? WHERE id=?");
    $stmt->bind_param('isdii', $data['category_id'], $data['name'], $data['price'], $data['is_active'], $id);
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
    $table_number = $data['table_number'] ?? null;
    $delivery_type = $data['delivery_type'] ?? 'local';

    $stmt = $db->prepare("INSERT INTO orders (customer_name, customer_phone, customer_address, table_number, delivery_type, subtotal, delivery_cost, total, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pendiente', NOW(), NOW())");
    $stmt->bind_param('sssssdds', $customer_name, $customer_phone, $customer_address, $table_number, $delivery_type, $subtotal, $delivery_cost, $total);
    $stmt->execute();
    $order_id = $stmt->insert_id;

    foreach ($items as $item) {
        $product_type   = $item['product_type'] ?? 'burrito';
        $variation_name = $item['variation_name'] ?? null;
        $item_total     = (float)($item['item_total'] ?? 0);
        $notes          = $item['notes'] ?? '';

        $stmt2 = $db->prepare("INSERT INTO order_items (order_id, product_type, variation_name, item_total, notes) VALUES (?, ?, ?, ?, ?)");
        $stmt2->bind_param('issds', $order_id, $product_type, $variation_name, $item_total, $notes);
        $stmt2->execute();
        $item_id = $stmt2->insert_id;

        $options = isset($item['options']) ? $item['options'] : [];
        foreach ($options as $opt) {
            $option_id = (int)($opt['option_id'] ?? 0);
            if ($option_id <= 0) continue;

            $optRes = $db->query("SELECT price FROM options WHERE id = " . $option_id);
            if ($optRes && $optData = $optRes->fetch_assoc()) {
                $price = (float)$optData['price'];
                $qty = (int)($opt['quantity'] ?? 1);
                
                $stmt3 = $db->prepare("INSERT INTO order_item_options (order_item_id, option_id, price_charged, quantity) VALUES (?, ?, ?, ?)");
                $stmt3->bind_param('iidi', $item_id, $option_id, $price, $qty);
                $stmt3->execute();
            }
        }
    }
    echo json_encode(['ok' => true, 'order_id' => $order_id]);
    exit;
}

function handleListOrders($db) {
    $sql = "SELECT * FROM orders";
    if (!empty($_GET['since'])) {
        $since = $db->real_escape_string($_GET['since']);
        $sql .= " WHERE updated_at >= '$since' OR created_at >= '$since'";
    }
    $sql .= " ORDER BY created_at DESC" . (empty($_GET['since']) ? " LIMIT 500" : "");
    $result = $db->query($sql);
    $orders = [];
    while ($row = $result->fetch_assoc()) {
        $items = $db->query("SELECT id, product_type, variation_name, item_total, notes FROM order_items WHERE order_id = ".$row['id'])->fetch_all(MYSQLI_ASSOC);
        foreach($items as &$item) {
            $item['options'] = $db->query("SELECT o.name, oio.quantity FROM order_item_options oio JOIN options o ON oio.option_id = o.id WHERE oio.order_item_id = ".$item['id'])->fetch_all(MYSQLI_ASSOC);
        }
        unset($item);
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
    $itemsResult = $db->query("SELECT oi.id, oi.product_type, oi.variation_name, oi.item_total FROM order_items oi WHERE oi.order_id = $id");
    $items = [];
    while ($item = $itemsResult->fetch_assoc()) {
        $optsResult = $db->query("SELECT opt.name, oio.quantity FROM order_item_options oio JOIN options opt ON oio.option_id = opt.id WHERE oio.order_item_id = " . (int)$item['id']);
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
            body {
                font-family: 'Outfit', monospace;
                line-height: 1.2;
                background: #f3f4f6;
            }

            /* ── Vista previa en pantalla ── */
            body {
                background: #f3f4f6;
                display: flex;
                justify-content: center;
                padding: 20px;
                margin: 0;
            }

            #zona-impresion {
                width: 80mm;
                background: white;
                padding: 4mm;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }

            /* ── Impresión: rollo térmico de 80mm ── */
            @media print {
                body {
                    background: white !important;
                    padding: 0 !important;
                    margin: 0 !important;
                    display: block !important;
                }

                @page {
                    size: 80mm auto; /* 80mm de ancho, alto automático */
                    margin: 0; /* Sin márgenes para impresoras térmicas */
                }

                #zona-impresion {
                    width: 76mm !important; /* Ligeramente menor a 80 para evitar cortes en el borde */
                    padding: 2mm !important;
                    margin: 0 auto !important;
                    box-shadow: none !important;
                }

                /* Evitar cortes feos a la mitad de un ingrediente */
                .no-cortar {
                    break-inside: avoid;
                    page-break-inside: avoid;
                }

                * {
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                    color-adjust: exact !important;
                }
            }
        </style>
    </head>
    <body class='p-4' onload='window.print()'>
        <div id='zona-impresion' class='text-black font-mono'>

            <!-- ENCABEZADO -->
            <div class='no-cortar text-center border-b-2 border-black pb-2 mb-2'>
                <p style='font-size:20px;font-weight:900;text-transform:uppercase;letter-spacing:0.1em;line-height:1;'>Deli Burrito</p>
                <p style='font-size:18px;font-weight:700;text-transform:uppercase;letter-spacing:-0.02em;'>Comanda #$id</p>
                <p style='font-size:11px;font-weight:700;margin-top:2px;'>$fecha &nbsp;·&nbsp; $hora</p>
            </div>

            <!-- DATOS DEL CLIENTE -->
            <div class='no-cortar border-b border-dashed border-black pb-2 mb-2' style='font-size:13px;'>
                <div style='display:flex;justify-content:space-between;align-items:flex-start;'>
                    <div style='line-height:1.5;'>
                        <p><span style='font-weight:900;text-transform:uppercase;background:#000;color:#fff;padding:0 4px;margin-right:4px;'>Cliente</span>{$order['customer_name']}</p>
                        <p><span style='font-weight:900;text-transform:uppercase;'>Tel:</span> {$order['customer_phone']}</p>";
    
    // Mostrar dirección o número de mesa según el tipo de entrega
    if ($order['delivery_type'] === 'local' && !empty($order['table_number'])) {
        echo "
                        <p><span style='font-weight:900;text-transform:uppercase;'>Mesa:</span> {$order['table_number']}</p>";
    } elseif ($order['delivery_type'] === 'domicilio' && !empty($order['customer_address'])) {
        echo "
                        <p><span style='font-weight:900;text-transform:uppercase;'>Dir:</span> {$order['customer_address']}</p>";
    } else {
        echo "
                        <p><span style='font-weight:900;text-transform:uppercase;'>Dir:</span> RECOGE EN LOCAL</p>";
    }
    
    echo "
                        <p><span style='font-weight:900;text-transform:uppercase;'>Entrega:</span> " . strtoupper($order['delivery_type']) . "</p>
                    </div>
                    <div style='text-align:right;'>
                        <p style='font-size:11px;font-weight:900;text-transform:uppercase;color:#555;'>Total</p>
                        <p style='font-size:20px;font-weight:900;line-height:1;'>\$" . number_format($order['total']) . "</p>
                    </div>
                </div>
            </div>

            <!-- DETALLE DEL PEDIDO -->
            <div class='border-b border-black pb-2 mb-2'>
                <p style='font-size:13px;font-weight:900;text-align:center;text-transform:uppercase;text-decoration:underline;text-underline-offset:2px;letter-spacing:0.1em;margin-bottom:6px;'>Preparación</p>
                ";

    foreach ($items as $item) {
        $productName    = strtoupper($item['product_type']);
        $variationLabel = !empty($item['variation_name'])
            ? ' — ' . strtoupper($item['variation_name'])
            : '';
        echo "
                <div class='no-cortar mb-2'>
                    <div style='background:#000;color:#fff;font-weight:900;font-size:14px;padding:3px 6px;text-transform:uppercase;letter-spacing:0.05em;'>
                        1x {$productName}{$variationLabel}
                    </div>
                    <ul style='margin-top:3px;font-size:14px;font-weight:700;padding-left:8px;line-height:1.5;'>
        ";
        foreach ($item['options'] as $opt) {
            $qLabel = ($opt['quantity'] > 1) ? " (x{$opt['quantity']})" : "";
            echo "
                        <li>— {$opt['name']}{$qLabel}</li>
            ";
        }
        echo "
                    </ul>
                </div>
        ";
    }

    echo "
            </div>

            <!-- TOTAL -->
            <div class='no-cortar' style='text-align:right;margin-top:4px;'>
                <p style='font-size:20px;font-weight:900;'>TOTAL: \$" . number_format($order['total']) . "</p>
            </div>

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
