"use strict";

// Document ready.

self.addEventListener("DOMContentLoaded", function(event) {
	console.log("self.DOMContentLoaded");

	// Remove the NOSCRIPT HTML tag from the dialog.

	while (dialog1.lastChild) dialog1.removeChild(dialog1.lastChild);

	// Set event handlers.

	dialog1.addEventListener("click", onDialog1Click, false);
	form1.addEventListener("submit", onForm1Submit, false);

	// Close the dialog.

	dialog1.close();
});

// Dialog1 events.

function onDialog1Click(event) {
	console.log("onDialog1Click");
	dialog1.close();
}

// Dialog1 functions.

function setDialog1(textContent = "") {
	console.log("setDialog1");
	dialog1.textContent = textContent;
	dialog1.showModal();
}

// Form1 events.

async function onForm1Submit(event) {
	console.log("onForm1Submit");
	event.preventDefault();

	// const form = this;
	this.fieldset.disabled = true;

	const username = this.username.value.trim();
	const password = this.password.value.trim();
	const confirmation = this.confirmation.value.trim();

	// TODO: username != ""
	// TODO: password != ""
	// TODO: password == confirmation

	const data = {username, password, confirmation};
	const json = await fetchURL("/signup1", data);
	console.log(json);

	if (json.error) {
		setDialog1(json.error);
		this.fieldset.disabled = null;
		return;
	}

	this.username.value = "Re: " + sanitizeText(json.username);
	this.password.value = "Re: " + sanitizeText(json.username);
	this.confirmation.value = "Re: " + sanitizeText(json.username);

	this.fieldset.disabled = null;
}

// Utils

async function fetchURL(url, data = {}) {
	console.log("fetchData");

	const response = await fetch(url, {
		method: "POST",
		mode: "no-cors",
		cache: "no-cache",
		credentials: "same-origin",
		headers: {"Content-Type": "application/json"},
		redirect: "error",
		referrerPolicy: "no-referrer",
		body: JSON.stringify(data)
	});

	const result = await response.json();

	return result;
}

function sanitizeText(text) {
	console.log("sanitizeText");

	return text.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&apos;")
		.replaceAll("`", "&grave;");
}
