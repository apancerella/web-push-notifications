const webPush = require('web-push');
const faker = require('faker');

// ./node_modules/.bin/web-push generate-vapid-keys
const vapidPublicKey = 'BD0TddxWgYFjQ9cz4jWLEUZlHx0-Jfz79Uq-obp52-VeYK6XIBGYzVbyghyxqlmv1HqUMZBz2KrSe8-yoAfrKIA';
const vapidPrivateKey = '4z64087R1oOJeIuRUmzINmOSKEtXpVakZuhEuMLB0uY';

const options = {
    TTL: 60, 
    vapidDetails: {
        subject: 'mailto: pushers@pushy.com',
        publicKey: vapidPublicKey,
        privateKey: vapidPrivateKey
    }
};

const notify = (subscribers) => {
    const transaction = faker.helpers.createTransaction();

    if (subscribers.size < 1) {
        console.log("No Subscribers to notify");
        return;
    }

    subscribers.forEach((subscriber, id) => {
        webPush.sendNotification(
            subscriber, 
            JSON.stringify(transaction),
            options 
        )
        .then(() => console.log(`subscribers notified`))
        .catch(error => console.error('Error in pushing notificaiton', error))
    })
}

module.exports = {
    notify: notify
}