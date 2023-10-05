"use strict";

// Window events.

self.addEventListener("DOMContentLoaded", function(event) {
	console.log("self.DOMContentLoaded");
});

// Sign up form events.
// Form element value property is a Safe Sink.
// See <https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html#safe-sinks>

signup.addEventListener("submit", async function(event) {
	console.log("signup.submit");
	event.preventDefault();

	const username = this.username.value.trim();
	const password = this.password.value.trim();
	const confirmation = this.confirmation.value.trim();
	this.send.disabled = true;

	if (!username.match(/[\w\-.]{8,}/)) {
		setMessage("Username invalid.");
		this.send.disabled = null;
		return;
	}

	if (!password.match(/[\w\x20-\x40]{8,}/)) {
		setMessage("Password invalid.");
		this.send.disabled = null;
		return;
	}

	if (password !== confirmation) {
		setMessage("Password confirmation incorrect.");
		this.send.disabled = null;
		return;
	}

	const data = {username, password, confirmation};
	const json = await fetchData("/signup", data);

	if (json.error) {
		setMessage(json.error);
		this.send.disabled = null;
		return;
	}

	this.username.value = json.username;
	this.password.value = json.username;
	this.confirmation.value = json.username;
	this.send.disabled = null;

	setMessage("ID: " + json.id);
});

// Messsage dialog events.

message.addEventListener("click", function(event) {
	console.log("message.click");

	this.close();
});

// Message dialog functions.
// Node textContent property is a Safe Sink.
// See <https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html#safe-sinks>

function setMessage(textContent = "") {
	console.log("setMessage");
	message.textContent = textContent;
	message.showModal();
}

// Utils.

function fetchData(url, data = {}) {
	console.log("fetchData");

	return fetch(url,
		{
			method: "POST",
			mode: "no-cors",
			cache: "no-cache",
			credentials: "same-origin",
			headers: {"Content-Type": "application/json"},
			redirect: "error",
			referrerPolicy: "no-referrer",
			body: JSON.stringify(data)
		}
	)
	.then(function(response) {
		return response.json();
	})
	.then(function(json) {
		return json;
	});
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
