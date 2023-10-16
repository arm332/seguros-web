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

// Database functions.

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

	event.submitter.disabled = true;

	const id = self.crypto.randomUUID();
	const username = event.target.username.value.trim();
	const password = event.target.password.value.trim();
	const confirmation = event.target.confirmation.value.trim();

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

		//await setDatabaseUser(user);
	}
	catch(error) {
		console.log(error);
		setDialog(error);
		//setDialog("Username already signed up");
		event.submitter.disabled = null;
		return;
	}

	setDialog("Done");

	event.submitter.disabled = null;
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

// Utils.

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
