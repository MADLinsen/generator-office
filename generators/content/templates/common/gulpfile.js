'use script';

var gulp = require('gulp');
var webserver = require('gulp-webserver');
var fs = require('fs');
var minimist = require('minimist');
var xmllint = require('xmllint');
var chalk = require('chalk');
var $ = require('gulp-load-plugins')({lazy: true});

gulp.task('help', $.taskListing.withFilters(function(task) {
	var mainTasks = ['default', 'help', 'serve-static', 'validate-xml'];
  var isSubTask = mainTasks.indexOf(task) < 0;
	return isSubTask;
}));
gulp.task('default', ['help']);

gulp.task('serve-static', function(){
  gulp.src('.')
    .pipe(webserver({
      https: true,
      port: '8443',
      host: 'localhost',
      directoryListing: true,
      fallback: 'index.html'
    }));
});

gulp.task('validate-xml', function () {
  var options = minimist(process.argv.slice(2));
  var xsd = fs.readFileSync('./manifest.xsd');
  var xmlFilePath = options.xmlfile || './manifest.xml';
  var resultsAsJson = options.json || false;
  var xml = fs.readFileSync(xmlFilePath);

  if (!resultsAsJson) {
    console.log('\nValidating ' + chalk.blue(xmlFilePath.substring(xmlFilePath.lastIndexOf('/')+1)) + ':');
  }
  var result = xmllint.validateXML({
    xml: xml,
    schema: xsd
  });

  validateHighResolutionIconUrl(xml, result);

  if (resultsAsJson) {
    console.log(JSON.stringify(result));
  }
  else {
    if (result.errors === null) {
      console.log(chalk.green('Valid'));
    }
    else {
      console.log(chalk.red('Invalid'));
      result.errors.forEach(function(e) {
        console.log(chalk.red(e));
      });
    }
  }
});

function validateHighResolutionIconUrl(xml, result) {
  if (xml && result) {
    if (xml.indexOf('<HighResolutionIconUrl ') > -1 &&
      xml.indexOf('<HighResolutionIconUrl DefaultValue="https://') < 0) {
        if (result.errors === null) {
          result.errors = [];
        }
        
        result.errors.push('The value of the HighResolutionIconUrl attribute contains an unsupported URL. You can only use https:// URLs.');
    }
  }
}