#!/bin/bash
# Fetch parameters from SSM and export as environment variables

export DATABASE_URL=$(aws ssm get-parameter --name "/lethologica/DATABASE_URL" --with-decryption --query "Parameter.Value" --output text)
export JWT_SECRET=$(aws ssm get-parameter --name "/lethologica/JWT_SECRET" --with-decryption --query "Parameter.Value" --output text)
export JWT_EXPIRES_IN=$(aws ssm get-parameter --name "/lethologica/JWT_EXPIRES_IN" --query "Parameter.Value" --output text)
export NODE_ENV=$(aws ssm get-parameter --name "/lethologica/NODE_ENV" --query "Parameter.Value" --output text)
export PORT=$(aws ssm get-parameter --name "/lethologica/PORT" --query "Parameter.Value" --output text)