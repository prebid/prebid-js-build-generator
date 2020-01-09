## prebid-bundle-generator-service

API that generates a prebid.js bundle. 

### Usage
Send a POST request to the `/download` service:
```
{
	"modules": ["smartadserverBidAdapter", "googleAnalyticsAdapter"],
	"version": "1.12.0"
}
```
Responds with the content of the Prebid.js bundle with the desired modules. 

### Setup

run `./chekcout.sh ${num_previous_ver}` to checkout prebid.js and build the files, where `${num_previous_ver}` is the number git tags (sorted from latest release) to checkout

### Run
`node app.js`

### Other documentation
Refer to [docs](docs) directory for [packaging](docs/packaging.md), [deployment](docs/deployment.md) and 
[operations](docs/operations.md) guides.
