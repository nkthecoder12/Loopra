const EventEmitter = require("events");

class NotificationEventBus extends EventEmitter {
  constructor() {
    super();
    // Increase maximum listener limit if many domains register listeners
    this.setMaxListeners(30);
  }
}

const notificationEventBus = new NotificationEventBus();

module.exports = notificationEventBus;
