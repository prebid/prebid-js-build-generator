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