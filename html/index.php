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
// ini_set("session.cookie_domain", "");
ini_set("session.cookie_lifetime", 604800);		// 604800 seconds to expire in 7 days; 0 (zero) expires when browser close
// ini_set("session.cookie_path", "/");
ini_set("session.cookie_httponly", 1);			// Prevent XSS
ini_set("session.cookie_samesite", "Strict");	// Requires PHP >= 7.4
ini_set("session.cookie_secure", 1);			// Requires HTTPS
ini_set("session.use_strict_mode", 1);			// Avoid session fixation
ini_set("session.use_trans_sid", 0);			// Avoid session hijacking
//setlocale(LC_TIME, "pt_BR");			// TODO: test this

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

if ($path == "/signup") {
	$_post = json_decode(file_get_contents("php://input"), TRUE);
	exit(json_encode($_post));
}

// Not found.

//header("HTTP/1.0 404 Not Found");
trigger_error("404 Not found", E_USER_ERROR);
