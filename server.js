const fs = require('fs');
const http = require('http');
const EventEmitter = require('events');
const path = require('path');

const file_location = path.join(__dirname, 'article.json')
const server = http.createServer();
const handleEmitter = new EventEmitter();


const getidfromURL=(url_param)=>{
    const url = new URL(`http://localhost:4400/${url_param}`);
    const queryParams = url.searchParams;
    if (queryParams.has('id')) {
        return queryParams.get('id');
    }
    else{
        return ''
    }
}

handleEmitter.on('getallarticle', (req, res) => {
    fs.readFile(file_location, 'utf8', (error, data) => {
        if (error) {
            //check file contains nothing (may be new file )
            if (error.code === 'ENOENT') {
                //create a new file if not exist and write with empty array
                fs.writeFile(file_location, JSON.stringify({
                    articles: []
                }), (error) => {
                    if (error) {
                        // error in creating files then it returns response as error
                        res.statusCode = 500;
                        return res.end(JSON.stringify(error));
                    } else {
                        // or create a file with empty data and returns the response as empty array
                        res.write(JSON.stringify([]))
                        return res.end()
                    }
                })
            }
            else {
                res.statusCode = 500;
                return res.end(err);
            }
        }
        res.write(data);
        return res.end();
    })
})

handleEmitter.on('getArticleagainstId',(req,res)=>{
    const id = getidfromURL(req.url);
    if (id!=='') {
        const datafromFile = fs.readFileSync(file_location, 'utf8');
        const jsonData = JSON.parse(datafromFile);
        const article_against_id = jsonData.filter(x => x.id == id);
        if(article_against_id.length==0){
            res.statusCode = 404;
            return  res.end(' Article not Found');
        }
        else{
            res.statusCode = 200;
            res.write(JSON.stringify(article_against_id))
            return res.end();
        }
    }
    else{
        res.statusCode = 400;
        return  res.end('Invalid URL Params');
    }
});

handleEmitter.on('postanarticle', (req, res) => {
    let data_from_client = {}
    const datafromFile = fs.readFileSync(file_location, 'utf8');
    const jsonConvertedData = JSON.parse(datafromFile); //converts string to JSON
      req.on("data", (data) => {
        const local_data = JSON.parse(data.toString())
        local_data.id = Math.floor(Math.random()*10)+1;
        data_from_client = local_data
    })
    req.on('end', () => {
        jsonConvertedData.push(data_from_client);
        fs.writeFile(file_location, JSON.stringify(jsonConvertedData), (err) => {
            if (err) {
                res.statusCode = 500;
                return res.end(JSON.stringify(err));
            } else {
                res.write('Posted the data...')
                res.statusCode = 200;
                return res.end();
            }
        })
    })
});

handleEmitter.on('deleteArticleagainstId',(req,res)=>{
    const id = getidfromURL(req.url);
    if (id!=='') {
        const datafromFile = fs.readFileSync(file_location, 'utf8');
        const jsonData = JSON.parse(datafromFile);
        const article = jsonData.filter(x => x.id != id);
        fs.writeFile(file_location,JSON.stringify(article),(err)=>{
            if(err){
                res.statusCode = 500;
                return res.end(JSON.stringify(err));
                }
                else{
                    res.statusCode = 200;
                    return res.end('Successfully Deleted...');
                    }
        })
    }
    else{
        res.statusCode = 400;
        return  res.end('Invalid URL Params');
    }
})

server.on('request', (req, res) => {
    const Url_method = req.method;
    const route= req.url;
    if (Url_method == 'GET' && route =='/article') {
        handleEmitter.emit('getallarticle', req, res);
    }
    else if (Url_method == 'POST' && route =='/article') {
        handleEmitter.emit('postanarticle', req, res)
    }
    else if(Url_method == 'GET' && route.includes('/article?id')){
        handleEmitter.emit('getArticleagainstId',req,res);
    }
    else if(Url_method == 'DELETE' && route.includes('/article?id')){
        handleEmitter.emit('deleteArticleagainstId', req,res);
    }
})

server.listen(4400, (err) => {
    if (err) {
        console.log(err);
    }
    else {
        console.log('server is running on port 4400');
    }
})