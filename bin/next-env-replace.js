#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');



(async () => {
  // check if 3rd argument is 'set-env-vars' or 'replace-env-vars'
  const args = process.argv;
  if (args.length < 3) {
    console.error('No command provided');
    process.exit(1);
  }
  const command = args[2];
  if (command !== 'set-env-vars' && command !== 'replace-env-vars') {
    console.error('Invalid command');
    process.exit(1);
  }
  if (command === 'set-env-vars') {
   await setVarsCommand();
  }
  else if (command === 'replace-env-vars') {
    await replaceVarsCommand();
  }
})();




// Function to recursively walk through directories and files asynchronously
async function walkDir(dir, fileExtensions, callback) {
    const files = await fs.readdir(dir, { withFileTypes: true });
    for (const file of files) {
        const fullPath = path.join(dir, file.name);

        // Exclude "node_modules" directory
        if (file.isDirectory() && file.name === 'node_modules') {
            continue;
        }

        if (file.isDirectory()) {
            // If it's a directory, recurse into it
            await walkDir(fullPath, fileExtensions, callback);
        } else if (fileExtensions.some(ext => file.name.endsWith(ext))) {
            // If it's a file and matches the extension, pass it to the callback
            await callback(fullPath);
        }
    }
}

// Function to extract strings with the given prefix asynchronously
async function extractPrefixStrings(filePath, prefix, collectedStrings) {
    const content = await fs.readFile(filePath, 'utf-8');
    const regex = new RegExp(`\\b${prefix}[a-zA-Z0-9_]*`, 'g');
    const matches = content.match(regex);
    if (matches) {
        for (const match of matches) {
            if (!collectedStrings.includes(match)) {
              collectedStrings.push(match);
            }
        }
    }
}

// Main function to collect strings with "THE_PREFIX"
async function collectStringsWithPrefix(rootDir, prefix, fileExtensions) {
    const collectedStrings = [];

    // Walk through the directories and collect strings
    await walkDir(rootDir, fileExtensions, async filePath => {
        await extractPrefixStrings(filePath, prefix, collectedStrings);
    });

    return collectedStrings;
}

// Function to replace the pattern in a file
async function replacePatternInFile(filePath) {
    const content = await fs.readFile(filePath, 'utf-8');

    // Regex to match the pattern "REPLACE_PH_IN_RUNTIME_1234_<ANYTHING>_REPLACE_PH_IN_RUNTIME" and extract the environment key
    const regex = /REPLACE_PH_IN_RUNTIME_1234_([A-Z_]+)_REPLACE_PH_IN_RUNTIME/g;
    
    const matchedKeys = []
    // Replace all occurrences of the pattern in the file
    const newContent = content.replace(regex, (_, envKey) => {
        // log matched keys
        matchedKeys.push(envKey);
        // Use the extracted key to get the value from process.env
        const envValue = process.env[envKey] == undefined ? envKey : process.env[envKey];
        return envValue;
    });

    if (matchedKeys.length === 0) {
        return;
    }
    // Write the modified content back to the file
    await fs.writeFile(filePath, newContent, 'utf-8');
    console.log(`Updated: ${filePath} with values of: ${matchedKeys}`);
}

// Main function to walk through the directory and replace the pattern in files
async function replacePatternInDirectory(rootDir, fileExtensions) {
    await walkDir(rootDir, fileExtensions, async filePath => {
        await replacePatternInFile(filePath);
    });
}


async function replaceVarsCommand(){
  const rootDir = '.';
  const fileExtensions = ['.js', '.jsx', '.ts', '.tsx', '.json', '.html', '.css']

    await replacePatternInDirectory(rootDir, fileExtensions);
}


async function setVarsCommand(){
  const rootDir = '.';
  const fileExtensions = ['.js', '.jsx', '.ts', '.tsx', '.json', '.html', '.css']
    const prefix = 'NEXT_PUBLIC_';
    const nextPublicFoundKeys = await collectStringsWithPrefix(rootDir, prefix, fileExtensions);

    // Separate the environment variables (in format KEY=VALUE) and the command with its arguments
    const args = process.argv;
    const envVars = {};
    nextPublicFoundKeys.forEach((nextPublicFoundKey) => {
      envVars[nextPublicFoundKey] =  `REPLACE_PH_IN_RUNTIME_1234_${nextPublicFoundKey}_REPLACE_PH_IN_RUNTIME`
    });
    Object.keys(envVars).forEach((key) => {
      console.log(`Found NEXT_PUBLIC_${key} setting a PLACEHOLDER value for replacement`);
    })
    // Loop through args to collect environment variables
    const separatorIndex = args.indexOf('--');
    // If no separator is found, exit with an error
    if (separatorIndex === -1) {
      console.error('No separator (--) found between environment variables and command');
      process.exit(1);
    }
    const commandIndex = separatorIndex + 1;


    for (let i = 0; i < commandIndex; i++) {
      if (args[i].includes('=')) {
        const [key, value] = args[i].split('=');
        envVars[key] = value;
      }
    }

    // If no command is provided, exit
    if (commandIndex === args.length) {
      process.exit(0);
    }

    // Get the command and arguments
    const command = args[commandIndex];
    const commandArgs = args.slice(commandIndex + 1);

    // Merge the current environment variables with the new ones
    const childEnv = Object.assign({}, process.env, envVars);

    // Spawn the process with the command, arguments, and custom environment variables
    const child = spawn(command, commandArgs, { stdio: 'inherit', env: childEnv });

    child.on('error', (error) => {
      console.error(`${error}`);
    });

    child.on('exit', (code) => {
      process.exit(code);
    });
}