var AWS = require('aws-sdk');
var uuid = require('uuid');

console.timeStamp = function (arguments) {
    console.log(new Date(), arguments);
};


var medialive = new AWS.MediaLive({
    apiVersion: '2017-10-14',
    accessKeyId: "***",
    secretAccessKey: "***",
    region: "eu-west-1",
}, console.log);


const createInput = (sourceUrl, params = {}) => {
    return new Promise((resolve, reject) => {
        medialive.createInput({
            Name: "LIVE-" + Date.now(),
            Type: "MP4_FILE",
            Sources: [
                { Url: sourceUrl }
            ],
            ...params,
        }, function (err, data) {
            if (err) {
                console.log(err, err.stack);
                reject(err);
            } else resolve(data.Input);
        });
    });
};

const createChannel = (InputId, rtmpKey, rtmpUrl = "rtmps://rtmp-global.cloud.vimeo.com:443/live", params = {}) => {
    return new Promise((resolve, reject) => {
        var channelParams = {
            ChannelClass: "SINGLE_PIPELINE", // | STANDARD ,
            Destinations: [
                {
                    Id: 'DIST-001',
                    Settings: [
                        {
                            StreamName: rtmpKey,
                            Url: rtmpUrl,
                        },
                    ]
                },
            ],
            Name: "Channel-" + Date.now(),
            InputAttachments: [
                {
                    InputAttachmentName: 'INPUT_ATTATECHEMENT' + Date.now(),
                    InputId,
                }
            ],
            EncoderSettings: {
                AudioDescriptions: [ /* required */
                    {
                        AudioSelectorName: 'AUDIO_SELEC_001', /* required */
                        Name: 'AUDIO_DISC_001', /* required */
                    }
                ],
                OutputGroups: [
                    {
                        OutputGroupSettings: {
                            RtmpGroupSettings: {
                                AuthenticationScheme: "COMMON",
                            }
                        },
                        Name: "vimeo",
                        Outputs: [
                            {
                                OutputSettings: {
                                    RtmpOutputSettings: {
                                        Destination: {
                                            DestinationRefId: "DIST-001"
                                        },
                                    }
                                },
                                VideoDescriptionName: "VID_DISC_001",
                                AudioDescriptionNames: [
                                    "AUDIO_DISC_001"
                                ],
                            }
                        ],
                    }
                ],
                TimecodeConfig: { /* required */
                    Source: "EMBEDDED", //| SYSTEMCLOCK | ZEROBASED, /* required */
                },
                VideoDescriptions: [ /* required */
                    {
                        Name: 'VID_DISC_001', /* required */
                    }
                ],
            },
        };

        medialive.createChannel({
            ...channelParams,
            ...params,
        }, function (err, data) {
            if (err) {
                console.log(err, err.stack);
                reject(err);
            } else resolve(data.Channel);
        });
    });
};

const startChannel = (ChannelId) => {
    return new Promise((resolve, reject) => {
        medialive.waitFor('channelCreated', { ChannelId }, function (err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else {
                console.timeStamp("STARTING");
                medialive.startChannel({ ChannelId }, function (err, data) {
                    if (err) reject(err);
                    else resolve(data);
                });
            }
        });
    });
};

const stopChannel = (ChannelId) => {
    return new Promise((resolve, reject) => {
        medialive.waitFor('channelCreated', { ChannelId }, function (err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else {
                console.timeStamp("STARTING");
                medialive.startChannel({ ChannelId }, function (err, data) {
                    if (err) reject(err);
                    else resolve(data);
                });
            }
        });
    });
};

const startLive = async (sourceUrl, rtmpUrl, rtmpKey) => {
    try {
        console.timeStamp("INIT");
        const Input = await createInput(sourceUrl);
        console.log({ Input });
        const Channel = await createChannel(Input.Id, rtmpKey, rtmpUrl);
        console.log({ Channel });
        console.timeStamp("CREATED");
        medialive.waitFor('channelRunning', { ChannelId: Channel.Id }, function (err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else console.timeStamp("RUNNING", data);
        })
        const Result = await startChannel(Channel.Id);
        console.timeStamp("STARTED");

        medialive.waitFor('channelStopped', { ChannelId: Channel.Id }, function (err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else console.timeStamp("STOPPED", data);
        })

        setInterval(() => {
            medialive.describeChannel({ ChannelId: Channel.Id }, function (err, data) {
                if (err) console.log(err, err.stack); // an error occurred
                else {
                    console.timeStamp("CHANNEL: " + data.State);
                }           // successful response
            });
            medialive.describeInput({ InputId: Input.Id }, function (err, data) {
                if (err) console.log(err, err.stack); // an error occurred
                else {
                    console.timeStamp("INPUT: " + data.State);
                }           // successful response
            });
        }, 5000);

        setTimeout(() => {
            medialive.batchDelete({ChannelIds: [Channel.Id], InputIds: [Input.Id]}, function(err, data) {
                if (err) console.log(err, err.stack); // an error occurred
                else     console.log(data);           // successful response
              });
        }, 60000);
        console.log(Result);
    } catch (error) {
        console.error(error);
    }
}



startLive(
    "https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4",
    //"https://samplelib.com/lib/download/mp4/sample-10s.mp4",
    "rtmps://rtmp-global.cloud.vimeo.com:443/live",
    "0d1e491d-fc28-4998-9cc7-b89cbe7aa7e2"
);