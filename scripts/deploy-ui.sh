#!/usr/bin/env bash
set -euo pipefail

DOMAIN="${UI_DOMAIN:-family.hitheredevs.com}"
WEB_ROOT="${UI_WEB_ROOT:-/var/www/family-tree-ui}"
DIST_DIR="${UI_DIST_DIR:-dist}"
NGINX_SITE_PATH="/etc/nginx/sites-available/${DOMAIN}"
NGINX_SITE_LINK="/etc/nginx/sites-enabled/${DOMAIN}"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-}"

require_sudo() {
  if ! command -v sudo >/dev/null 2>&1; then
    echo "sudo is required for nginx/certbot setup"
    exit 1
  fi
}

install_nginx() {
  if command -v nginx >/dev/null 2>&1; then
    return
  fi

  sudo apt-get update
  sudo apt-get install -y nginx
}

install_certbot() {
  if command -v certbot >/dev/null 2>&1; then
    return
  fi

  sudo apt-get update
  sudo apt-get install -y certbot
}

ensure_web_root() {
  sudo mkdir -p "${WEB_ROOT}"
}

write_http_nginx_config() {
  sudo tee "${NGINX_SITE_PATH}" >/dev/null <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};

  location /.well-known/acme-challenge/ {
    root ${WEB_ROOT};
  }

    location / {
    return 301 https://\$host\$request_uri;
    }
}
EOF

  sudo ln -sfn "${NGINX_SITE_PATH}" "${NGINX_SITE_LINK}"
  if [[ -L /etc/nginx/sites-enabled/default ]]; then
  sudo rm -f /etc/nginx/sites-enabled/default
  fi
}

write_https_nginx_config() {
  sudo tee "${NGINX_SITE_PATH}" >/dev/null <<EOF
server {
  listen 80;
  listen [::]:80;
  server_name ${DOMAIN};

  location /.well-known/acme-challenge/ {
    root ${WEB_ROOT};
  }

  location / {
    return 301 https://\$host\$request_uri;
  }
}

server {
  listen 443 ssl http2;
  listen [::]:443 ssl http2;
  server_name ${DOMAIN};

  ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
  include /etc/letsencrypt/options-ssl-nginx.conf;
  ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

  root ${WEB_ROOT};
  index index.html;

  location /assets/ {
    try_files \$uri =404;
    expires 1y;
    add_header Cache-Control "public, immutable";
  }

  location / {
    try_files \$uri \$uri/ /index.html;
  }
}
EOF

  sudo ln -sfn "${NGINX_SITE_PATH}" "${NGINX_SITE_LINK}"
  if [[ -L /etc/nginx/sites-enabled/default ]]; then
    sudo rm -f /etc/nginx/sites-enabled/default
  fi
}

deploy_build() {
  if [[ ! -d "${DIST_DIR}" ]]; then
    echo "Build output not found at ${DIST_DIR}"
    exit 1
  fi

  sudo find "${WEB_ROOT}" -mindepth 1 -maxdepth 1 \
    ! -name .well-known \
    -exec rm -rf {} +

  sudo cp -R "${DIST_DIR}/." "${WEB_ROOT}/"
}

enable_and_reload_nginx() {
  sudo nginx -t
  sudo systemctl enable nginx
  sudo systemctl reload nginx || sudo systemctl restart nginx
}

ensure_certificate() {
  if [[ -z "${CERTBOT_EMAIL}" ]]; then
    echo "CERTBOT_EMAIL is required to provision TLS certificates"
    exit 1
  fi

  if sudo test -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem"; then
    return
  fi

  sudo certbot certonly --webroot \
    --non-interactive \
    --agree-tos \
    --email "${CERTBOT_EMAIL}" \
    -w "${WEB_ROOT}" \
    -d "${DOMAIN}"
}

main() {
  require_sudo
  install_nginx
  install_certbot
  ensure_web_root
  deploy_build
  write_http_nginx_config
  enable_and_reload_nginx
  ensure_certificate
  write_https_nginx_config
  enable_and_reload_nginx
}

main "$@"
