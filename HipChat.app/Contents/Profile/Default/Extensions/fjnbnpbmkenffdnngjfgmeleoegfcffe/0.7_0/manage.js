
var styleTemplate = document.createElement("div");
styleTemplate.innerHTML = "<h2 class='style-name'></h2><p class='applies-to'></p><p class='actions'><a class='style-edit-link' href='edit.html?id='><button>" + t('editStyleLabel') + "</button></a><button class='enable' onclick='enable(event, true)'>" + t('enableStyleLabel') + "</button><button class='disable' onclick='enable(event, false)'>" + t('disableStyleLabel') + "</button><button class='delete' onclick='doDelete(event)'>" + t('deleteStyleLabel') + "</button><button class='check-update' onclick='doCheckUpdate(event)'>" + t('checkForUpdate') + "</button><button class='update' onclick='doUpdate(event)'>" + t('installUpdate') + "</button><span class='update-note'></span></p>";

var appliesToExtraTemplate = document.createElement("span");
appliesToExtraTemplate.className = "applies-to-extra";
appliesToExtraTemplate.innerHTML = t('appliesDisplayTruncatedSuffix');

getStyles({}, showStyles);

function showStyles(styles) {
	var installed = document.getElementById("installed");
	styles.map(createStyleElement).forEach(function(e) {
		installed.appendChild(e);
	});
}

function createStyleElement(style) {
	var e = styleTemplate.cloneNode(true);
	e.setAttribute("class", style.enabled == "true" ? "enabled" : "disabled");
	e.setAttribute("style-id", style.id);
	if (style.updateUrl) {
		e.setAttribute("style-update-url", style.updateUrl);
	}
	
	var styleName = e.querySelector(".style-name");
	styleName.appendChild(document.createTextNode(style.name));
	if (style.url) {
		var homepage = document.createElement("a");
		homepage.setAttribute("href", style.url);
		homepage.setAttribute("target", "_blank");
		var homepageImg = document.createElement("img");
		homepageImg.src = "world_go.png";
		homepageImg.alt = "*";
		homepage.appendChild(homepageImg);
		styleName.appendChild(document.createTextNode(" " ));
		styleName.appendChild(homepage);
	}
	var domains = [];
	var urls = [];
	var urlPrefixes = [];
	function add(array, property) {
		style.sections.forEach(function(section) {
			if (section[property]) {
				section[property].filter(function(value) {
					return array.indexOf(value) == -1;
				}).forEach(function(value) {
					array.push(value);
				});;
			}
		});
	}
	add(domains, 'domains');
	add(urls, 'urls');
	add(urlPrefixes, 'urlPrefixes');
	var appliesToToShow = [];
	if (domains)
		appliesToToShow = appliesToToShow.concat(domains);
	if (urls)
		appliesToToShow = appliesToToShow.concat(urls);
	if (urlPrefixes)
		appliesToToShow = appliesToToShow.concat(urlPrefixes.map(function(u) { return u + "*"; }));
	var appliesToString = "";
	var showAppliesToExtra = false;
	if (appliesToToShow.length == "")
		appliesToString = t('appliesToEverything');
	else if (appliesToToShow.length <= 10)
		appliesToString = appliesToToShow.join(", ");
	else {
		appliesToString = appliesToToShow.slice(0, 10).join(", ");
		showAppliesToExtra = true;
	}
	e.querySelector(".applies-to").appendChild(document.createTextNode(t('appliesDisplay', [appliesToString])));
	if (showAppliesToExtra) {
		e.querySelector(".applies-to").appendChild(appliesToExtraTemplate.cloneNode(true));
	}
	var editLink = e.querySelector(".style-edit-link");
	editLink.setAttribute("href", editLink.getAttribute("href") + style.id);
	return e;
}

function enable(event, enabled) {
	var id = getId(event);
	enableStyle(id, enabled);
}

function doDelete() {
	if (!confirm(t('deleteStyleConfirm'))) {
		return;
	}
	var id = getId(event);
	deleteStyle(id);
}

function getId(event) {
	return getStyleElement(event).getAttribute("style-id");
}

function getStyleElement(event) {
	var e = event.target;
	while (e) {
		if (e.hasAttribute("style-id")) {
			return e;
		}
		e = e.parentNode;
	}
	return null;
}

chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
	switch(request.name) {
		case "styleUpdated":
			handleUpdate(request.style);
			sendResponse({});
			break;
		case "styleAdded":
			installed.appendChild(createStyleElement(request.style));
			sendResponse({});
			break;
		case "styleDeleted":
			handleDelete(request.id);
			sendResponse({});
			break;
	}
});

