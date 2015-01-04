var _ = require('underscore')
var fs = require('fs')
var http = require('http')
var url = require('url')
var querystring = require('querystring')
var argv = require('optimist').argv
var mon17 = require('./lib/17mon')

var host = argv.h || argv.host || '127.0.0.1'
var port = argv.p || argv.port || 5127
var file = argv.f || argv.file || './db/17monipdb.dat'

var loadDB = function() {
    console.info('load DB %s mtime=%s', file, mtime)
    console.time('load DB consume')
    mon17.loadDB(file)
    console.timeEnd('load DB consume')
}

var mtime = fs.statSync(file).mtime.getTime()
loadDB()

setInterval(function(){
    fs.stat(file, function(err, stats){
        if (!!err) {
            console.error('stat file %s fail err=%j', file, err)
        }
        else {
            var nowMTime = stats.mtime.getTime()
            if (nowMTime !== mtime) {
                mtime = nowMTime
                loadDB()
            }
        }
    })
}, 1000)

http.createServer(function (req, res) {
    var query = querystring.parse(url.parse(req.url).query)
    var ips = query.ip || []
    if (_.isString(ips)) {
        ips = [query.ip]
    }

    var result = {}
    _.each(ips, function(ip) {
        result[ip] = mon17.lookup(ip)
    })

    res.writeHead(200, {'Content-Type': 'text/plain'})
    res.end(JSON.stringify(result))
}).listen(port, host)

console.log('geoip-17mon listen on %s:%s', host, port)
