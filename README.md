# Introduction

Firefox extension to [sign AWS requests](https://docs.aws.amazon.com/general/latest/gr/signing_aws_api_requests.html).

This extension is largely inspired by [aws-request-signer](https://github.com/carsales/aws-request-signer).

# Installation
https://addons.mozilla.org/en-US/firefox/addon/aws-signer-browser/

# Usage
1. Click toolbar button, go to Settings
0. Fill in AWS key and secret
0. Add new services
0. There you go :P

# Example
To enable AWS Signer on all ElasticSearch services in region `us-east-1`:
```
[
    {
        "region": "us-east-1",
        "service": "es",
        "host": "*.us-east-1.es.amazonaws.com"
    }
]
```
