#!/bin/bash

###############################################################################
# Frontend Deployment Script for NaviKid
#
# Usage: ./scripts/deploy-frontend.sh <environment> <platform> [version]
#   environment: staging | production
#   platform: android | ios | all | update
#   version: (optional) version tag
#
# Example:
#   ./scripts/deploy-frontend.sh staging update
#   ./scripts/deploy-frontend.sh production all v1.0.0
###############################################################################

set -e  # Exit on error
set -u  # Exit on undefined variable

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Validate arguments
ENVIRONMENT=${1:-}
PLATFORM=${2:-update}
VERSION=${3:-$(git describe --tags --always)}

if [[ -z "$ENVIRONMENT" ]]; then
    log_error "Environment is required"
    echo "Usage: $0 <staging|production> <android|ios|all|update> [version]"
    exit 1
fi

if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    log_error "Environment must be 'staging' or 'production'"
    exit 1
fi

if [[ ! "$PLATFORM" =~ ^(android|ios|all|update)$ ]]; then
    log_error "Platform must be 'android', 'ios', 'all', or 'update'"
    exit 1
fi

log_info "Starting frontend deployment"
log_info "Environment: $ENVIRONMENT"
log_info "Platform: $PLATFORM"
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

# Check for EXPO_TOKEN
if [[ -z "${EXPO_TOKEN:-}" ]]; then
    log_error "EXPO_TOKEN environment variable is required"
    log_info "Get your token from: https://expo.dev/accounts/[account]/settings/access-tokens"
    exit 1
fi

# Change to project root
cd "$(dirname "$0")/.."

# Install dependencies
log_step "Installing dependencies..."
npm ci

# Run pre-deployment checks
log_step "Running pre-deployment checks..."

# TypeScript check
log_info "Checking TypeScript..."
npm run typecheck

# Linting
log_info "Running linter..."
npm run lint

# Tests (optional - can be skipped for hotfixes)
if [[ "${SKIP_TESTS:-false}" != "true" ]]; then
    log_info "Running tests..."
    npm run test
else
    log_warn "Skipping tests (SKIP_TESTS=true)"
fi

# Set EAS profile based on environment
EAS_PROFILE="$ENVIRONMENT"
EAS_CHANNEL="$ENVIRONMENT"

# Deploy based on platform
if [[ "$PLATFORM" == "update" ]]; then
    # OTA Update (fastest deployment, no app store required)
    log_step "Publishing EAS Update..."

    eas update \
        --branch "$EAS_CHANNEL" \
        --message "Deploy $VERSION to $ENVIRONMENT" \
        --non-interactive

    log_info "EAS Update published successfully"
    log_info "Users will receive the update on next app restart"

elif [[ "$PLATFORM" == "android" ]]; then
    # Build Android
    log_step "Building Android app..."

    eas build \
        --platform android \
        --profile "$EAS_PROFILE" \
        --non-interactive

    log_info "Android build completed"
    log_info "Download from: https://expo.dev/accounts/[account]/projects/navikid/builds"

elif [[ "$PLATFORM" == "ios" ]]; then
    # Build iOS
    log_step "Building iOS app..."

    eas build \
        --platform ios \
        --profile "$EAS_PROFILE" \
        --non-interactive

    log_info "iOS build completed"
    log_info "Download from: https://expo.dev/accounts/[account]/projects/navikid/builds"

elif [[ "$PLATFORM" == "all" ]]; then
    # Build both platforms
    log_step "Building both Android and iOS..."

    eas build \
        --platform all \
        --profile "$EAS_PROFILE" \
        --non-interactive

    log_info "Builds completed for both platforms"
    log_info "Download from: https://expo.dev/accounts/[account]/projects/navikid/builds"
fi

# Auto-submit to app stores (production only)
if [[ "$ENVIRONMENT" == "production" && "$PLATFORM" != "update" ]]; then
    if [[ "${AUTO_SUBMIT:-false}" == "true" ]]; then
        log_step "Submitting to app stores..."

        if [[ "$PLATFORM" == "android" || "$PLATFORM" == "all" ]]; then
            log_info "Submitting to Google Play Store..."
            eas submit --platform android --latest
        fi

        if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "all" ]]; then
            log_info "Submitting to Apple App Store..."
            eas submit --platform ios --latest
        fi
    else
        log_warn "Auto-submit disabled. To submit, run:"
        echo "  eas submit --platform android --latest"
        echo "  eas submit --platform ios --latest"
    fi
fi

# Create deployment tag
log_step "Creating deployment tag..."
TAG_NAME="${ENVIRONMENT}-frontend-${VERSION}"
git tag -a "$TAG_NAME" -m "Frontend deployment to $ENVIRONMENT: $VERSION" || log_warn "Tag already exists"

# Success message
log_info "Deployment completed successfully!"
echo ""
echo "================================================"
echo "  Frontend Deployment Summary"
echo "================================================"
echo "  Environment: $ENVIRONMENT"
echo "  Platform: $PLATFORM"
echo "  Version: $VERSION"
echo "  Channel: $EAS_CHANNEL"
echo "  Tag: $TAG_NAME"
echo "================================================"

# Next steps
if [[ "$PLATFORM" == "update" ]]; then
    echo ""
    log_info "Next steps:"
    echo "  1. Users will receive the update on next app restart"
    echo "  2. Monitor Sentry for errors"
    echo "  3. Check analytics for adoption rate"
elif [[ "$ENVIRONMENT" == "production" ]]; then
    echo ""
    log_info "Next steps:"
    echo "  1. Download builds from Expo"
    echo "  2. Test builds thoroughly"
    echo "  3. Submit to app stores (if not auto-submitted)"
    echo "  4. Monitor store review status"
    echo "  5. Publish OTA update if needed: ./scripts/deploy-frontend.sh production update"
else
    echo ""
    log_info "Next steps:"
    echo "  1. Download builds from Expo"
    echo "  2. Share with QA team"
    echo "  3. Run through test plan"
    echo "  4. Fix any issues and redeploy"
fi
