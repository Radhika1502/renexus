"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.createLogger = createLogger;
// Simple logger utility for shared use across services
var SimpleLogger = /** @class */ (function () {
    function SimpleLogger(context) {
        if (context === void 0) { context = 'App'; }
        this.context = context;
    }
    SimpleLogger.prototype.formatMessage = function (level, message) {
        var timestamp = new Date().toISOString();
        return "[".concat(timestamp, "] [").concat(level, "] [").concat(this.context, "] ").concat(message);
    };
    SimpleLogger.prototype.log = function (message) {
        console.log(this.formatMessage('LOG', message));
    };
    SimpleLogger.prototype.error = function (message, error) {
        console.error(this.formatMessage('ERROR', message));
        if (error) {
            console.error(error);
        }
    };
    SimpleLogger.prototype.warn = function (message) {
        console.warn(this.formatMessage('WARN', message));
    };
    SimpleLogger.prototype.debug = function (message) {
        console.debug(this.formatMessage('DEBUG', message));
    };
    SimpleLogger.prototype.verbose = function (message) {
        console.log(this.formatMessage('VERBOSE', message));
    };
    return SimpleLogger;
}());
exports.logger = new SimpleLogger('App');
function createLogger(context) {
    return new SimpleLogger(context);
}
exports.default = exports.logger;
