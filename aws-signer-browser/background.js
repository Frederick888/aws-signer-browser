let ignoreHeaders = ['connection'];

let hashedPayloads = [];

let algorithm = 'AWS4-HMAC-SHA256';
let access_key_id;
let secret_access_key;
let definedServices = [];

browser.storage.local.get(['aws_key', 'aws_secret', 'defined_services'])
    .then(function (result) {
        access_key_id = result.aws_key || "";
        secret_access_key = result.aws_secret || "";
        definedServices = [];
        JSON.parse(result.defined_services || "[]").forEach(function (service) {
            definedServices[service.host] = service;
        });
    });

function rewriteUserAgentHeader(e) {
    let method = e.method;
    let url = new URL(e.url);
    if (!(url.host in definedServices))
        return;
    let dateTime = (new Date()).toISOString().replace(/[-:\.]/g, '').replace(/T(\d{6})\d*Z/, 'T$1Z');

    let canonicalUri = encodeURI(url.pathname);

    let canonicalQuery = '';
    Array.from(url.searchParams.keys()).sort().forEach(function (param) {
        let values = url.searchParams.getAll(param).sort();
        if (values.length === 0) {
            canonicalQuery += '&' + encodeURIComponent(param) + '=';
        } else {
            values.forEach(function (value) {
                canonicalQuery += '&' + encodeURIComponent(param) + '=' + encodeURIComponent(value);
            });
        }
    });
    canonicalQuery = canonicalQuery.substr(1);

    let canonicalHeader = '';
    let trimmedHeaders = {
        'x-amz-date': [dateTime],
    };
    e.requestHeaders.forEach(function (header) {
        let name = header.name.trim().toLowerCase();
        if (ignoreHeaders.includes(name))
            return;
        let value = header.value.trim().replace(/\s+/g, ' ');
        if (name in trimmedHeaders) {
            trimmedHeaders[name].push(value);
        } else {
            trimmedHeaders[name] = [value];
        }
    });
    Object.keys(trimmedHeaders).sort().forEach(function (name) {
        canonicalHeader += name + ':' + trimmedHeaders[name].join() + "\n";
    });

    let signedHeaders = Object.keys(trimmedHeaders).sort().join(";");

    let canonicalRequest = method + "\n" +
        canonicalUri + "\n" +
        canonicalQuery + "\n" +
        canonicalHeader + "\n" +
        signedHeaders + "\n" +
        hashedPayloads[e.requestId];
    console.log("\n\n");
    console.log('==== Canonical Request ====');
    console.log(canonicalRequest);

    let canonicalRequestHash = CryptoJS.SHA256(canonicalRequest).toString(CryptoJS.enc.Hex).toLowerCase();
    console.log('==== Canonical Request Hash ====');
    console.log(canonicalRequestHash);

    let credentialScope = [
        dateTime.split('T')[0],
        encodeURIComponent(definedServices[url.host].region),
        encodeURIComponent(definedServices[url.host].service),
        'aws4_request'
    ].join('/');
    let stringToSign = algorithm + "\n" +
        dateTime + "\n" +
        credentialScope + "\n" +
        canonicalRequestHash;
    console.log('==== StringToSign ====');
    console.log(stringToSign);

    let kSecret = secret_access_key;
    let kDate = sign('AWS4' + kSecret, dateTime.split('T')[0]);
    let kRegion = sign(kDate, definedServices[url.host].region);
    let kService = sign(kRegion, definedServices[url.host].service);
    let kSigning = sign(kService, 'aws4_request');

    let signature = sign(kSigning, stringToSign).toString(CryptoJS.enc.Hex).toLowerCase();
    console.log('==== Signature ====');
    console.log(signature);

    let authorizationHeader = algorithm + ' Credential=' +
        access_key_id + '/' + credentialScope +
        ', SignedHeaders=' + signedHeaders + ', Signature=' + signature;
    console.log('==== Authorization Header ====');
    console.log(authorizationHeader);

    e.requestHeaders.push({
        'name': 'x-amz-date',
        'value': dateTime,
    });
    e.requestHeaders.push({
        'name': 'Authorization',
        'value': authorizationHeader,
    });
    return {
        requestHeaders: e.requestHeaders
    };
}

function sign(key, msg) {
    return CryptoJS.HmacSHA256(msg, key);
}

function getHashedPayload(request) {
    let body = request.requestBody;
    if (body && body.raw && body.raw.length > 0 && body.raw[0].bytes) {
        let str = String.fromCharCode.apply(String, new Uint8Array(body.raw[0].bytes));
        return CryptoJS.SHA256(str).toString(CryptoJS.enc.Hex).toLowerCase();
    }
    return CryptoJS.SHA256('').toString(CryptoJS.enc.Hex).toLowerCase();
}

function badgeOn(tabId) {
    browser.browserAction.setBadgeText({
        text: '🔑',
        tabId: tabId
    });
}

function badgeOff(tabId) {
    browser.browserAction.setBadgeText({
        text: '',
        tabId: tabId
    });
}

function updateBadge(tab) {
    let url = new URL(tab.url);
    if (url.host in definedServices) {
        badgeOn(tab.id);
        return;
    }
    badgeOff(tab.id);
}

browser.runtime.onMessage.addListener(function (message) {
    access_key_id = message.aws_key;
    secret_access_key = message.aws_secret;
    definedServices = [];
    JSON.parse(message.defined_services || "[]").forEach(function (service) {
        definedServices[service.host] = service;
    });
    browser.tabs.query({}).then((tabs) => {
        for (let tab of tabs) {
            updateBadge(tab);
        }
    });
});
browser.tabs.onCreated.addListener((tab) => {
    updateBadge(tab);
});
browser.tabs.onUpdated.addListener((tabId, changeInfo, tabInfo) => {
    if (changeInfo.url) {
        updateBadge(tabInfo);
    }
});
browser.webRequest.onBeforeRequest.addListener(
    function (e) {
        let hashedPayload = getHashedPayload(e);
        hashedPayloads[e.requestId] = hashedPayload;
    }, {
        urls: ["*://*.amazonaws.com/*"]
    }, ["blocking", "requestBody"]
);
browser.webRequest.onBeforeSendHeaders.addListener(
    rewriteUserAgentHeader, {
        urls: ["*://*.amazonaws.com/*"]
    }, ["blocking", "requestHeaders"]
);