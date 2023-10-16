
// Window events.

self.addEventListener("DOMContentLoaded", function(event) {
	console.log("window.DOMContentLoaded");

	setAlert("Loading...");
});

// Show errors on mobile browsers.

self.addEventListener("error", function(event) {
	console.log("window.error");
	const filename = event.filename.replace(/.*\//, '');
	const message = event.message + ' in ' + filename + ' at line ' + event.lineno;
	setAlert(message);
});

// All resources loaded.

self.addEventListener("load", function(event) {
	console.log("window.load");
	setAlert("Done.");
});

// Document events.
// Avoid event delegation bug on Safari Mobile.
// See <https://developer.mozilla.org/en-US/docs/Web/API/Element/click_event#safari_mobile>.

document.addEventListener("click", function(event) {
	console.log("document.click");

	// For local anchors (anchors starting with a fragment) only.

	const found = (event.target.href) ? event.target.href.match(/.*\/#(\w+)/) : null;

	if (found) {
		event.preventDefault();
		const fragment = found[1];
		setPage(fragment);
	}
});

// Sign up form events.

signupForm.addEventListener("submit", async function(event) {
	console.log("signupForm.submit");
	event.preventDefault();

	event.submitter.disabled = true;

	const id = self.crypto.randomUUID();
	const username = this.username.value.trim();
	const password = this.password.value.trim();
	const confirmation = this.confirmation.value.trim();

	if (!username.match(/[\w\-.]{8,}/)) {
		setAlert("Username invalid");
		event.submitter.disabled = null;
		return;
	}

	if (!password.match(/[\w\x20-\x40]{8,}/)) {
		setAlert("Invalid password");
		event.submitter.disabled = null;
		return;
	}

	if (password !== confirmation) {
		setAlert("Invalid password confirmation");
		event.submitter.disabled = null;
		return;
	}

	// Hash the password so the server never touches it.

	const encoder = new TextEncoder();
	const encoded = encoder.encode(password);
	const hash = await self.crypto.subtle.digest("SHA-256", encoded);
	const hex = buf2hex(hash);

	try {
		const data = {id, username, password: hex, confirmation: hex};

		const response = await self.fetch("/signup", {method: "POST",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify(data)
		});

		const result = await response.json();

		if (result.error) {
			throw result.error;
		}

		const user = {id, username, password: hash};

		await setDatabaseUser(user);
	}
	catch(error) {
		console.log(error);
		setAlert(error);
		//setAlert("Username already signed up");
		event.submitter.disabled = null;
		return;
	}

	setAlert("Done");

	event.submitter.disabled = null;
});

// Alert dialog events.

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

// IndexedDB utils.
// See <https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API>.

function getDatabase(name = "seguros-web", version = 1) {
	console.log("getDatabase");

	return new Promise(function(resolve, reject) {
		const request = self.indexedDB.open(name, version);

		request.addEventListener("error", function(event) {
			console.log("getDatabase.error");

			const error = event.target.error;

			reject(error);
		});

		request.addEventListener("upgradeneeded", function(event) {
			console.log("getDatabase.upgradeneeded");

			const db = event.target.result;

			if (event.newVersion == 1) {
				const userStore = db.createObjectStore("user", {keyPath: "id"});
				userStore.createIndex("username", "username", {unique: true});

				const itemStore = db.createObjectStore("item", {keyPath: "id"});
				itemStore.createIndex("username", "username"); // not unique
			}
		});

		request.addEventListener("success", function(event) {
			console.log("getDatabase.success");

			const db = event.target.result;

			resolve(db);
		});
	});
}

function getDatabaseUser(user) {
	console.log("getDatabaseUser");

	return getDatabase().then(function(db) {
		return new Promise(function(resolve, reject) {
			const transaction = db.transaction("user");
			const objectStore = transaction.objectStore("user");
			const request = objectStore.get(user.id);

			request.addEventListener("success", function(event) {
				console.log("getDatabaseUser.success");

				const record = event.target.result;
				console.log("getDatabaseUser.record", record);

				resolve(record);
			});
		});
	});
}

function getDatabaseUserByUsername(user) {
	console.log("getDatabaseUserByUsername");

	return getDatabase().then(function(db) {
		return new Promise(function(resolve, reject) {
			const transaction = db.transaction("user");
			const objectStore = transaction.objectStore("user");
			const index = objectStore.index("username");
			const request = index.get(user.username);

			request.addEventListener("success", function(event) {
				console.log("getDatabaseUserByUsername.success");

				const record = event.target.result;
				console.log("getDatabaseUserByUsername.record", record);

				resolve(record);
			});
		});
	});
}

function setDatabaseUser(user) {
	console.log("setDatabaseUser");

	return getDatabase().then(function(db) {
		return new Promise(function(resolve, reject) {
			const transaction = db.transaction(["user"], "readwrite");

			transaction.addEventListener("error", function(event) {
				console.log("setDatabaseUser.error");

				const error = event.target.error;

				reject(error);
			});

			transaction.addEventListener("complete", function(event) {
				console.log("setDatabaseUser.complete");

				//const transaction = event.target;

				resolve(true);
			});

			const objectStore = transaction.objectStore("user");
			const request = objectStore.add(user);

			request.addEventListener("success", function(event) {
				console.log("setDatabaseUser.success");

				//const key = event.target.result;

				//resolve(key);
			});
		});
	});
}

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
