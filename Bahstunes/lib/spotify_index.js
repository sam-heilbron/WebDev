/**
 * Module dependencies.
 */
var Strategy = require('./spotify_strategy');

/**
 * Framework version.
 */
require('pkginfo')(module, 'version');

/**
 * Expose constructors.
 */
exports.Strategy = Strategy;