'use strict';

const aws = require('aws-sdk');

const { AWS_REGION, DYNAMODB_STATS_TABLE } = process.env;
const { RECIPIENT_ADDRESS_LIST, SOURCE_ADDRESS, REPORT_SUBJECT } = process.env;

const dynamoDbRegions = {
    'us-east-1': true,
    'us-east-2': true
};

const dynamoDbClient = new aws.DynamoDB.DocumentClient({
  apiVersion: '2012-10-08',
  region: dynamoDbRegions[AWS_REGION] ? AWS_REGION : 'us-east-1'
});

const sesClient = new aws.SES({region: 'us-east-1'});

exports.handler = async (event) => {

    return Promise.all(timeBuckets().map(bucket => fetchBucket(bucket)))
        .then(fetchedBuckets => aggregateCounts(fetchedBuckets))
        .then(aggregatedCounts => prepareRawReportData(aggregatedCounts))
        .then(rawReportData => sendReport(rawReportData));
};

function timeBuckets() {
    const lastTimeBucketExclusive = currentMonthStart();

    let buckets = [];

    let currentTimeBucket = previousMonthStart();
    while(currentTimeBucket < lastTimeBucketExclusive) {
        buckets.push(`bucket#${currentTimeBucket}`);
        currentTimeBucket += 3600000; // one hour in milliseconds
    }

    return buckets;
}

function currentMonthStart() {
    // get current time, zero out minutes and hours, set first day of the month 
    // to get midnight of the first day of current month
    const date = new Date();

    date.setUTCMinutes(0,0,0);
    date.setUTCHours(0);
    date.setUTCDate(1);

    return date.getTime();
}

function previousMonthStart() {
    // get current month start, move one day back and set first day of the month
    const date = new Date(currentMonthStart());
    date.setUTCDate(0); // days start at 1, so 0 means one day backwards
    date.setUTCDate(1);

    return date.getTime();
}

function fetchBucket(bucket) {
    return dynamoDbClient.get({
        TableName: DYNAMODB_STATS_TABLE,
        Key:{
            time_bucket: bucket
        }
    })
    .promise()
    .then(data => {
        return data.Item;
    });
}

function aggregateCounts(buckets) {
    const nonEmptyBuckets = buckets.filter(bucket => bucket != null);

    const aggregatedCounts = {};
    for (var i in nonEmptyBuckets) {
        const currentBucket = nonEmptyBuckets[i];

        for(var currentKey in currentBucket) {
            const previousCount = aggregatedCounts[currentKey] || 0;
            aggregatedCounts[currentKey] = previousCount + currentBucket[currentKey];
        }
    }

    return aggregatedCounts;
}

function prepareRawReportData(aggregatedCounts) {
    const versionCounts = {};
    const moduleCounts = {};

    versionCounts['latest'] = aggregatedCounts['latest_count'];

    for(var currentKey in aggregatedCounts) {
        const regexMatchResult = currentKey.match(/version_[\d_]+_count_(\w+)/);

        if(regexMatchResult) {
            const moduleName = regexMatchResult[1]; // first and sole capturing group comes second in result array

            const previousCount = moduleCounts[moduleName] || 0;
            moduleCounts[moduleName] = previousCount + aggregatedCounts[currentKey];
        } else if(currentKey.startsWith('version_') && currentKey.endsWith('_count')) {
            // key looks like version_XXX_XXX_XXX_count;
            // extract version - remove leading version_ and trailing _count from key and
            // replace underscores with dots
            const version = currentKey.slice(8).slice(0, -6).replace(/_/gi, '.');
            versionCounts[version] = aggregatedCounts[currentKey];
        }
    }

    return [versionCounts, moduleCounts];
}

function sendReport(rawReportData) {
    var params = {
        Destination: {
            ToAddresses: RECIPIENT_ADDRESS_LIST.split(',').map(address => address.trim())
        },
        Message: {
            Body: {
                Html: {
                    Data: composeReportBody(rawReportData)
                }
            },
            Subject: {
                Data: REPORT_SUBJECT
            }
        },
        Source: SOURCE_ADDRESS
    };


     return sesClient.sendEmail(params)
        .promise();
}

function composeReportBody(rawReportData) {
    const versionCounts = rawReportData[0];
    const moduleCounts = rawReportData[1];

    const concreteVersionCounts = Object.keys(versionCounts)
        .filter(key => key != 'latest')
        .reduce((obj, key) => {
          return {
            ...obj,
            [key]: versionCounts[key]
          };
        }, {});

    const latestVersionRequestedCount = versionCounts['latest'];

    let olderVersionsRequestedCount = 0;
    for(var currentVersion in concreteVersionCounts) {
        olderVersionsRequestedCount += concreteVersionCounts[currentVersion];
    }
    olderVersionsRequestedCount -= latestVersionRequestedCount;

    const versionsCells = Object.keys(concreteVersionCounts).sort().reverse()
        .map(version => `<tr><td>${version}</td><td>${concreteVersionCounts[version]}</td></tr>`)
        .join('\n');

    const bidAdapterCells = Object.keys(moduleCounts)
        .filter(module => module.endsWith('BidAdapter'))
        .sort((a, b) => moduleCounts[a] - moduleCounts[b])
        .reverse()
        .map(module => `<tr><td>${module}</td><td>${moduleCounts[module]}</td></tr>`)
        .join('\n');

    const otherModuleCells = Object.keys(moduleCounts)
        .filter(module => !module.endsWith('BidAdapter'))
        .sort((a, b) => moduleCounts[a] - moduleCounts[b])
        .reverse()
        .map(module => `<tr><td>${module}</td><td>${moduleCounts[module]}</td></tr>`)
        .join('\n');

    return `
        <h1>Monthly report</h1>
        <h3>Breakdown by version</h3>
        <table border='1'>
          <tr>
            <th>Version</th>
            <th>Number of downloads</th>
          </tr>
          ${versionsCells}
        </table>

        <h3>Latest vs older version download requests</h3>
        Latest version has been requested <b>${latestVersionRequestedCount}</b> times, while older versions have been
        requested <b>${olderVersionsRequestedCount}</b> times.


        <h3>Breakdown by Bid Adapter modules</h3>
        <table border='1'>
          <tr>
            <th>Module</th>
            <th>Number of downloads</th>
          </tr>
          ${bidAdapterCells}
        </table>

        <h3>Breakdown by other modules</h3>
        <table border='1'>
          <tr>
            <th>Module</th>
            <th>Number of downloads</th>
          </tr>
          ${otherModuleCells}
        </table>`;
}
