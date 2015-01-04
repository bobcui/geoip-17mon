var fs = require('fs')
var http = require('http')
var url = require('url')
var argv = require('optimist').argv
var spawn = require('child_process').spawn

var versionUrl = argv.c || argv.check || 'http://user.17mon.cn/download.php?a=version&token=dccc45f980c84d5228a32c509881294b2afcbccf'
var downloadUrl = argv.d || argv.download || 'http://user.17mon.cn/download.php?token=dccc45f980c84d5228a32c509881294b2afcbccf'
var versionFile = argv.v || argv.version || './db/version'
var dbFile = argv.f || argv.file || './db/17monipdb.dat'

var getLocalVersion = function() {
    if (!fs.existsSync(versionFile)) {
        return undefined
    }
    return fs.readFileSync(versionFile).toString().trim()
}

var getRemoteVersion = function(cb) {
    http.get(versionUrl, function(res) {
        res.on('data', function(data) {
            cb(data.toString().trim())
        })
        res.on('error', function(e) {
            throw e
        })
    })
}

var download = function(tmpFilePath, cb) {
    var options = {
        hostname: url.parse(downloadUrl).hostname,
        port: url.parse(downloadUrl).port || 80,
        path: url.parse(downloadUrl).path
    }

    var tmpFile = fs.createWriteStream(tmpFilePath)
    http.get(options, function(res) {
        res.on('data', function(data) {
            tmpFile.write(data)
        })
        res.on('end', function() {
            tmpFile.end()
            cb()
        })
        res.on('error', function(e) {
            throw e
        })
    })
}

var localVersion = getLocalVersion()
console.log('local version : %s', localVersion)

getRemoteVersion(function(remoteVersion){
    console.log('remote version: %s', remoteVersion)
    if (localVersion === remoteVersion) {
        console.log('no need update already latest version')
    }
    else {
        var tmpFilePath = '/tmp/17monipdb.dat.' + new Date().getTime()
        download(tmpFilePath, function(){
            spawn('mv', [tmpFilePath, dbFile]).on('close', function (code) {
                if (code !== 0) {
                    throw new Error('mv '+tmpFilePath+' '+dbFile+' ret '+code)
                }

                fs.writeFile(versionFile, remoteVersion, function (err) {
                    if (!!err) {
                        throw err
                    }
                    console.log('update to version %s succ', remoteVersion)
                })
            })
        })
    }
})
