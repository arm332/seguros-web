"use strict";

// Window events.

self.addEventListener("DOMContentLoaded", function(event) {
	console.log("window.DOMContentLoaded");
	setMessage("OK");
});

self.addEventListener("offline", function(event) {
	console.log("window.offline");
	setMessage("window.offline");
});

self.addEventListener("online", function(event) {
	console.log("window.online");
	setMessage("window.online");
});

// Document events.

document.addEventListener("keydown", function(event) {
	console.log("document.keydown");

	if (event.key == "Escape") {
		if (message.open) {
			message.close();
		}
	}
});

// Sign up form events.

signup.addEventListener("submit", async function(event) {
	console.log("signup.submit");
	event.preventDefault();

	event.submitter.disabled = true;

	const username = this.username.value.trim();
	const password = this.password.value.trim();
	const confirmation = this.confirmation.value.trim();

	if (!username.match(/[\w\-.]{8,}/)) {
		setMessage("Username invalid.");
		event.submitter.disabled = null;
		return;
	}

	if (!password.match(/[\w\x20-\x40]{8,}/)) {
		setMessage("Password invalid.");
		event.submitter.disabled = null;
		return;
	}

	if (password !== confirmation) {
		setMessage("Password confirmation incorrect.");
		event.submitter.disabled = null;
		return;
	}

	const data = {username, password, confirmation};
	const json = await fetchData("/signup", data);

	if (json.error) {
		setMessage(json.error);
		event.submitter.disabled = null;
		return;
	}

	// HTMLInputElement value property is a Safe Sink.
	// See <https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html#safe-sinks>

	this.username.value = json.username;
	this.password.value = json.username;
	this.confirmation.value = json.username;

	setMessage("ID: " + json.id);
	event.submitter.disabled = null;
});

// Messsage dialog events.

message.addEventListener("click", function(event) {
	console.log("message.click");

	this.close();
});

// Message dialog functions.

function setMessage(textContent = null) {
	console.log("setMessage");

	// Node textContent property is a Safe Sink.
	// See <https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html#safe-sinks>

	if (textContent) {
		message.textContent = textContent;
		message.show();
	}
	else {
		message.close();
	}
}

// Utils.

async function fetchData(url, data = null) {
	console.log("fetchData");

	// credentials defaults to "same-origin"
	// See <https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch>.

	const response = await fetch(url, {method: "POST", mode: "no-cors",
		cache: "no-cache", headers: {"Content-Type": "application/json"},
		redirect: "error", referrerPolicy: "no-referrer",
		body: JSON.stringify(data)});

	const json = response.json();

	return json;
}

//~ function sanitizeData(text) {
	//~ console.log("sanitizeData");

	//~ return text.replaceAll("&", "&amp;")
		//~ .replaceAll("<", "&lt;")
		//~ .replaceAll(">", "&gt;")
		//~ .replaceAll('"', "&quot;")
		//~ .replaceAll("'", "&apos;")
		//~ .replaceAll("`", "&grave;");
//~ }
