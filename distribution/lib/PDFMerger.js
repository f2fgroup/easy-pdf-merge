'use strict';

var fs = require('fs');
var exec = require('child_process').exec;
var path = require('path');

function checkSrc(src, callback) {

  if (!Array.isArray(src)) return callback('Source is not an Array');else if (src.length < 2) return callback('There must be atleast 2 input files');

  var norm_src = [];

  for (var i = 0; i < src.length; i++) {

    if (typeof src[i] === 'string') {

      /*
      //Check if source file exists
       fs.stat(src[i],function(err,stats){
         if(err)
          return callback('Can\'t access file : ' + src[i]);
         if(!stats.isFile())
          return callback(src[i] + ' is not a File');
       });*/

      norm_src.push('"' + src[i] + '"');
    } else return callback('Source : ' + src[i] + ' + , is not a file name');
  }

  callback(null, norm_src);
}

module.exports = function (src, dest, background, callback) {

  var dirPathArr = __dirname.split(path.sep);

  dirPathArr.pop();
  dirPathArr.pop();
  dirPathArr.push('jar');
  dirPathArr.push('pdfbox.jar');
  if (typeof background === 'function') {
    callback = background;
    background = null;
  }
  var jarPath = dirPathArr.join(path.sep);

  var command = ['java -jar "' + jarPath + '" PDFMerger'];

  // sets the specified background
  var runBackground = function runBackground(src) {
    if (background) {
      command = ['java -jar "' + jarPath + '" OverlayPDF'];
      command.push('"' + src + '"'); // input
      command.push('"' + background + '"'); // background
      command.push('-position background');
      command.push('"' + dest + '"'); // output
      var childOverlay = exec(command.join(' '), function (err, stdout, stderr) {
        if (err) return callback(err);
        callback(null);
      });
      childOverlay.on('error', function (err) {
        return callback('Overlay execution problem. ' + err);
      });
      return;
    }
  };

  checkSrc(src, function (err, norm_src) {

    if (err && src.length === 1 && background) {
      return runBackground(src[0]);
    }
    if (err) return callback(err);

    command = command.concat(norm_src);

    command.push('"' + dest + '"');

    var child = exec(command.join(' '), function (err, stdout, stderr) {

      if (err) return callback(err);

      if (background) {
        return runBackground(dest);
      }
      callback(null);
    });

    child.on('error', function (err) {
      return callback('Execution problem. ' + err);
    });
  });
};