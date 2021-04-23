const express = require('express');
const app = express();
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const cli = require("cli");
const server = require('http').Server(app);
const busboy = require('connect-busboy');
const archiver = require('archiver');
const SvgFontLoader = require('svg-caster/lib/loader/SvgFont');


app.use('/swagger', (req, res, next) =>{
    const host = req.get('host');

    swaggerDocument.servers[0].url = `//${host}/api`;
    req.swaggerDoc = swaggerDocument;
    next();
},swaggerUi.serve, swaggerUi.setup());

app.use(busboy());

function streamToString(stream) {
    const chunks = [];
    return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        stream.on('error', (err) => reject(err));
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    })
}

app.post('/api/export', async (req, res, next) => {
    if (req.busboy) {
        req.pipe(req.busboy);
    }

    req.busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
        if (!mimetype.includes("svg")) {
            next(new Error(`only allow submit svg files`));
            return;
        }

        // console.dir(arguments);


        const archive = archiver('zip', {
            zlib: { level: 9 }
        });
        archive.pipe(res);

        const loader = new SvgFontLoader({});

        streamToString(file).then((content) => {
            loader._parseFont(content);
            loader.getCollection().forEach((font) => {
                archive.append(font.svg, { name: `${font.name}.svg` })
            });

            res.writeHead(200, {
                'Content-Type': 'application/zip',
                'Content-disposition': `attachment; filename=${filename}.zip`
            });

            archive.finalize();
        });
    });
});

app.use(async function(error, req, res, next) {

    await res.status(500).json({
        status: false,
        error: error.toString()
    });
});

const options = cli.parse({
    host: [ 'h', 'web server listen on address', 'ip', "0.0.0.0"],
    port: [ 'p', 'listen on port', "string", "3654"],
});

if (require && require.main === module) {
    cli.ok(`server listen on: http://${options.host}:${options.port}`);
    server.listen(options.port, options.host);
}


