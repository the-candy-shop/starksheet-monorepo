#!/bin/bash

# Check if two arguments are provided
if [[ $# -ne 2 ]]; then
	echo "Usage: $0 filepath content"
	exit 1
fi

# Assign arguments to variables
filepath=$1
content=$2

# Create directory if it doesn't exist
dirname=$(dirname "${filepath}")
if [[ ! -d ${dirname} ]]; then
	mkdir -p "${dirname}"
fi

# Write content to file
echo "${content}" >"${filepath}"

# Print success message
echo "Content written to ${filepath}"
