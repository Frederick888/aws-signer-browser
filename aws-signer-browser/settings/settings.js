function notifySettingsChange() {
    let message = {
        aws_key: document.getElementById('aws_key').value,
        aws_secret: document.getElementById('aws_secret').value,
        defined_services: document.getElementById('textarea1').value,
    };
    browser.runtime.sendMessage(message);
}

document.addEventListener('DOMContentLoaded', () => {
    M.AutoInit();

    browser.storage.local.get(['aws_key', 'aws_secret', 'defined_services'])
        .then((result) => {
            document.getElementById('aws_key').value = result.aws_key || "";
            document.getElementById('aws_secret').value = result.aws_secret || "";
            document.getElementById('textarea1').value = result.defined_services || "";
        });
});

document.getElementById('aws_key').addEventListener("change", (e) => {
    browser.storage.local.set({
        aws_key: e.target.value,
    });
    notifySettingsChange();
});

document.getElementById('aws_secret').addEventListener("change", (e) => {
    browser.storage.local.set({
        aws_secret: e.target.value,
    });
    notifySettingsChange();
});

let hostRegexp = /^(?:[\w\*-]+\.)?(?:([a-z]{2}-[a-z]{4,10}-\d+)\.)?([a-z]{2,10})\.amazonaws\.com$/i;
document.getElementById('aws_host').addEventListener("change", (e) => {
    let host = e.target.value;
    host = host.replace(/^https?:\/\//i, '');
    document.getElementById('aws_host').value = host;
    if (hostRegexp.test(host)) {
        let matches = hostRegexp.exec(host);
        if (matches[1] !== undefined && document.getElementById('aws_region').value == "") {
            document.getElementById('aws_region').value = matches[1];
        }
        if (matches[2] !== undefined && document.getElementById('aws_service').value == "") {
            document.getElementById('aws_service').value = matches[2];
        }
    }
});

document.getElementById('add').addEventListener("click", () => {
    let service = {
        region: document.getElementById('aws_region').value,
        service: document.getElementById('aws_service').value,
        host: document.getElementById('aws_host').value,
    };
    let definedServices;
    try {
        definedServices = JSON.parse(document.getElementById('textarea1').value || "[]");
    } catch (e) {
        browser.notifications.create(null, {
            type: 'basic',
            message: 'Defined services field does not contain a valid JSON!',
            title: 'Parsing Error',
        });
        return;
    }
    definedServices.push(service);
    let definedServicesJson = JSON.stringify(definedServices, null, 4);
    document.getElementById('textarea1').value = definedServicesJson;
    browser.storage.local.set({
        defined_services: definedServicesJson,
    });
    notifySettingsChange();
    document.getElementById('aws_region').value = '';
    document.getElementById('aws_service').value = '';
    document.getElementById('aws_host').value = '';

    document.getElementById('add').setAttribute('disabled', 1);
    document.getElementById('add').innerText = 'Added';
    setTimeout(() => {
        document.getElementById('add').removeAttribute('disabled');
        document.getElementById('add').innerText = 'Add';
    }, 700);
});

document.getElementById('save').addEventListener("click", () => {
    let definedServices;
    try {
        definedServices = JSON.parse(document.getElementById('textarea1').value || "[]");
    } catch (e) {
        browser.notifications.create(null, {
            type: 'basic',
            message: 'Defined services field does not contain a valid JSON!',
            title: 'Parsing Error',
        });
        return;
    }
    let definedServicesJson = JSON.stringify(definedServices, null, 4);
    document.getElementById('textarea1').value = definedServicesJson;
    browser.storage.local.set({
        defined_services: definedServicesJson,
    });
    notifySettingsChange();

    document.getElementById('save').setAttribute('disabled', 1);
    document.getElementById('save').innerText = 'Saved';
    setTimeout(() => {
        document.getElementById('save').removeAttribute('disabled');
        document.getElementById('save').innerText = 'Save';
    }, 700);
});