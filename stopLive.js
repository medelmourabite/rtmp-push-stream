var AWS = require('aws-sdk');
var uuid = require('uuid');

console.timeStamp = function(arguments) {
    console.log(new Date(), arguments);
};

const deleteInput = (medialive, InputId) => {
    return new Promise((resolve, reject) => {
        medialive.deleteInput({ InputId }, function(err, data) {
            if (err) { reject(err); } else { resolve(data); }
        });
    });
};

const stopChannel = (medialive, ChannelId) => {
    return new Promise((resolve, reject) => {
        medialive.stopChannel({ ChannelId }, function(err, data) {
            if (err) { reject(err); }
        });
        medialive.waitFor("channelStopped", { ChannelId }, function(err, data) {
            if (err) { reject(err); } // an error occurred
            else { resolve(data); }
        });
    });
};

const deleteChannel = (medialive, ChannelId) => {
    return new Promise((resolve, reject) => {
        medialive.deleteChannel({ ChannelId }, function(err, data) {
            if (err) { reject(err); }
        });
        medialive.waitFor("channelDeleted", { ChannelId }, function(err, data) {
            if (err) { reject(err); } // an error occurred
            else { resolve(data); }
        });
    });
};

const stopLive = async (ChannelId, InputId) => {
    try {
        const medialive = new AWS.MediaLive({
            apiVersion: "2017-10-14",
            accessKeyId: "***",
    secretAccessKey: "***",
            region: "eu-west-1",
        });

        console.timeStamp("INIT");
        await stopChannel(medialive, ChannelId);
        console.timeStamp("STOPPED");
        await deleteChannel(medialive, ChannelId);
        console.timeStamp("DELETED");
        await deleteInput(medialive, InputId);
        console.timeStamp("INPUT_DELETED");
    } catch (error) {
        console.error(error);
    }
};

stopLive("6449096", "4373266");