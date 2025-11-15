FROM php:8.1-apache

# Copy PHP files to web root
COPY php/ /var/www/html/

# Enable Apache mod_rewrite (if needed)
RUN a2enmod rewrite

# Set proper permissions
RUN chown -R www-data:www-data /var/www/html
RUN chmod -R 755 /var/www/html

# Expose port 80
EXPOSE 80