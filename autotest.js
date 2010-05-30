// Watches the spec files for changes and reloads the Jasmine test runner
// Watches the source files for changes and auto-builds with Sprockets
// Rebuilds also trigger the tests

var SOURCE_DIR = "src";
var SOURCE_MAIN = SOURCE_DIR+'/application.js';
var BUILD_DIR = 'build';
var BUILD_MAIN = BUILD_DIR+'/application.js';
var SPEC_DIR = 'spec';
var WATCH_INTERVAL = 5000;

// Requires
var sys = require("sys"),
    fs  = require("fs")
    spawn = require('child_process').spawn,
    exec = require('child_process').exec;

var FileWatcher = {};
FileWatcher.create = function(pathToWatch, callback, options)
{
  var _options = options || []
  var _callOnChange = callback;
  var _rootWatchedPaths = (pathToWatch instanceof Array) ? pathToWatch : [pathToWatch];
  var _watchedFiles = [];

  var _conditionallyCallOnChange = function(currStat, prevStat)
  {
    // Only execute if the file was actually modified
    if(""+currStat.mtime == ""+prevStat.mtime)
    {
      return;
    }

    // Remove watchers, if necessary
    _options["disableDuringCallback"] && _unwatchAllPaths();
    // Call _callOnChange()
    _callOnChange();
    // Refresh watchers, if necessary
    if(_options["disableDuringCallback"] || _options["refreshAfterCallback"])
    {
      _reprocessRootPaths();
    }
  };

  var _unwatchAllPaths = function()
  {
    while(_watchedFiles.length > 0)
    {
      // Clear the filesystem watch and remove from the array
      var filePath = _watchedFiles.pop();
      fs.unwatchFile(filePath);
    }
  };

  var _watchThisFilePath = function(filePath)
  {
    fs.watchFile(filePath,
                 {persistent:true, interval:WATCH_INTERVAL},
                 _conditionallyCallOnChange);
    _watchedFiles.push(filePath);
  };

  var _processPath = function(filePath)
  {
    var fileStat = fs.statSync(filePath);
    if(fileStat.isFile())
    {
      _watchThisFilePath(filePath);
    }
    else if(fileStat.isDirectory())
    {
      var files = fs.readdirSync(filePath);
      files.forEach(function(child)
      {
        // Descend the filename
        _processPath(filePath+'/'+child);
      });
    }
  };

  var _reprocessRootPaths = function()
  {
    _unwatchAllPaths();
    _rootWatchedPaths.forEach(function(watchThisPath)
    {
      _processPath(watchThisPath);
    });
  };

  // Check the pathToWatch (file or directory?) and do the appropriate operation
  _reprocessRootPaths();
};

var Jasmine = {};
Jasmine.init = function()
{
  var _jasmineProcess;
  var _stop = function()
  {
    _jasmineProcess && _jasmineProcess.kill();
  };

  var _start = function()
  {
    sys.puts("Starting Jasmine Server...");
    _stop();
    _jasmineProcess = spawn('rake', ['jasmine']);

    _jasmineProcess.stdout.addListener('data', function (data)
    {
      sys.puts('jasmine stdout: ' + data);
    });

    _jasmineProcess.stderr.addListener('data', function (data)
    {
      sys.puts('jasmine stderr: ' + data);
    });

    _jasmineProcess.addListener('exit', function (code)
    {
      sys.puts('Jasmine Server exited with code: ' + code);
    });

    // Watch the test files and output file
    FileWatcher.create(SPEC_DIR, _reopenTestPage);
  };

  var _reopenTestPage = function()
  {
    sys.puts("Opening Jasmine Test Runner.");
    exec("open -g -a 'Google Chrome' 'http://localhost:8888'", function(error, stdout, stderr)
    {
      if (error !== null)
      {
        sys.puts('testPage exec error: ' + error);
      }
    });
  };

  return {
    start:          _start,
    stop:           _stop,
    reopenTestPage: _reopenTestPage
  };
};

var jasmineManager = Jasmine.init();
jasmineManager.start();

// define a function for calling sprockets
var sprocketize = function()
{
  sys.puts("Sprocketizing source.");
  var sprocketizeCommand = 'sprocketize -I src '+SOURCE_MAIN+' > '+BUILD_MAIN;
  var sprocket = exec(sprocketizeCommand,
    function(error, stdout, stderr)
    {
      if (error !== null) {
        sys.puts('exec error: ' + error);
      }
      
      jasmineManager.reopenTestPage();
    }
  );
};

FileWatcher.create(SOURCE_DIR, sprocketize, { 'disableDuringCallback':true });


