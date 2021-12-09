# Personal Website

Hosted [here](https://www.jimxlin.com).

## Todo

- [ ] (M) convert to typescript
- [ ] (L) create Terraform module for website setup
- [ ] (XL) continuous deployment with github actions

## Setting up the Website

Generate a static website with S3, CloudFront, ACM, Route 53, and Google Domains.

### Request SSL Certificate

Modern browsers discourage users from visiting unsecured websites.

1. Set AWS Region to `US East (N. Virginia)us-east-1`, because only certificates in this region work with CloudFront
2. Go to **AWS Management Console > Certificate Manager > Request certificate**
3. Set "Certificate type" to `Request a public certificate`
4. Set "Fully qualified domain name" to `www.jimxlin.com`
5. Set "Select validation method" to `DNS validation - recommended`
6. Go to **AWS Management Console > Certificate Manager > List certificates > {Certificate ID}**
7. Copy "CNAME name" _without_ the domain suffix to the clipboard; e.g. if `_abcd1234.jimxlin.com.` is the name, then only copy `_abcd1234`
8. Go to **Google Domains > My Domains > Manage > DNS > Resource Records > Manage Custom Records > Create new record**
9. Paste from clipboard to "Host name", "Type" should be `CNAME`
10. Repeat copy-paste action for "CNAME Value" (AWS) and "Data" (Google Domains)
11. Wait for up to an hour
12. Go to **AWS Management Console > Certificate Manager > {Certificate ID}**
13. "Status" should have changed from `Pending` to `Issued`

### Create S3 Bucket

Create a bucket to upload build files.

1. Go to **AWS Management Console > S3 > Buckets > Create Bucket**
2. "Bucket name" should be `www.jimxlin.com`; _if `www` is not included, the website will not work_
3. "AWS Region" should be `US East (N. Virginia)us-east-1)`, to match the SSL certificate region
4. Set "Block all public access" to `unchecked`
5. Go to **AWS Management Console > S3 > Buckets > www<nolink>.jimxlin.com > Properties > Static website hosting > Edit**
6. Set "Static website hosting" to `enabled`
7. Set "Hosting type" to `Host a static website`
8. Set "Index document" to `index.html`
9. Go to **AWS Management Console > S3 > Buckets > www<nolink>.jimxlin.com > Permissions > Bucket policy > Edit**
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
11. Go to **AWS Management Console > S3 > Buckets > www<nolink>.jimxlin.com > Objects > Upload**
12. Upload the files in the `dist` directory that were created by running `npm run build`; do not upload the `dist` directory itself

### Create CloudFront Distribution

1. Go to **AWS Management Console > CloudFront > Distributions > Create Distribution**
2. Set "Origin domain" to `www.jimxlin.com.s3.us-east-1.amazonaws.com`
3. Set "S3 bucket access" to `Don't use OAI (bucket must allow public access)`
4. Set "Viewer protocol policy" to `Redirect HTTP to HTTPS`
5. Set "Alternate domain name (CNAME) - optional" to `www.jimxlin.com`
6. Set "Custom SSL certificate - optional" to the certificate that was previously created

### Create a Hosted Zone

1. Go to **AWS Management Console > Route 53 > Hosted zones > Create hosted zone**
2. Set "Domain name" to `www.jimxlin.com`
3. Set "Type" to `Public hosted zone`
4. Go to **AWS Management Console > Route 53 > Hosted zones > www<nolink>.jimxlin.com > Create record**
5. Keep "Record name" blank
6. Set "Record type" to `A – Routes traffic to an IPv4 address and some AWS resources`
7. Set "Alias" to `on`
8. Set "Route traffic" to `Alias to CloudFront distribution`
9. Set distribution to the one that was previously created
10. Go to **Google Domains > My Domains > Manage > DNS > Resource Records > Manage Custom Records > Create new record**
11. Set "Host name" to `www`
12. Set "Type" to `CNAME`
13. Set "Data" to the url found in **AWS Management Console > CloudFront > Distributions > {ID} > Distribution domain name**, it will look like `abcd1234.cloudfront.net`

### Redirect Naked Domain

Always use `www`, as explained [here](https://www.yes-www.org/why-use-www/), by creating a forwarding address in Google Domains.

1. Go to **My Domains > Manage > Website > Add a forwarding address**
2. Set "Forward from" to `jimxlin.com`
3. Set "Forward to" to `http://www.jimxlin.com`
4. In "Advanced options", "FORWARDING OVER SSL" should be `SSL On`

### Restrict Bucket Access to only CloudFront

Prevent direct access to the bucket with the url `www.jimxlin.com.s3-website-us-east-1.amazonaws.com`, which is not secured with SSL.

1. Go to **AWS Management Console > CloudFront > Security > Origin access identities > Create origin access identity**
2. Set "Name" to `www.jimxlin.com-OAI`, this is arbitrary
3. Go to **AWS Management Console > CloudFront > Distributions > {ID} > Origins > Edit**
4. Set "S3 bucket access" to `Yes use OAI (bucket can restrict access to only CloudFront)`
5. Set "Origin access identity" to `www.jimxlin.com-OAI`
6. Set "Bucket policy" to `Yes, update the bucket policy`
7. Go to **AWS Management Console > S3 > Buckets > www<nolink>.jimxlin.com > Permissions > Block public access (bucket settings) > Edit**
8. Set "Block all public access" to `checked`
9. Go to **AWS Management Console > S3 > Buckets > www<nolink>.jimxlin.com > Permissions > Bucket policy > Edit**
10. Verify that the `"Statement"` array has a new object element that looks like
    ```
    {
        "Sid": "2",
        "Effect": "Allow",
        "Principal": {
            "AWS": "arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity abcd1234"
        },
        "Action": "s3:GetObject",
        "Resource": "arn:aws:s3:::www.jimxlin.com/*"
    }
    ```
11. Remove the old object element from the `"Statement"` array that looks like
    ```
    {
        "Sid": "PublicReadGetObject",
        "Effect": "Allow",
        "Principal": "*",
        "Action": "s3:GetObject",
        "Resource": "arn:aws:s3:::www.jimxlin.com/*"
    }
    ```
12. Check that the bucket cannot be access directly by visiting the url found in **AWS Management Console > S3 > Buckets > www<nolink>.jimxlin.com > Properties > Static website hosting > Bucket website endpoint**

### Add security headers to CloudFront

Improve security by adding headers to the response that CloudFront will send to browsers.

1. Go to **AWS Management Console > CloudFront > Functions > Create function**
2. Set "Name" to `security-headers`, this is arbitrary
3. Go to **AWS Management Console > CloudFront > Functions > security-headers > Build**
4. Set "Development" to

   ```
   function handler(event) {
       var response = event.response;
       var headers = response.headers;

       // Set HTTP security headers
       // Since JavaScript doesn't allow for hyphens in variable names, we use the dict["key"] notation
       headers['strict-transport-security'] = { value: 'max-age=63072000; includeSubdomains; preload' };
       headers['content-security-policy'] = { value: "default-src 'none'; img-src 'self'; form-action: 'none';frame-ancestors 'none'; script-src 'self'; style-src 'self'; object-src 'none'; base-uri 'self';" };
       headers['permissions-policy'] = { value: "layout-animations 'none'; unoptimized-images 'none'; oversized-images 'none'; sync-script 'none'; sync-xhr 'none'; unsized-media 'none';" };
       headers['referrer-policy'] = { value: 'no-referrer' };
       headers['server'] = { value: '' };
       headers['x-content-type-options'] = { value: 'nosniff' };
       headers['x-frame-options'] = { value: 'DENY' };
       // https://github.com/OWASP/CheatSheetSeries/issues/376
       headers['x-xss-protection'] = { value: '0' };

       // Return the response to viewers
       return response;
   }
   ```

5. Go to **AWS Management Console > CloudFront > Functions > security-headers > Test**
6. Set "Event Type" to `Viewer Response`
7. Click "Test Function" and make sure the "Execution result" is green
8. Go to **AWS Management Console > CloudFront > Functions > security-headers > Build**
9. Click "Public function", then click "Add association"
10. Set "Distribution" to the one used for the website
11. Set "Event type" to `Viewer Response`
12. Set "Cache behavior" to `Default (*)`

## Updating the Website

CloudFront uses caching to improve performance, but changes to the website will not be automatically served by CloudFront.

1. Go to **AWS Management Console > S3 > www<nolink>.jimxlin.com**
2. Delete all files from the bucket
3. Upload the new build files
4. Go to **AWS Management Console > CloudFront > Distributions > {ID} > Invalidations > Create Invalidation**
5. Set "Add object paths" to `/*`