function handleUpdate(style) {
	var installed = document.getElementById("installed");
	installed.replaceChild(createStyleElement(style), installed.querySelector("[style-id='" + style.id + "']"));
}

function handleDelete(id) {
	var installed = document.getElementById("installed");
	installed.removeChild(installed.querySelector("[style-id='" + id + "']"));
}

function doCheckUpdate(event) {
	checkUpdate(getStyleElement(event));
}

function checkUpdateAll() {
	Array.prototype.forEach.call(document.querySelectorAll("[style-update-url]"), checkUpdate);
}

function checkUpdate(element) {
	element.querySelector(".update-note").innerHTML = t('checkingForUpdate');
	element.className = element.className.replace("checking-update", "").replace("no-update", "").replace("can-update", "") + " checking-update";
	var id = element.getAttribute("style-id");
	var url = element.getAttribute("style-update-url");
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url, true);	
	xhr.onreadystatechange = function (aEvt) {  
		if (xhr.readyState == 4) {  
			if (xhr.status == 200) {
				checkNeedsUpdate(id, JSON.parse(xhr.responseText));
			} else if (xhr.status == 0) {
				handleNeedsUpdate(t('updateCheckFailServerUnreachable'), id, null);
			} else {
				handleNeedsUpdate(t('updateCheckFailBadResponseCode', [xhr.status]), id, null);
			}
		}
	};  
	xhr.send(null);
}

function checkNeedsUpdate(id, serverJson) {
	getStyles({id: id}, function(styles) {
		var style = styles[0];
		if (codeIsEqual(style.sections, serverJson.sections)) {
			handleNeedsUpdate("no", id, serverJson);
		} else {
			handleNeedsUpdate("yes", id, serverJson);
		}
	});
}

function handleNeedsUpdate(needsUpdate, id, serverJson) {
	var e = document.querySelector("[style-id='" + id + "']");
	e.className = e.className.replace("checking-update", "");
	switch (needsUpdate) {
		case "yes":
			e.className += " can-update";
			e.updatedCode = serverJson;
			e.querySelector(".update-note").innerHTML = '';
			break;
		case "no":
			e.className += " no-update";
			e.querySelector(".update-note").innerHTML = t('updateCheckSucceededNoUpdate');
			break;
		default:
			e.className += " no-update";
			e.querySelector(".update-note").innerHTML = needsUpdate;
	}
}

function doUpdate(event) {
	var element = getStyleElement(event);
	var o = {};
	o.id = element.getAttribute('style-id');
	o.sections = element.updatedCode.sections;
	saveFromJSON(o, function() {
		element.updatedCode = "";
		element.className = element.className.replace("can-update", "update-done");
		element.querySelector(".update-note").innerHTML = t('updateCompleted');
	});
}

function codeIsEqual(a, b) {
	if (a.length != b.length) {
		return false;
	}
	var properties = ["code", "urlPrefixes", "urls", "domains"];
	for (var i = 0; i < a.length; i++) {
		var found = false;
		for (var j = 0; j < b.length; j++) {
			var allEquals = properties.every(function(property) {
				return jsonEquals(a[i], b[j], property);
			});
			if (allEquals) {
				found = true;
				break;
			}
		}
		if (!found) {
			return false;
		}
	}
	return true;
}

function jsonEquals(a, b, property) {
	var type = getType(a[property]);
	var typeB = getType(b[property]);
	if (type != typeB) {
		// consider empty arrays equivalent to lack of property
		if ((type == "undefined" || (type == "array" && a[property].length == 0)) && (typeB == "undefined" || (typeB == "array" && b[property].length == 0))) {
			return true;
		}
		return false;
	}	
	if (type == "array") {
		if (a[property].length != b[property].length) {
			return false;
		}
		for (var i = 0; i < a.length; i++) {
			var found = false;
			for (var j = 0; j < b.length; j++) {
				if (a[i] == b[j]) {
					found = true;
					break;
				}
			}
			if (!found) {
				return false;
			}
		}
		return true;
	}
	if (type == "string") {
		return a[property] == b[property];
	}
}

function getType(o) {
	if (typeof o == "undefined" || typeof o == "string") {
		return typeof o;
	}
	if (o instanceof Array) {
		return "array";
	}
	throw "Not supported - " + o;
}

document.title = t("manageTitle");
