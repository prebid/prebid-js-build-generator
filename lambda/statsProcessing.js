'use strict';

const zlib = require('zlib');
const aws = require('aws-sdk');

const { AWS_REGION, DYNAMODB_STATS_TABLE } = process.env;

const dynamoDbRegions = {
  'us-east-1': true,
  'us-east-2': true
};

const dynamoDbClient = new aws.DynamoDB.DocumentClient({
  apiVersion: '2012-10-08',
  region: dynamoDbRegions[AWS_REGION] ? AWS_REGION : 'us-east-1'
});

exports.handler = async (event) => {

    return decompressMessages(event.awslogs.data)
        .then(payload => {
            const logMessages = payload.logEvents.map(logEvent => logEvent.message);

            return processMessages(logMessages);
        });
};

function decompressMessages(data) {
    return new Promise((resolve, reject) => {
        zlib.gunzip(Buffer.from(data, 'base64'), (error, buffer) => {
            if (error) {
                reject(error);
            } else {
                resolve(buffer);
            }
        });
    })
    .then(content => {
       return JSON.parse(content.toString('utf8')) ;
    });
}

function processMessages(messages) {
    const updatePromises = messages.map(message => {
        const parsedMessage = parseMessage(message);
        return updateCounters(parsedMessage[0], parsedMessage[1], parsedMessage[2], parsedMessage[3]);
    });

    return Promise.all(updatePromises);
}

function parseMessage(message) {
    const fields = message.split(',');
    if(fields.length != 6) {
        console.error('Unexpected log message format: "%s"', message);
        return;
    }

    const timestamp = fields[1];
    const version = fields[2];
    const originalModules = fields[3].split(';');
    const modules = originalModules
        .filter((a,b) => originalModules.indexOf(a) === b) // deduplicate modules
        .map(module => module.replace(/\-/gi, '_'));
    const isLatestVersion = fields[4] == 'latest';

    const hourBucket = new Date(+timestamp).setMinutes(0,0,0);

    return [hourBucket, version, modules, isLatestVersion];
}

function updateCounters(hourBucket, version, modules, isLatestVersion) {
    const versionPrefix = `version_${version.replace(/\./gi, '_')}`;

    // create a batch of general counters
    const generalCounterBatch = [`${versionPrefix}_count`];
    if(isLatestVersion) {
        generalCounterBatch.push('latest_count');
    }

    // calculate adapter counters
    const adapterCounters = modules.map(module => `${versionPrefix}_count_${module}`);

    // create aggregated list of batches
    const aggregatedCounterBatches = [generalCounterBatch].concat(splitArrayToChunks(adapterCounters, 20));

    const updatePromises = aggregatedCounterBatches.map(counterBatch => updateBucketCounters(hourBucket, counterBatch));

    return Promise.all(updatePromises);
}

function splitArrayToChunks(array, chunk_size) {
    return Array(Math.ceil(array.length / chunk_size))
                .fill()
                .map((_, index) => index * chunk_size)
                .map(begin => array.slice(begin, begin + chunk_size));
}

function updateBucketCounters(hourBucket, counters) {
    const updateCountersClause = counters
        .map(counter => `${counter} = if_not_exists(${counter}, :zero) + :val`)
        .join(', ');

    return dynamoDbClient.update({
        TableName: DYNAMODB_STATS_TABLE,
           Key: {
               time_bucket: `bucket#${hourBucket}`
           },
           UpdateExpression: `set ${updateCountersClause}`,
           ExpressionAttributeValues:{
               ':zero': 0,
               ':val': 1
           },
           ReturnValues: 'NONE'
       })
       .promise()
}
