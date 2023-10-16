"use strict";

// Globals.

let currentId = "signup";
let timeoutId = 0;

// Show errors on mobile browsers.

self.addEventListener("error", function(event) {
	console.log("window.error");

	const filename = event.filename.replace(/.*\//, "");

	setDialog(event.message + ", in " + filename + ", at line " + event.lineno);
});

// Document ready.

self.addEventListener("DOMContentLoaded", function(event) {
	console.log("window.DOMContentLoaded");

	setDialog("Loading...");

	setPage();
});

// All resources loaded.

self.addEventListener("load", function(event) {
	console.log("window.load");

	setDialog("Done.");
});

// User is navigatin through history.

self.addEventListener("popstate", function(event) {
	console.log("popstate");

	setPage();
});

// Document events.
// Avoid event delegation bug on Safari Mobile.
// See <https://developer.mozilla.org/en-US/docs/Web/API/Element/click_event#safari_mobile>.

document.addEventListener("click", function(event) {
	console.log("document.click");

	// Match inner links only (i.e. http://www.foo.org/#bar).

	if (event.target.href) {
		const found = event.target.href.match(/.*\/#(\w+)/);

		if (found) {
			event.preventDefault();

			const id = found[1];

			if (id === "back") {
				history.back();
			}
			else {
				setPage(id);
			}
		}
	}
});

// Dialog events.

dialog1.addEventListener("click", function(event) {
	console.log("dialog1.click");

	if (dialog1.open) {
		dialog1.close();
	}
});

// Dialog functions.

function setDialog(textContent = "") {
	console.log("setDialog", textContent);

	if (timeoutId) {
		clearTimeout(timeoutId);
	}

	if (dialog1.open) {
		dialog1.close();
	}

	if (textContent) {
		timeoutId = setTimeout(setDialog, 5000);
		dialog1.textContent = textContent;
		dialog1.showModal();
	}
}

// Page events.

signup.addEventListener("submit", async function(event) {
	console.log("signup.submit");
	event.preventDefault();
});

signin.addEventListener("submit", async function(event) {
	console.log("signin.submit");
	event.preventDefault();
});

// Page functions.

function setPage(id = null) {
	console.log("setPage", id, currentId);

	const prev = document.getElementById(currentId);

	prev.classList.add("hidden");

	// If history.state is empty, the user just loaded the application, so
	// replace the first (empty) state with currentId. Contract: call this
	// from DOMContentLoaded event with an empty id parameter.

	// If history.state is NOT empty, but id parameter is empty, the user is
	// navigating through history, so set currentId with the history.state.
	// Contract: call this from popstate event with an empty id parameter.

	// If history.state is NOT empty and id parameter is NOT empty, the user
	// is navigating to a new page in the application, so push the new id
	// to history and set currentId with new id.

	if (!history.state) {
		console.log("foo", history.state);
		history.replaceState(currentId, "");
	}
	else if (!id) {
		console.log("bar", id);
		currentId = history.state;
	}
	else {
		console.log("foobar", id);
		history.pushState(id, "");
		currentId = id;
	}

	const next = document.getElementById(currentId);

	next.classList.remove("hidden");
}
