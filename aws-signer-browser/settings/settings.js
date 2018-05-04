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
});