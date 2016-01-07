/* 
 *	Determine which stylesheet files are loaded
 * 	
 *
 *
 */

var bootstrap = 'stylesheets/bootstrap.min.css';
var fonts = 'stylesheets/font-awesome.min.css';
var main = 'stylesheets/main.css';
var error = 'stylesheets/error404.css';
var index = 'stylesheets/index.css';


 
exports.homepage = [bootstrap, fonts, main, error, index];
exports.error = [bootstrap, error, main, index];