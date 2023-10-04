"use strict";

// Simple frame frame buster.
// See <https://cheatsheetseries.owasp.org/cheatsheets/Clickjacking_Defense_Cheat_Sheet.html>.

if (self !== top) top.location = self.location;

// Start.

self.addEventListener("DOMContentLoaded", function(event) {
	console.log("self.DOMContentLoaded");
});
