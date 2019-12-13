const runCmd = require('../src/runShCommand');
const path = require('path');
const fs = require('fs');
const uuid = require('../src/fastUuid');
const semverRegex = require('semver-regex');
const NodeCache = require( 'node-cache' );
const semverSort = require('semver-sort');
const cache = new NodeCache();
const cacheKey = 'prebidVersions';

const _prebidRootDir = './../prebid.js';
const _prebidVersions = [];
const _ttlSeconds = 60 * 60; // 1 hour

const appRouter = function (app, gulp) {

  app.use(function(req, res, next) {
    //enable CORS
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
  });

  app.post('/download', function(req, res) {

    if(!isValidRequest(req, res)){
      return;
    }

    const requestId = uuid.v4();
    const fileName = `prebid.${requestId}.js`;
    const allModules = req.body.modules || [];
    const prebidPath = getPrebidPathFromVersion(req.body.version);
    const modulesListStr = allModules.reduce(function(accm, val){
      return accm + ',' + val;
    });
    // for logging CSV
    logModules = modulesListStr.replace(/,/g, ';');
    logInfo(req.body.version, logModules);
   
    // generate file from command line
    // gulp bundle --modules ${module_list} --bundleName prebid.${uuid}.js
    runCmd.runCmd('gulp', ['--cwd', prebidPath, 'bundle', '--modules', modulesListStr, '--bundleName', fileName], function(output) {
      const prebidDownloadFilePath = path.resolve(prebidPath, 'build/dist', fileName);
      console.log(output);
      if(fs.existsSync(prebidDownloadFilePath)) {
        res.download(prebidDownloadFilePath);
      }
      else {
        res.send(JSON.stringify({
            error : 'Prebid file not built properly',
            requestId : requestId
          }
        ));
      }
      
    })
  });

  /**
   * Get a list of the supported download versions
   */
  app.get('/versions', function (req, res){
    /*
      example response:
      {
	      "versions": ["0.34.18", "1.17.0", "1.18.0", "1.20.0", "1.30.0"]
      }
    */
    const directory = 'prebid.js';
    const prebidPrefix = 'prebid_';

    let prebidVersions = cache.get(cacheKey);
    if(prebidVersions) {
      console.log('Retrieved from cache');
      res.send(getResponse(prebidVersions));
    }
    else{
      prebidVersions = [];
      console.log('Saving to cache');
      fs.readdir(directory, (err, files) => {
        files.forEach(file => {
          if (file.startsWith(prebidPrefix)){   // validate filename
            var f=file.replace(prebidPrefix, '');
            var v=f.split(".");
	    // consider it valid only if there are 3 fields
            if (v.length==3) {
                prebidVersions.push(file.replace(prebidPrefix, ''));
            }
          }
        });
        prebidVersions = semverSort.desc(prebidVersions);
        cache.set(cacheKey, prebidVersions, _ttlSeconds);
        res.send(getResponse(prebidVersions));
      })
    }

    function getResponse(versions) {
      return JSON.stringify({ versions : versions});
    }

  });

  /**
   * WIP: get a list of modules supported by a given version.
   * TODO: needs to support aliases. 
   */
  app.get('/bidders', function (req, res) {

    /*
      example request:
      {
        "version" : "1.1.2"
      }

      example response:
      {
        bidders : ['bidderA', 'bidderB'],
        analyticsAdapters : ['analyticsAdapter'],
        modules : ['moduleA', 'moduleB']
      }
    */

    if(!isValidVersion(req.query.id)){
      res.status(400);
      res.send('not valid version');
      return;
    };

    const bidders = [];
    const analytics = [];
    const modules = [];
    const directory = `prebid.js/prebid_${req.query.id}/modules/`;
    
    fs.readdir(directory, (err, files) => {
      if(err) {
        res.send(JSON.stringify({error : 'invalid version specified'}));
        return;
      }
      files.forEach(fileName => {
        if(fileName.indexOf('BidAdapter.js') > 0){
          bidders.push(fileName.substring(0, fileName.indexOf('BidAdapter.js')));
          fs.readFile(`${directory}${fileName}`, (err, contents) => {
            console.log(contents.toString());
          });
        }
        else if (fileName.indexOf('AnalyticsAdapter.js') > 0) {
          analytics.push(fileName.substring(0, fileName.indexOf('AnalyticsAdapter.js')));
        }
        else if (fileName.indexOf('.js') > 0) {
          modules.push(fileName.substring(0, fileName.indexOf('.js')));
        }
      });

      let response = {
        bidders : bidders,
        analyticsAdapters : analytics,
        modules : modules
      };

      res.send(JSON.stringify(response));
    })
    
  });
  
  /**
   * A health monitor endpoint that returns 200 OK.
   */
  app.get('/health', function(req, res) {
    res.status(200).send('OK');
  });

  function isValidRequest(req, res) {
    if(!req.body.modules || req.body.modules.length < 1 ){
      logError(res, 'missing module list');
      return false;
    }
    // TODO: Validate version is valid
    if(!isValidVersion(req.body.version)){
      res.status(400);
      logError(res, 'not valid version');
      return false;
    };

    function logError(res, err){
      res.status(400);
      res.send(JSON.stringify({
        error : err
      }));
    }
    return true;
  }

  function getPrebidPathFromVersion(version) {
    return path.resolve(__dirname, `${_prebidRootDir}/prebid_${version}/`);
  }

  function isValidVersion(version) {

    return semverRegex().test(version);
  }

  function logInfo(version, moduleString) {
    var info = 'dataCapture,' ;
    info += Date.now() + ',';
    [...arguments].forEach(arg => {
      info += `${arg},`;
    });
    console.log(info);
  }
};

module.exports = appRouter;
