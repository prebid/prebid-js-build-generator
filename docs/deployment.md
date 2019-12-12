# Packaging instructions
This project allows to package the application in the Docker images out-of-the-box. Run the 
following commands to build the images (you will need [Docker](https://www.docker.com/) installed of course):
```shell script
docker build -t prebid/pbjs-bundle-service-api:latest -f docker/Dockerfile.api .
docker build -t prebid/pbjs-bundle-service-builder:latest -f docker/Dockerfile.builder .
```

Alternatively you can use a helper script for this purpose (should be run from the project directory):
```shell script
docker/build.sh
```

This will build the images locally and tag them as `latest`.

# Deployment instructions
In order to get the application running in AWS ECS you will need:
- Create an [AWS ECR](https://aws.amazon.com/ecr/) repositories in single region of choice
- Push the application images to the ECR repositories
- Create the stack of necessary AWS resources to set up and run the application
- Set up [AWS Route 53](https://aws.amazon.com/route53/) to route client requests to the running application

These step are discussed in details in the following subsections.

## Create ECR repositories
[Create ECR repositories](https://docs.aws.amazon.com/AmazonECR/latest/userguide/repository-create.html) named 
`prebid/pbjs-bundle-service-api` and `prebid/pbjs-bundle-service-builder` (these are the names of the docker images).

When repositories are created note the name of the repositories in form 
`<aws_account_id>.dkr.ecr.<aws_region>.amazonaws.com/prebid/pbjs-bundle-service-api`. They will be needed during the 
next steps.

## Push images to ECR repositories
Given that the application images are already generated locally and ECR repositories exist it's time to push them to the 
repositories to make them available for deployment.

In order to be able to push to repositories you must log in into ECR first. In order to do that run the following 
commands (it will require AWS credentials set up properly):
```shell script
$(aws ecr get-login --no-include-email)
```

After that you will be able to push the images to corresponding repositories:
```shell script
docker tag prebid/pbjs-bundle-service-api:latest <aws_account_id>.dkr.ecr.<aws_region>.amazonaws.com/prebid/pbjs-bundle-service-api:latest
docker push <aws_account_id>.dkr.ecr.<aws_region>.amazonaws.com/prebid/pbjs-bundle-service-api:latest

docker tag prebid/pbjs-bundle-service-builder:latest <aws_account_id>.dkr.ecr.<aws_region>.amazonaws.com/prebid/pbjs-bundle-service-builder:latest
docker push <aws_account_id>.dkr.ecr.<aws_region>.amazonaws.com/prebid/pbjs-bundle-service-builder:latest
```

After this step you should be able to see the images in ECR in AWS Console.

## Create AWS resources and deploy application
In order to get application deployed to [AWS ECS](https://aws.amazon.com/ecs/) many different 
AWS-specific resources should be created, most important among them: VPC, Subnets, Application Load Balancer, ECS cluster, 
ECS Task Definition and ECS Service.

This project contains [AWS CloudFormation](https://aws.amazon.com/cloudformation/) templates allowing to create all these 
resource easily with a few clicks. These templates are located in [cloudformation](../cloudformation) directory.

In order to start the process of resources creation using these templates they should be stored in S3 bucket first. You 
may do this manually or let AWS do this for you, in the latter case a new S3 bucket will be created with a generated name 
and the templates will be uploaded in it under the covers. It will be assumed further that a S3 bucket was created 
manually and templates were uploaded there beforehand.

All the resources are broken into two groups. [First group](../cloudformation/network.yaml) contains all the network 
resources (VPC, Subnets) and ECS Cluster. [Second group](../cloudformation/service.yaml) contains ECS Task Definition, 
Service, Auto Scaling Group and ALB.

At first create the network stack:
- Initiate CloudFormation stack creation
- Pick a decent name for the stack, for example `prebid-network-prod`
- Wait until all the resources are provisioned

After that create the service stack:
- Initiate CloudFormation stack creation
- Pick a decent name for the stack, for example `pbjs-bundler-prod`
- Fill in desired input parameters, most notable and important of them are:
  - Api Image URL - specify ECR repository name and tag to deploy, for example 
  `<aws_account_id>.dkr.ecr.<aws_region>.amazonaws.com/prebid/pbjs-bundle-service-api:latest`
  - Builder Image URL - specify ECR repository name and tag to deploy, for example 
  `<aws_account_id>.dkr.ecr.<aws_region>.amazonaws.com/prebid/pbjs-bundle-service-builder:latest`
  - Network Stack Name - specify the name of the network stack created previously, for example `prebid-network-prod`
  - Load Balancer Certificate ID - ID of the pre-uploaded (or pre-requested) SSL certificate from ACM (Amazon Certificate Manager)
  - Key Name - Name of an existing EC2 KeyPair to enable SSH access to the ECS instances
- Wait until all the resources are provisioned

Once both stacks are created application should be up and running, it could be accessed by ALB DNS name that is found on 
the Outputs tab of the service stack as `ExternalUrl`.

## Set up sub-domain
AWS Route 53 allows to set up a sub-domain in `prebid.org` zone as an alias to the ALB. You'll have to create a new 
Record Set of _A_ type, then select _Alias_ and choose the corresponding ALB from the list resembling 
`dualstack.<ALB_name>.<region>.elb.amazonaws.com.`
