const spawn = require('child_process').spawn;
const runShCommand = exports;

/**
 * 
 * @param {string} cmd command to run 
 * @param {[string]} args arguments to send to the command 
 * @param {function} callBack callback function that is passed the standard output of the command as an argument
 */
function runCmd(cmd, args, callBack ) {
    var child = spawn(cmd, args);
    var resp = "";
    child.stdout.on('data', function (buffer) { resp += buffer.toString(); });
    child.stdout.on('end', function() { callBack (resp); });
}

runShCommand.runCmd = runCmd;