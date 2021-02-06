# MonoNodeExpress
A monolithic web API built on NodeJS/Express

## What does it do?

## What frameworks/resources does it use?
- [NodeJS](https://nodejs.org/en/) and JavaScript (ECMAScript 39)
- [ExpressJS](https://expressjs.com/) as the middleware
- [TediousJS](https://github.com/tediousjs/tedious) for SQL in Node
- [AWS Elastic Beanstalk](https://aws.amazon.com/elasticbeanstalk/). Deployed this application in Elastic Beanstalk from source code.
- [AWS ECS](https://aws.amazon.com/ecs/?whats-new-cards.sort-by=item.additionalFields.postDateTime&whats-new-cards.sort-order=desc&ecs-blogs.sort-by=item.additionalFields.createdDate&ecs-blogs.sort-order=desc). Deployed this application on AWS ECS as a container
- [Azure App Service](https://azure.microsoft.com/en-us/services/app-service/). Deplyoed this application as an Azure App Service from soruce code.

## What did I learn?
- Cloud deployment of NodeJS apps to Amazon AWS and Microsoft Azure infrastructure.
    - This application was first deployed as an Azure Web Service. I used remote github deployment which allowed me to update the application whenever a repository change was detected. I did not use auto-scaling.
    - This application was also deployed in AWS Elastic Beanstalk. I uploaded the source code as a folder to the AWS portal, which was a more cumbersome proccess than using a github repository. Once again, I did not use any auto-scaling settings. In the case of AWS Elastic Beanstalk, auto-scaling is automitcally enabled.
- [Monolithic applications](https://www.mulesoft.com/resources/api/microservices-vs-monolithic) are not fesible for most production environments.  This application is prone to errors upon load increase. 
    - This application was again deployed on AWS, this time on AWS ECS. The application was turned into a [docker container](https://www.docker.com/resources/what-container) and then uploaded to AWS. I found this [proccess](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/) to be very easy with NodeJS. This proccess was maybe more powerful than the other deployment methods because the applciation has access to a full containerized environment.
    - NodeJS call limits are a problem. Though NodeJS is singlethreaded, it is lightning fast for IO operations and in proccessing requests. When the servers load increases, there will be a threshold in which API calls are no longer responsive. This is usually because of a slowdown in the API call it self, not because of NodeJS's connection limits or expenses. 
    - SQL calls are the most time intensive per-call function invokation in this application. While certain queries will be slower than others, query optimization would be an easy way to achieve performance gains.
 - [Microservices](https://microservices.io/patterns/microservices.html) addresses the above problems by spreading the load throughout multiple instances of the application. This differs from a monolithic application because the code is split further into seperate applications, usually in independent projects. Using seperate services increases the modularity of the entire application by allowing flexibiltiy in programming language and in development. 
    - While each application instance has the same aformentioned limits, each application should stay under their own load limit by having the service scale out. Popular approaches to this a few years ago would be SaaS platforms to automate the scaling layer, such as AWS Elastic Beanstalk or Azure App Service. More popular approaches now include containerized environments, such as AWS ECS or AWS EKS. 
    - Monolothic applications cannot be directly deployed as a Microservice app.
        - Microservices require inter-application [communication](https://solace.com/blog/microservices-choreography-vs-orchestration/). No longer is it feesible to use simple timers or scheduled tasks because each instance of the application would be doing the same tasks. Many [Microservice frameworks](https://github.com/mfornos/awesome-microservices) solve this issue. There are some SDKs that do this, such as ZooKeepers, or various [SaaS](https://docs.microsoft.com/en-us/dotnet/architecture/microservices/architect-microservice-container-applications/scalable-available-multi-container-microservice-applications) applications achieve the same. 
    - A lead Netflix engineer gives [a detailed history](https://www.youtube.com/watch?v=CZ3wIuvmHeM) of the evolution of their technology/backend, making it clear that the lack of modularity and cripple larger projects. Large applications can suffer from a large amount of dependencies that can make updating their software extremely time intensive.
 - API routes should be clearly defined and accesible to programmers, clients and servers. By avoiding hard-coded URLS or IP addresses the application becomes easier to update and more modular; most Microservice frameworks provide this functionality.
    
