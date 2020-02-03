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
    const modules = fields[3].split(';');
    const isLatestVersion = fields[4] == 'latest';

    const hourBucket = new Date(+timestamp).setMinutes(0,0,0);

    return [hourBucket, version, modules, isLatestVersion];
}

function updateCounters(hourBucket, version, modules, isLatestVersion) {
    const versionPrefix = `version_${version.replace(/\./gi, '_')}`;

    const updateVersionClause = `${versionPrefix}_count = if_not_exists(${versionPrefix}_count, :zero) + :val`;
    const updateModulesClause = modules
        .map(module => `${versionPrefix}_count_${module} = if_not_exists(${versionPrefix}_count_${module}, :zero) + :val`)
        .join(', ');
    const updateLatestVersionClause = isLatestVersion ? ',latest_count = if_not_exists(latest_count, :zero) + :val' : '';

    return dynamoDbClient.update({
        TableName: DYNAMODB_STATS_TABLE,
        Key: {
            time_bucket: `bucket#${hourBucket}`
        },
        UpdateExpression: `set ${updateVersionClause},${updateModulesClause}${updateLatestVersionClause}`,
        ExpressionAttributeValues:{
            ':zero': 0,
            ':val': 1
        },
        ReturnValues: 'NONE'
    })
    .promise();
}