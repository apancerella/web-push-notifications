const client = (() => {
    let serviceWorkerRegObj = undefined 
    const notificationButton = document.getElementById("btn-notify");
    const pushButton = document.getElementById("btn-push");
    let isUserSubscribed = false;

    const showNotificationButton = () => {
        notificationButton.style.display = "block";
        notificationButton.addEventListener("click", showNotification);
    }

    const showNotification = () => {
        const customizedNotification = reg => {
            const options = {
                body: 'This is an important body!',
                actions: [
                    { action: "search", title: "Try Searching!" },
                    { action: "close", title: "Forget it!" }
                ],
                data: {
                    notificationTime: Date.now(),
                    githubUser: 'Tony'
                }
            }
            reg.showNotification('Second Notification', options);
        }

        navigator.serviceWorker.getRegistration()
            .then(registration => customizedNotification(registration));
    }

    const checkNotificationSupport = () => {
        if(!('Notification' in window)) {
            return Promise.reject("The browser does not support notifications")
        }

        console.log("The browser supports notifications")
        return Promise.resolve("Ok!");
    }

    const registerServiceWorker = () => {
        if(!('serviceWorker') in navigator) {
            return Promise.reject("ServiceWorker support is not available.")
        }

        return navigator.serviceWorker.register('service-worker.js')
            .then(regObj => {
                console.log("service worker is registered successfully!");
                serviceWorkerRegObj = regObj;
                showNotificationButton();

                serviceWorkerRegObj.pushManager.getSubscription()
                    .then(subs => {
                        if (subs) disablePushNotificationButton();
                        else enablePushNotificationButton();
                    })
            })
    }

    const requestNotificationPermissions = () => {
        return Notification.requestPermission(status => {
            console.log("Notificaiton Permission Status:", status);
        })
    }

    checkNotificationSupport()
        .then(registerServiceWorker)
        .then(requestNotificationPermissions)
        .catch(err => console.error(err))
    
    const disablePushNotificationButton = () => {
        isUserSubscribed = true;
        pushButton.innerText = "DISABLE PUSH NOTIFICATIONS";
        pushButton.style.backgroundColor = "#ea9085"
    }

    const enablePushNotificationButton = () => {
        isUserSubscribed = false;
        pushButton.innerText = "ENABLE PUSH NOTIFICATIONS";
        pushButton.style.backgroundColor = "#efb1ff";
    }

    const setupPush = () => {
        function urlB64ToUint8Array(url) {
            const padding = '='.repeat((4 - url.length % 4) % 4);
            const base64 = (url + padding)
                .replace(/\-/g, '+')
                .replace(/_/g, '/');

            const rawData = window.atob(base64);
            const outputArray = new Uint8Array(rawData.length);

            for (let i = 0; i < rawData.length; ++i) {
                outputArray[i] = rawData.charCodeAt(i);
            }
            return outputArray;
        }

        const subscribeWithServer = (subscription) => {
            return fetch('http://localhost:3000/addSubscriber', {
                method: 'POST',
                body: JSON.stringify(subscription),
                headers: {
                    'Content-Type': 'application/json'
                }
            })
        }

        const subscribeUser = () => {
            const appServerPublicKey = "BD0TddxWgYFjQ9cz4jWLEUZlHx0-Jfz79Uq-obp52-VeYK6XIBGYzVbyghyxqlmv1HqUMZBz2KrSe8-yoAfrKIA";
            const publicKeyAsArray = urlB64ToUint8Array(appServerPublicKey);

            serviceWorkerRegObj.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: publicKeyAsArray
            })
            .then(subscription => {
                console.log(JSON.stringify(subscription, null, 4))
                subscribeWithServer(subscription)
                disablePushNotificationButton();
            })
            .catch(error => console.error("Failed to subscribe to Push Service.", error));
        };

        const unsubscribeWithServer = (id) => {
            return fetch('http://localhost:3000/removeSubscriber', {
                method: 'POST',
                body: JSON.stringify({ id }),
                headers: {
                    'Content-Type': 'application/json'
                }
            })
        }

        const unSubscribeUser = () => {
            console.log("un-subscribing user");
            serviceWorkerRegObj.pushManager.getSubscription()
                .then(subscription => {
                    if (subscription) {
                        let subAsString = JSON.stringify(subscription);
                        let subAsObject = JSON.parse(subAsString);
                        unsubscribeWithServer(subAsObject.keys.auth);
                        return subscription.unsubscribe()
                    }
                })
                .then(enablePushNotificationButton())
                .catch(error => console.error("Failed to unsibscribe from Push Service.", error))
        }

        pushButton.addEventListener('click', () => {
            if(isUserSubscribed) {
                unSubscribeUser();
            } else {
                subscribeUser();
            }
        })
    }
    setupPush();
})();