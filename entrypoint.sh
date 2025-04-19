#!/bin/sh

set -e

pnpm db:deploy && pnpm seed:prod && pnpm start