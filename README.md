## prebid-bundle-generator-service

API that generates a prebid.js bundle. 

### Usage
Send a POST request to the `/download` service:
```
{
	"email": "name@mail.com",
	"company": "company Name",
	"modules": ["smartadserverBidAdapter", "googleAnalyticsAdapter"],
	"version": "1.12.0"
}
```
Responds with the content of the Prebid.js bundle with the desired modules. 

### Setup

run `./chekcout.sh ${num_previous_ver}` to checkout prebid.js and build the files, where `${num_previous_ver}` is the number git tags (sorted from latest release) to checkout

### Run
`node app.js`