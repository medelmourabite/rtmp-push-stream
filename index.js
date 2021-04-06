const express = require('express');
const app = express();
const bodyParser = require("body-parser");
//const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
//const ffmpeg = require('fluent-ffmpeg');
//ffmpeg.setFfmpegPath(ffmpegPath);

const port = 4444;
const cp = require('child_process');

app.use(bodyParser.json({
    type: "application/json",
    verify: (req, res, buf, encoding) => {
        if (buf && buf.length) {
            req.rawBody = buf.toString(encoding || "utf8");
        }
    },
}));

app.post('/stream', (req, res) => {
    const { id, src, dist } = req.body;
    console.log(req.body);

    if (src && dist) {
        let ffmpeg = cp.spawn("ffmpeg", [
            "-re",
            "-nostdin",
            "-i", src,
            "-vcodec", "libx264",
            "-preset:v", "ultrafast",
            "-acodec", "aac",
            "-f", "flv",
            "-flvflags", "no_duration_filesize",
            dist
        ]);

        ffmpeg.stderr.on('data', function (data) {

            var tLines = data.toString().split('\n');
            var progress = {};
            for (var i = 0; i < tLines.length; i++) {
                var key = tLines[i].split('=');
                if (typeof key[0] != 'undefined' && typeof key[1] != 'undefined') {
                    progress[key[0]] = key[1];
                }
            }
        
            // The 'progress' variable contains a key value array of the data
            console.log(progress);
        
        });
        
        ffmpeg.stderr.on('end', function () {
            console.log('file has been converted succesfully');
        });
        
        ffmpeg.stderr.on('exit', function () {
            console.log('child process exited');
        });
        
        ffmpeg.stderr.on('close', function() {
            console.log('...closing time! bye');
        });
    }
    else {
        res.end();
    }
});

app.post('/start-stream', (req, res) => {
    const { id, src, dist } = req.body;
    console.log(req.body);
    if (id && src && dist) {
        ffmpeg(src)
            .audioCodec('libfaac')
            .videoCodec('libx264')
            .inputOptions("-preset:v", "ultrafast")
            .addOutput("\"" + dist + "\"")
            .outputOptions("-flvflags", "no_duration_filesize")
            .format('flv')
            .on('progress', function (progress) {
                console.log('Processing: ' + progress.percent + '% done');
                res.send(progress.percent);
            })
            .on('error', function (err, stdout, stderr) {
                console.log('Cannot process video: ' + err.message);
            })
            .on('end', function (stdout, stderr) {
                console.log('Transcoding succeeded !');
            })
            .run();
    }
    else {
        res.end();
    }
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})


/*
ffmpeg("https://file-examples-com.github.io/uploads/2017/04/file_example_MP4_1280_10MG.mp4")
            // .audioCodec('libfaac')
            // .videoCodec('libx264')
            // .inputOptions("-preset:v", "ultrafast")
            //.outputOptions("-flvflags", "no_duration_filesize")
            //.format('flv')
            .on('progress', function (progress) {
                console.log('Processing: ' + progress.percent + '% done');
            })
            .on('error', function (err, stdout, stderr) {
                console.log('Cannot process video: ' + err.message);
            })
            .on('end', function (stdout, stderr) {
                console.log('Transcoding succeeded !');
            })
            .save("\"rtmps://rtmp-global.cloud.vimeo.com:443/live/0d1e491d-fc28-4998-9cc7-b89cbe7aa7e2\"")
            //.run();

            */