# Personal Website

Hosted [here](https://www.jimxlin.com).

## Todo

- [ ] (S) only allow cloudfront to access S3 bucket using Origin Access Identities
- [ ] (S) add links to projects section
- [ ] (L) write a script that uses aws-cli to do initial setup of S3, CloudFront, and Route 53
- [ ] (XL) continuous deployment with github actions

## Setting up the Website

Generate a static website with S3, CloudFront, ACM, Route 53, and Google Domains.

### Request SSL Certificate

Modern browsers discourage users from visiting unsecured websites.

1. Set AWS Region to `US East (N. Virginia)us-east-1`, because only certificates in this region work with CloudFront
2. Go to __AWS Management Console > Certificate Manager > Request__
3. Set "Certificate type" to `Request a public certificate`
4. Set "Fully qualified domain name" to `www.jimxlin.com`
5. Set "Select validation method" to `DNS validation - recommended`
6. Go to __AWS Management Console > Certificate Manager > {Certificate ID}__
7. Copy "CNAME name" _without_ the domain suffix to the clipboard; e.g. if `_abcd1234.jimxlin.com.` is the name, then only copy `_abcd1234`
8. Go to __Google Domains >  My Domains >  Manage > DNS > Resource Records > Manage Custom Records > Create new record__
9. Paste from clipboard to "Host name", "Type" should be `CNAME`
10. Repeat copy-paste action for "CNAME Value" (AWS) and "Data" (Google Domains)
11. Wait for up to an hour
12. Go to __AWS Management Console > Certificate Manager > {Certificate ID}__
13. "Status" should have changed from `Pending` to `Issued`

### Create S3 Bucket

Create a bucket to upload build files.

1. Go to __AWS Management Console > S3 > Create Bucket__
2. "Bucket name" should be `www.jimxlin.com`; _if `www` is not included, the website will not work_
3. "AWS Region" should be `US East (N. Virginia)us-east-1)`, to match the SSL certificate region
4. Set "Block all public access" to `unchecked`
5. Go to __AWS Management Console > S3 > www<nolink>.jimxlin.com > Properties > Static website hosting > Edit__
6. Set "Static website hosting" to `enabled`
7. Set "Hosting type" to `Host a static website`
8. Set "Index document" to `index.html`
9. Go to __AWS Management Console > S3 > www<nolink>.jimxlin.com > Permissions > Bucket policy > Edit__
10. Paste the following:
    ```
    {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "PublicReadGetObject",
                "Effect": "Allow",
                "Principal": "*",
                "Action": "s3:GetObject",
                "Resource": "arn:aws:s3:::www.jimxlin.com/*"
            }
        ]
    }
    ```
11. Go to __AWS Management Console > S3 > www<nolink>.jimxlin.com > Objects > Upload__
12. Upload the files in the `dist` directory that were created by running `npm run build`; do not upload the `dist` directory itself 

### Create CloudFront Distribution

1. Go to __AWS Management Console > CloudFront > Create Distribution__
2. Set "Origin domain" to `www.jimxlin.com.s3-website-us-east-1.amazonaws.com`; this is the url found in __AWS Management Console > S3 > www<nolink>.jimxlin.com > Properties > Static website hosting > Bucket website endpoint__
3. Set "S3 bucket access" to `Don't use OAI (bucket must allow public access)`
4. Set "Viewer protocol policy" to `Redirect HTTP to HTTPS`
5. Set "Alternate domain name (CNAME) - optional" to `www.jimxlin.com`
6. Set "Custom SSL certificate - optional" to the certificate that was previously created

### Create a Hosted Zone

1. Go to __AWS Management Console > Route 53 > Hosted Zone > Create hosted zone__
2. Set "Domain name" to `www.jimxlin.com`
3. Set "Type" to `Public hosted zone`
4. Go to __AWS Management Console > Route 53 > Hosted Zone > www<nolink>.jimxlin.com > Create record__
5. Keep "Record name" blank
6. Set "Record type" to `A – Routes traffic to an IPv4 address and some AWS resources`
7. Set "Alias" to `on`
8. Set "Route traffic" to `Alias to CloudFront distribution`
9. Set distribution to the one that was previously created
10. Go to __Google Domains >  My Domains >  Manage > DNS > Resource Records > Manage Custom Records > Create new record__
11. Set "Host name" to `www`
12. Set "Type" to `CNAME`
13. Set "Data" to the url found in __AWS Management Console > CloudFront > {ID} > Distribution domain name__, it will look like `abcd1234.cloudfront.net`

### Redirect Naked Domain

Always use `www`, as explained [here](https://www.yes-www.org/why-use-www/), by creating a forwarding address in Google Domains.

1. Go to __My Domains > Manage > Website > Add a forwarding address__
2. Set "Forward from" to `jimxlin.com`
3. Set "Forward to" to `http://www.jimxlin.com`
4. In "Advanced options", "FORWARDING OVER SSL" should be `SSL On`

## Updating the Website

1. Go to __AWS Management Console > S3 > www<nolink>.jimxlin.com__
2. Delete all files from the bucket
3. Upload the new build files
4. Go to __AWS Management Console > CloudFront > {ID} > Invalidations > Create Invalidation__
5. Set "Add object paths" to `/*`