<?php
// I would not put too much weight on single quotes being faster than
// double quotes. [...] this benchmarks page has a single vs double
// quote comparison. Most of the comparisons are the same. There is
// one comparison where double quotes are slower than single quotes.
// See <https://stackoverflow.com/q/3446216> and
// <https://www.phpbench.com/>.

require("../config.php");

// Initial configuration.

date_default_timezone_set("UTC");
ini_set("default_charset", "UTF-8");
ini_set("display_errors", APP_DEBUG);
ini_set("error_reporting", E_ALL);
// ini_set("error_log", "");					// TESTING: log to Nginx error log so Fail2ban...
// ini_set("log_errors", 1);					// TESTING: always log
// ini_set("session.cookie_domain", "");		// defaults to the host name
ini_set("session.cookie_lifetime", 604800);		// 604800 seconds = 7 days; 0 (zero) expires when browser close
// ini_set("session.cookie_path", "/");
ini_set("session.cookie_httponly", 1);			// Prevent XSS
ini_set("session.cookie_samesite", "Strict");	// Requires PHP >= 7.4
ini_set("session.cookie_secure", 1);			// Requires HTTPS
ini_set("session.use_strict_mode", 1);			// Avoid session fixation
ini_set("session.use_trans_sid", 0);			// Avoid session hijacking
//setlocale(LC_TIME, "pt_BR");					// TODO: test this

// You should use the mb_internal_encoding() function at the top of
// every PHP script you write (or at the top of your global include
// script), and the mb_http_output() function right after it if your
// script is outputting to a browser.
// See <https://phptherightway.com/#php_and_utf8>.

mb_internal_encoding("UTF-8");
mb_http_output("UTF-8");

// If errors occur before the script is executed (e.g. on file uploads)
// the custom error handler cannot be called since it is not registered
// at that time.
// See <https://www.php.net/manual/en/function.set-error-handler.php>.

set_error_handler("app_error_handler");
set_exception_handler("app_exception_handler");

function app_error_handler($errno, $errstr, $errfile, $errline) {
	// $errstr may need to be escaped:
	// See <https://www.php.net/manual/en/function.set-error-handler.php>.

	$errstr = htmlspecialchars($errstr);

	// Log errors

	error_log($errstr);

	// Display errors: remove path from $errfile.

	$errfile = basename($errfile);

	// TODO: use error_reporting.

	$error = (!APP_DEBUG) ? $errstr : "$errstr, in $errfile, at line $errline";

	exit(json_encode(array("error" => $error)));

	//return false;
}

function app_exception_handler($ex) {
	return app_error_handler($ex->getCode(), $ex->getMessage(), $ex->getFile(), $ex->getLine());
}

// If SQLite database is exposed to the HTTP server, it is recommended,
// STRONGLY ADVISED, to setup the HTTP server to deny access to it.
// See also <https://nginx.org/en/docs/http/ngx_http_access_module.html>
// and <https://httpd.apache.org/docs/2.4/howto/access.html>.

// NOTE: keep SQLite database out of the document root directory.

$db = new PDO("sqlite:../data/database.sqlite");
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
//$db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_OBJ);
$db->exec("CREATE TABLE IF NOT EXISTS user (id TEXT NOT NULL PRIMARY KEY, username TEXT NOT NULL UNIQUE, password TEXT NOT NULL)");
$db->exec("CREATE TABLE IF NOT EXISTS item (id TEXT NOT NULL PRIMARY KEY, user_id TEXT NOT NULL, value TEXT)");

// This cookie doesn't need GDPR pop-ups because it's strictly necessary to
// provide the service.
// See <https://gdpr.eu/cookies/>.

session_start();

if (!isset($_SESSION["user_id"])) {
	$_SESSION["user_id"] = "";
}

// Simple router.

$path = parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH);

// Use X-Frame-Options header to defend against Clickjacking and fix the
// "Content-Security-Policy: Ignoring source ‘frame-ancestors’ (Not supported
// when delivered via meta element)" browser console warning message.
// See <https://cheatsheetseries.owasp.org/cheatsheets/Clickjacking_Defense_Cheat_Sheet.html>.

if ($path === "/") {
	header("X-Frame-Options: DENY");
	readfile("index.html");
	return true;
}

// From now on, every response must be formated as JSON.

header("Content-type: application/json; charset=UTF-8");

// From now on, every HTTP request must use POST method.

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
	//header("HTTP/1.0 405 Method Not Allowed");
	trigger_error("405 Method not allowed", E_USER_ERROR);
}

// Sign up.

// Don't use PHP sanitize filters (e.g. FILTER_SANITIZE_EMAIL).
// It could change the submitted input from an invalid into a
// valid state. See <https://stackoverflow.com/q/7290674>.

// Don't use PHP validate filters (e.g. FILTER_VALIDATE_EMAIL).
// On some older versions of PHP, it will accept john@gmail, which
// is a valid email address, but probably not desirable on an
// internet website. See <https://stackoverflow.com/a/7290702>.

// If FILTER_VALIDATE_REGEXP is the only way to validate text,
// prefer preg_match for efficiency and performance. See
// <https://stackoverflow.com/a/29215501>.

// Allways use PHP htmlentities and ENT_QUOTES to escape input
// before outputting it into a HTML context. See
// <http://shiflett.org/articles/cross-site-scripting> and
// <https://stackoverflow.com/q/46483>.

if ($path == "/signup") {
	$_post = json_decode(file_get_contents("php://input"), TRUE);
	$id = isset($_post["id"]) ? $_post["id"] : "";
	$username = isset($_post["username"]) ? mb_strtolower(trim($_post["username"])) : "";
	$password = isset($_post["password"]) ? trim($_post["password"]) : "";
	$confirmation = isset($_post["confirmation"]) ? trim($_post["confirmation"]) : "";

	if (!$id) {
		trigger_error("Invalid ID.", E_USER_ERROR);
	}

	if (!preg_match("/[\w\-.]{8,}/", $username)) {
		trigger_error("Invalid username", E_USER_ERROR);
	}

	if (!preg_match("/[\w\x20-\x40]{8,}/", $password)) {
		trigger_error("Invalid password", E_USER_ERROR);
	}

	if ($password !== $confirmation) {
		trigger_error("Invalid password confirmation", E_USER_ERROR);
	}

	// NOTE: sign up disabled.

	trigger_error("Cadastro de usuários desativado", E_USER_ERROR);

	// TODO: prevent SPAM without reCAPATCHA.

	$qry = $db->prepare("SELECT 1 FROM user WHERE username = ?");
	$qry->execute(array($username));
	$row = $qry->fetch();

	if ($row) {
		trigger_error("Username already signed up", E_USER_ERROR);
	}

	$password_hash = password_hash($password, PASSWORD_DEFAULT);
	$qry = $db->prepare("INSERT INTO user (id, username, password) VALUES (?, ?, ?)");
	$qry->execute(array($id, $username, $password_hash));
	//$id = $db->lastInsertId();

	$_SESSION["user_id"] = $id;

	exit(json_encode($_post));
}

// Not found.

//header("HTTP/1.0 404 Not Found");
trigger_error("404 Not found", E_USER_ERROR);

