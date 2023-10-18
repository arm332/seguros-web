"use strict";

self.addEventListener("DOMContentLoaded", function(event) {
	console.log("window.DOMContentLoaded");
});

signup.addEventListener("submit", async function(event) {
	console.log("signup.submit");
	event.preventDefault();

	event.submitter.disable = true;

	const form = event.target;
	const username = form.username.value.trim();
	const password = form.password.value.trim();
	const confirmation = form.confirmation.value.trim();

	// TODO: form validation

	const encoder = new TextEncoder();

	const message = "The book is on the table.";

	const rawKey = await self.crypto.subtle.digest("SHA-256", encoder.encode(password));
	const authKey = await self.crypto.subtle.importKey("raw", rawKey, {name: "HMAC", hash: "SHA-256"}, true, ["sign", "verify"]);
	console.log(authKey);

	const signature = await self.crypto.subtle.sign("HMAC", authKey, encoder.encode(message));
	console.log(signature);

	// NOTE: using the SHA-256 digest of the hostname + "." + username is NOT
	// what is usually recommended but it gives us a 32 bytes long, globally
	// unique, salt which is what is expected and we can do authentication.

	//const salt = self.crypto.getRandomValues(new Uint8Array(16));
	const salt = await self.crypto.subtle.digest("SHA-256", encoder.encode(location.hostname + "." + username));
	const baseKey = await self.crypto.subtle.importKey("raw", rawKey, "PBKDF2", true, ["deriveKey", "deriveBits"]);
	const secretKey = await self.crypto.subtle.deriveKey({name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256"}, baseKey, {name: "AES-GCM", length: 256}, true, ["encrypt", "decrypt"]);
	console.log(secretKey);

    const iv = self.crypto.getRandomValues(new Uint8Array(12));
	const cypher = await self.crypto.subtle.encrypt({name: "AES-GCM", iv: iv}, secretKey, encoder.encode(message));
	console.log(cypher);

	const data = {username, signature: buf2hex(signature), cypher: buf2hex(cypher), iv: buf2hex(iv)};
	const response = await self.fetch("/test", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(data)});
	const json = await response.json();
	console.log(json);

	const plain = await self.crypto.subtle.decrypt({name: "AES-GCM", iv: hex2buf(json.iv)}, secretKey, hex2buf(json.cypher));
	const valid = await self.crypto.subtle.verify({name: "HMAC"}, authKey, hex2buf(json.signature), plain);
	console.log(valid);

	const decoder = new TextDecoder("UTF-8");
	const text = decoder.decode(plain);
	console.log(text);

	event.submitter.disable = null;
});

// Crypto functions.

// See <https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest#converting_a_digest_to_a_hex_string>.

function buf2hex(arrayBuffer) {
	return Array.from(new Uint8Array(arrayBuffer)).map(function(b) {
		return b.toString(16).padStart(2, "0");
	}).join("");
}

// See <https://stackoverflow.com/a/71083193>.

function hex2buf(hexString) {
	return new Uint8Array(hexString.match(/../g).map(function(h) {
		return parseInt(h, 16);
	})).buffer;
}
