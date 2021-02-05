# MonoNodeExpress
A monolithic web API built on NodeJS/Express

## What does it do?

## What frameworks/resources does it use?
- [NodeJS](https://nodejs.org/en/) and JavaScript (ECMAScript 39)
- [ExpressJS](https://expressjs.com/) as the middleware
- [TediousJS](https://github.com/tediousjs/tedious) for SQL in Node
- [AWS Elastic Beanstalk](https://aws.amazon.com/elasticbeanstalk/)
- [Azure App Service](https://azure.microsoft.com/en-us/services/app-service/)

## What did I learn?
- Cloud deployment of NodeJS apps to Amazon AWS and Microsoft Azure infrastructure.
    - This application was first deployed as an Azure Web Service. I used remote github deployment which allowed me to update the application whenever a repository change was detected. I did not use auto-scaling.
    - This application was also deployed in AWS Elastic Beanstalk. I uploaded the source code as a folder to the AWS portal, which was a more cumbersome proccess than using a github repository. Once again, I did not use any auto-scaling settings. In the case of AWS Elastic Beanstalk, auto-scaling is automitcally enabled.
- Monolithic applications are not fesible for most production environments. This application is prone to errors upon load increase in various ways:
    - NodeJS call limits.
