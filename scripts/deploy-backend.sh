#!/bin/bash

###############################################################################
# Backend Deployment Script for NaviKid
#
# Usage: ./scripts/deploy-backend.sh <environment> [version]
#   environment: staging | production
#   version: (optional) version tag or commit SHA
#
# Example:
#   ./scripts/deploy-backend.sh staging
#   ./scripts/deploy-backend.sh production v1.0.0
###############################################################################

set -e  # Exit on error
set -u  # Exit on undefined variable

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored messages
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Validate arguments
ENVIRONMENT=${1:-}
VERSION=${2:-$(git rev-parse --short HEAD)}

if [[ -z "$ENVIRONMENT" ]]; then
    log_error "Environment is required"
    echo "Usage: $0 <staging|production> [version]"
    exit 1
fi

if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    log_error "Environment must be 'staging' or 'production'"
    exit 1
fi

log_info "Starting deployment to $ENVIRONMENT"
log_info "Version: $VERSION"

# Confirmation for production
if [[ "$ENVIRONMENT" == "production" ]]; then
    log_warn "You are about to deploy to PRODUCTION"
    read -p "Are you sure you want to continue? (yes/no): " -r
    echo
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        log_info "Deployment cancelled"
        exit 0
    fi
fi

# Change to backend directory
cd "$(dirname "$0")/../backend"

# Build the application
log_info "Building backend application..."
npm ci
npm run build

# Build Docker image
log_info "Building Docker image..."
docker build -t "navikid-backend:${VERSION}" .
docker tag "navikid-backend:${VERSION}" "navikid-backend:${ENVIRONMENT}-latest"

# Deploy based on environment configuration
log_info "Deploying to $ENVIRONMENT..."

# Option 1: Deploy to AWS ECS
deploy_to_aws_ecs() {
    log_info "Deploying to AWS ECS..."

    # Push to ECR
    aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin "${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com"
    docker tag "navikid-backend:${VERSION}" "${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/navikid-backend:${VERSION}"
    docker push "${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/navikid-backend:${VERSION}"

    # Update ECS service
    aws ecs update-service \
        --cluster "navikid-${ENVIRONMENT}" \
        --service "backend" \
        --force-new-deployment \
        --region us-east-1
}

# Option 2: Deploy to Digital Ocean
deploy_to_digitalocean() {
    log_info "Deploying to Digital Ocean..."

    # Push to DO Container Registry
    doctl registry login
    docker tag "navikid-backend:${VERSION}" "registry.digitalocean.com/navikid/backend:${VERSION}"
    docker push "registry.digitalocean.com/navikid/backend:${VERSION}"

    # Trigger deployment
    doctl apps create-deployment "${DO_APP_ID}"
}

# Option 3: Deploy to Heroku
deploy_to_heroku() {
    log_info "Deploying to Heroku..."

    heroku container:login
    docker tag "navikid-backend:${VERSION}" "registry.heroku.com/navikid-backend-${ENVIRONMENT}/web"
    docker push "registry.heroku.com/navikid-backend-${ENVIRONMENT}/web"
    heroku container:release web --app "navikid-backend-${ENVIRONMENT}"
}

# Option 4: Deploy to Railway
deploy_to_railway() {
    log_info "Deploying to Railway..."
    railway up --service backend --environment "$ENVIRONMENT"
}

# Option 5: Deploy to custom VPS via SSH
deploy_to_vps() {
    log_info "Deploying to VPS..."

    # Save and transfer image
    docker save "navikid-backend:${VERSION}" | gzip > /tmp/navikid-backend.tar.gz

    # Transfer to VPS
    scp /tmp/navikid-backend.tar.gz "${VPS_USER}@${VPS_HOST}:/tmp/"

    # Load and run on VPS
    ssh "${VPS_USER}@${VPS_HOST}" << EOF
        docker load < /tmp/navikid-backend.tar.gz
        docker stop navikid-backend || true
        docker rm navikid-backend || true
        docker run -d \
            --name navikid-backend \
            --restart unless-stopped \
            -p 3000:3000 \
            --env-file /opt/navikid/.env.${ENVIRONMENT} \
            navikid-backend:${VERSION}
        rm /tmp/navikid-backend.tar.gz
EOF

    rm /tmp/navikid-backend.tar.gz
}

# Choose deployment method based on environment variable
DEPLOY_METHOD=${DEPLOY_METHOD:-vps}

case $DEPLOY_METHOD in
    aws)
        deploy_to_aws_ecs
        ;;
    digitalocean)
        deploy_to_digitalocean
        ;;
    heroku)
        deploy_to_heroku
        ;;
    railway)
        deploy_to_railway
        ;;
    vps)
        deploy_to_vps
        ;;
    *)
        log_error "Unknown deployment method: $DEPLOY_METHOD"
        exit 1
        ;;
esac

# Run database migrations
log_info "Running database migrations..."
if [[ "$DEPLOY_METHOD" == "vps" ]]; then
    ssh "${VPS_USER}@${VPS_HOST}" "cd /opt/navikid/backend && npm run db:migrate"
else
    # For managed services, migrations usually run automatically or via CI/CD
    log_warn "Database migrations should be configured in your deployment platform"
fi

# Health check
log_info "Performing health check..."
HEALTH_URL=""
if [[ "$ENVIRONMENT" == "production" ]]; then
    HEALTH_URL="https://api.navikid.app/health"
else
    HEALTH_URL="https://staging-api.navikid.app/health"
fi

# Wait for service to be ready
sleep 10

# Check health endpoint
if curl -f -s "$HEALTH_URL" > /dev/null; then
    log_info "Health check passed"
else
    log_error "Health check failed"
    log_warn "Deployment may have issues. Check logs."
    exit 1
fi

# Success
log_info "Deployment completed successfully!"
log_info "Backend version $VERSION is now running on $ENVIRONMENT"
log_info "URL: $HEALTH_URL"
