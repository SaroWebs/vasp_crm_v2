# Production Refresh 520 Issue

## Issue

The application works correctly during normal Inertia navigation in production, but hard-refreshing nested URLs returns a Cloudflare error.

Working URL:

```text
https://work.vasptechnologies.com
```

Failing URL example:

```text
https://work.vasptechnologies.com/admin/dashboard
```

Observed error:

```text
Web server is returning an unknown error
Error code 520
```

This does not happen in local development on `localhost`.

## Current Production Context

Hosting stack:

- Cloudflare
- cPanel
- Laravel application
- Inertia frontend routes rendered through Laravel

The server directory currently has this `.htaccess`:

```apache
RewriteEngine On

# Redirect to HTTPS (optional but recommended)
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}/$1 [R=301,L]

# Route everything through Laravel's public/index.php
RewriteCond %{REQUEST_URI} !^/public/
RewriteRule ^(.*)$ /public/$1 [L]

# php -- BEGIN cPanel-generated handler, do not edit
# Set the “ea-php82” package as the default “PHP” programming language.
<IfModule mime_module>
  AddHandler application/x-httpd-ea-php82___lsphp .php .php8 .phtml
</IfModule>
# php -- END cPanel-generated handler, do not edit
```

## Expected Behavior

Hard-refreshing any Laravel/Inertia route should send the request to Laravel's front controller:

```text
public/index.php
```

Laravel should then resolve the route and return the correct Inertia page.

## Likely Cause

This looks like a production web-server rewrite/document-root issue, not a frontend routing issue.

The root URL works because it can reach Laravel normally. Nested URLs such as `/admin/dashboard` fail on hard refresh because the server or Cloudflare origin request is not consistently falling back to Laravel's `public/index.php`.

In local development, Laravel's dev server already routes unknown paths through `index.php`, so the issue does not appear there.

## Things To Check

1. Confirm the cPanel document root.

   The safest Laravel setup is for the domain document root to point directly to:

   ```text
   /path/to/project/public
   ```

   If the document root points to the project root instead, extra rewrite rules are needed and can behave differently between hosts.

2. Check whether there is also a `.htaccess` file inside `public/`.

   Laravel normally expects rewrite rules in:

   ```text
   public/.htaccess
   ```

   That file should route non-existing files and directories to `index.php`.

3. Check the cPanel error logs for the exact origin error.

   Cloudflare `520` is a generic origin failure. The real cause is usually visible in Apache/LiteSpeed/PHP logs.

4. Check Cloudflare SSL mode.

   If Cloudflare is set to `Flexible`, HTTPS redirects can loop or behave unexpectedly. Prefer:

   ```text
   Full
   ```

   or:

   ```text
   Full (strict)
   ```

   when the origin certificate is valid.

5. Clear Laravel caches after changing server configuration.

   Useful commands:

   ```bash
   php artisan optimize:clear
   php artisan route:clear
   php artisan config:clear
   php artisan view:clear
   ```

## Recommended Direction

Prefer changing the domain document root to Laravel's `public` directory if cPanel allows it. That avoids exposing project files and lets Laravel's standard `public/.htaccess` handle refreshes correctly.

If cPanel cannot point the domain directly to `public`, then keep the root `.htaccess` minimal and make sure `public/.htaccess` contains Laravel's normal front-controller rewrite rules.
