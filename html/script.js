"use strict";

// Globals.

let timeoutId = 0;

// Window events.

self.addEventListener("DOMContentLoaded", function(event) {
	console.log("window.DOMContentLoaded");
	setAlert("Loading...");
});

self.addEventListener("load", function(event) {
	console.log("window.DOMContentLoaded");
	setAlert("Done.");
});

// Sign up form events.

signupForm.addEventListener("click", function(event) {
	console.log("signupForm.click");
	event.preventDefault();
	setAlert("Done.");
});

// Messsage dialog events.

alertDialog.addEventListener("click", function(event) {
	console.log("alertDialog.click");
	setAlert();
});

// Alert dialog functions.

function setAlert(textContent = null) {
	console.log("setAlert");

	//

	clearTimeout(timeoutId);

	// The dialog may already be closed if the user typed Escape while the
	// setTimeout ID is still not 0 (zero). Close the dialog before opening
	// it so we see the message has changed and we can use showModal() even
	// if open attribute is true. Use showModal so we can close the dialog by
	// clicking anywere on the screen (backdrop), or by typing Escape,
	// without a document key down event handler.

	if (alertDialog.open) {
		alertDialog.close();
	}

	// Node textContent property is a Safe Sink.
	// See <https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html#safe-sinks>

	if (textContent) {
		alertDialog.textContent = textContent;
		alertDialog.showModal();

		// Auto-close the dialog in 5 seconds.

		setTimeout(setAlert, 5000);
	}
}
