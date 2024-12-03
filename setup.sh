#!/bin/bash

# Check if claude_output.txt.old exists
if [ ! -f "claude_output.txt" ]; then
    echo "Error: claude_output.txt not found!"
    exit 1
fi

# Create base project directory
mkdir -p medical-transport-marketplace/{frontend,backend}/{src,public}
mkdir -p medical-transport-marketplace/frontend/src/components
mkdir -p medical-transport-marketplace/frontend/src/styles
mkdir -p medical-transport-marketplace/backend/src/{models,services}

cd medical-transport-marketplace || exit

# Read the claude_output.txt.old file and process it
current_file=""
{
    while IFS= read -r line || [ -n "$line" ]; do
        # If line starts with //, it's a new file path
        if [[ $line == //* ]]; then
            # If we were writing to a file, close it
            if [ -n "$current_file" ]; then
                exec 3>&-
            fi

            # Extract the file path (remove // and trim)
            filepath=$(echo "$line" | sed 's/\/\/ *//')

            # Create directory structure if needed
            mkdir -p "$(dirname "$filepath")"

            # Set current file and open file descriptor 3 for writing
            current_file="$filepath"
            exec 3>"$current_file"

            echo "Creating $filepath..."
        else
            # If we have a current file, write the line to it
            if [ -n "$current_file" ]; then
                echo "$line" >&3
            fi
        fi
    done
} < "../claude_output.txt"

# Close the last file if needed
if [ -n "$current_file" ]; then
    exec 3>&-
fi

# Make the script executable if it exists
if [ -f "run_dev.sh" ]; then
    chmod +x run_dev.sh
fi

echo "Project setup complete! 🚀"
echo "Next steps:"
echo "1. cd medical-transport-marketplace"
echo "2. Install dependencies and start the servers using ./run_dev.sh"