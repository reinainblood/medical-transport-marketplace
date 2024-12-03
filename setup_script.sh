#!/bin/bash

# Check if claude_output.txt.old exists
if [ ! -f "claude_output.txt" ]; then
    echo "Error: claude_output.txt not found!"
    exit 1
fi

# Create base project directory
mkdir -p medical-transport-marketplace/{frontend,backend}/{src,public}
mkdir -p medical-transport-marketplace/frontend/src/{components,types,hooks}
mkdir -p medical-transport-marketplace/backend/src/{services,types,models}

cd medical-transport-marketplace || exit

# Read the claude_output.txt.old file and process it
current_file=""
{
    while IFS= read -r line || [ -n "$line" ]; do
        if [[ $line == //* ]]; then
            if [ -n "$current_file" ]; then
                exec 3>&-
            fi
            filepath=$(echo "$line" | sed 's/\/\/ *//')
            mkdir -p "$(dirname "$filepath")"
            current_file="$filepath"
            exec 3>"$current_file"
            echo "Creating $filepath..."
        else
            if [ -n "$current_file" ]; then
                echo "$line" >&3
            fi
        fi
    done
} < "../claude_output.txt"

if [ -n "$current_file" ]; then
    exec 3>&-
fi

# Make scripts executable
chmod +x run_dev.sh

echo "Project setup complete! 🚀"
echo "Next steps:"
echo "1. Ensure Redis is installed and running"
echo "2. cd medical-transport-marketplace"
echo "3. ./run_dev.sh"

