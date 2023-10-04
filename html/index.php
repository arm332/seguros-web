<?php

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
?>
