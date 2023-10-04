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

	$error = (!APP_DEBUG) ? $errstr : "$errstr in $errfile at line $errline";

	exit(json_encode(array("error" => $error)));

	//return false;
}

function app_exception_handler($ex) {
	return app_error_handler($ex->getCode(), $ex->getMessage(), $ex->getFile(), $ex->getLine());
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

header("HTTP/1.0 404 Not Found");
