let express = require('express')
let nodeify = require('bluebird-nodeify')
let morgan = require('morgan')
let fs = require('fs')
let path = require('path')
let mime = require('mime-types')
let rimraf = require ('rimraf')
let mkdirp = require ('mkdirp')
let bluebird = require ('bluebird')
let jot = require('json-over-tcp')
let net = require('net')
let jsonSocket = require('json-socket')
let archiver = require('archiver')
let chokidar = require('chokidar')
let argv = require('yargs')
  .default('dir', process.cwd())
  .argv





require ('songbird')

const NODE_ENV = process.env.ENV
const PORT = process.env.PORT || 8000
const ROOT_DIR = path.resolve(path.join(argv.dir, 'client'))
//const ROOT_DIR = path.resolve({dir})
//const ROOT_DIR = process.env.ROOT_DIR
//const ROOT_DIR = path.resolve(process.cwd())
const TCP_SERVER_PORT = '8001'


let app = express()

if (NODE_ENV === 'development'){
    app.use(morgan('dev'))
}

app.listen(PORT, ()=> console.log(`LISTENING @ http://localhost:${PORT}`))

//TCP Server details
let dropBoxClients = []
let tcpServer = net.createServer()

tcpServer.listen(TCP_SERVER_PORT)
console.log(`TCP Server LISTENING @ tcp://localhost:${TCP_SERVER_PORT}`)

tcpServer.on('connection', function(socket) {    
    socket = new jsonSocket(socket)
    dropBoxClients.push(socket)
    socket.on('message', function(message) {
	    socket.sendMessage({greeting: 'hello ' + message.name})
    })
})	

//TCP server to watch and notify the changes.
let watcher = chokidar.watch('.', {ignored: /[\/\\]\./,ignoreInitial: true})

//let watcher = chokidar.watch(ROOT_DIR, {
//  ignored: /[\/\\]\./,
//  persistent: true
//})
 
watcher
  .on('add', function(path) { 
  	  console.log('File', path, 'has been added') 
  	  pushFSChangesToClients('file', path, 'add')	
  })
  .on('change', function(path) 
  	{ console.log('File', path, 'has been changed') 
  	  pushFSChangesToClients('file', path, 'change')	
  })
  .on('unlink', function(path) 
  	{ console.log('File', path, 'has been removed') 
  	  pushFSChangesToClients('file', path, 'unlink')	
  })
  .on('addDir', function(path) 
  	{ console.log('Directory', path, 'has been added') 
  	  pushFSChangesToClients('dir', path, 'add')	
   })
  .on('unlinkDir', function(path) 
  	{ console.log('Directory', path, 'has been removed') 
  	  pushFSChangesToClients('dir', path, 'unlink')	     
   })
   


app.head('*', setFileMeta, sendHeaders, (req, res) => res.end())






app.delete('*', setFileMeta, (req,  res, next)=> {
	async ()=> {
		if(!req.stat) return res.send(400,'Invalid Path')
		if(req.stat.isDirectory()){
			await rimraf.promise(req.filePath)
            req.operation = 'unlinkDir'
		} else {
			await fs.promise.unlink(req.filePath)
            req.operation = 'unlink'
		}
        
        pushUpdateToClients(req, res)
		res.end()
	}().catch(next)
})

app.put('*', setFileMeta, setDirDetails, (req, res, next) => {
	async ()=> {
		if(req.stat) return res.send(405,'File exist\n')
		await mkdirp.promise(req.dirPath)
        req.operation = 'addDir'
		if(!req.isDir) req.pipe(fs.createWriteStream(req.filePath))
        req.operation = 'add'
        pushUpdateToClients(req, res)
		res.end()
	}().catch(next)
})


app.post('*', setFileMeta, setDirDetails,(req, res, next) => {
	async ()=> {
		if(!req.stat) return res.send(405,'File does not exists')
		if(req.isDir) return res.send(405,'Path is the directory')		
		await fs.promise.truncate(req.filePath,0)
		req.pipe(fs.createWriteStream(req.filePath))
        req.operation = 'change'
        pushUpdateToClients(req, res)
		res.end()
	}().catch(next)
})

app.get('*', setFileMeta,  sendHeaders, (req, res) => {

	//console.log(req.params.type)
	console.log(req.headers.accept)
	if(req.headers.accept === 'application/x-gtar'){
		 let archive = archiver('zip')
    	archive.pipe(res);
		archive.bulk([
	        { expand: true, cwd: 'source', src: ['**'], dest: 'source'}
	    ])
    	archive.finalize()
	}
	if(req.params.type === 'DIR'){
		res.json(res.body)
		return
	}
	fs.createReadStream(req.filePath).pipe(res)		
})

function setDirDetails(req, rex, next){
	let filePath = req.filePath
	let endsWithSlash =filePath.charAt(filePath.length-1) ===path.sep
	let hasExt = path.extname(filePath) !== ''
	req.isDir = endsWithSlash || !hasExt
	req.dirPath = req.isDir
	? filePath : path.dirname(filePath)
	next()
}

function setFileMeta(req, res, next) {   
    req.filePath = path.resolve(path.join(ROOT_DIR, req.url))
    if (req.filePath.indexOf(ROOT_DIR) !== 0){
        res.send(400, 'Invalid path')
        return
    }
    fs.promise.stat(req.filePath)
    .then(stat => req.stat = stat, ()=> req.stat = null)
    .nodeify(next)
}

function sendHeaders(req, res, next) {
  nodeify(async () => {  
    if (req.stat.isDirectory()){
        let files = await fs.promise.readdir(req.filePath)
        res.body = JSON.stringify(files.length)
        res.setHeader('Content-Length', res.body.length)
        res.setHeader('Content-Type', 'application/json')
        return
    }
    
     res.setHeader('Content-Length', req.stat.size)
     let contentType = mime.contentType(path.extname(req.filePath))
     res.setHeader('Content-Type', contentType)
  }(), next) 
}

function pushFSChangesToClients(type, path, action){
	console.log('Number of clients connected:' + dropBoxClients.length)
	if(path.indexOf(ROOT_DIR) > -1) {
		path = path.replace(ROOT_DIR,'')
		console.log(path)	
	}
	for (let client of dropBoxClients) {
		client.sendMessage({action:action,path:path,type:type})
	}
}


function pushUpdateToClients(req, res, next){
	console.log('Number of clients connected:' + dropBoxClients.length)
	for (let client of dropBoxClients) {
		client.sendMessage({action:req.operation,path:req.filePath,type:req.isDir?'dir':'file'})
	}
}


