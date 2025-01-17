interface PullRequestConfig {
  repoSlug: string;
  branch: string;
  files: {
    content: string;
    path: string;
  }[];
  commitMessage: string;
  prTitle: string;
  prDescription: string;
}

// Simple base64 encoding function for Figma plugin environment
function base64Encode(str: string): string {
  const b64chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let result = "";
  let i = 0;

  do {
    const a = str.charCodeAt(i++);
    const b = str.charCodeAt(i++);
    const c = str.charCodeAt(i++);

    const enc1 = a >> 2;
    const enc2 = ((a & 3) << 4) | (b >> 4);
    const enc3 = ((b & 15) << 2) | (c >> 6);
    const enc4 = c & 63;

    result +=
      b64chars[enc1] +
      b64chars[enc2] +
      (isNaN(b) ? "=" : b64chars[enc3]) +
      (isNaN(c) ? "=" : b64chars[enc4]);
  } while (i < str.length);

  return result;
}

async function createBitbucketPR(
  config: PullRequestConfig,
  credentials: { username: string; token: string }
) {
  try {
    const { username, token } = credentials;
    console.log("Starting PR creation with username:", username);

    if (!username || !token) {
      throw new Error("Username and app password are required");
    }

    // Send progress update
    figma.ui.postMessage({
      type: "pr-progress",
      message: "Starting PR creation process...",
    });

    const baseUrl = "https://api.bitbucket.org/2.0";
    const workspace = "chainels";

    // Create authorization header with app password
    const auth = base64Encode(`${username}:${token}`);
    const headers = {
      Authorization: `Basic ${auth}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    };

    // 1. Check if branch exists and delete it if it does
    figma.ui.postMessage({
      type: "pr-progress",
      message: `Checking if branch '${config.branch}' exists...`,
    });

    const branchUrl = `${baseUrl}/repositories/${workspace}/${config.repoSlug}/refs/branches/${config.branch}`;

    try {
      const branchCheckResponse = await fetch(branchUrl, {
        method: "GET",
        headers,
      });

      if (branchCheckResponse.ok) {
        figma.ui.postMessage({
          type: "pr-progress",
          message: "⌛ Branch exists, deleting it...",
        });
        const deleteResponse = await fetch(branchUrl, {
          method: "DELETE",
          headers,
        });

        if (!deleteResponse.ok) {
          const errorText = await deleteResponse.text();
          console.error("Failed to delete existing branch:", errorText);
        }
      }
    } catch (error) {
      console.log("Error checking branch existence:", error);
    }

    // 2. Create new branch
    figma.ui.postMessage({
      type: "pr-progress",
      message: `⌛ Creating new branch '${config.branch}'...`,
    });

    const branchCreateUrl = `${baseUrl}/repositories/${workspace}/${config.repoSlug}/refs/branches`;
    const branchPayload = {
      name: config.branch,
      target: {
        hash: "main",
      },
    };

    const branchResponse = await fetch(branchCreateUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(branchPayload),
    });

    if (!branchResponse.ok) {
      const errorText = await branchResponse.text();
      let parsedError;
      try {
        parsedError = JSON.parse(errorText);
      } catch (e) {}

      let errorMessage = `Branch creation failed (${branchResponse.status})`;
      if (branchResponse.status === 401) {
        errorMessage = `Authentication failed. Please check your app password.`;
      } else if (branchResponse.status === 403) {
        errorMessage = `Access denied. Please check if your app password has the required permissions.`;
      } else if (branchResponse.status === 400) {
        errorMessage =
          parsedError?.error?.message ||
          `Invalid request. Please check if the branch already exists or if the target branch is valid.`;
      }
      throw new Error(errorMessage);
    }

    // 3. Create commits for the files
    figma.ui.postMessage({
      type: "pr-progress",
      message: `⌛ Creating ${config.files.length} files...`,
    });

    for (const file of config.files) {
      figma.ui.postMessage({
        type: "pr-progress",
        message: `⌛ Creating file: ${file.path}...`,
      });

      const fileUrl = `${baseUrl}/repositories/${workspace}/${config.repoSlug}/src`;
      const encodedBody = [
        `${encodeURIComponent(file.path)}=${encodeURIComponent(file.content)}`,
        `branch=${encodeURIComponent(config.branch)}`,
        `message=${encodeURIComponent(`Add ${file.path}`)}`,
      ].join("&");

      const fileResponse = await fetch(fileUrl, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: encodedBody,
      });

      if (!fileResponse.ok) {
        const errorText = await fileResponse.text();
        throw new Error(`Failed to create file ${file.path}: ${errorText}`);
      }
    }

    // 4. Create pull request
    figma.ui.postMessage({
      type: "pr-progress",
      message: "⌛ Creating pull request...",
    });

    const prUrl = `${baseUrl}/repositories/${workspace}/${config.repoSlug}/pullrequests`;
    const prPayload = {
      title: config.prTitle,
      description: config.prDescription,
      source: {
        branch: {
          name: config.branch,
        },
      },
      destination: {
        branch: {
          name: "main",
        },
      },
    };

    const prResponse = await fetch(prUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(prPayload),
    });

    if (!prResponse.ok) {
      const errorText = await prResponse.text();
      throw new Error(`Failed to create PR: ${errorText}`);
    }

    const result = await prResponse.json();
    figma.ui.postMessage({
      type: "pr-progress",
      message: `🚀 Pull request created successfully! URL: ${result.links.html.href}`,
      url: result.links.html.href,
    });

    return result;
  } catch (error) {
    console.error("Error in createBitbucketPR:", error);
    throw error;
  }
}

export async function createPullRequests(
  whiteLabelName: string,
  files: {
    typescript: string;
    scss: string;
    scssTheme: string;
  },
  credentials: { username: string; token: string }
) {
  const repoConfig: PullRequestConfig = {
    repoSlug: "hackathon-white-label",
    branch: `feature/white-label-${whiteLabelName.toLowerCase()}`,
    files: [
      {
        content: files.typescript,
        path: `themes/${whiteLabelName}.brand.ts`,
      },
      {
        content: files.scss,
        path: `themes/${whiteLabelName}.colors.scss`,
      },
      {
        content: files.scssTheme,
        path: `themes/${whiteLabelName}.scss`,
      },
      {
        content: files.scssTheme,
        path: `themes/${whiteLabelName}-email.scss`,
      },
    ],
    commitMessage: `feat(white-label): add ${whiteLabelName} theme files`,
    prTitle: `Add ${whiteLabelName} white label theme`,
    prDescription: `# White Label Theme: ${whiteLabelName}

This PR adds the following generated theme files:
- \`${whiteLabelName}.brand.ts\`: TypeScript theme configuration
- \`${whiteLabelName}.colors.scss\`: SCSS color variables and maps
- \`${whiteLabelName}.theme.scss\`: Main theme file with color assignments
- \`${whiteLabelName}-email.scss\`: Email-specific theme styles

## Changes
- Created new branch \`feature/white-label-${whiteLabelName.toLowerCase()}\`
- Generated theme files from Figma design tokens
- Added theme files to \`themes/\` directory

## Generated by
- Chainels White Label Figma Plugin
- User: ${credentials.username}`,
  };

  return await createBitbucketPR(repoConfig, credentials);
}
