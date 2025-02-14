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
      const isImage = /\.(png|ico|jpg|jpeg|gif)$/i.test(file.path);

      let boundary =
        "----WebKitFormBoundary" + Math.random().toString(36).substring(2);

      let body = "";
      if (isImage) {
        // For image files, create proper multipart/form-data with base64 content
        const base64Data = file.content.split(",")[1];
        const contentType = file.path.endsWith(".ico")
          ? "image/x-icon"
          : "image/png";

        body = [
          `--${boundary}`,
          `Content-Disposition: form-data; name="${
            file.path
          }"; filename="${file.path.split("/").pop()}"`,
          `Content-Type: ${contentType}`,
          "Content-Transfer-Encoding: base64",
          "",
          base64Data,
          `--${boundary}`,
          'Content-Disposition: form-data; name="branch"',
          "",
          config.branch,
          `--${boundary}`,
          'Content-Disposition: form-data; name="message"',
          "",
          `Add ${file.path}`,
          `--${boundary}--`,
        ].join("\r\n");
      } else {
        // For text files, use x-www-form-urlencoded
        body = [
          `${encodeURIComponent(file.path)}=${encodeURIComponent(
            file.content
          )}`,
          `branch=${encodeURIComponent(config.branch)}`,
          `message=${encodeURIComponent(`Add ${file.path}`)}`,
        ].join("&");
      }

      const headers = {
        Authorization: `Basic ${auth}`,
        "Content-Type": isImage
          ? `multipart/form-data; boundary=${boundary}`
          : "application/x-www-form-urlencoded",
      };

      const fileResponse = await fetch(fileUrl, {
        method: "POST",
        headers,
        body,
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
    scssEmail: string;
    "favicon.ico": string;
    "favicon-192x192.png": string;
    "favicon-512x512.png": string;
    "manifest.json": string;
  },
  credentials: { username: string; token: string }
) {
  // Convert whiteLabelName to start with lowercase
  const lowerCaseWhiteLabelName =
    whiteLabelName.charAt(0).toLowerCase() + whiteLabelName.slice(1);

  const repoConfig: PullRequestConfig = {
    repoSlug: "hackathon-white-label",
    branch: `feature/white-label-${lowerCaseWhiteLabelName}`,
    files: [
      {
        content: files.typescript,
        path: `themes/${lowerCaseWhiteLabelName}.brand.ts`,
      },
      {
        content: files.scss,
        path: `themes/${lowerCaseWhiteLabelName}.colors.scss`,
      },
      {
        content: files.scssTheme,
        path: `themes/${lowerCaseWhiteLabelName}.scss`,
      },
      {
        content: files.scssEmail,
        path: `themes/${lowerCaseWhiteLabelName}-email.scss`,
      },
      {
        content: files["favicon.ico"],
        path: `favicons/${lowerCaseWhiteLabelName}/favicon.ico`,
      },
      {
        content: files["favicon-192x192.png"],
        path: `favicons/${lowerCaseWhiteLabelName}/favicon-192x192.png`,
      },
      {
        content: files["favicon-512x512.png"],
        path: `favicons/${lowerCaseWhiteLabelName}/favicon-512x512.png`,
      },
      {
        content: files["manifest.json"],
        path: `favicons/${lowerCaseWhiteLabelName}/manifest.json`,
      },
    ],
    commitMessage: `feat(white-label): add ${lowerCaseWhiteLabelName} theme files`,
    prTitle: `Add ${whiteLabelName} white label theme`,
    prDescription: `# White Label Theme: ${whiteLabelName}

This PR adds the following generated theme files:
- \`${lowerCaseWhiteLabelName}.brand.ts\`: TypeScript theme configuration
- \`${lowerCaseWhiteLabelName}.colors.scss\`: SCSS color variables
- \`${lowerCaseWhiteLabelName}.scss\`: Main theme file with color assignments
- \`${lowerCaseWhiteLabelName}-email.scss\`: Email-specific theme styles
- \`favicons/${lowerCaseWhiteLabelName}\`: Favicons for the white label
- \`favicons/${lowerCaseWhiteLabelName}/manifest.json\`: Web app manifest for the white label

## Changes
- Created new branch \`feature/white-label-${lowerCaseWhiteLabelName}\`
- Generated theme files from Figma design tokens
- Added theme files to \`themes/\`

# Generated by
- Chainels White Label Figma Plugin
- User: ${credentials.username}`,
  };

  return await createBitbucketPR(repoConfig, credentials);
}
